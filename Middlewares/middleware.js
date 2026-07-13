import jwt from "jsonwebtoken";
import User from "../Models/UserSchema.js";
import Tenant from "../Models/TenantSchema.js";
import ExpressError from "./ExpressError.js";
import { getTokenFromRequest } from "../Services/authService.js";
import { canManageTenant } from "../Services/noteService.js";

const verifyToken = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded._id)
      .populate("tenant", "name displayName plan noteLimit billing settings templates");

    if (!currentUser) {
      return res.status(401).json({ message: "User not found for token" });
    }

    const tenantId = currentUser.tenant?._id?.toString();
    const decodedTenantId =
      typeof decoded.tenant === "object" && decoded.tenant !== null
        ? decoded.tenant._id?.toString()
        : decoded.tenant?.toString();

    if (!tenantId || !decodedTenantId || tenantId !== decodedTenantId) {
      return res.status(401).json({ message: "Token tenant is invalid" });
    }

    req.user = currentUser;
    req.tenant = currentUser.tenant;
    req.auth = decoded;

    try {
      await User.findByIdAndUpdate(currentUser._id, { lastSeenAt: new Date() });
    } catch (presenceError) {
      console.error("Error updating lastSeenAt:", presenceError);
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const isNoteOwner = async (req, res, next) => next();

const isRole = (...roles) => {
  return function (req, res, next) {
    const userRole = req.user.role.toString().toLowerCase().trim();
    const allowedRoles = roles.map((r) => r.toString().toLowerCase().trim());
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: No role", user: "user", admin: "admin" });
    }
    next();
  };
};

const isTenantAdmin = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant?._id;
    if (!tenantId) return res.status(403).json({ message: "No tenant found in token" });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    req.tenant = tenant;
    if (!canManageTenant(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: tenant admin access required" });
    }
    next();
  } catch (err) {
    console.error("Error in isTenantAdmin middleware:", err);
    res.status(500).json({ message: "Server error in verifying admin" });
  }
};

const isPaid = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant?._id;
    if (!tenantId) return res.status(403).json({ message: "No tenant found in token" });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    const noteLimit = tenant.noteLimit;
    if (noteLimit === "unlimited") {
      return next();
    }
    const limit = Number(tenant.noteLimit);
    const noteCount = await (await import("../Models/NotesSchema.js")).default.countDocuments({ tenant: tenantId });
    if (limit <= noteCount) return res.status(403).json(`Free Plan Limit ended. Upgrade to Pro`);
    next();
  } catch (err) {
    console.error("Error in isTenantAdmin middleware:", err);
    res.status(500).json({ message: "Server error in verifying amount paid" });
  }
};

const requireUserMutationAccess = async (req, res, next) => {
  const targetUser = await User.findOne({ _id: req.params.userId, tenant: req.user.tenant._id });
  if (!targetUser) {
    return next(new ExpressError(404, "User not found"));
  }

  const isSelf = targetUser._id.toString() === req.user._id.toString();
  if (!isSelf && !canManageTenant(req.user.role)) {
    return next(new ExpressError(403, "Forbidden"));
  }

  req.targetUser = targetUser;
  next();
};

export { verifyToken, isNoteOwner, isRole, isTenantAdmin, isPaid, requireUserMutationAccess };
