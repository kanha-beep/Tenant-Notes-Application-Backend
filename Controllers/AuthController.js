import bcrypt from "bcryptjs";
import User from "../Models/UserSchema.js";
import Tenant from "../Models/TenantSchema.js";
import Invite from "../Models/InviteSchema.js";
import ExpressError from "../Middlewares/ExpressError.js";
import { clearAuthCookie, generateToken, setAuthCookie } from "../Services/authService.js";
import { recordAuditLog } from "../Services/auditService.js";

function serializeAuthUser(user) {
  return {
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    tenant: user.tenant,
  };
}

export const registerUser = async (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();
  const username = req.body.username?.trim();
  const tenantName = req.body.tenant?.trim().toLowerCase();
  const inviteToken = req.body.inviteToken?.trim();

  if (!email || !password || !username) {
    return next(new ExpressError(400, "Please enter username, email, and password"));
  }

  const hashPassword = await bcrypt.hash(password, 10);

  if (inviteToken) {
    const invite = await Invite.findOne({ token: inviteToken, acceptedAt: null }).populate("tenant");
    if (!invite || invite.expiresAt < new Date()) {
      return next(new ExpressError(400, "Invite link is invalid or expired"));
    }
    if (invite.email !== email) {
      return next(new ExpressError(400, "Invite email does not match this account"));
    }

    const existingInvitedUser = await User.findOne({ email, tenant: invite.tenant._id });
    if (existingInvitedUser) {
      return next(new ExpressError(409, "This invite has already been used"));
    }

    const user = await User.create({
      email,
      password: hashPassword,
      tenant: invite.tenant._id,
      username,
      role: invite.role,
      status: "active",
      invitedBy: invite.invitedBy,
      invitedAt: invite.createdAt,
      lastSeenAt: new Date(),
    });

    invite.acceptedAt = new Date();
    await invite.save();
    await recordAuditLog({
      tenantId: invite.tenant._id,
      actorId: user._id,
      action: "invite.accepted",
      entityType: "invite",
      entityId: invite._id,
      metadata: { email, role: invite.role },
    });

    res.status(201).json({ user: serializeAuthUser({ ...user.toObject(), tenant: invite.tenant }) });
    return;
  }

  if (!tenantName) {
    return next(new ExpressError(400, "Tenant name is required"));
  }

  const existingTenant = await Tenant.findOne({ name: tenantName });
  if (existingTenant) {
    return next(new ExpressError(403, "This workspace exists already. Ask for an invite link."));
  }

  const tenant = await Tenant.create({
    name: tenantName,
    displayName: req.body.tenantDisplayName?.trim() || tenantName,
    plan: "free",
    noteLimit: "10",
    billing: { seats: 5, status: "trialing" },
    templates: [
      {
        name: "Follow-up",
        title: "Customer follow-up",
        content: "Summarize the issue, owner, next step, and target resolution date.",
        category: "customer-success",
      },
    ],
  });

  const user = await User.create({
    email,
    password: hashPassword,
    tenant: tenant._id,
    username,
    role: "owner",
    status: "active",
    lastSeenAt: new Date(),
  });

  await recordAuditLog({
    tenantId: tenant._id,
    actorId: user._id,
    action: "tenant.created",
    entityType: "tenant",
    entityId: tenant._id,
    metadata: { ownerEmail: email },
  });

  res.status(201).json({ user: serializeAuthUser({ ...user.toObject(), tenant }) });
};

export const loginUser = async (req, res, next) => {
  try {
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
    if (user.status === "suspended") return next(new ExpressError(403, "Account suspended"));

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return next(new ExpressError(400, "Invalid credentials"));

    if (user.tenant.name !== tenant) return next(new ExpressError(401, "Tenant not matched"));

    user.lastSeenAt = new Date();
    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);
    await recordAuditLog({
      tenantId: user.tenant._id,
      actorId: user._id,
      action: "auth.login",
      entityType: "user",
      entityId: user._id,
      metadata: { role: user.role },
    });

    res.json({
      user: serializeAuthUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    next(new ExpressError(500, "Login failed: " + error.message));
  }
};

export const currentOwner = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("tenant", "name displayName plan noteLimit billing settings templates");
  if (!user) return next(new ExpressError(404, "User not found"));
  res.json(serializeAuthUser(user));
};

export const logoutUser = async (req, res) => {
  if (req.user?.tenant?._id && req.user?._id) {
    await recordAuditLog({
      tenantId: req.user.tenant._id,
      actorId: req.user._id,
      action: "auth.logout",
      entityType: "user",
      entityId: req.user._id,
    });
  }

  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
};

export const getInviteDetails = async (req, res, next) => {
  const invite = await Invite.findOne({ token: req.params.token }).populate("tenant", "name displayName");
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return next(new ExpressError(404, "Invite link not found or expired"));
  }

  res.json({
    email: invite.email,
    role: invite.role,
    tenant: invite.tenant,
    expiresAt: invite.expiresAt,
  });
};
