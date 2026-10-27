import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/foods.js";
import orderRoutes from "./routes/orders.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";

dotenv.config();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ message: "Online Food Ordering API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.get("/api/admin/stats", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { default: Food } = await import("./models/Food.js");
    const { default: Order } = await import("./models/Order.js");
    const { default: User } = await import("./models/User.js");
    const [foods, orders, customers, revenueRows] = await Promise.all([
      Food.countDocuments(), Order.countDocuments(), User.countDocuments({ role: "customer" }),
      Order.aggregate([{ $match: { status: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }])
    ]);
    res.json({ foods, orders, customers, revenue: revenueRows[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: "Unable to load dashboard statistics" }); }
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online_food_ordering")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
