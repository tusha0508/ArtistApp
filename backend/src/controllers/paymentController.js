import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Artist from "../models/Artist.js";
import Cancellation from "../models/Cancellation.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createRefund,
  getRefundStatus,
} from "../lib/razorpay.js";
import { sendEmail } from "../services/emailService.js";

/**
 * USER → CREATE RAZORPAY ORDER FOR ADVANCE PAYMENT (15%)
 */
export const createAdvancePaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    console.log('📦 [ADVANCE PAYMENT] Creating order for booking:', bookingId);

    const booking = await Booking.findById(bookingId)
      .populate("artistId", "email fullName")
      .populate("userId", "email username");

    if (!booking) {
      console.error('❌ [ADVANCE PAYMENT] Booking not found:', bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log('✅ [ADVANCE PAYMENT] Booking found:', {
      status: booking.status,
      userId: booking.userId._id,
      requestUserId: req.user._id,
    });

    // Authorization check
    if (booking.userId._id.toString() !== req.user._id.toString()) {
      console.error('❌ [ADVANCE PAYMENT] Unauthorized user');
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Only allow for confirmed bookings
    if (booking.status !== "CONFIRMED" && booking.status !== "ACCEPTED") {
      console.error('❌ [ADVANCE PAYMENT] Booking not ready. Status:', booking.status);
      return res
        .status(400)
        .json({ message: "Booking is not ready for payment" });
    }

    // Determine final amount
    const finalAmount =
      booking.status === "CONFIRMED"
        ? booking.counterOfferAmount
        : booking.proposedBudget;

    const advanceAmount = Math.round(finalAmount * 0.15); // 15%
    const remainingAmount = finalAmount - advanceAmount;

    console.log('💰 [ADVANCE PAYMENT] Amount calculation:', {
      finalAmount,
      advanceAmount,
      remainingAmount,
    });

    // Check if payment already exists
    let payment = await Payment.findOne({
      bookingId,
      advancePaymentStatus: "COMPLETED",
    });

    if (payment) {
      console.warn('⚠️ [ADVANCE PAYMENT] Advance already paid');
      return res
        .status(400)
        .json({ message: "Advance payment already completed for this booking" });
    }

    // Create or update payment record
    payment = await Payment.findOneAndUpdate(
      { bookingId },
      {
        bookingId,
        userId: booking.userId._id,
        artistId: booking.artistId._id,
        totalAmount: finalAmount,
        advanceAmount,
        remainingAmount,
        advancePaymentStatus: "PENDING",
      },
      { upsert: true, new: true }
    );

    console.log('✅ [ADVANCE PAYMENT] Payment record created/updated:', payment._id);

    // Create Razorpay order
    const orderDetails = await createRazorpayOrder(
      advanceAmount,
      bookingId,
      "ADVANCE"
    );

    console.log('✅ [ADVANCE PAYMENT] Razorpay order created:', orderDetails.orderId);

    // Update payment with order details
    payment.advancePaymentOrder = {
      razorpayOrderId: orderDetails.orderId,
    };
    await payment.save();

    console.log('✅ [ADVANCE PAYMENT] Order details saved. Sending response...');

    return res.status(200).json({
      orderId: orderDetails.orderId,
      amount: advanceAmount,
      currency: orderDetails.currency,
      bookingId,
      paymentId: payment._id,
    });
  } catch (err) {
    console.error("❌ [ADVANCE PAYMENT] createAdvancePaymentOrder error:", {
      message: err.message,
      stack: err.stack,
      fullError: err,
    });
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

/**
 * USER → VERIFY ADVANCE PAYMENT
 */
export const verifyAdvancePayment = async (req, res) => {
  try {
    const { bookingId, orderId, paymentId, signature } = req.body;

    console.log('🔍 [ADVANCE VERIFY] Verifying payment:', {
      bookingId,
      orderId,
      paymentId: paymentId?.substring(0, 20),
      signature: signature?.substring(0, 20),
    });

    // Verify Razorpay signature
    const isSignatureValid = verifyRazorpayPayment(
      orderId,
      paymentId,
      signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    console.log('✅ [ADVANCE VERIFY] Signature validation:', isSignatureValid);

    if (!isSignatureValid) {
      console.error('❌ [ADVANCE VERIFY] Invalid signature');
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { bookingId },
      {
        advancePaymentStatus: "COMPLETED",
        advancePaymentAt: new Date(),
        "advancePaymentOrder.razorpayPaymentId": paymentId,
        "advancePaymentOrder.razorpaySignature": signature,
      },
      { new: true }
    );

    console.log('✅ [ADVANCE VERIFY] Payment record updated:', payment._id);

    // Update booking status - ensure paymentStatus object exists
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: "ACTIVE",
        finalAmount: payment.totalAmount,
        paymentStatus: {
          advancePaid: true,
          remainingPaid: false,
        },
      },
      { new: true }
    ).populate("artistId", "email fullName username");

    console.log('✅ [ADVANCE VERIFY] Booking updated. Status:', booking.status);
    console.log('✅ [ADVANCE VERIFY] Payment Status:', booking.paymentStatus);

    // Send email to artist
    try {
      await sendEmail({
        to: booking.artistId.email,
        subject: "Advance Payment Received - ArtistApp",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0; font-size: 24px;">Payment Received</h2>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello ${booking.artistId.fullName},</p>
              <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">The user has successfully completed the advance payment for your confirmed booking. Your event is now scheduled.</p>
              
              <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;"><strong>Total Amount:</strong> ₹${payment.totalAmount}</p>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;"><strong>Advance Payment (15%):</strong> ₹${payment.advanceAmount}</p>
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Remaining Amount (85%):</strong> ₹${payment.remainingAmount}</p>
              </div>
              
              <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">Please prepare for your event. Once completed, you will receive the remaining 85% payment through the app.</p>
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 25px 0 0 0;">© 2025 ArtistApp. All rights reserved.</p>
            </div>
          </div>
        `,
      });
      console.log('✅ [ADVANCE VERIFY] Email sent to artist');
    } catch (emailErr) {
      console.error('⚠️ [ADVANCE VERIFY] Email sending failed:', emailErr.message);
    }

    console.log('✅ [ADVANCE VERIFY] Payment verification complete');

    return res.status(200).json({
      message: "Advance payment verified successfully",
      booking,
      payment,
    });
  } catch (err) {
    console.error("❌ [ADVANCE VERIFY] verifyAdvancePayment error:", {
      message: err.message,
      stack: err.stack,
      fullError: err,
    });
    return res.status(500).json({ 
      message: "Payment verification failed", 
      error: err.message 
    });
  }
};

/**
 * ARTIST → CREATE RAZORPAY ORDER FOR REMAINING PAYMENT (85%)
 * Called after event is completed
 */
export const createRemainingPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("artistId")
      .populate("userId", "email username");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization - only artist of this booking or user can request
    const isArtist = booking.artistId._id.toString() === req.user._id.toString();
    const isUser = booking.userId._id.toString() === req.user._id.toString();

    if (!isArtist && !isUser) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Status should be COMPLETED or ACTIVE
    if (booking.status !== "COMPLETED" && booking.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ message: "Booking is not eligible for remaining payment" });
    }

    const payment = await Payment.findOne({ bookingId });

    if (!payment) {
      return res
        .status(404)
        .json({ message: "Payment record not found for this booking" });
    }

    if (payment.advancePaymentStatus !== "COMPLETED") {
      return res
        .status(400)
        .json({ message: "Advance payment not completed yet" });
    }

    if (payment.remainingPaymentStatus === "COMPLETED") {
      return res
        .status(400)
        .json({ message: "Remaining payment already completed" });
    }

    // Create Razorpay order for remaining amount
    const orderDetails = await createRazorpayOrder(
      payment.remainingAmount,
      bookingId,
      "REMAINING"
    );

    // Update payment with order details
    payment.remainingPaymentOrder = {
      razorpayOrderId: orderDetails.orderId,
    };
    await payment.save();

    return res.status(200).json({
      orderId: orderDetails.orderId,
      amount: payment.remainingAmount,
      currency: orderDetails.currency,
      bookingId,
    });
  } catch (err) {
    console.error("createRemainingPaymentOrder error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ARTIST → VERIFY REMAINING PAYMENT
 */
export const verifyRemainingPayment = async (req, res) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;

    // Verify Razorpay signature
    const isSignatureValid = verifyRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isSignatureValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        remainingPaymentStatus: "COMPLETED",
        remainingPaymentAt: new Date(),
        "remainingPaymentOrder.razorpayPaymentId": razorpayPaymentId,
        "remainingPaymentOrder.razorpaySignature": razorpaySignature,
      },
      { new: true }
    );

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      payment.bookingId,
      {
        status: "COMPLETED",
        "paymentStatus.remainingPaid": true,
      },
      { new: true }
    )
      .populate("artistId", "email fullName username")
      .populate("userId", "email username");

    // Send confirmation emails
    await sendEmail({
      to: booking.artistId.email,
      subject: "Final Payment Released - ArtistApp",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Final Payment Released</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello,</p>
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">The event has been completed and the remaining payment (85%) has been released to your account.</p>
            
            <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;"><strong>Remaining Payment (85%):</strong> ₹${payment.remainingAmount}</p>
              <p style="margin: 0; font-size: 14px; color: #666;"><strong>Total Amount Earned:</strong> ₹${payment.totalAmount}</p>
            </div>
            
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">Thank you for your excellent work! We look forward to working with you again.</p>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 25px 0 0 0;">© 2025 ArtistApp. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Remaining payment verified successfully",
      booking,
      payment,
    });
  } catch (err) {
    console.error("verifyRemainingPayment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * USER → REQUEST REFUND
 * Refund rules:
 * - >3 days before event: 100% refund
 * - 1-3 days before: 50% refund
 * - <1 day before: 0% refund (no refund)
 */
export const requestRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization check
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if advance payment is completed
    const payment = await Payment.findOne({ bookingId });

    if (!payment || payment.advancePaymentStatus !== "COMPLETED") {
      return res
        .status(400)
        .json({ message: "No completed payment found for this booking" });
    }

    // Calculate days before event
    const now = new Date();
    const eventDate = new Date(booking.eventDate);
    const daysBeforeEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;

    if (daysBeforeEvent > 3) {
      refundPercentage = 100; // Full refund
    } else if (daysBeforeEvent >= 1) {
      refundPercentage = 50; // Half refund
    } else {
      refundPercentage = 0; // No refund
    }

    const refundAmount = (payment.advanceAmount * refundPercentage) / 100;

    // Update payment with refund request
    payment.refund = {
      isRefundRequested: true,
      refundReason: reason,
      daysBeforeEvent,
      refundPercentage,
      refundAmount,
      refundStatus: refundAmount > 0 ? "PROCESSING" : "NOT_INITIATED",
    };

    // Process refund if amount > 0
    if (refundAmount > 0 && payment.advancePaymentOrder.razorpayPaymentId) {
      try {
        const refundResult = await createRefund(
          payment.advancePaymentOrder.razorpayPaymentId,
          refundAmount
        );

        payment.refund.razorpayRefundId = refundResult.refundId;
        payment.refund.refundStatus = "PROCESSING";
        payment.refund.refundInitiatedAt = new Date();
      } catch (refundErr) {
        console.error("Refund processing error:", refundErr);
        payment.refund.refundStatus = "FAILED";
      }
    }

    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, {
      status: "CANCELLED",
    });

    return res.status(200).json({
      message: `Refund request processed. ${refundPercentage}% refund (₹${refundAmount}) will be credited.`,
      refund: payment.refund,
    });
  } catch (err) {
    console.error("requestRefund error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET PAYMENT DETAILS
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({ bookingId })
      .populate("userId", "username email")
      .populate("artistId", "fullName email username");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (err) {
    console.error("getPaymentDetails error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ARTIST → CANCEL BOOKING (with shadow ban tracking)
 */
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization - only artist can cancel
    if (booking.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only artist can cancel" });
    }

    // Only allow cancellation if not already cancelled
    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Record cancellation
    await Cancellation.create({
      artistId: req.user._id,
      bookingId,
      userId: booking.userId,
      reason,
    });

    // Check if artist has 3 cancellations in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cancellationCount = await Cancellation.countDocuments({
      artistId: req.user._id,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Update booking
    booking.status = "CANCELLED";
    booking.artistCancelledAt = new Date();
    booking.artistCancelReason = reason;
    await booking.save();

    // Shadow ban if 3 cancellations
    const artist = await Artist.findById(req.user._id);

    if (cancellationCount >= 3) {
      const bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      artist.shadowBan = {
        isShadowBanned: true,
        bannedUntil,
        reason: "3 cancellations within 7 days",
      };
      await artist.save();

      return res.status(200).json({
        message: "Booking cancelled. You have been shadow banned for 30 days due to multiple cancellations.",
        booking,
      });
    }

    return res.status(200).json({
      message: `Booking cancelled. You have ${3 - cancellationCount} cancellations left before shadow ban.`,
      booking,
    });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
