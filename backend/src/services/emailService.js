// services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error; // Re-throw so caller knows it failed
  }
};

export const sendOTPEmail = async ({ to, otp, userName }) => {
  const subject = "Your Password Reset OTP";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>You've requested to reset your password. Use the OTP below to proceed:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #007AFF; margin: 0; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">© 2025 ArtistApp. All rights reserved.</p>
    </div>
  `;
  
  await sendEmail({ to, subject, html });
};

export const sendWelcomeEmail = async ({ to, username, role }) => {
  const isArtist = role === "artist";
  const subject = "Welcome to ArtistApp! 🎉";
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: -0.5px;">Welcome to ArtistApp! 🎉</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px 20px; background-color: #f9f9f9;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Hi <strong>${username}</strong>,</p>
        
        <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 30px;">
          Your account has been created successfully! We're excited to have you join our creative community. 🎨
        </p>

        ${isArtist ? `
          <!-- Artist Content -->
          <h2 style="color: #5B4FEE; font-size: 20px; margin-top: 30px; margin-bottom: 20px;">🚀 Here's What You Can Do Next:</h2>
          
          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>📸 Upload Your Portfolio</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Add stunning images and videos of your work to showcase your talent</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>✏️ Edit Your Profile</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Complete your bio, add your hourly rate, and highlight what makes you unique</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>⭐ Add Skills & Expertise</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">List all your skills to attract the right clients looking for your expertise</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>🏆 Become a Top-Rated Artist</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Deliver exceptional work and build your reputation to become the go-to choice for clients</p>
          </div>
        ` : `
          <!-- User Content -->
          <h2 style="color: #5B4FEE; font-size: 20px; margin-top: 30px; margin-bottom: 20px;">🚀 Here's What You Can Do Next:</h2>
          
          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>🎯 Discover Artists</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Browse through talented artists based on your requirements and budget</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>📅 Book Their Calendar</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Schedule events and book your favorite artists at your preferred dates and times</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>💬 Communicate & Collaborate</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Chat with artists, negotiate rates, and finalize all the details seamlessly</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>⭐ Leave Reviews & Ratings</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Share your experience and help other users find the best artists</p>
          </div>
        `}

        <p style="font-size: 15px; color: #555; line-height: 24px; margin-top: 30px;">
          If you have any questions or need assistance, feel free to reach out to our support team.
        </p>

        <p style="font-size: 15px; color: #555; margin-top: 20px;">
          Happy creating! 🎨<br>
          <strong>The ArtistApp Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #999;">
        <p style="margin: 0;">© 2025 ArtistApp. All rights reserved.</p>
        <p style="margin: 8px 0 0 0;">Connect • Create • Collaborate</p>
      </div>
    </div>
  `;
  
  await sendEmail({ to, subject, html });
};
