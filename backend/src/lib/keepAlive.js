// lib/keepAlive.js
// Prevents Render free tier from sleeping by pinging the server every 10 minutes
import cron from "node-cron";

export const startKeepAliveJob = (serverUrl) => {
  // Run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const response = await fetch(`${serverUrl}/ping`);
      if (response.ok) {
        console.log("✅ Keep-alive ping successful at", new Date().toISOString());
      }
    } catch (error) {
      console.error("❌ Keep-alive ping failed:", error.message);
    }
  });

  console.log("⏰ Keep-alive job started - server will ping itself every 10 minutes");
};
