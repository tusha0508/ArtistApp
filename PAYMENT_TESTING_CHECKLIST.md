# Payment System Testing Checklist

## ✅ Pre-Testing Setup

- [ ] Installed `npm install razorpay` in backend
- [ ] Created Razorpay account at https://dashboard.razorpay.com
- [ ] Got Razorpay TEST Mode keys (Key ID & Key Secret)
- [ ] Added RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to `.env` file
- [ ] Ran `npm install` in backend to install all dependencies
- [ ] Backend running: `npm run dev` (should show no errors)
- [ ] Mobile app running: `npm start` (should compile successfully)

---

## 🧪 Test Scenario 1: Advance Payment (15%)

### Step 1: Create User Account
1. Open mobile app
2. Click "Sign Up" → Choose "Client"
3. Fill in: username, email, password
4. Verify OTP from email
5. Login successfully

### Step 2: Find and Book Artist
1. Go to Home tab
2. Search for an artist (or use any listed artist)
3. Click "Book Now"
4. Fill in:
   - Event Date: `2026-02-20` (future date)
   - Time: `18:00`
   - Duration: `2 hours`
   - Location: `Mumbai`
   - Budget: `₹1000`
5. Submit booking

### Step 3: Artist Responds
1. Switch to artist account (login as artist)
2. Go to "My Requests" or "Requests" tab
3. Find the booking
4. Click "Counter Offer"
5. Enter amount: `₹1200`
6. Send counter offer

### Step 4: User Confirms Counter
1. Switch back to user account
2. Go to bookings
3. Find booking with counter offer
4. Click "Confirm" button
5. Booking status should be "CONFIRMED"

### Step 5: Test Advance Payment
1. Click on confirmed booking
2. Click "Pay Now" or "Make Payment"
3. See: "Advance Payment: ₹180 (15% of ₹1200)"
4. Click "Proceed to Payment"
5. Razorpay modal should open

### Step 6: Complete Test Payment
1. Use test card: **4111 1111 1111 1111**
2. Enter expiry: **12/25** (or any future date)
3. Enter CVV: **123**
4. Enter OTP: **123456**
5. Click "Pay"

### Expected Results
✅ Payment modal closes
✅ Shows "Payment Successful!"
✅ Booking status changes to "ACTIVE"
✅ Artist receives email: "Booking Payment Confirmed"
✅ Payment amount: ₹180 appears in Razorpay dashboard (marked as TEST)

---

## 🧪 Test Scenario 2: Failed Payment

### Step 1: Create Booking
1. Create another booking (repeat Test Scenario 1, Steps 1-4)
2. Confirm counter offer

### Step 2: Test Failed Payment
1. Click payment button
2. Use declined card: **4000 0000 0000 0002**
3. Enter expiry: **12/25**
4. Enter CVV: **123**
5. Try to pay

