// /api/admin
import bcrypt from "bcryptjs";
import User from "../Models/UserSchema.js"
import Notes from "../Models/NotesSchema.js"
import Tenant from "../Models/TenantSchema.js";
import Invite from "../Models/InviteSchema.js";
import ExpressError from "../Middlewares/ExpressError.js"
import { recordAuditLog } from "../Services/auditService.js";
import { getTenantDashboard } from "../Services/tenantInsightsService.js";

function escapeCsvValue(value) {
    const stringValue = value == null ? "" : String(value);
    if (/["\n,]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function generateTemporaryPassword() {
    return Math.random().toString(36).slice(-10);
}

export const getPlan = async (req, res, next) => {
    const tenants = await Tenant.findById(req.user.tenant._id);
    if (!tenants) return next(new ExpressError(401, "No tenant adminROute"))
    res.json({
        plan: tenants.plan,
        noteLimit: tenants.noteLimit,
        billing: tenants.billing,
        paidUsers: tenants.paidUsers,
        settings: tenants.settings,
    });

};
//plan change
export const buyPlan = async (req, res, next) => {
    const { plan, seats, slaHours } = req.body;
    const tenants = await Tenant.findById(req.user.tenant._id);
    if (!tenants) return next(new ExpressError(401, "No tenant adminRoute"))
    const planMap = {
        free: { noteLimit: "10", seats: 5 },
        team: { noteLimit: "unlimited", seats: 25 },
        enterprise: { noteLimit: "unlimited", seats: 250 },
    };
    const selectedPlan = planMap[plan] || planMap.free;
    tenants.plan = plan || tenants.plan;
    tenants.noteLimit = selectedPlan.noteLimit;
    tenants.billing.seats = Number(seats) || selectedPlan.seats;
    tenants.billing.status = "active";
    tenants.billing.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (slaHours) {
        tenants.settings.slaHours = Number(slaHours);
    }
    await tenants.save();
    await recordAuditLog({
        tenantId: tenants._id,
        actorId: req.user._id,
        action: "tenant.plan.updated",
        entityType: "tenant",
        entityId: tenants._id,
        metadata: { plan: tenants.plan, seats: tenants.billing.seats },
    });
    res.json(tenants);
}
//all users
export const allUsers = async (req, res, next) => {
    const search = req.query.search || "";
    const sort = req.query.sort || "email";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const query = {};
    if (search) query.username = { $regex: search, $options: "i" }
    const sortOptions = {}
    if (sort === "username") sortOptions.username = 1;
    if (sort === "email") sortOptions.email = 1;
    if (sort === "role") sortOptions.role = 1;
    const finalUsers = await User.find({ ...query, tenant: req.user.tenant._id }).sort(sortOptions).skip(skip).limit(limit)
    const totalUsers = await User.countDocuments({ ...query, tenant: req.user.tenant._id });
    const totalPages = Math.ceil(totalUsers / limit);
    res.json({ users: finalUsers, totalNoOfUsers: totalUsers, totalPages: totalPages, page: page });
}
//new user
export const newUser = async (req, res, next) => {
    try {
        const username = req.body.username?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const rawPassword = req.body.password?.trim() || req.body.content?.trim() || req.body.title?.trim();
        const role = req.body.role || "member";
        if (!username || !email) {
            return next(new ExpressError(400, "Username and email are required"));
        }

        const existingUser = await User.findOne({ email, tenant: req.user.tenant._id });
        if (existingUser) {
            return next(new ExpressError(409, "A user with this email already exists"));
        }

        const temporaryPassword = rawPassword || generateTemporaryPassword();
        const password = await bcrypt.hash(temporaryPassword, 10);
        const user = await User.create({
            username,
            email,
            password,
            role,
            tenant: req.user.tenant._id
        });
        await recordAuditLog({
            tenantId: req.user.tenant._id,
            actorId: req.user._id,
            action: "user.created",
            entityType: "user",
            entityId: user._id,
            metadata: { role },
        });
        res.status(201).json({ success: true, user, temporaryPassword });
    } catch (error) {
        next(new ExpressError(500, "Failed to create user"));
    }
}
//single user
export const singleUser = async (req, res, next) => {
    const { userId } = req.params;
    const users = await User.findOne({ _id: userId, tenant: req.user.tenant._id });
    if (!users) return next(new ExpressError(401, "No user adminRoute"))
    res.json(users);

}
//users change
export const updateUser = async (req, res, next) => {
    const { userId } = req.params;
    const { username, email, password, role, status } = req.body;
    const updatePayload = {};
    if (typeof username === "string" && username.trim()) {
        updatePayload.username = username.trim();
    }
    if (typeof email === "string" && email.trim()) {
        updatePayload.email = email.trim().toLowerCase();
    }
    if (typeof password === "string" && password.trim()) {
        updatePayload.password = await bcrypt.hash(password.trim(), 10);
    }
    if (role) updatePayload.role = role;
    if (status) updatePayload.status = status;
    if (Object.keys(updatePayload).length === 0) {
        return next(new ExpressError(400, "No valid fields provided for update"));
    }

    const users = await User.findOneAndUpdate(
        { _id: userId, tenant: req.user.tenant._id },
        updatePayload,
        { new: true }
    );
    if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    await recordAuditLog({
        tenantId: req.user.tenant._id,
        actorId: req.user._id,
        action: "user.updated",
        entityType: "user",
        entityId: users._id,
        metadata: { fields: Object.keys(updatePayload) },
    });
    res.json(users);
}
//users delete
export const deleteUser = async (req, res, next) => {
    const { userId } = req.params;
    const users = await User.findOneAndDelete({ _id: userId, tenant: req.user.tenant._id, role: { $ne: "owner" } });
    if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    await recordAuditLog({
        tenantId: req.user.tenant._id,
        actorId: req.user._id,
        action: "user.deleted",
        entityType: "user",
        entityId: users._id,
        metadata: { email: users.email },
    });
    res.json(users);

}
//dashboard
export const dashboard = async (req, res, next) => {
    const data = await getTenantDashboard(req.user.tenant._id);
    res.json(data);
}
export const generateUserReport = async (req, res) => {

    const users = await User.find({ tenant: req.user.tenant._id });
    if (users.length === 0) {
        throw new ExpressError(404, "No users found to export");
    }
    // Map only required fields
    const reportData = users.map(u => ({
        Username: u.username,
        Email: u.email,
        CreatedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A",
    }));
    function convertToCSV(data) {
        const headers = Object.keys(data[0]).map(escapeCsvValue).join(",");
        const rows = data.map(obj => Object.values(obj).map(escapeCsvValue).join(","));
        return [headers, ...rows].join("\n");
    }
    // Convert to CSV or Excel same as monthly report
    const csv = convertToCSV(reportData);
    res.header("Content-Type", "text/csv");
    res.attachment("User_Report.csv");
    res.send(csv);
};

export const createInvite = async (req, res, next) => {
    const email = req.body.email?.trim().toLowerCase();
    const role = req.body.role || "member";
    if (!email) {
        return next(new ExpressError(400, "Invite email is required"));
    }

    const invite = await Invite.create({
        tenant: req.user.tenant._id,
        email,
        role,
        invitedBy: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await recordAuditLog({
        tenantId: req.user.tenant._id,
        actorId: req.user._id,
        action: "invite.created",
        entityType: "invite",
        entityId: invite._id,
        metadata: { email, role },
    });

    res.status(201).json({
        invite,
        inviteUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth?invite=${invite.token}`,
    });
};

export const listInvites = async (req, res) => {
    const invites = await Invite.find({ tenant: req.user.tenant._id }).sort({ createdAt: -1 });
    res.json(invites);
};

export const listTemplates = async (req, res) => {
    const tenant = await Tenant.findById(req.user.tenant._id);
    res.json(tenant?.templates || []);
};

export const createTemplate = async (req, res, next) => {
    const tenant = await Tenant.findById(req.user.tenant._id);
    if (!tenant) {
        return next(new ExpressError(404, "Tenant not found"));
    }

    const template = {
        name: req.body.name?.trim(),
        title: req.body.title?.trim(),
        content: req.body.content?.trim(),
        category: req.body.category?.trim() || "general",
        createdBy: req.user._id,
    };

    if (!template.name || !template.title || !template.content) {
        return next(new ExpressError(400, "Template name, title, and content are required"));
    }

    tenant.templates.push(template);
    await tenant.save();
    await recordAuditLog({
        tenantId: tenant._id,
        actorId: req.user._id,
        action: "template.created",
        entityType: "template",
        entityId: tenant.templates[tenant.templates.length - 1]._id,
    });
    res.status(201).json(tenant.templates[tenant.templates.length - 1]);
};
