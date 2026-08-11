import express, { Router } from "express";

import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Prisma Express Starter API",
  });
});

router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);

export default router;
