import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

export default router;
