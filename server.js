const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// Configurable Djubo Booking Engine target URL
const DJUBO_BOOKING_URL = process.env.DJUBO_BOOKING_URL || 'https://live.ipms247.com/booking/book-rooms-arogyadham';

// Room Catalog
const ROOM_CATALOG = {
  // Wing 1: Arogyadham Swasthya Kutir
  'Mandakini Premium Cottage': 12000,
  'Mandakini Royal Suite': 12000,
  'Paishwani Cottage': 10000,
  'Paishwani Heritage Suite': 10000,
  'Vaidehi Suite Room': 8000,
  'Vaidehi Suite': 8000,
  'Vaidehi Twin Room': 5500,
  'Vaidehi Twin': 5500,
  // Wing 2: Panchvati
  'Panchwati Quad': 4500,
  'Panchvati Quad Room': 4500,
  'Panchwati Suite Room': 3500,
  'Panchvati Suite Room': 3500,
  'Panchwati Triple': 3500,
  'Panchvati Triple Room': 3500,
  'Panchwati Twin Bed': 2500,
  'Panchvati Twin Bed': 2500,
  'Panchvati King Size': 2500,
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
 * Returns public client configuration (Google Identity, Djubo URL, and Firebase client config)
 */
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    djuboBookingUrl: DJUBO_BOOKING_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
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

// Fallback route for SPA (compatible with Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
================================================================
🏛️  AROGYADHAM SWASTHYA KUTIR — FULL-STACK PRODUCTION SERVER
================================================================
✓ Local Server running at: http://localhost:${PORT}
✓ Static Frontend served from: ${__dirname}
✓ Djubo Booking Engine: ${DJUBO_BOOKING_URL}
✓ API Endpoints active:
  - GET  /api/config
================================================================
    `);
  });
}

module.exports = app;
