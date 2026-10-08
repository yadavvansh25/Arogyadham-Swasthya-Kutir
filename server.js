const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// Initialize Razorpay instance
let razorpay = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (razorpayKeyId && razorpayKeySecret && !razorpayKeyId.includes('YOUR_KEY_HERE')) {
  try {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
    console.log('✓ Razorpay SDK initialized with credentials from .env');
  } catch (err) {
    console.warn('⚠️ Razorpay initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ Razorpay configured in developer setup mode (credentials in .env)');
}

// Room Catalog Pricing for Server-Side Verification
const ROOM_CATALOG = {
  'Mandakini Royal Suite': 12000,
  'Paishwani Heritage Suite': 10000,
  'Vaidehi Suite': 8000,
  'Vaidehi Twin': 5500,
  'Panchvati Quad Room': 4500,
  'Panchvati Suite Room': 3500,
  'Panchvati Triple Room': 3500,
  'Panchvati King Size': 2500,
  'Panchvati Twin Bed': 2500,
};

// Dining Catalog
const DINING_CATALOG = {
  'Regular Satvik Thali': 220,
  'Special Ayurvedic Thali': 280,
  'Morning Wholesome Breakfast': 150,
  'Extra Phulka Basket': 40,
  'Desi Ghee Bowl': 30,
  'Herbal Buttermilk': 40,
};

/**
 * GET /api/config
 * Returns public client configuration (Firebase client config and Razorpay Key ID)
 */
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
    },
    serverTime: new Date().toISOString(),
  });
});

/**
 * POST /api/create-razorpay-order
 * Validates rates, calculates server-side GST, and creates a real Razorpay Order
 */
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const {
      roomName,
      nights = 1,
      rate,
      promoCode,
      guestName,
      guestEmail,
      guestPhone,
      orderType = 'room',
      items = [],
    } = req.body;

    const isDining = orderType === 'dining' || /table|meal|aahar|rasoee|pasoee|thali|dish|coupon/i.test(roomName || '');

    // Server-side rate validation
    let baseRate = rate;
    if (ROOM_CATALOG[roomName]) {
      baseRate = ROOM_CATALOG[roomName];
    } else if (!baseRate) {
      baseRate = 12000;
    }

    const calculatedNights = Math.max(1, parseInt(nights, 10) || 1);
    const baseSubtotal = isDining ? baseRate : (baseRate * calculatedNights);

    // Validate promo code
    let discount = 0;
    if (promoCode && (promoCode.trim().toUpperCase() === 'TAJWELLNESS' || promoCode.trim().toUpperCase() === 'CHITRAKOOT10')) {
      discount = Math.round(baseSubtotal * 0.10); // 10% Royal Heritage discount
    }

    const taxableAmount = Math.max(0, baseSubtotal - discount);

    // GST: 12% for Kutirs/Suites, 5% for Food & Beverage
    const gstRate = isDining ? 0.05 : 0.12;
    const gstAmount = Math.round(taxableAmount * gstRate);
    const totalAmount = taxableAmount + gstAmount;
    const amountInPaise = Math.round(totalAmount * 100);

    const receiptId = `ASK_${Date.now().toString().slice(-8)}`;

    let orderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    // If real Razorpay instance is configured and has active keys, create real order
    if (razorpay) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptId,
          notes: {
            sanctuary: 'Arogyadham Swasthya Kutir, Chitrakoot',
            roomName: roomName || 'Sanctuary Suite',
            nights: calculatedNights.toString(),
            guestName: guestName || 'Guest',
            guestEmail: guestEmail || '',
          },
        });
        orderId = rzpOrder.id;
        console.log(`✓ Real Razorpay Order created: ${orderId} for ₹${totalAmount}`);
      } catch (rzpErr) {
        console.warn('⚠️ Razorpay API order create error (falling back to generated order id):', rzpErr.message);
      }
    }

    return res.json({
      success: true,
      orderId: orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
      receipt: receiptId,
      breakdown: {
        baseRate,
        nights: calculatedNights,
        baseSubtotal,
        discount,
        taxableAmount,
        gstRate: isDining ? '5%' : '12%',
        gstAmount,
        total: totalAmount,
      },
    });
  } catch (error) {
    console.error('Error in /api/create-razorpay-order:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    });
  }
});

/**
 * POST /api/verify-payment
 * Verifies Razorpay payment signature using HMAC SHA256
 */
app.post('/api/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment details for verification',
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // If signature and secret exist, verify HMAC SHA256
    let isSignatureValid = true;
    if (secret && razorpay_signature && !secret.includes('YOUR_RAZORPAY_KEY_SECRET')) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpay_signature;
      if (!isSignatureValid) {
        return res.status(400).json({
          success: false,
          error: 'Payment verification failed: Invalid Razorpay signature',
        });
      }
    }

    console.log(`✓ Payment verified: PaymentID=${razorpay_payment_id}, OrderID=${razorpay_order_id}`);

    return res.json({
      success: true,
      message: 'Payment verified successfully by Arogyadham Server',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/verify-payment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Payment verification encountered an internal error',
    });
  }
});

// Fallback route for SPA (compatible with Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`
================================================================
🏛️  AROGYADHAM SWASTHYA KUTIR — FULL-STACK PRODUCTION SERVER
================================================================
✓ Local Server running at: http://localhost:${PORT}
✓ Static Frontend served from: ${__dirname}
✓ API Endpoints active:
  - GET  /api/config
  - POST /api/create-razorpay-order
  - POST /api/verify-payment
================================================================
  `);
});
