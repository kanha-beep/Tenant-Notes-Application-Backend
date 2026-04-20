import bcrypt from "bcryptjs";
import User from "../Models/UserSchema.js"
import ExpressError from "../Middlewares/ExpressError.js";

function canAccessUser(req, user) {
    if (!user) {
        return false;
    }

    const sameTenant = user.tenant?._id?.toString() === req.user.tenant?._id?.toString();
    const isSelf = user._id.toString() === req.user._id.toString();

    return isSelf || (req.user.role === "admin" && sameTenant);
}
// /api/users
// //users current user
//first page of all notes
export const getUser = async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("tenant", "name plan noteLimit");
    if (!user) return next(new ExpressError(404, "User not found"));
    console.log("current user found: ", user)
    res.json({ message: "", user });
}
//view profile with id
export const singleUser = async (req, res, next) => {
    const user = await User.findById(req.params.userId).populate("tenant", "name plan noteLimit");
    if (!user) return next(new ExpressError(404, "User not found"))
    if (!canAccessUser(req, user)) return next(new ExpressError(403, "Forbidden"))
    
    res.json({ message: "", user });

}
export const editUser = async (req, res, next) => {
    const { username, password } = req.body;
    const existingUser = await User.findById(req.params.userId).populate("tenant", "name plan noteLimit");
    if (!existingUser) return next(new ExpressError(404, "User not found"))
    if (!canAccessUser(req, existingUser)) return next(new ExpressError(403, "Forbidden"))

    const newData = {};
    if (typeof username === "string" && username.trim()) {
        newData.username = username.trim();
    }
    if (typeof password === "string" && password.trim()) {
        newData.password = await bcrypt.hash(password.trim(), 10);
    }
    if (Object.keys(newData).length === 0) {
        return next(new ExpressError(400, "No valid fields provided for update"));
    }

    const user = await User.findByIdAndUpdate(req.params.userId, newData, { new: true })
        .populate("tenant", "name plan noteLimit");
    if (!user) return next(new ExpressError(404, "User not found"))
    console.log("new update", newData)
    console.log("updated User", user)
    res.json({ message: "Profile updated successfully", user });

}
