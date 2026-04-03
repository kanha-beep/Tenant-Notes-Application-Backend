import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    check: {
      type: Boolean,
      default: false,
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
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", notesSchema);
export default Note;
