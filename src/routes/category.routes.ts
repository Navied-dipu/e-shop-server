import { Router } from "express";

import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category/category.controller.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.use(authenticate);
router.use(authorize("ADMIN"));

router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
