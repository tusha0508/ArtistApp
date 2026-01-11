// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";               // register/login for users
import userRoutes from "./routes/userRoutes.js";               // profile routes for users (me, update, password, delete, refresh)
import artistAuthRoutes from "./routes/artistAuthRoutes.js";   // register/login for artists
import artistRoutes from "./routes/artistRoutes.js";           // artist profile routes (me, update, public GET, search, delete)
import { connectDB } from "./lib/db.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;



// Basic middleware
app.use(express.json({ limit: "1mb" })); // JSON parser MUST be before routes
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// quick health check
app.get("/ping", (req, res) => res.send("pong"));

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/portfolios", portfolioRoutes); 
app.use("/api/artists", artistAuthRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
// handle invalid JSON parse errors from express.json
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    console.warn("Invalid JSON payload:", err.message);
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.warn("SyntaxError while parsing JSON:", err.message);
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  console.error(err && err.stack ? err.stack : err);
  res.status(500).json({ message: "Internal Server Error" });
});

// (optional) print mounted routes in dev — SAFELY
if (process.env.NODE_ENV !== "production") {
  if (app._router && Array.isArray(app._router.stack)) {
    console.log("Mounted route list:");
    app._router.stack
      .filter((r) => r.route && r.route.path)
      .forEach((r) => {
        console.log(Object.keys(r.route.methods).join(", ").toUpperCase(), r.route.path);
      });
  } else {
    console.log("No routes found on app._router (this is fine).");
  }
}

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });

// export app for testing if needed
export default app;
