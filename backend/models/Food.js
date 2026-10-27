import mongoose from "mongoose";
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  available: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model("Food", foodSchema);
