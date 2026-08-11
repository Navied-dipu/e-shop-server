import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import {
  createReview,
  getReviewsByProduct,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/review/review.controller.js";

const router = Router();

router.get("/", getReviewsByProduct);
router.get("/:id", getReviewById);

router.use(authenticate);

router.post("/", createReview);
router.patch("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;
