import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Food from "./models/Food.js";
dotenv.config();

const sampleFoods = [
  { name: "Classic Veg Burger", description: "Grilled veggie patty, lettuce and house sauce", category: "Burgers", price: 129, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800" },
  { name: "Margherita Pizza", description: "Tomato, mozzarella and fresh basil", category: "Pizza", price: 249, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800" },
  { name: "Creamy Alfredo Pasta", description: "Pasta in a creamy parmesan sauce", category: "Pasta", price: 219, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800" },
  { name: "Crispy French Fries", description: "Golden fries with a pinch of sea salt", category: "Sides", price: 89, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800" },
  { name: "Chocolate Brownie", description: "Warm chocolate brownie dessert", category: "Desserts", price: 99, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800" },
  { name: "Fresh Lemonade", description: "Fresh lemon, mint and chilled water", category: "Drinks", price: 69, image: "https://images.unsplash.com/photo-1513558161293-cdad765edc2b?w=800" }
];
try {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online_food_ordering");
  const email = (process.env.ADMIN_EMAIL || "admin@restaurant.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "RestaurantAdmin@123";
  const hashed = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate({ email }, { name: process.env.ADMIN_NAME || "Restaurant Admin", email, password: hashed, role: "admin" }, { upsert: true, new: true, setDefaultsOnInsert: true });
  if (await Food.countDocuments() === 0) await Food.insertMany(sampleFoods);
  console.log(`Admin ready: ${email}`);
  console.log("Sample menu items inserted if the menu was empty.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
