import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    password: {
        type: String,
        select: false,
    },
    lastSeenAt: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ["owner", "admin", "member", "viewer"],
        default: "member"
    },
    status: {
        type: String,
        enum: ["invited", "active", "suspended"],
        default: "active"
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant"
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    invitedAt: {
        type: Date,
        default: null,
    }
}, {timestamps: true})

UserSchema.index({ tenant: 1, email: 1 }, { unique: true });

const User = mongoose.model("User", UserSchema);
export default User;
