import { Router } from "express";

import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user/user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN"), getUsers);
router.get("/:id", getUserById);
router.patch("/:id", authorize("ADMIN"), updateUser);
router.delete("/:id", authorize("ADMIN"), deleteUser);

export default router;
