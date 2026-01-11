
// models/Artist.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const artistSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    profileImage: {
      type: String,           // Cloudinary URL or placeholder
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    resetOTP: {
      type: String,
      default: null,
    },
    resetOTPExpiry: {
      type: Date,
      default: null,
    },
    resetOTPAttempts: {
      type: Number,
      default: 0,
    },
    tncAccepted: {
      type: Boolean,
      default: false,
    },
    tncAcceptedAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }        // adds createdAt & updatedAt
);

// Hash password before saving
artistSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords for login
artistSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Artist = mongoose.model("Artist", artistSchema);
export default Artist;
