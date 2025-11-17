import mongoose from "mongoose";
import User from "./Models/UserSchema.js";
import Tenant from "./Models/TenantSchema.js";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function testUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    
    const tenants = await Tenant.find();
    console.log("Tenants:", tenants);
    
    const users = await User.find().populate('tenant');
    console.log("Users:", users);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testUsers();