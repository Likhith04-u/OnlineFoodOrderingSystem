import { Router } from "express";
import Food from "../models/Food.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.search) filter.$or = [
      { name: { $regex: String(req.query.search), $options: "i" } },
      { description: { $regex: String(req.query.search), $options: "i" } },
      { category: { $regex: String(req.query.search), $options: "i" } }
    ];
    if (req.query.admin !== "true") filter.available = true;
    res.json(await Food.find(filter).sort({ createdAt: -1 }));
  } catch { res.status(500).json({ message: "Unable to load food menu" }); }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, price, image, available } = req.body;
    if (!name || !category || !Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: "Name, category, and a valid non-negative price are required." });
    const food = await Food.create({ name, description, category, price: Number(price), image, available });
    res.status(201).json(food);
  } catch { res.status(500).json({ message: "Unable to create food item" }); }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!food) return res.status(404).json({ message: "Food item not found" });
    res.json(food);
  } catch { res.status(400).json({ message: "Unable to update food item" }); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: "Food item not found" });
    res.json({ message: "Food item deleted" });
  } catch { res.status(500).json({ message: "Unable to delete food item" }); }
});
export default router;
