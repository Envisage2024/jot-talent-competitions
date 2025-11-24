// ===== FIREBASE CONFIGURATION =====
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBgnkqrg_2clJ77WTonEQFC3gwVrG7HrO4",
  authDomain: "jot-talent-competitions-72b9f.firebaseapp.com",
  projectId: "jot-talent-competitions-72b9f",
  storageBucket: "jot-talent-competitions-72b9f.firebasestorage.app",
  messagingSenderId: "25581487736",
  appId: "1:25581487736:web:a3730b66cd4fb7d9ebcf8d"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== SERVER CONFIGURATION =====
// Dynamically detect server URL based on environment
const SERVER_URL = (function() {
  const hostname = window.location.hostname;
  
  // Production environment - Render
  if (hostname.includes('onrender.com') || hostname.includes('jot-talent')) {
    return 'https://jot-payment-api.onrender.com';
  }
  
  // Local development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Fallback to current origin
  return window.location.origin;
})();

console.log('Payment System Initialized - Server URL:', SERVER_URL);

// ===== PAYMENT CONFIGURATION =====
const PAYMENT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  timeout: 30000, // milliseconds
  currencies: {
    UGX: { rate: 1, symbol: 'shs.' },
    USD: { rate: 0.00027, symbol: '$' }
  }
};

// ===== IOTEC CONFIGURATION =====
// ioTec Mobile Money Payment Provider Settings
const IOTEC_CONFIG = {
  merchantId: 'JOT_TALENT', // Replace with actual merchant ID
  environment: window.location.hostname === 'localhost' ? 'sandbox' : 'production'
};

// ===== STORAGE KEYS =====
const STORAGE_KEYS = {
  userPayments: 'jot_user_payments',
  verificationCodes: 'jot_verification_codes',
  sessionData: 'jot_session_data'
};

// ===== PAYMENT STATUS CONSTANTS =====
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// ===== VERIFICATION STATUS CONSTANTS =====
const VERIFICATION_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed'
};
