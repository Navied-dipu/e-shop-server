import express, { Router } from "express";

import userRoutes from "./user.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Prisma Express Starter API",
  });
});

router.use("/users", userRoutes);

export default router;