### Expected Results
✅ Payment fails with error message
✅ Shows: "Payment failed. Please try again."
✅ Booking remains in "CONFIRMED" status
✅ User can retry payment
✅ No money charged (it's test mode)

---

## 🧪 Test Scenario 3: Refund Request (>3 days before event)

### Step 1: Create Booking
1. Create booking with event date: **February 25, 2026** (>3 days from now)
2. Complete advance payment (₹180)
3. Booking status: "ACTIVE"

### Step 2: Request Refund
1. Go to booking details
2. Click "Cancel Booking"
3. Enter reason: "Event postponed"
4. Click "Request Refund"

### Expected Results
✅ Shows: "Refund request accepted"
✅ Shows refund percentage: **100%**
✅ Shows refund amount: **₹180**
✅ Booking status: "CANCELLED"
✅ User receives email about refund
✅ Amount appears as refunded in Razorpay dashboard

---

## 🧪 Test Scenario 4: Refund Request (1-3 days before event)

### Step 1: Create Booking
1. Create booking with event date: **January 17, 2026** (tomorrow, ~1 day away)
2. Complete advance payment
3. Booking status: "ACTIVE"

### Step 2: Request Refund
1. Go to booking details
2. Click "Cancel Booking"
3. Enter reason: "Emergency"
4. Click "Request Refund"

### Expected Results
✅ Shows: "Refund request accepted"
✅ Shows refund percentage: **50%**
✅ Shows refund amount: **₹90** (50% of ₹180)
✅ Booking status: "CANCELLED"

---

## 🧪 Test Scenario 5: Artist Cancellation & Shadow Ban

### Step 1: Create Booking
1. User creates booking
2. Artist accepts/confirms
3. Payment completed

### Step 2: First Cancellation
1. Artist goes to booking
2. Click "Cancel This Booking"
3. Enter reason: "Emergency"
4. Should see message: "2 cancellations left before shadow ban"

### Step 3: Second Cancellation
1. Create another booking
2. Repeat cancellation
3. Should see message: "1 cancellation left before shadow ban"

### Step 4: Third Cancellation (SHADOW BAN!)
1. Create another booking
2. Cancel it
3. Should see message: "You have been shadow banned for 30 days"

### Step 5: Verify Shadow Ban
1. Logout artist
2. Login as user
3. Go to search artists
4. The shadow-banned artist should NOT appear
5. Try to view artist profile directly (if you have URL):
   - Profile shows but marked as "temporarily unavailable"

### Expected Results
✅ After 3 cancellations in 7 days: Artist is shadow banned
✅ Shadow ban duration: 30 days
✅ Artist not visible in search results
✅ Artist account still exists (not deleted)
✅ Ban automatically lifts after 30 days

---

## 🧪 Test Scenario 6: Remaining Payment (85%)

### Step 1: Complete Advance Payment
1. Follow Test Scenario 1 completely
2. Booking should be "ACTIVE"

### Step 2: Event Completes
1. Wait for event date to pass (or admin updates status manually)
2. Booking status should change to "COMPLETED"

### Step 3: Request Remaining Payment
1. Artist goes to booking
2. Click "Request Final Payment"
3. Should show: "Remaining Payment: ₹1020 (85% of ₹1200)"
4. Click "Proceed to Payment"

### Step 4: Complete Remaining Payment
1. Use test card: **4111 1111 1111 1111**
2. Complete payment of ₹1020

### Expected Results
✅ Second payment successful
✅ Booking status: "FINAL COMPLETED"
✅ Total paid: ₹1200 (₹180 + ₹1020)
✅ Artist receives: ₹1200 (minus Razorpay fees)
✅ Both payments appear in Razorpay dashboard

---

## 📊 Razorpay Dashboard Verification

### Check in Razorpay Dashboard:
1. Go to https://dashboard.razorpay.com (login with test account)
2. Go to **Payments** section
3. All test payments should appear with "TEST" label
4. Verify:
   - [ ] Advance payments (15%) are recorded
   - [ ] Refunds appear in "Refunds" tab
   - [ ] Failed payments show as "failed" status
   - [ ] Amount is in **paise** (₹100 = 10000 paise in dashboard)

---

## ✅ Success Criteria

All tests passing means:
- ✅ Payment orders are created correctly
- ✅ Razorpay integration works
- ✅ Payment verification succeeds
- ✅ Refunds process correctly
- ✅ Shadow ban logic works
- ✅ Email notifications send
- ✅ Booking status updates properly
- ✅ No real money is charged (test mode)

---

## 🐛 Troubleshooting

### Payment Modal Doesn't Open
- Check if `paymentId` is being sent correctly
- Check browser console for JavaScript errors
- Verify Razorpay script is loaded

### Signature Verification Fails
- Ensure RAZORPAY_KEY_SECRET matches in backend `.env`
- Check that `razorpaySignature` is being sent from frontend
- Verify order ID and payment ID format

### Refund Not Processing
- Check if payment status is "COMPLETED"
- Verify refund amount is less than payment amount
- Check Razorpay dashboard for refund errors

### Shadow Ban Not Working
- Verify Artist model has `shadowBan` field
- Check Cancellation model exists in database
- Verify booking status is "CONFIRMED" before cancellation
- Check that 3 cancellations are within 7-day window

### Artist Still Visible After Shadow Ban
- Clear frontend cache
- Logout and login again
- Check Razorpay timestamp (should be recent)
- Verify database has shadowBan set correctly

---

## 📝 Test Notes

| Test | Date | Status | Notes |
|------|------|--------|-------|
| Advance Payment | TBD | ⏳ | |
| Failed Payment | TBD | ⏳ | |
| Refund >3 days | TBD | ⏳ | |
| Refund 1-3 days | TBD | ⏳ | |
| Shadow Ban | TBD | ⏳ | |
| Remaining Payment | TBD | ⏳ | |

---

## Next Steps After Testing

1. Once all tests pass: Commit to GitHub
2. Deploy backend to production server
3. Get live Razorpay keys (when ready for real money)
4. Update `.env` with live keys
5. Test with real payments (small amount first)
6. Deploy mobile app to TestFlight/Play Store

---

## Important Test Card Details

| Scenario | Card Number | Expiry | CVV | OTP |
|----------|-------------|--------|-----|-----|
| ✅ Success | 4111 1111 1111 1111 | 12/25 | 123 | 123456 |
| ❌ Failure | 4000 0000 0000 0002 | 12/25 | 123 | 123456 |
| ❌ Declined | 4000 0000 0000 0069 | 12/25 | 123 | 123456 |

**Note**: All payments are TEST - NO real money is charged!
