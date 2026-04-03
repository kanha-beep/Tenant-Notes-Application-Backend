import jwt from "jsonwebtoken";
import Notes from "../Models/NotesSchema.js";
import Tenant from "../Models/TenantSchema.js";
import User from "../Models/UserSchema.js";

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  console.log("auth header present:", Boolean(authHeader));

  if (!token) return res.status(401).json("No token provided");

  jwt.verify(token, process.env.JWT_SECRET, async (error, user) => {
    if (error) return res.status(401).json("Why error in MW");
    req.user = user;
    try {
      await User.findByIdAndUpdate(user._id, { lastSeenAt: new Date() });
    } catch (presenceError) {
      console.error("Error updating lastSeenAt:", presenceError);
    }
    next();
  });
};

const isNoteOwner = async (req, res, next) => {
  try {
    const notes = await Notes.findById(req.params.noteId)
      .populate("tenant")
      .populate("user");
    if (!notes) return res.status(404).json({ message: "Note not found" });
    if (notes.tenant._id.toString() !== req.user.tenant._id.toString()) {
      return res.status(403).json({ message: "Note belongs to different tenant" });
    }
    if (req.user.role === "admin") return next();
    if (!notes.user) {
      console.log("User field is null/undefined:", notes.user);
      return res.status(500).json({ message: "Note user not populated" });
    }
    if (req.user._id.toString() !== notes.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: not the owner" });
    }
    next();
  } catch (e) {
    console.log("Error in isNotesOwner middleware:", e);
    res.status(500).json({ message: "Server error in verifying note owner" });
  }
};

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
    const tenantId = req.user.tenant._id;
    if (!tenantId) return res.status(403).json({ message: "No tenant found in token" });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    req.tenant = tenant;
    next();
  } catch (err) {
    console.error("Error in isTenantAdmin middleware:", err);
    res.status(500).json({ message: "Server error in verifying admin" });
  }
};

const isPaid = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant._id;
    if (!tenantId) return res.status(403).json({ message: "No tenant found in token" });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    const noteLimit = tenant.noteLimit;
    if (noteLimit === "unlimited") {
      return next();
    }
    const limit = Number(tenant.noteLimit);
    const noteCount = await Notes.countDocuments({ tenant: tenantId });
    if (limit <= noteCount) return res.status(403).json(`Free Plan Limit ended. Upgrade to Pro`);
    next();
  } catch (err) {
    console.error("Error in isTenantAdmin middleware:", err);
    res.status(500).json({ message: "Server error in verifying amount paid" });
  }
};

export { verifyToken, isNoteOwner, isRole, isTenantAdmin, isPaid };
