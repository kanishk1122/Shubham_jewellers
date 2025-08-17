import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalPurchases?: number;
  lastPurchaseDate?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, index: true, sparse: true },
    phone: { type: String, index: true, sparse: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
    totalPurchases: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
  },
  { timestamps: true }
);

let UserModel: any;
if (typeof window === "undefined") {
  UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
} else {
  UserModel = undefined;
}

export default UserModel;
