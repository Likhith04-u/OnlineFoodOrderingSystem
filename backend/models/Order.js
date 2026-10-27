import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  items: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  total: { type: Number, required: true, min: 0 },
  deliveryAddress: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"], default: "Pending" }
}, { timestamps: true });
export default mongoose.model("Order", orderSchema);
