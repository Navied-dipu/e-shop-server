import express, { Router } from "express";

import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import reviewRoutes from "./review.routes.js";
import orderRoutes from "./order.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Prisma Express Starter API",
  });
});

router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/orders", orderRoutes);

export default router;
