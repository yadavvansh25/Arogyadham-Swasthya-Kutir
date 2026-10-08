/**
 * Arogyadham Swasthya Kutir - Real Firebase v10+ Client Initialization
 * Modular SDK (Authentication + Cloud Firestore)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Default / fallback Firebase configuration
let firebaseConfig = {
  apiKey: 'AIzaSyArogyadhamChitrakootDemoApiKey2026',
  authDomain: 'arogyadham-chitrakoot.firebaseapp.com',
  projectId: 'arogyadham-chitrakoot',
  storageBucket: 'arogyadham-chitrakoot.firebasestorage.app',
  messagingSenderId: '789234190821',
  appId: '1:789234190821:web:9fa42c8d20b7ef12',
};

let app = null;
let auth = null;
let db = null;
let isInitialized = false;

// Global wrapper for Taj Firebase operations
const TajFirebase = {
  app: null,
  auth: null,
  db: null,
  isLive: false,
  razorpayKeyId: 'rzp_test_YOUR_KEY_HERE',

  async init() {
    try {
      // 1. Fetch live configuration from backend server /api/config
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.firebaseConfig && data.firebaseConfig.apiKey) {
            firebaseConfig = { ...firebaseConfig, ...data.firebaseConfig };
          }
          if (data.razorpayKeyId) {
            this.razorpayKeyId = data.razorpayKeyId;
          }
        }
      } catch (netErr) {
        console.info('Backend /api/config not reachable, using direct config:', netErr.message);
      }

      // 2. Initialize Firebase App, Auth, and Firestore
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      this.app = app;
      this.auth = auth;
      this.db = db;
      this.isLive = true;
      isInitialized = true;

      console.log('✓ Firebase v10 SDK successfully initialized for Arogyadham Swasthya Kutir');
      return { app, auth, db };
    } catch (err) {
      console.warn('⚠️ Firebase initialization warning:', err.message);
      return null;
    }
  },

  /**
   * Listen to real-time authentication changes across page reloads
   */
  onAuthChange(callback) {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  },

  /**
   * Real Google OAuth Login with popup
   */
  async signInWithGoogle() {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Persist/Update user profile in Cloud Firestore 'users' collection
    if (db && user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            name: user.displayName || 'Google Guest',
            email: user.email,
            photoURL: user.photoURL || null,
            emailVerified: user.emailVerified,
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Could not sync user to Firestore:', dbErr.message);
      }
    }

    return user;
  },

  /**
   * Real Email/Password Signup + Email Verification trigger
   */
  async signUpWithEmail(fullName, phone, email, password) {
    if (!auth) throw new Error('Firebase Auth is not initialized');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: fullName });

    // Send real email verification
    await sendEmailVerification(user);

    // Save in Firestore 'users' collection
    if (db && user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            name: fullName,
            phone: phone || '',
            email: user.email,
            emailVerified: false,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Could not save user profile to Firestore:', dbErr.message);
      }
    }

    return user;
  },

  /**
   * Real Email/Password Sign-In
   */
  async signInWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (db && user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {}
    }

    return user;
  },

  /**
   * Reload current user to check if email was verified
   */
  async reloadUser() {
    if (auth && auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser;
    }
    return null;
  },

  /**
   * Resend Verification Email
   */
  async resendEmailVerification() {
    if (auth && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }
    return false;
  },

  /**
   * Send Password Reset Email
   */
  async resetPassword(email) {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    await sendPasswordResetEmail(auth, email);
    return true;
  },

  /**
   * Real Sign Out
   */
  async signOut() {
    if (!auth) return;
    await signOut(auth);
  },

  /**
   * Save confirmed booking in Firestore 'bookings' collection
   */
  async saveBooking(bookingData) {
    if (!db) {
      console.warn('Firestore is not active, saving locally only');
      return null;
    }

    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        bookingId: bookingData.refNo,
        userId: bookingData.userId || (auth.currentUser ? auth.currentUser.uid : 'guest'),
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        roomName: bookingData.room,
        checkin: bookingData.checkIn,
        checkout: bookingData.checkOut,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        nights: bookingData.nights || 1,
        baseAmount: bookingData.base,
        gstAmount: bookingData.tax,
        totalPaid: bookingData.total,
        razorpayPaymentId: bookingData.paymentId,
        razorpayOrderId: bookingData.orderId || '',
        status: 'PAID',
        createdAt: serverTimestamp(),
      });

      console.log('✓ Booking recorded in Cloud Firestore with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Error saving booking in Firestore:', err);
      return null;
    }
  },

  /**
   * Save confirmed food order in Firestore 'food_orders' collection
   */
  async saveFoodOrder(foodOrderData) {
    if (!db) {
      console.warn('Firestore is not active, saving locally only');
      return null;
    }

    try {
      const docRef = await addDoc(collection(db, 'food_orders'), {
        orderId: foodOrderData.orderId,
        userId: foodOrderData.userId || (auth.currentUser ? auth.currentUser.uid : 'guest'),
        items: foodOrderData.items || [],
        subtotal: foodOrderData.subtotal,
        gst: foodOrderData.gst,
        total: foodOrderData.total,
        razorpayPaymentId: foodOrderData.paymentId || '',
        status: 'PAID',
        createdAt: serverTimestamp(),
      });

      console.log('✓ Food order recorded in Cloud Firestore with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Error saving food order in Firestore:', err);
      return null;
    }
  },

  /**
   * Real-time listener for user's bookings from Cloud Firestore
   */
  subscribeToBookings(userId, callback) {
    if (!db || !userId) return () => {};

    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const bookings = [];
          snapshot.forEach((docSnap) => {
            bookings.push({ id: docSnap.id, ...docSnap.data() });
          });
          callback(bookings);
        },
        (error) => {
          console.warn('Firestore bookings subscription query fallback:', error.message);
          // Fallback query without orderBy in case index is pending
          try {
            const fallbackQuery = query(collection(db, 'bookings'), where('userId', '==', userId));
            onSnapshot(fallbackQuery, (snapshot) => {
              const bookings = [];
              snapshot.forEach((docSnap) => {
                bookings.push({ id: docSnap.id, ...docSnap.data() });
              });
              callback(bookings);
            });
          } catch (e) {}
        }
      );
    } catch (err) {
      console.warn('Failed to subscribe to bookings:', err);
      return () => {};
    }
  },
};

// Expose globally on window
window.TajFirebase = TajFirebase;

// Auto-initialize TajFirebase
TajFirebase.init().then(() => {
  if (window.onTajFirebaseReady) {
    window.onTajFirebaseReady();
  }
});

export default TajFirebase;
