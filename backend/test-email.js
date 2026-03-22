import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
  try {
    console.log("🔧 Testing Resend email configuration...\n");

    // Log what we're using
    console.log("📧 Email Config:");
    console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "***SET***" : "NOT SET");
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("\n");

    const emailData = {
      from: process.env.EMAIL_FROM || "ArtistApp <noreply@yourdomain.com>",
      to: ["singhdevesho701@gmail.com"],
      subject: "Test Email from ArtistApp - Resend",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>✅ Email Test Successful with Resend!</h2>
          <p>This is a test email from your ArtistApp backend using Resend.</p>
          <p><strong>Test OTP Code: 123456</strong></p>
          <p>If you received this, your Resend email configuration is working correctly!</p>
        </div>
      `,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Resend API error: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.id);
    console.log("\n📧 Check singhdevesho701@gmail.com inbox (and spam folder)");

  } catch (err) {
    console.error("❌ Resend email test failed!");
    console.error("Error:", err.message);
    console.error("\nPossible causes:");
    console.error("1. RESEND_API_KEY is not set or incorrect");
    console.error("2. Resend account not verified or suspended");
    console.error("3. Email sending limits exceeded");
    console.error("4. Network connectivity issues");
  }
};

testEmail();
