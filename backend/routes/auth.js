import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const makeToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: "7d" });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 8) return res.status(400).json({ message: "Enter your name, a valid email, and a password of at least 8 characters." });
    if (await User.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists." });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "customer" });
    res.status(201).json({ message: "Registration successful", token: makeToken(user), user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: "Unable to register account" }); }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid email or password." });
    res.json({ message: "Login successful", token: makeToken(user), user: publicUser(user) });
  } catch { res.status(500).json({ message: "Unable to log in" }); }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
export default router;
