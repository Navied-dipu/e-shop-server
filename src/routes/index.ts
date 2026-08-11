import express, { Router } from "express";
import cors from "cors";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Prisma Express Starter API",
  });
});

export default router;
