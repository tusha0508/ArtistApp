// controllers/portfolioController.js
import Portfolio from "../models/Portfolio.js";
import jwt from "jsonwebtoken";
import Artist from "../models/Artist.js";
import User from "../models/User.js";

/**
 * CREATE portfolio (Artist only)
 */
export const createPortfolio = async (req, res) => {
  try {
    const { title, caption, description, mediaUrls, tags, price } = req.body;

    if (!title || !mediaUrls || !Array.isArray(mediaUrls)) {
      return res.status(400).json({ message: "Title and mediaUrls are required" });
    }

    const portfolio = await Portfolio.create({
      artistId: req.user._id, // comes from protectRoute
      title,
      caption,
      description,
      mediaUrls,
      tags,
      price,
    });

    return res.status(201).json(portfolio);
  } catch (err) {
    console.error("createPortfolio error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET single portfolio (Public)
 */
export const getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
      .populate("artistId", "username fullName profileImage city");

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    return res.status(200).json(portfolio);
  } catch (err) {
    console.error("getPortfolioById error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * LIST / SEARCH portfolios (Public)
 */
export const listPortfolios = async (req, res) => {
  try {
    const { artist, tag, q, page = 1, limit = 20 } = req.query;

    const filter = { visibility: "public" };

    // support ?artist=me to mean the authenticated artist
    if (artist && artist !== "undefined") {
      if (artist === "me") {
        // try to read token from header and resolve account id
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ message: "Authentication required for artist=me" });
        }

        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const { userId, role } = decoded;
          let account = null;
          if (role === "artist") {
            account = await Artist.findById(userId).select("_id");
          } else {
            account = await User.findById(userId).select("_id");
          }

          if (!account) return res.status(401).json({ message: "Invalid token" });

          filter.artistId = account._id;
        } catch (err) {
          console.error("listPortfolios auth error:", err);
          return res.status(401).json({ message: "Token is not valid" });
        }
      } else {
        filter.artistId = artist;
      }
    }
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const portfolios = await Portfolio.find(filter)
      .populate("artistId", "username fullName profileImage city")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json(portfolios);
  } catch (err) {
    console.error("listPortfolios error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * UPDATE portfolio (Artist only, owner)
 */
export const updatePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    if (portfolio.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = { ...req.body };
    delete updates.artistId;

    const updated = await Portfolio.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    return res.status(200).json(updated);
  } catch (err) {
    console.error("updatePortfolio error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE portfolio (Artist only, owner)
 */
export const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    if (portfolio.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await portfolio.deleteOne();
    return res.status(200).json({ message: "Portfolio deleted" });
  } catch (err) {
    console.error("deletePortfolio error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
