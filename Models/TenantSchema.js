import Joi from "joi";
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
    name: String,
    plan: {
        type: String,
        enum: ["free", "paid", "enterprise"],
        default: "free"
    },
    noteLimit: String,
    paidUsers: {
        type: Number,
        default: 0
    }
}, {timestamps:true})
const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;