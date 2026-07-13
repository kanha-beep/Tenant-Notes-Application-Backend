import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "./Models/TenantSchema.js";
import User from "./Models/UserSchema.js";
import bcrypt from "bcryptjs";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://kanha_beep_db_user:RjWlquLu09OU4cKo@kanha-code.qx9zs9d.mongodb.net/tenantDB?retryWrites=true&w=majority&appName=Kanha-Code";
const tenantData = [
  { name: "acme", plan: "free", noteLimit: 10 },
  { name: "efgh", plan: "free", noteLimit: 10 },
];

export const mongooseConnect = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    // console.log("mongoose connected: ", mongoose.connection.host);
    // for (const tenant of tenantData) {
    //   const existingTenant = await Tenant.findOne({ name: tenant.name });
    //   if (!existingTenant) {
    //     const newTenant = await Tenant.create(tenant);
    //     console.log("Tenant created:", newTenant);
    //   } else {
    //     console.log("Tenant already exists:", existingTenant.name);
    //   }
    // }
    // const ABCD = await Tenant.findOne({ name: "Acme" });
    // const EFGH = await Tenant.findOne({ name: "EFGH" });

    // const testDb = [
    //   { username: "adminABCD", email: "admin@ACME.test", password: "password", role: "admin", tenant: ABCD._id },
    //   { username: "userABCD", email: "user@ACME.test", password: "password", role: "user", tenant: ABCD._id },
    //   { username: "adminEFGH", email: "admin@EFGH.test", password: "password", role: "admin", tenant: EFGH._id },
    //   { username: "userEFGH", email: "user@EFGH.test", password: "password", role: "user", tenant: EFGH._id },
    // ];
    // for (const user of testDb) {
    //   const existingUser = await User.findOne({ email: user.email, tenant: user.tenant });
    //   console.log("user.email: ", existingUser);
    //   if (!existingUser) {
    //     const hashPassword = await bcrypt.hash(user.password, 10);
    //     const newUser = await User.create({ ...user, password: hashPassword });
    //     console.log("User created:", newUser);
    //   }
    //    else {
    //     console.log("User already exists:", existingUser.email);
    //   }
    // }
    console.log("Mongoose connected");
    return true;
  } catch (e) {
    console.log("Mongoose error: ", e);
    return false;
  }

  console.log("Test data created");
};






// // Users to create

