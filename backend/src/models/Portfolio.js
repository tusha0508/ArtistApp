// models/Portfolio.js
import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    mediaUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one media URL is required",
      },
    },

    tags: {
      type: [String],
      index: true,
      default: [],
    },

    price: {
      type: Number,
      min: 0,
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

// Text search index
portfolioSchema.index({ title: "text", description: "text" });

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio;
    