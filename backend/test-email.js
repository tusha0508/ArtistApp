import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
  try {
    console.log("🔧 Testing email configuration...\n");
    
    // Log what we're using
    console.log("📧 Email Config:");
    console.log("HOST:", process.env.EMAIL_HOST);
    console.log("PORT:", process.env.EMAIL_PORT);
    console.log("USER:", process.env.EMAIL_USER);
    console.log("PASS:", process.env.EMAIL_PASS ? "***SET***" : "NOT SET");
    console.log("FROM:", process.env.EMAIL_FROM);
    console.log("\n");
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    console.log("🔗 Testing connection...");
    await transporter.verify();
    console.log("✅ Connection successful!\n");

    // Send test email
    console.log("📨 Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: "singhdevesho701@gmail.com",
      subject: "Test Email from ArtistApp",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>✅ Email Test Successful!</h2>
          <p>This is a test email from your ArtistApp backend.</p>
          <p><strong>Test OTP Code: 123456</strong></p>
          <p>If you received this, your email configuration is working correctly!</p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("\n📧 Check singhdevesho701@gmail.com inbox (and spam folder)");
    
  } catch (err) {
    console.error("❌ Email test failed!");
    console.error("Error:", err.message);
    console.error("\nPossible causes:");
    console.error("1. Email credentials are wrong");
    console.error("2. Gmail password needs to be App Password (not regular password)");
    console.error("3. 2-Step Verification not enabled on Gmail account");
    console.error("4. Firewall blocking port 587");
  }
};

testEmail();
