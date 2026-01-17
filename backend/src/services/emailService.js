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
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service connection failed:", error.message);
    console.log("📧 Email credentials - USER:", process.env.EMAIL_USER);
    console.log("🔑 Email credentials - HOST:", process.env.EMAIL_HOST + ":" + process.env.EMAIL_PORT);
  } else {
    console.log("✅ Email service is ready to send messages");
  }
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

export const sendOTPEmail = async ({ to, otp, userName, isSignup = false }) => {
  const subject = isSignup ? "Verify Your Email - ArtistApp" : "Password Reset Code - ArtistApp";
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 24px;">${isSignup ? "Verify Your Email" : "Reset Your Password"}</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; color: #333;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Hello ${userName},</p>
        <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 25px;">
          ${isSignup 
            ? "Welcome to ArtistApp! Please verify your email address to complete your account setup." 
            : "You have requested to reset your password. Use the code below to proceed:"}
        </p>
        <div style="background-color: white; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px solid #5B4FEE;">
          <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">Your Verification Code</p>
          <h1 style="color: #5B4FEE; margin: 0; letter-spacing: 8px; font-size: 36px; font-weight: bold;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">This code is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px; text-align: center; margin: 10px 0;">${
          isSignup 
            ? "If you did not create an ArtistApp account, please disregard this email." 
            : "If you did not request this, please disregard this email."
        }</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© 2025 ArtistApp. All rights reserved.</p>
      </div>
    </div>
  `;
  
  await sendEmail({ to, subject, html });
};

export const sendWelcomeEmail = async ({ to, username, role }) => {
  const isArtist = role === "artist";
  const subject = "Welcome to ArtistApp";
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #5B4FEE 0%, #FF7F50 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: -0.5px;">Welcome to ArtistApp</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px 20px; background-color: #f9f9f9;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Hello <strong>${username}</strong>,</p>
        
        <p style="font-size: 15px; color: #555; line-height: 24px; margin-bottom: 30px;">
          Your account has been created successfully! You are now part of our creative community.
        </p>

        ${isArtist ? `
          <!-- Artist Content -->
          <h2 style="color: #5B4FEE; font-size: 20px; margin-top: 30px; margin-bottom: 20px;">Get Started</h2>
          
          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Upload Your Portfolio</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Add images and videos of your work to showcase your talent</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Complete Your Profile</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Add your bio, hourly rate, and highlight what makes you unique</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>List Your Skills</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Add your expertise to attract clients looking for your services</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Build Your Reputation</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Deliver excellent work and earn positive ratings to become a top-rated artist</p>
          </div>
        ` : `
          <!-- User Content -->
          <h2 style="color: #5B4FEE; font-size: 20px; margin-top: 30px; margin-bottom: 20px;">Get Started</h2>
          
          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Discover Artists</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Browse talented artists based on your requirements and budget</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Book Artists</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Schedule events and book your favorite artists at your preferred dates</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #5B4FEE; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Communicate</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Chat with artists, negotiate rates, and finalize all details seamlessly</p>
          </div>

          <div style="background-color: white; border-left: 4px solid #FF7F50; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #333;"><strong>Leave Reviews</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Share your experience and help other users find the best artists</p>
          </div>
        `}

        <p style="font-size: 15px; color: #555; line-height: 24px; margin-top: 30px;">
          If you have any questions, please reach out to our support team.
        </p>

        <p style="font-size: 15px; color: #555; margin-top: 20px;">
          Best regards,<br>
          <strong>The ArtistApp Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #999;">
        <p style="margin: 0;">© 2025 ArtistApp. All rights reserved.</p>
      </div>
    </div>
  `;
  
  await sendEmail({ to, subject, html });
};
