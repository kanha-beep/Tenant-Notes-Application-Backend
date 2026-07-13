import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: { type: String, default: "general", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, _id: true }
);

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "team", "enterprise"],
      default: "free",
    },
    noteLimit: {
      type: String,
      default: "10",
    },
    paidUsers: {
      type: Number,
      default: 1,
    },
    billing: {
      seats: { type: Number, default: 5 },
      renewalDate: { type: Date, default: null },
      status: {
        type: String,
        enum: ["trialing", "active", "past_due"],
        default: "trialing",
      },
      stripeCustomerId: { type: String, default: "" },
    },
    settings: {
      allowPublicInvites: { type: Boolean, default: false },
      slaHours: { type: Number, default: 24 },
    },
    templates: {
      type: [templateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
