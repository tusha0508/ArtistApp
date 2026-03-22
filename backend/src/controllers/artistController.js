// controllers/artistController.js
import Artist from "../models/Artist.js";
import jwt from "jsonwebtoken";

export const getMeArtist = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (err) {
    console.error("getMeArtist error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMeArtist = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) delete updates.password;

    // Validate artistType if provided
    if (updates.artistType && !["solo", "band"].includes(updates.artistType)) {
      return res.status(400).json({ message: "Invalid artist type. Must be 'solo' or 'band'" });
    }

    // Validate bandDetails if artistType is being set to "band" or if bandDetails are provided
    if (updates.artistType === "band" || (updates.bandDetails && !updates.artistType)) {
      const artist = await Artist.findById(req.user._id);
      const effectiveArtistType = updates.artistType || artist.artistType;

      if (effectiveArtistType === "band") {
        const bandDetails = updates.bandDetails || artist.bandDetails;
        if (!bandDetails || !bandDetails.bandName || !bandDetails.members) {
          return res.status(400).json({ message: "Band name and number of members are required for band artists" });
        }
        if (bandDetails.members < 1) {
          return res.status(400).json({ message: "Number of members must be at least 1" });
        }
        if (bandDetails.performingSince && (bandDetails.performingSince < 1900 || bandDetails.performingSince > new Date().getFullYear())) {
          return res.status(400).json({ message: "Performing since year must be between 1900 and current year" });
        }
      }
    }

    // If switching from band to solo, clear bandDetails
    if (updates.artistType === "solo") {
      updates.bandDetails = null;
    }

    const updated = await Artist.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    return res.status(200).json(updated);
  } catch (err) {
    console.error("updateMeArtist error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePasswordArtist = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Provide current and new password" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password too short" });

    const artist = await Artist.findById(req.user._id);
    const ok = await artist.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password incorrect" });

    artist.password = newPassword;
    await artist.save();
    return res.status(200).json({ message: "Password changed" });
  } catch (err) {
    console.error("changePasswordArtist error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is not undefined or invalid
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid artist ID" });
    }
    
    const artist = await Artist.findById(id).select("-password");
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    return res.status(200).json(artist);
  } catch (err) {
    console.error("getArtistById error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const searchArtists = async (req, res) => {
  try {
    const q = req.query.search || "";
    const skill = req.query.skill || "";
    const cityFilter = req.query.city || "";
    const artistTypeFilter = req.query.artistType || ""; // "solo", "band", or ""

    const criteria = [];

    // Exclude shadow-banned artists
    criteria.push({
      $or: [
        { "shadowBan.isShadowBanned": false },
        { "shadowBan.isShadowBanned": { $exists: false } },
        {
          $and: [
            { "shadowBan.isShadowBanned": true },
            { "shadowBan.bannedUntil": { $lt: new Date() } }, // Ban expired
          ],
        },
      ],
    });

    if (q) {
      const regex = new RegExp(q, "i");
      criteria.push({ $or: [{ username: regex }, { fullName: regex }, { city: regex }] });
    }

    if (skill) {
      const skillRegex = new RegExp(skill, "i");
      // match if any skill element matches the regex
      criteria.push({ skills: skillRegex });
    }

    if (cityFilter) {
      // support comma-separated multiple cities
      const parts = cityFilter.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const regexes = parts.map((p) => new RegExp(p, "i"));
        criteria.push({ city: { $in: regexes } });
      } else {
        const cityRegex = new RegExp(cityFilter, "i");
        criteria.push({ city: cityRegex });
      }
    }

    if (artistTypeFilter && ["solo", "band"].includes(artistTypeFilter)) {
      criteria.push({ artistType: artistTypeFilter });
    }

    const query = criteria.length ? { $and: criteria } : {};

    const artists = await Artist.find(query)
      .select("-password")
      .limit(100);

    return res.status(200).json(artists);
  } catch (err) {
    console.error("searchArtists error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCities = async (req, res) => {
  try {
    const cities = await Artist.distinct("city");
    const cleaned = cities.filter(Boolean).map((c) => c.trim()).sort((a, b) => a.localeCompare(b));
    return res.status(200).json(cleaned);
  } catch (err) {
    console.error("getCities error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const discoverArtistsByPincode = async (req, res) => {
  try {
    const { pincode, artistType } = req.query;
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: "Valid 6-digit pincode is required" });
    }

    // Exclude shadow-banned artists
    const baseCriteria = {
      $or: [
        { "shadowBan.isShadowBanned": false },
        { "shadowBan.isShadowBanned": { $exists: false } },
        {
          $and: [
            { "shadowBan.isShadowBanned": true },
            { "shadowBan.bannedUntil": { $lt: new Date() } }, // Ban expired
          ],
        },
      ],
    };

    // Add artistType filter if provided
    if (artistType && ["solo", "band"].includes(artistType)) {
      baseCriteria.artistType = artistType;
    }

    // First, get artists with exact pincode match
    const exactMatchArtists = await Artist.find({
      ...baseCriteria,
      pincode: pincode,
    })
      .select("-password")
      .limit(50);

    // Then, get nearby pincodes (simple logic: same first 4 digits + variations)
    // For more sophisticated nearby logic, you'd need a pincode database or API
    const nearbyPincodes = [];
    const basePin = pincode.substring(0, 4);

    // Generate some nearby variations (this is a simplified approach)
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue; // Skip exact match
      const variation = (parseInt(pincode.substring(4, 6)) + i).toString().padStart(2, '0');
      if (variation.length === 2 && variation >= '00' && variation <= '99') {
        nearbyPincodes.push(basePin + variation);
      }
    }

    const nearbyArtists = await Artist.find({
      ...baseCriteria,
      pincode: { $in: nearbyPincodes },
    })
      .select("-password")
      .limit(50);

    // Combine results: exact matches first, then nearby
    const allArtists = [
      ...exactMatchArtists,
      ...nearbyArtists.filter(artist => !exactMatchArtists.some(exact => exact._id.equals(artist._id))),
    ];

    return res.status(200).json({
      pincode,
      exactMatches: exactMatchArtists.length,
      nearbyMatches: nearbyArtists.length,
      artists: allArtists.slice(0, 100), // Limit total results
    });
  } catch (err) {
    console.error("discoverArtistsByPincode error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMeArtist = async (req, res) => {
  try {
    await Artist.findByIdAndDelete(req.user._id);
    return res.status(200).json({ message: "Artist account deleted" });
  } catch (err) {
    console.error("deleteMeArtist error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// lightweight refresh (dev)
export const refreshTokenArtist = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role } = decoded;
    const newToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
    return res.status(200).json({ token: newToken });
  } catch (err) {
    console.error("refreshTokenArtist error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
