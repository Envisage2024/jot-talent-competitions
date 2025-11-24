# Payment System Component - Documentation

## Overview
This is an extracted, modular payment system component for the Jot Talent Competitions platform. The code has been separated into HTML, CSS, and JavaScript files for easier maintenance, reusability, and deployment.

## File Structure

### 1. `payment.html`
- **Purpose**: Main payment UI structure
- **Contains**: HTML markup for payment modal, form fields, verification section
- **Key Features**:
  - Header/Navigation with branding
  - Competition information card
  - Payment form with fields for amount, phone, email, name, currency
  - Email verification section
  - Status displays

### 2. `payment-styles.css`
- **Purpose**: Complete styling for payment system
- **Contains**: 
  - CSS variables (colors, shadows, transitions)
  - Header and navigation styles
  - Payment modal and form styling
  - Verification section styling
  - Responsive breakpoints (mobile, tablet, desktop)
  - Animations and transitions
- **Features**:
  - Theme-aware color system
  - Responsive design (mobile-first)
  - Accessibility-focused styling

### 3. `payment-config.js`
- **Purpose**: Configuration and constants
- **Contains**:
  - Firebase configuration
  - Server URL detection (production vs development)
  - ioTec payment provider settings
  - Payment and verification status constants
  - Storage keys and configuration objects

### 4. `payment-logic.js`
- **Purpose**: Core payment processing logic
- **Contains**:
  - Event listeners and DOM management
  - Payment form submission handler
  - Payment processing with retry logic
  - Form validation (email, phone)
  - Verification code generation and validation
  - Firebase integration
  - Authentication management
  - Data persistence

## Integration Guide

### Option 1: Direct Integration
```html
<!-- Include in your HTML -->
<link rel="stylesheet" href="Payments/payment-styles.css">
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
<script src="Payments/payment-config.js"></script>
<script src="Payments/payment-logic.js"></script>
```

### Option 2: As a Standalone Page
Simply use `payment.html` directly in your project. All dependencies are included.

### Option 3: Within Netlify
1. Deploy to Netlify
2. Update `SERVER_URL` in `payment-config.js` to point to your Netlify Functions
3. Use Netlify Functions for backend processing:
   - `/api/process-payment` - Handles payment processing
   - `/api/send-verification` - Sends verification codes

## Configuration

### Firebase Setup
Edit `payment-config.js` and update the Firebase configuration:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Server URL Configuration
The system automatically detects the environment:
- **Localhost**: `http://localhost:5000`
- **Heroku**: Uses Heroku domain
- **Netlify**: Uses Netlify domain
- **Other**: Falls back to `window.location.origin`

Override by setting in `payment-config.js`:
```javascript
const SERVER_URL = 'https://your-api.com';
```

### ioTec Payment Provider
Update ioTec configuration in `payment-config.js`:
```javascript
const IOTEC_CONFIG = {
  merchantId: 'YOUR_MERCHANT_ID',
  environment: 'production' // or 'sandbox'
};
```

## Key Features

### 1. Payment Processing
- Form validation (email, phone number)
- Retry logic with exponential backoff
- Transaction ID generation
- Payment status tracking

### 2. Email Verification
- Verification code generation
- Email verification via backend
- Code storage and validation
- User registration upon verification

### 3. Firebase Integration
- User data storage
- Payment history tracking
- Verification status management
- Real-time data synchronization

### 4. Security Features
- Input validation
- CORS-protected API calls
- Timeout configuration
- Error handling and logging

### 5. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop experience
- Touch-friendly buttons

## API Endpoints

### POST `/process-payment`
**Request:**
```json
{
  "amount": 10000,
  "phone": "+256700000000",
  "email": "user@example.com",
  "name": "User Name",
  "currency": "UGX",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "roundId": "first-round",
  "status": "processing"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN_1234567890_ABC123",
  "message": "Payment successful"
}
```

### POST `/send-verification`
**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

## Usage Examples

### Opening Payment Modal
```javascript
window.PaymentSystem.openModal();
```

### Closing Payment Modal
```javascript
window.PaymentSystem.closeModal();
```

### Getting Server URL
```javascript
const serverUrl = window.PaymentSystem.serverUrl;
```

### Formatting Currency
```javascript
const formatted = window.PaymentSystem.formatCurrency(10000, 'UGX');
// Output: "shs.10,000.00"
```

## Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Troubleshooting

### "Failed to fetch" Error
- Check that the server is running at the configured URL
- Verify CORS headers are properly set
- Check browser console for network errors

### Verification Code Not Received
- Check email configuration in backend
- Verify SMTP settings if using email service
- Check spam/junk folder

### Payment Form Not Displaying
- Ensure all CSS file paths are correct
- Check browser console for errors
- Verify Firebase SDK is loaded

### Firebase Errors
- Verify Firebase configuration is correct
- Check Firebase project permissions
- Ensure Firestore database is enabled

## Deployment Checklist

- [ ] Update Firebase configuration for your project
- [ ] Configure ioTec merchant ID and API keys
- [ ] Set up backend server or Netlify Functions
- [ ] Test payment flow in development
- [ ] Verify email verification system
- [ ] Set up SSL/HTTPS certificate
- [ ] Configure CORS headers for production domain
- [ ] Test on mobile devices
- [ ] Set up error logging/monitoring
- [ ] Document API keys and secrets in secure location

## Security Notes

1. **Never commit API keys** - Use environment variables in production
2. **CORS configuration** - Restrict to your domain only
3. **Input validation** - All inputs are validated on both client and server
4. **HTTPS required** - Always use HTTPS in production
5. **Sensitive data** - Don't store payment details client-side

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the documentation above
3. Check Firebase console for data
4. Verify server/API configuration
5. Test with sample data

## Version
- Current: 1.0.0
- Last Updated: 2024
- Compatible with: Firebase SDK 8.10.1+

## License
Part of Jot Talent Competitions Platform
