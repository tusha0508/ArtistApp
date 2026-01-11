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
    });

    // EMAIL → ARTIST
    await sendEmail({
      to: artist.email,
      subject: "New Booking Request",
      html: `
        <h3>You have a new booking request</h3>
        <p><b>Date:</b> ${eventDate}</p>
        <p><b>Time:</b> ${eventTime}</p>
        <p><b>Budget:</b> ₹${proposedBudget}</p>
        <p>Please open the app to respond.</p>
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
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (err) {
    console.error("getUserBookings error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ARTIST → VIEW BOOKINGS
 */
export const getArtistBookings = async (req, res) => {
  const bookings = await Booking.find({ artistId: req.user._id })
    .populate("userId", "username email")
    .sort({ createdAt: -1 });

  res.json(bookings);
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
      subject: "Booking Confirmed 🎉",
      html: `
        <h3>Booking Confirmed</h3>
        <p>The user has accepted your counter offer.</p>
        <p>Please open the app for details.</p>
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
      subject: "Booking Declined",
      html: `
        <h3>Booking Declined</h3>
        <p>The user has rejected your counter offer.</p>
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
      subject: `Booking ${status}`,
      html: `
        <h3>${emailText}</h3>
        <p>${artistMessage || ""}</p>
        <p>Open the app for details.</p>
      `,
    });

    res.json(booking);
  } catch (err) {
    console.error("respondToBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
