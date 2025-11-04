import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
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