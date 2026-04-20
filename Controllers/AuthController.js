import bcrypt from "bcryptjs";
import { userValidation } from "../Validation/SchemaValidation.js";
import User from "../Models/UserSchema.js";
import Tenant from "../Models/TenantSchema.js";
import ExpressError from "../Middlewares/ExpressError.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res, next) => {
  console.log("Register request body:", req.body);
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();
  const username = req.body.username?.trim();
  const tenant = req.body.tenant?.toLowerCase();
  if (!email || !password || !username || !tenant) {
    return next(new ExpressError(400, "Please enter username, email, password, and tenant"));
  }

  const findTenant = await Tenant.findOne({ name: tenant });
  if (!findTenant) return next(new ExpressError(403, "No existing Tenant found"));
  const existingUser = await User.findOne({ email, tenant: findTenant._id });
  if (existingUser) return next(new ExpressError(402, "Already Registered"));
  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashPassword,
    tenant: findTenant._id,
    username,
    role: "user",
    lastSeenAt: new Date(),
  });
  res.json({
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    tenant: user.tenant,
  });
};

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }

  const tenantId =
    typeof user.tenant === "object" && user.tenant !== null
      ? user.tenant._id?.toString()
      : user.tenant?.toString();

  return jwt.sign(
    { _id: user._id.toString(), tenant: tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export const loginUser = async (req, res, next) => {
  try {
    console.log("Login request body:", req.body);
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const tenant = req.body.tenant?.toLowerCase();
    if (!email || !password || !tenant) {
      return next(new ExpressError(400, "Wrong details. Please enter all"));
    }

    const findTenant = await Tenant.findOne({ name: tenant });
    if (!findTenant) return next(new ExpressError(403, "No tenant exist found"));

    const user = await User.findOne({ email, tenant: findTenant._id })
      .select("+password")
      .populate("tenant");
    if (!user) return next(new ExpressError(400, "Invalid credentials"));

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return next(new ExpressError(400, "Invalid credentials"));

    if (user.tenant.name !== tenant) return next(new ExpressError(401, "Tenant not matched"));

    user.lastSeenAt = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(new ExpressError(500, "Login failed: " + error.message));
  }
};

export const currentOwner = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("tenant", "name plan noteLimit");
  console.log("current owner NotesAuth: ", user.username);
  if (!user) return next(new ExpressError(404, "User not found"));
  res.json(user);
};
