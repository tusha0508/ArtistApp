# 🧪 Payment & Refund System - Complete Testing Guide

## Overview
This guide provides step-by-step instructions to test the refactored payment system with all edge cases, refund scenarios, and status synchronization.

---

## Table of Contents
1. [Setup Prerequisites](#setup-prerequisites)
2. [Test Scenario 1: Happy Path (Complete Payment Flow)](#test-scenario-1-happy-path)
3. [Test Scenario 2: User Cancellations (All Refund Cases)](#test-scenario-2-user-cancellations)
4. [Test Scenario 3: Artist Cancellation](#test-scenario-3-artist-cancellation)
5. [Test Scenario 4: Edge Cases & Error Handling](#test-scenario-4-edge-cases)
6. [Test Scenario 5: Status Synchronization](#test-scenario-5-status-synchronization)
7. [Test Scenario 6: Razorpay Integration](#test-scenario-6-razorpay-integration)
8. [Refund Verification Checklist](#refund-verification-checklist)
9. [Database Queries for Verification](#database-queries-for-verification)

---

## Setup Prerequisites

Before running tests:

1. **MongoDB Setup**
   ```bash
   # Start MongoDB
   mongod
   ```

2. **Backend Server Setup**
   ```bash
   cd backend
   npm install
   # Ensure .env has:
   # - RAZORPAY_KEY_ID
   # - RAZORPAY_KEY_SECRET
   # - MONGODB_URI
   # - JWT_SECRET
   npm start
   ```

3. **Test Data Creation**
   - Create 1 test user account (email: testuser@test.com)
   - Create 1 test artist account (email: testartist@test.com)
   - Note their IDs for use in tests

---

## Test Scenario 1: Happy Path

### 1.1 Artist Accepts Booking Request

**Setup:**
- User has created a booking request to artist

**Action:**
```bash
curl -X PUT http://localhost:5000/api/bookings/BOOKING_ID/respond \
  -H "Authorization: Bearer ARTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "counterOfferAmount": 10000
  }'
```

**Verify:**
```
✅ Response status: 201
✅ booking.status = "accepted"
✅ booking.finalAmount = 10000
```

### 1.2 Create Advance Payment Order (15%)

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/advance/create-order \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID"
  }'
```

**Verify:**
```
✅ Response status: 200
✅ Response includes: { orderId, amount: 1500, currency: "INR" }
✅ amount = 15% of finalAmount (1500 = 15% of 10000)
```

**Database Check:**
```javascript
db.payments.findOne({ bookingId: ObjectId("BOOKING_ID") })
// Should show:
// {
//   advanceAmount: 1500,
//   remainingAmount: 8500,
//   advancePaymentOrder: { razorpayOrderId: "order_xxx" }
// }
```

### 1.3 Simulate Razorpay Payment (Frontend)

**Action (in Razorpay modal):**
- User completes payment
- Razorpay returns: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`

**Simulate in Backend Test:**
```javascript
// Using Node.js/Javascript
const crypto = require('crypto');

const orderId = 'order_xxx'; // From step 1.2
const paymentId = 'pay_xxx'; // Would come from Razorpay
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Generate valid signature
const body = orderId + '|' + paymentId;
const signature = crypto
  .createHmac('sha256', keySecret)
  .update(body)
  .digest('hex');
```

### 1.4 Verify Advance Payment

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/advance/verify \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID",
    "orderId": "order_xxx",
    "paymentId": "pay_xxx",
    "signature": "VALID_SIGNATURE_HERE"
  }'
```

**Verify:**
```
✅ Response status: 200
✅ payment.advancePaymentStatus = "COMPLETED"
✅ booking.status = "partial_paid"
✅ booking.paymentStatus.advancePaid = true
✅ Email sent to artist with payment confirmation
```

**Database Check:**
```javascript
// Booking
db.bookings.findOne({ _id: ObjectId("BOOKING_ID") })
// {
//   status: "partial_paid",
//   finalAmount: 10000,
//   paymentStatus: { advancePaid: true, remainingPaid: false }
// }

// Payment
db.payments.findOne({ bookingId: ObjectId("BOOKING_ID") })
// {
//   advancePaymentStatus: "COMPLETED",
//   advancePaymentAt: ISODate("2025-03-23T10:00:00.000Z"),
//   advancePaymentOrder: {
//     razorpayPaymentId: "pay_xxx",
//     razorpaySignature: "signature_xxx"
//   }
// }
```

---

## Test Scenario 2: User Cancellations

Test all 4 refund cases by creating 4 different bookings with different event dates.

### Case 1: Cancel ≥ 15 days before (90% Refund)

**Setup:**
1. Event date: 20 days from NOW
2. Complete advance payment (following Scenario 1)

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_CASE1",
    "reason": "User cancellers 20 days early"
  }'
```

**Verify:**
```
✅ Response status: 200
✅ Response message: "Refund request processed. 90% refund (₹1350) initiated."
✅ booking.status = "cancelled"
```

**Database Check:**
```javascript
db.payments.findOne({ bookingId: ObjectId("BOOKING_ID_CASE1") })
// {
//   refund: {
//     isRefundRequested: true,
//     refundPercentage: 90,
//     refundAmount: 1350,
//     daysBeforeEvent: 20,
//     refundStatus: "PROCESSING",
//     razorpayRefundId: "rfnd_xxx"
//   }
// }
```

**Razorpay Verification:**
- Check Razorpay dashboard: Refund of ₹1350 should be processing
- Verify refundId matches store record

---

### Case 2: Cancel 10-14 days before (40% Refund)

**Setup:**
1. Event date: 12 days from NOW
2. Complete advance payment

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_CASE2",
    "reason": "User cancels 12 days early"
  }'
```

**Verify:**
```
✅ Response: 40% refund (₹600)
✅ refund.refundPercentage = 40
✅ refund.refundAmount = 600
✅ Razorpay refund initiated
```

---

### Case 3: Cancel 5-9 days before (30% Refund)

**Setup:**
1. Event date: 7 days from NOW
2. Complete advance payment

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_CASE3",
    "reason": "User cancels 7 days early"
  }'
```

**Verify:**
```
✅ Response: 30% refund (₹450)
✅ refund.refundPercentage = 30
✅ refund.refundAmount = 450
```

---

### Case 4: Cancel ≤ 3 days before (0% Refund)

**Setup:**
1. Event date: 2 days from NOW
2. Complete advance payment

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_CASE4",
    "reason": "User cancels last minute"
  }'
```

**Verify:**
```
✅ Response: 0% refund (₹0)
✅ refund.refundPercentage = 0
✅ refund.refundAmount = 0
✅ refundStatus = "NOT_INITIATED" (no Razorpay call)
```

---

## Test Scenario 3: Artist Cancellation

### Artist Refunds 100% Always

**Setup:**
1. Create new booking
2. Artist accepts and user pays advance
3. Event date: ANY (20 days, 2 days, doesn't matter)

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-artist \
  -H "Authorization: Bearer ARTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_ARTIST_CANCEL",
    "reason": "Artist cancels due to emergency"
  }'
```

**Verify:**
```
✅ Response: "100% refund (₹1500)"
✅ refund.refundPercentage = 100
✅ refund.refundAmount = 1500 (100% of advance)
✅ Razorpay refund initiated immediately
✅ booking.status = "cancelled"
✅ booking.artistCancelledAt = NOW
```

**Database Check:**
```javascript
db.payments.findOne({ bookingId: ObjectId("BOOKING_ID") })
// {
//   refund: {
//     refundPercentage: 100,
//     refundAmount: 1500,
//     refundStatus: "PROCESSING",
//     razorpayRefundId: "rfnd_xxx"
//   }
// }
```

---

## Test Scenario 4: Edge Cases

### EC-1: Double Cancel Attempt

**Setup:**
- User cancels booking successfully

**Action:**
```bash
# First cancel (should work)
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "BOOKING_ID", "reason": "First cancel" }'

# Second cancel (should fail)
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "BOOKING_ID", "reason": "Second cancel" }'
```

**Verify:**
```
❌ Second request status: 400
❌ Error message: "Booking is already cancelled"
✅ Only one refund processed
```

---

### EC-2: Cancel Without Payment

**Setup:**
- Booking in "pending" status (no advance paid)

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "BOOKING_ID_PENDING", "reason": "Cancel before paying" }'
```

**Verify:**
```
❌ Response status: 400
❌ Error: "No completed payment found. Cannot cancel."
✅ No refund initiated
```

---

### EC-3: Unauthorized Cancellation

**Setup:**
- User A tries to cancel User B's booking
- Artist tries to cancel using user role token

**Action:**
```bash
# User tries to cancel booking they didn't create
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer OTHER_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "SOME_USERS_BOOKING" }'

# Artist tries to use user cancel endpoint
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer ARTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "BOOKING_ID" }'
```

**Verify:**
```
❌ Response status: 403
❌ Error: "Unauthorized"
✅ No refund processed
```

---

### EC-4: Invalid Booking ID

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/booking/cancel-user \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "invalid123", "reason": "Not real" }'
```

**Verify:**
```
❌ Response status: 404
❌ Error: "Booking not found"
```

---

### EC-5: Signature Verification Failure

**Setup:**
- Create advance payment order
- Attempt verification with wrong signature

**Action:**
```bash
curl -X POST http://localhost:5000/api/payments/advance/verify \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID",
    "orderId": "order_xxx",
    "paymentId": "pay_xxx",
    "signature": "INVALID_SIGNATURE_HERE"
  }'
```

**Verify:**
```
❌ Response status: 400
❌ Error: "Invalid payment signature"
✅ Booking status remains "accepted"
✅ Payment status remains "PENDING"
```

---

### EC-6: Razorpay Refund Failure Handling

**Setup:**
- Mock Razorpay failure (use test mode)

**Expected Behavior:**
```
Even if Razorpay refund fails:
✅ Booking marked as "cancelled"
✅ Payment.refund.refundStatus = "FAILED"
✅ refundError recorded
✅ Response status: 500 (graceful error)
✅ User can retry or contact support
```

---

## Test Scenario 5: Status Synchronization

### User View

**Action:**
```bash
curl -X GET http://localhost:5000/api/bookings/user \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Response:**
```json
[
  {
    "_id": "booking_xxx",
    "status": "partial_paid",
    "finalAmount": 10000,
    "paymentStatus": {
      "advancePaid": true,
      "remainingPaid": false
    },
    "artistId": { "username": "artist123" },
    "eventDate": "2025-04-12",
    "eventTime": "18:00"
  }
]
```

### Artist View

**Action:**
```bash
curl -X GET http://localhost:5000/api/bookings/artist \
  -H "Authorization: Bearer ARTIST_TOKEN"
```

**Expected Response:**
```json
[
  {
    "_id": "booking_xxx",
    "status": "partial_paid",
    "finalAmount": 10000,
    "paymentStatus": {
      "advancePaid": true,
      "remainingPaid": false
    },
    "userId": { "username": "user123" },
    "eventDate": "2025-04-12",
    "eventTime": "18:00"
  }
]
```

### Verification
```
✅ Both responses show identical:
  - status: "partial_paid"
  - finalAmount: 10000
  - paymentStatus
  - eventDate & eventTime
✅ Data is perfectly synced
```

---

## Test Scenario 6: Razorpay Integration

### Order Creation Flow

```
1. User clicks "Pay Advance"
   ↓
2. Backend: POST /advance/create-order
   ↓
3. Backend calls: createRazorpayOrder(1500, bookingId, "ADVANCE")
   ↓
4. Razorpay API: creates order → returns orderId
   ↓
5. Backend stores: Payment.advancePaymentOrder.razorpayOrderId = orderId
   ↓
6. Frontend receives orderId and opens Razorpay modal
   ↓
7. User completes payment on Razorpay
   ↓
8. Razorpay returns: orderId, paymentId, signature
   ↓
9. Frontend: POST /advance/verify with all data
   ↓
10. Backend: Verifies signature using crypto.createHmac
    - Body: "{orderId}|{paymentId}"
    - Hash: sha256 with keySecret
    - Compare with provided signature
   ↓
11. If valid: Update Payment & Booking status
```

### Manual Verification

**Check Razorpay Dashboard:**
```
1. Login to Razorpay dashboard
2. Navigate to Payments section
3. Filter by test mode
4. Verify:
   - Order created with ₹1500 (1,50,000 paise)
   - Payment marked as captured/authorized
   - Receipt shown: "ADV_booking_xxx_timestamp"
```

---

## Refund Verification Checklist

### For Each Refund Scenario:

- [ ] **Calculation is correct:**
  - [ ] Days >= 15: 90% refund
  - [ ] Days 10-14: 40% refund
  - [ ] Days 5-9: 30% refund
  - [ ] Days <= 3: 0% refund
  - [ ] Artist always: 100% refund

- [ ] **Database records:**
  - [ ] `payment.refund.refundPercentage` is correct
  - [ ] `payment.refund.refundAmount` calculated accurately
  - [ ] `payment.refund.daysBeforeEvent` is accurate
  - [ ] `payment.refund.refundStatus` = "PROCESSING" or "NOT_INITIATED"
  - [ ] `payment.refund.razorpayRefundId` stored (if attempted)
  - [ ] `booking.status` = "cancelled"

- [ ] **Razorpay Integration:**
  - [ ] Refund initiated on Razorpay API (if amount > 0)
  - [ ] razorpayRefundId matches Razorpay dashboard
  - [ ] Refund amount in paise is correct (amount * 100)
  - [ ] Refund status tracked

- [ ] **Error Handling:**
  - [ ] If Razorpay fails, refundStatus = "FAILED"
  - [ ] If no refund needed (0%), skip Razorpay call
  - [ ] Error messages clear and helpful

- [ ] **UI/UX:**
  - [ ] Alert shows correct refund percentage & amount
  - [ ] Alert shows days before event
  - [ ] Cancel button disabled during processing
  - [ ] Success/error messages displayed clearly

---

## Database Queries for Verification

### 1. Check Booking Status

```javascript
db.bookings.findOne({ _id: ObjectId("BOOKING_ID") })
// Should show:
// {
//   status: "partial_paid" | "cancelled" | "pending" | "accepted",
//   finalAmount: 10000,
//   paymentStatus: { advancePaid: true/false, remainingPaid: true/false },
//   eventDate: ISODate(...),
//   artistCancelledAt: null or ISODate(...),
//   userCancelledAt: null or ISODate(...),
//   ...
// }
```

### 2. Check Payment Record

```javascript
db.payments.findOne({ bookingId: ObjectId("BOOKING_ID") })
// Should show:
// {
//   totalAmount: 10000,
//   advanceAmount: 1500,
//   remainingAmount: 8500,
//   advancePaymentStatus: "COMPLETED" | "PENDING" | "FAILED",
//   advancePaymentOrder: {
//     razorpayOrderId: "order_xxx",
//     razorpayPaymentId: "pay_xxx",
//     razorpaySignature: "sig_xxx"
//   },
//   refund: {
//     isRefundRequested: true/false,
//     refundPercentage: 0 | 30 | 40 | 90 | 100,
//     refundAmount: number,
//     refundStatus: "NOT_INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED",
//     razorpayRefundId: "rfnd_xxx" | null,
//     daysBeforeEvent: number,
//     ...
//   },
//   createdAt: ISODate(...),
//   updatedAt: ISODate(...),
//   ...
// }
```

### 3. Check Cancellation Record

```javascript
db.cancellations.find({ bookingId: ObjectId("BOOKING_ID") })
// Should show:
// {
//   cancelledBy: "user" | "artist",
//   reason: string,
//   refund: { ... },
//   createdAt: ISODate(...)
// }
```

### 4. Verify Amount Breakdown

```javascript
// For 10,000 booking:
db.payments.findOne({ bookingId: ObjectId("BOOKING_ID") })

// Advance: 10000 * 0.15 = 1500 ✓
// Remaining: 10000 * 0.85 = 8500 ✓
// Total: 1500 + 8500 = 10000 ✓
```

### 5. Check Shadow Ban Status

```javascript
db.artists.findOne({ _id: ObjectId("ARTIST_ID") })
// After 3 cancellations in 7 days:
// {
//   shadowBan: {
//     isShadowBanned: true,
//     bannedUntil: ISODate(...),
//     reason: "3 cancellations within 7 days"
//   }
// }
```

---

## Final Checklist

Before marking as "PRODUCTION READY," verify:

- [ ] All 4 user refund cases work correctly
- [ ] Artist 100% refund works
- [ ] Double cancel prevented
- [ ] Unauth access blocked (403)
- [ ] Invalid IDs handled (404)
- [ ] Signature verification working
- [ ] Razorpay integration complete
- [ ] Both UIs show synced data
- [ ] Email notifications sent
- [ ] Error messages clear
- [ ] Refund amounts calculated perfectly
- [ ] Database records all correct
- [ ] No platform fee anywhere
- [ ] 15% advance via Razorpay only
- [ ] 85% shown as offline payment
- [ ] Shadow ban system works

---

## Support

If you encounter issues:

1. Check backend logs: `npm start`
2. Verify Razorpay keys in .env
3. Check MongoDB connection
4. Review database records with queries above
5. Test with Razorpay test mode credentials

---

**Last Updated:** March 23, 2025
