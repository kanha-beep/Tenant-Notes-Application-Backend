// /api/admin
import bcrypt from "bcryptjs";
import User from "../Models/UserSchema.js"
import Notes from "../Models/NotesSchema.js"
import Tenant from "../Models/TenantSchema.js";
import ExpressError from "../Middlewares/ExpressError.js"

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
    const plan = tenants.plan;
    if (!plan) return next(new ExpressError(402, "No plan adminRoutes"))
    // console.log("tenant found AdminRoute: ", tenants)
    res.json(plan);

};
//plan change
export const buyPlan = async (req, res, next) => {
    const { amount } = req.body;
    const amtValue = Number(amount)
    const tenants = await Tenant.findById(req.user.tenant._id);
    if (!tenants) return next(new ExpressError(401, "No tenant adminRoute"))
    const existingPlan = tenants.plan;
    console.log("existing plan", existingPlan);
    console.log('amount from body', typeof amount)//
    if (amtValue === 100) {
        tenants.plan = "paid";
        tenants.noteLimit = "unlimited";
        console.log("changed plan", tenants.plan, tenants.noteLimit)//
    } else if (amtValue <= 100) {
        tenants.plan = "free";
        tenants.noteLimit = "3";
        console.log("no change", tenants.plan, tenants.noteLimit)
    }
    await tenants.save();
    console.log("tenant paid saved AdminRoute: ", tenants);
    res.json(tenants);
}
//all users
export const allUsers = async (req, res, next) => {
    // const searchUser = req.query.search || "";
    // const sort = req.query.sort || "";
    console.log("got value for pagination: ", req.query)
    const search = req.query.search || "";
    const sort = req.query.sort || "email";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    // console.log("1. sort: ", sort)
    console.log("all users: ", req.user.tenant._id)
    // const users = await User.find({ role: "user", tenant: req.user.tenant._id });
    // console.log("all users: ", users)
    // if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    const query = {};
    //search
    if (search) query.username = { $regex: search, $options: "i" }
    //sort
    const sortOptions = {}
    if (sort === "username") sortOptions.username = 1;
    if (sort === "email") sortOptions.email = 1;
    const finalUsers = await User.find({ ...query, role: "user", tenant: req.user.tenant._id }).sort(sortOptions).skip(skip).limit(limit)
    console.log("all users: ", finalUsers)
    const totalUsers = await User.countDocuments({ ...query, role: "user", tenant: req.user.tenant._id });
    const totalPages = Math.ceil(totalUsers / limit);
    // console.log("now search user is being set", finalUsers, totalUsers, totalPages)
    res.json({ users: finalUsers, totalNoOfUsers: totalUsers, totalPages: totalPages, page: page });
}
//new user
export const newUser = async (req, res, next) => {
    try {
        console.log("getting user id new: ", req.params)
        const username = req.body.username?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const rawPassword = req.body.password?.trim() || req.body.content?.trim() || req.body.title?.trim();
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
            role: "user",
            tenant: req.user.tenant._id
        });
        console.log("user created AdminRoute: ", user)
        res.status(201).json({ success: true, user, temporaryPassword });
    } catch (error) {
        console.log("Error creating user: ", error);
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
    console.log("req.body user change AdminRoutes: ", req.body);
    const { username, email, password } = req.body;
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
    if (Object.keys(updatePayload).length === 0) {
        return next(new ExpressError(400, "No valid fields provided for update"));
    }

    const users = await User.findOneAndUpdate(
        { _id: userId, tenant: req.user.tenant._id },
        updatePayload,
        { new: true }
    );
    if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    console.log("user changed AdminRoute: ", users)
    res.json(users);
}
//users delete
export const deleteUser = async (req, res, next) => {
    console.log("req.params delete AdminRoutes: ", req.params)
    const { userId } = req.params;
    console.log("got user id", userId)
    const users = await User.findOneAndDelete({ _id: userId, tenant: req.user.tenant._id, role: "user" });
    if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    console.log("user delete AdminRoute: ", users)
    res.json(users);

}
//dashboard
export const dashboard = async (req, res, next) => {
    // console.log("dashboard AdminRoutes: ", req.user)
    const totalNotes = await Notes.countDocuments({ tenant: req.user.tenant._id });
    // console.log("total notes: ", totalNotes)
    if (totalNotes < 0) return next(new ExpressError(402, "No user dashboard"))
    const totalUsers = await User.countDocuments({ role: "user", tenant: req.user.tenant._id });
    const allAdmins = await User.find({ tenant: req?.user?.tenant?._id, role:"admin" })
    // console.log("all admins: ", allAdmins)
    if (totalUsers < 0) return next(new ExpressError(401, "No total users coming"))
    res.json({ totalUsers, totalNotes, allAdmins })
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
