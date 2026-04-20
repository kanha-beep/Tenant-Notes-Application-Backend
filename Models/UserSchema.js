import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
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
        enum: ["user", "admin"],
        default: "user"
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant"
    }
}, {timestamps: true})
const User = mongoose.model("User", UserSchema);
export default User;
