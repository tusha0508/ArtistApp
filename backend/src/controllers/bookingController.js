// controllers/bookingController.js
import Booking from "../models/Booking.js";
import Artist from "../models/Artist.js";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";

/**
 * USER → CREATE BOOKING
 */
export const createBooking = async (req, res) => {
  try {
    const {
      artistId,
      eventDate,
      eventTime,
      durationHours,
      location,
      description,
      proposedBudget,
    } = req.body;

    if (!artistId || !eventDate || !eventTime || !durationHours || !location || !proposedBudget) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const user = await User.findById(req.user._id);

    const booking = await Booking.create({
      userId: req.user._id,
      artistId,
      eventDate,
      eventTime,
      durationHours,
      location,
      description,
      proposedBudget,
      finalAmount: proposedBudget, // Initially set to proposedBudget, updates when counter offer accepted
    });

    // EMAIL → ARTIST
    await sendEmail({
      to: artist.email,
      subject: "New Booking Request - ArtistApp",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">New Booking Request</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello,</p>
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">You have received a new booking request. Please review the details below:</p>
            
            <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;"><strong>Event Date:</strong> ${eventDate}</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;"><strong>Event Time:</strong> ${eventTime}</p>
              <p style="margin: 0; font-size: 14px; color: #666;"><strong>Proposed Budget:</strong> ₹${proposedBudget}</p>
            </div>

            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">Please log in to ArtistApp to review the complete booking details and respond to this request.</p>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 25px 0 0 0;">© 2025 ArtistApp. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * USER → VIEW OWN BOOKINGS
 */
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("artistId", "username fullName profileImage city")
      .lean() // Convert to plain objects
      .sort({ createdAt: -1 });

    // Enrich bookings with payment status from Payment collection
    const Payment = (await import("../models/Payment.js")).default;
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ bookingId: booking._id });
        
        if (payment) {
          // Update booking's paymentStatus from Payment record
          booking.paymentStatus = {
            advancePaid: payment.advancePaymentStatus === "COMPLETED",
            remainingPaid: payment.remainingPaymentStatus === "COMPLETED",
          };
        }
        
        console.log(`📋 [GET USER BOOKINGS] Booking ${booking._id}:`, {
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentRecord: payment ? {
            advancePaymentStatus: payment.advancePaymentStatus,
            remainingPaymentStatus: payment.remainingPaymentStatus,
          } : 'NOT_FOUND',
        });
        
        return booking;
      })
    );

    console.log('✅ [GET USER BOOKINGS] Sending', enrichedBookings.length, 'bookings with updated payment status');
    return res.status(200).json(enrichedBookings);
  } catch (err) {
    console.error("getUserBookings error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ARTIST → VIEW BOOKINGS
 */
export const getArtistBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ artistId: req.user._id })
      .populate("userId", "username email")
      .lean() // Convert to plain objects
      .sort({ createdAt: -1 });

    // Enrich bookings with payment status from Payment collection
    const Payment = (await import("../models/Payment.js")).default;
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ bookingId: booking._id });
        
        if (payment) {
          // Update booking's paymentStatus from Payment record
          booking.paymentStatus = {
            advancePaid: payment.advancePaymentStatus === "COMPLETED",
            remainingPaid: payment.remainingPaymentStatus === "COMPLETED",
          };
        }
        
        console.log(`📋 [GET ARTIST BOOKINGS] Booking ${booking._id}:`, {
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentRecord: payment ? {
            advancePaymentStatus: payment.advancePaymentStatus,
            remainingPaymentStatus: payment.remainingPaymentStatus,
          } : 'NOT_FOUND',
        });
        
        return booking;
      })
    );

    console.log('✅ [GET ARTIST BOOKINGS] Sending', enrichedBookings.length, 'bookings with updated payment status');
    res.json(enrichedBookings);
  } catch (err) {
    console.error("getArtistBookings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * USER → ACCEPT COUNTER OFFER
 */
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("artistId", "email username");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "COUNTER_OFFER") {
      return res.status(400).json({ message: "Booking is not in counter offer state" });
    }

    booking.status = "CONFIRMED";
    await booking.save();

    // EMAIL → ARTIST
    await sendEmail({
      to: booking.artistId.email,
      subject: "Booking Confirmed - ArtistApp",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello,</p>
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">The booking request has been confirmed. The user has accepted your counter offer and the booking is now active.</p>
            
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">Please log in to ArtistApp to view the booking details and prepare accordingly.</p>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 25px 0 0 0;">© 2025 ArtistApp. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json(booking);
  } catch (err) {
    console.error("confirmBooking error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * USER → REJECT COUNTER OFFER
 */
export const rejectCounterOffer = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("artistId", "email username");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "COUNTER_OFFER") {
      return res.status(400).json({ message: "Booking is not in counter offer state" });
    }

    booking.status = "USER_REJECTED";
    await booking.save();

    // EMAIL → ARTIST
    await sendEmail({
      to: booking.artistId.email,
      subject: "Booking Request Declined - ArtistApp",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Booking Request Declined</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello,</p>
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">The user has declined your counter offer. This booking request has been closed.</p>
            
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">You may continue to receive new booking requests from other users. Please log in to ArtistApp to view available opportunities.</p>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 25px 0 0 0;">© 2025 ArtistApp. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Counter offer rejected",
      booking,
    });
  } catch (err) {
    console.error("rejectCounterOffer error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ARTIST → RESPOND
 */
export const respondToBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "email username")
      .populate("artistId", "username");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.artistId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { status, artistMessage, counterOfferAmount } = req.body;

    booking.status = status;
    booking.artistMessage = artistMessage;
    booking.counterOfferAmount = counterOfferAmount;
    await booking.save();

    // EMAIL → USER
    let emailText = "";

    if (status === "ACCEPTED") {
      emailText = "Your booking has been accepted 🎉";
    } else if (status === "REJECTED") {
      emailText = "Your booking was rejected.";
    } else {
      emailText = `Artist requested a change. New amount: ₹${counterOfferAmount}`;
    }

    await sendEmail({
      to: booking.userId.email,
      subject: `Booking Status: ${status} - ArtistApp`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Booking Status Update</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello,</p>
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">${emailText}</p>
            
            ${artistMessage ? `<p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;"><strong>Artist Message:</strong> ${artistMessage}</p>` : ''}
            
            <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">Please log in to ArtistApp to view the complete booking details.</p>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 25px 0 0 0;">© 2025 ArtistApp. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    res.json(booking);
  } catch (err) {
    console.error("respondToBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
