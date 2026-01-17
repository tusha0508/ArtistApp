import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️ Razorpay credentials missing in .env file");
  console.warn("KEY_ID:", process.env.RAZORPAY_KEY_ID ? "✅ Set" : "❌ Missing");
  console.warn("KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "✅ Set" : "❌ Missing");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay Order
 */
export const createRazorpayOrder = async (amount, bookingId, paymentType) => {
  try {
    // Create short receipt (max 40 chars)
    const shortReceipt = `${paymentType.substring(0, 3)}_${bookingId.substring(0, 20)}_${Date.now().toString().slice(-8)}`;
    
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        bookingId,
        paymentType, // "ADVANCE" or "REMAINING"
      },
    };

    const order = await razorpay.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    throw new Error("Failed to create payment order");
  }
};

/**
 * Verify Razorpay Payment
 */
export const verifyRazorpayPayment = (
  orderId,
  paymentId,
  signature,
  keySecret
) => {
  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    return false;
  }
};

/**
 * Fetch Payment Details from Razorpay
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Razorpay Fetch Payment Error:", error);
    throw new Error("Failed to fetch payment details");
  }
};

/**
 * Create Refund
 */
export const createRefund = async (paymentId, refundAmount) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(refundAmount * 100), // Convert to paise
    });

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100, // Convert back to rupees
    };
  } catch (error) {
    console.error("Razorpay Refund Error:", error);
    throw new Error("Failed to create refund");
  }
};

/**
 * Get Refund Status
 */
export const getRefundStatus = async (refundId) => {
  try {
    const refund = await razorpay.refunds.fetch(refundId);
    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    };
  } catch (error) {
    console.error("Razorpay Get Refund Error:", error);
    throw new Error("Failed to fetch refund status");
  }
};

export default razorpay;
