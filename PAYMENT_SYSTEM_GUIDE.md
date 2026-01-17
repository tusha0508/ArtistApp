# Payment System Implementation Guide

## Overview
This document explains the complete payment system implementation with Razorpay integration for the ArtistApp platform.

### Payment Model
- **Advance Payment**: 15% of total booking amount (paid upfront)
- **Remaining Payment**: 85% of total booking amount (paid after event completion)
- **No Platform Fee**: All money goes to artist (minus processing fees)

---

## Setup Instructions

### 1. **Install Razorpay Package**
```bash
cd backend
npm install razorpay
npm install
```

### 2. **Get Razorpay Credentials**

#### For Testing (Without Real Money):
1. Go to https://dashboard.razorpay.com/signup
2. Create a free account
3. Navigate to **Settings → API Keys**
4. Copy your **Test Mode** keys (these won't charge real money):
   - `Key ID` (public key)
   - `Key Secret` (private key)

#### For Production (Real Payments):
Later, when ready for live payments:
- Switch to "Live Mode"
- Use Live Mode keys
- Complete KYC verification

### 3. **Update .env File**

Add these environment variables to your `.env` file in the backend folder:

```env
# Razorpay Keys (TEST MODE - No real charges)
RAZORPAY_KEY_ID=your_test_key_id_here
RAZORPAY_KEY_SECRET=your_test_key_secret_here

# Other existing variables...
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@artistapp.com
```

### 4. **Database Models Added**

#### Payment Model (`src/models/Payment.js`)
Tracks all payment information:
- Advance payment (15%)
- Remaining payment (85%)
- Razorpay order/payment IDs
- Refund details
- Payment status

#### Cancellation Model (`src/models/Cancellation.js`)
Tracks artist cancellations for shadow banning:
- Records each cancellation
- Used to count cancellations within 7-day window
- Triggers shadow ban at 3 cancellations

#### Updated Booking Model
New fields:
- `finalAmount`: Final negotiated price
- `paymentStatus`: Advance & remaining payment status
- `artistCancelledAt`: Timestamp of cancellation
- `artistCancelReason`: Why artist cancelled

#### Updated Artist Model
Shadow ban tracking:
- `isShadowBanned`: Boolean flag
- `bannedUntil`: Date when ban expires (30 days from incident)
- `reason`: Why they were banned

---

## API Endpoints

### Advance Payment (15%)

#### 1. Create Advance Payment Order
```
POST /api/payments/advance/create-order
Headers: Authorization: Bearer {token}
Body: {
  "bookingId": "booking_id_here"
}
Response: {
  "orderId": "order_12345",
  "amount": 150, // 15% of total
  "currency": "INR",
  "bookingId": "booking_id",
  "paymentId": "payment_record_id"
}
```

#### 2. Verify Advance Payment
```
POST /api/payments/advance/verify
Headers: Authorization: Bearer {token}
Body: {
  "paymentId": "payment_record_id",
  "razorpayPaymentId": "pay_12345",
  "razorpayOrderId": "order_12345",
  "razorpaySignature": "signature_here"
}
```

### Remaining Payment (85%)

#### 1. Create Remaining Payment Order
```
POST /api/payments/remaining/create-order
Headers: Authorization: Bearer {token}
Body: {
  "bookingId": "booking_id_here"
}
Response: {
  "orderId": "order_67890",
  "amount": 850, // 85% of total
  "currency": "INR",
  "bookingId": "booking_id"
}
```

#### 2. Verify Remaining Payment
```
POST /api/payments/remaining/verify
Headers: Authorization: Bearer {token}
Body: {
  "paymentId": "payment_record_id",
  "razorpayPaymentId": "pay_67890",
  "razorpayOrderId": "order_67890",
  "razorpaySignature": "signature_here"
}
```

### Refunds

#### Request Refund
```
POST /api/payments/refund/request
Headers: Authorization: Bearer {token}
Body: {
  "bookingId": "booking_id",
  "reason": "Cancellation reason"
}
```

**Refund Rules** (Based on days before event):
- **>3 days**: 100% refund of advance amount
- **1-3 days**: 50% refund of advance amount
- **<1 day**: 0% refund (non-refundable)

### Cancellation & Shadow Ban

#### Artist Cancel Booking
```
POST /api/payments/booking/cancel
Headers: Authorization: Bearer {token}
Body: {
  "bookingId": "booking_id",
  "reason": "Emergency"
}
```

**Shadow Ban Logic**:
- Tracks all artist cancellations
- If 3 cancellations within 7 days → Shadow ban for 30 days
- Shadow banned artists:
  - Not visible in search results
  - Not in recommendations
  - Account remains active (can't login other users' bookings)
  - Ban auto-lifts after 30 days

---

## Testing Payment Gateway (Without Real Money)

### Using Razorpay Test Mode

1. **Use Test Card Details**:
   ```
   Card Number: 4111 1111 1111 1111
   Expiry: 12/25 (or any future date)
   CVV: 123
   ```

2. **Test Different Scenarios**:

   **Successful Payment**:
   - Use card above with any OTP: 123456

   **Failed Payment**:
   - Card: 4000 0000 0000 0002
   - OTP: 123456 (will fail)

   **Declined Card**:
   - Card: 4000 0000 0000 0069

3. **Check Payment Status**:
   - Go to Razorpay Dashboard → Payments
   - All test payments appear here with "TEST" label
   - No real money is charged

### Integration Test Steps

1. **Create a Booking**
   ```
   POST /api/bookings
   {
     "artistId": "artist_123",
     "eventDate": "2026-02-15",
     "eventTime": "18:00",
     "durationHours": 2,
     "location": "Mumbai",
     "proposedBudget": 1000
   }
   ```

2. **Artist Responds (Counter Offer)**
   ```
   PUT /api/bookings/{bookingId}/respond
   {
     "action": "counter",
     "counterOfferAmount": 1200
   }
   ```

3. **User Confirms Counter**
   ```
   PUT /api/bookings/{bookingId}/confirm
   ```

4. **User Creates Payment Order**
   ```
   POST /api/payments/advance/create-order
   {
     "bookingId": "booking_123"
   }
   ```

5. **Use Test Card in Frontend**
   - Complete payment in Razorpay modal
   - Use test card: 4111 1111 1111 1111

6. **Verify Payment**
   ```
   POST /api/payments/advance/verify
   {
     "paymentId": "payment_record_id",
     "razorpayPaymentId": "pay_...",
     "razorpayOrderId": "order_...",
     "razorpaySignature": "signature"
   }
   ```

7. **Check Payment Status**
   ```
   GET /api/payments/details/{bookingId}
   ```

---

## Booking Status Flow

```
REQUESTED
    ↓
COUNTER_OFFER (or ACCEPTED if no counter)
    ↓
CONFIRMED (user accepted counter)
    ↓
PAYMENT_PENDING
    ↓
ACTIVE (after 15% advance payment)
    ↓
COMPLETED (event done, awaiting 85% payment)
    ↓
FINAL (after 85% remaining payment)

OR

CANCELLED (user requests refund)
    → Refund processed based on timeline
```

---

## Key Features

### 1. **Advance Payment (15%)**
- Confirmed when booking is finalized
- User pays 15% upfront
- Booking becomes ACTIVE after payment
- Artist is notified of payment

### 2. **Remaining Payment (85%)**
- Due after event completion
- Can be requested by artist or user
- Artist waits for payment before closing event

### 3. **Shadow Banning**
- Auto-tracks artist cancellations
- 3 cancellations in 7 days = 30-day shadow ban
- Shadow banned artists:
  - Hidden from search
  - Hidden from recommendations
  - Can't accept new bookings (backend enforces)
  - Ban auto-lifts after 30 days

### 4. **Smart Refunds**
- Calculated based on event timing
- >3 days: 100% refund
- 1-3 days: 50% refund
- <1 day: 0% refund
- Auto-triggered via Razorpay

### 5. **Email Notifications**
- Payment confirmation emails
- Booking status updates
- Refund notifications
- Shadow ban alerts

---

## Mobile App Integration (React Native)

### Payment Screen Component
Add a Payment Screen to handle:
1. Advance payment collection
2. Razorpay integration
3. Payment verification
4. Success/failure handling

### Key Integration Points:
- Use Razorpay React Native SDK
- Handle payment callbacks
- Store payment confirmation in local storage
- Navigate to next screen on success

---

## Security Notes

1. **Always use HTTPS** in production
2. **Never expose** RAZORPAY_KEY_SECRET in frontend
3. **Verify signatures** on backend for all payments
4. **Store payment records** in database for audit trail
5. **Use test keys** during development
6. **Enable 3D Secure** for production

---

## Troubleshooting

### Payment Order Creation Fails
- Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
- Ensure they're test keys if in dev mode
- Check Razorpay dashboard for any notifications

### Signature Verification Fails
- Ensure RAZORPAY_KEY_SECRET matches in .env
- Check order ID and payment ID format
- Verify razorpaySignature is being sent correctly

### Refund Not Processing
- Check if payment was completed (status = "COMPLETED")
- Ensure refund amount is valid
- Check Razorpay refunds dashboard

### Shadow Ban Not Working
- Check Artist model has shadowBan field
- Verify Cancellation model is created
- Check booking status is "CONFIRMED" before cancellation

---

## Next Steps

1. ✅ Update backend (.env, package.json, models, controllers)
2. ⏳ Create Mobile Payment UI Component
3. ⏳ Integrate Razorpay SDK in React Native
4. ⏳ Test with test cards
5. ⏳ Complete booking flow with payments
6. ⏳ Test shadow banning logic
7. ⏳ Deploy to production with live keys

---

## Support

For Razorpay documentation: https://razorpay.com/docs
For test card details: https://razorpay.com/docs/payments/payments/payment-gateway/test-card-details/
