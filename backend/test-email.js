import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
  try {
    console.log("🔧 Testing Brevo email configuration...\n");

    // Log what we're using
    console.log("📧 Email Config:");
    console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "***SET***" : "NOT SET");
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("\n");

    // Test API key by attempting to send email
    console.log("🔗 Testing Brevo API connection...");

    const emailData = {
      sender: {
        email: process.env.EMAIL_FROM || "noreply@artistapp.com",
        name: "ArtistApp"
      },
      to: [{ email: "singhdevesho701@gmail.com" }],
      subject: "Test Email from ArtistApp - Brevo",
      htmlContent: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>✅ Email Test Successful with Brevo!</h2>
          <p>This is a test email from your ArtistApp backend using Brevo.</p>
          <p><strong>Test OTP Code: 123456</strong></p>
          <p>If you received this, your Brevo email configuration is working correctly!</p>
        </div>
      `,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.messageId);
    console.log("\n📧 Check singhdevesho701@gmail.com inbox (and spam folder)");

  } catch (err) {
    console.error("❌ Brevo email test failed!");
    console.error("Error:", err.message);
    console.error("\nPossible causes:");
    console.error("1. BREVO_API_KEY is not set or incorrect");
    console.error("2. Brevo account not verified or suspended");
    console.error("3. Email sending limits exceeded");
    console.error("4. Network connectivity issues");
  }
};

testEmail();
