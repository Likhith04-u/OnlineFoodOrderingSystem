import { Router } from "express";
import Order from "../models/Order.js";
import Food from "../models/Food.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !String(deliveryAddress || "").trim()) return res.status(400).json({ message: "Add items and a delivery address." });
    const orderItems = [];
    let total = 0;
    for (const item of items) {
      const food = await Food.findOne({ _id: item.foodId, available: true });
      const quantity = Math.floor(Number(item.quantity));
      if (!food || !Number.isFinite(quantity) || quantity < 1 || quantity > 50) return res.status(400).json({ message: "One or more cart items are invalid or unavailable." });
      orderItems.push({ food: food._id, name: food.name, price: food.price, quantity });
      total += food.price * quantity;
    }
    const order = await Order.create({ customer: req.user._id, customerName: req.user.name, items: orderItems, total, deliveryAddress: String(deliveryAddress).trim() });
    res.status(201).json(order);
  } catch { res.status(500).json({ message: "Unable to place order" }); }
});

router.get("/mine", requireAuth, async (req, res) => {
  try { res.json(await Order.find({ customer: req.user._id }).sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: "Unable to load your orders" }); }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "All") filter.status = req.query.status;
    if (req.query.search) filter.$or = [
      { customerName: { $regex: String(req.query.search), $options: "i" } },
      { deliveryAddress: { $regex: String(req.query.search), $options: "i" } }
    ];
    res.json(await Order.find(filter).sort({ createdAt: -1 }));
  } catch { res.status(500).json({ message: "Unable to load orders" }); }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const allowed = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch { res.status(500).json({ message: "Unable to update order status" }); }
});
export default router;
