import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  date: Date;
  amount: number;
  category: string;
  description?: string;
  vendor?: string;
  relatedCustomerId?: mongoose.Types.ObjectId;
  metalWeight?: number;
  metalType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "operational",
        "loan",
        "rent",
        "salary",
        "utility",
        "misc",
        "purchase",
        "other",
      ],
      default: "operational",
    },
    description: { type: String },
    vendor: { type: String },
    relatedCustomerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    metalWeight: { type: Number },
    metalType: { type: String },
  },
  { timestamps: true }
);

// Indexes for common queries
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ relatedCustomerId: 1 });

const Expense =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
