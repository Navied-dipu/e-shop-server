import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product/product.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.use(authenticate);

router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
