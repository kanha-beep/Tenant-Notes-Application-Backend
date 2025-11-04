import User from "../Models/UserSchema.js"
import ExpressError from "../Middlewares/ExpressError.js";
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
    // console.log("user found: ", user)
    if (!user) return next(new ExpressError(404, "User not found"))
    
    res.json({ message: "", user });

}
export const editUser = async (req, res, next) => {
    const { username, password } = req.body;
    const newData = { username, password }
    const user = await User.findByIdAndUpdate(req.params.userId, newData, { new: true })
    if (!user) return next(new ExpressError(404, "User not found"))
    console.log("new update", newData)
    console.log("updated User", user)
    res.json(user);

}