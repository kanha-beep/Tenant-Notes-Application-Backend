// /api/admin
import User from "../Models/UserSchema.js"
import Notes from "../Models/NotesSchema.js"
import Tenant from "../Models/TenantSchema.js";
import ExpressError from "../Middlewares/ExpressError.js"
export const getPlan = async (req, res, next) => {
    // console.log("plan starts")
    const tenants = await Tenant.findById(req.user.tenant._id);
    if (!tenants) return next(new ExpressError(401, "No tenant adminROute"))
    const plan = tenants.plan;
    if (!plan) return next(new ExpressError(402, "No plan adminRoutes"))
    // console.log("tenant found AdminRoute: ", tenants)
    res.json(plan);

};
//plan change
export const buyPlan = async (req, res, next) => {
    // console.log("tenant id: ", req.user.tenant._id);
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
    tenants.save();
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
    const totalUsers = await User.countDocuments({ ...query, role: "user", tenant: req.user.tenant._id });
    const totalPages = Math.ceil(totalUsers / limit);
    // console.log("now search user is being set", finalUsers)
    res.json({ users: finalUsers, totalNoOfUsers: totalUsers, totalPages: totalPages, page: page });
}
//new user
export const newUser = async (req, res, next) => {
    try {
        console.log("getting user id new: ", req.params)
        const { username, email, title, content } = req.body;
        const user = await User.create({
            username,
            email,
            password: "password",
            title,
            content,
            role: "user",
            tenant: req.user.tenant._id
        });
        console.log("user created AdminRoute: ", user)
        res.json({ success: true, user });
    } catch (error) {
        console.log("Error creating user: ", error);
        next(new ExpressError(500, "Failed to create user"));
    }
}
//single user
export const singleUser = async (req, res, next) => {
    // console.log("req.params single user AdminRoutes: ", req.params)
    const { userId } = req.params;
    const users = await User.findById(userId);
    if (!users) return next(new ExpressError(401, "No user adminRoute"))
    // console.log("user found AdminRoute: ", users)
    res.json(users);

}
//users change
export const updateUser = async (req, res, next) => {
    // console.log("req.params user Change AdminRoutes: ", req.params)
    const { userId } = req.params;
    console.log("req.body user change AdminRoutes: ", req.body);
    const { username, email, password } = req.body;
    const users = await User.findByIdAndUpdate(userId, { username, email, password }, { new: true });
    if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    console.log("user changed AdminRoute: ", users)
    res.json(users);
}
//users delete
export const deleteUser = async (req, res, next) => {
    console.log("req.params delete AdminRoutes: ", req.params)
    const { userId } = req.params;
    console.log("got user id", userId)
    const users = await User.findByIdAndDelete(userId);
    if (!users) return next(new ExpressError(401, "No user AdminRoute"))
    console.log("user delete AdminRoute: ", users)
    res.json(users);

}
//dashboard
export const dashboard = async (req, res, next) => {
    // console.log("dashboard AdminRoutes: ", req.user)
    const totalNotes = await Notes.countDocuments({ tenant: req.user.tenant._id });
    console.log("total notes: ", totalNotes)
    if (!totalNotes) return next(new ExpressError(402, "No user dashboard"))
    const totalUsers = await User.countDocuments({ role: "user", tenant: req.user.tenant._id });
    if (!totalUsers) return next(new ExpressError(401, "No total users coming"))
    res.json({ totalUsers, totalNotes })
}
export const generateUserReport = async (req, res) => {

    const users = await User.find({ tenant: req.user.tenant._id });
    // Map only required fields
    const reportData = users.map(u => ({
        Username: u.username,
        Email: u.email,
        Password: u.password,
        CreatedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A",
    }));
    function convertToCSV(data) {
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(obj => Object.values(obj).join(","));
        return [headers, ...rows].join("\n");
    }
    // Convert to CSV or Excel same as monthly report
    const csv = convertToCSV(reportData);
    res.header("Content-Type", "text/csv");
    res.attachment("User_Report.csv");
    res.send(csv);
};
