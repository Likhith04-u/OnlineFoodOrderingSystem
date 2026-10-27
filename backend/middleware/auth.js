import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in to continue" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development_secret_change_me");
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "Account not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Administrator access required" });
  next();
}
