import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "./Models/TenantSchema.js";
import User from "./Models/UserSchema.js";
import bcrypt from "bcryptjs";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

export const mongooseConnect = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Mongoose connected");
  } catch (e) {
    console.log("Mongoose error: ", e);
    process.exit(1); // exit if connection fails
  }
};
// const tenantData = [
//   { name: "Acme", plan: "free", noteLimit: 3 },
//   { name: "EFGH", plan: "free", noteLimit: 3 },
// ];

// // Create tenants
// for (const tenant of tenantData) {
//   const existingTenant = await Tenant.findOne({ name: tenant.name });
//   if (!existingTenant) {
//     const newTenant = await Tenant.create(tenant);
//     console.log("Tenant created:", newTenant);
//   } else {
//     console.log("Tenant already exists:", existingTenant.name);
//   }
// }

// // Fetch tenants
// const ABCD = await Tenant.findOne({ name: "Acme" });
// const EFGH = await Tenant.findOne({ name: "EFGH" });

// // Users to create
// const testDb = [
//   { username: "adminABCD", email: "admin@ACME.test", password: "password", role: "admin", tenant: ABCD._id },
//   { username: "userABCD", email: "user@ACME.test", password: "password", role: "user", tenant: ABCD._id },
//   { username: "adminEFGH", email: "admin@EFGH.test", password: "password", role: "admin", tenant: EFGH._id },
//   { username: "userEFGH", email: "user@EFGH.test", password: "password", role: "user", tenant: EFGH._id },
// ];

// // Create users with hashed passwords
// for (const user of testDb) {
//   const existingUser = await User.findOne({ email: user.email, tenant: user.tenant });
//   if (!existingUser) {
//     const hashPassword = await bcrypt.hash(user.password, 10);
//     const newUser = await User.create({ ...user, password: hashPassword });
//     console.log("User created:", newUser);
//   } else {
//     console.log("User already exists:", existingUser.email);
//   }
// }
