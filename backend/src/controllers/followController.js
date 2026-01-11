// controllers/followController.js
import Follow from "../models/Follow.js";
import Artist from "../models/Artist.js";

/**
 * FOLLOW artist
 * POST /api/artists/:id/follow
 * Auth: User
 */
export const followArtist = async (req, res) => {
  try {
    const userId = req.user._id;
    const artistId = req.params.id;

    if (userId.toString() === artistId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Ensure artist exists
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const follow = await Follow.create({ userId, artistId });

    return res.status(201).json({
      message: "Artist followed",
      follow,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already following artist" });
    }
    console.error("followArtist error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * UNFOLLOW artist
 * DELETE /api/artists/:id/follow
 * Auth: User
 */
export const unfollowArtist = async (req, res) => {
  try {
    const userId = req.user._id;
    const artistId = req.params.id;

    const result = await Follow.findOneAndDelete({ userId, artistId });

    if (!result) {
      return res.status(400).json({ message: "You are not following this artist" });
    }

    return res.status(200).json({ message: "Artist unfollowed" });
  } catch (err) {
    console.error("unfollowArtist error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * LIST artists followed by a user
 * GET /api/users/:id/following
 * Auth: User (or public if you want later)
 */
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    const follows = await Follow.find({ userId })
      .populate("artistId", "username fullName profileImage city")
      .sort({ createdAt: -1 });

    const artists = follows.map((f) => f.artistId);

    return res.status(200).json(artists);
  } catch (err) {
    console.error("getFollowing error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
