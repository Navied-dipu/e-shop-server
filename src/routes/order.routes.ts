import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/order/order.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", cancelOrder);

export default router;
