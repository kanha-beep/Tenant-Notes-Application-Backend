import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, _id: true }
);

const notesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    check: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "blocked"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    userFeedback: {
      type: String,
      default: "",
      trim: true,
    },
    feedbackAt: {
      type: Date,
      default: null,
    },
    template: {
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: "" },
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    issueCluster: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

notesSchema.index({ tenant: 1, user: 1, dueAt: 1 });
notesSchema.index({ tenant: 1, title: 1 });

const Note = mongoose.model("Note", notesSchema);
export default Note;
