import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        default: "",
        trim: true,
    },
    username:{
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,   
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
     },
     profileImage:{
        type: String,
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
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
}
const User = mongoose.model("User", userSchema);
export default User;