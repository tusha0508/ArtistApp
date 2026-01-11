// routes/portfolioRoutes.js
import express from "express";
import {
  createPortfolio,
  getPortfolioById,
  listPortfolios,
  updatePortfolio,
  deletePortfolio,
} from "../controllers/portfolioController.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// PUBLIC
router.get("/", listPortfolios);          // /api/portfolios
router.get("/:id", getPortfolioById);     // /api/portfolios/:id

// ARTIST ONLY
router.post("/", protectRoute(["artist"]), createPortfolio);
router.put("/:id", protectRoute(["artist"]), updatePortfolio);
router.delete("/:id", protectRoute(["artist"]), deletePortfolio);

export default router;
