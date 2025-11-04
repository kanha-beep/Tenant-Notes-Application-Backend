import bcrypt from "bcryptjs";
// /api/admin
import { userValidation } from "../Validation/SchemaValidation.js"
import User from "../Models/UserSchema.js"
import Tenant from "../Models/TenantSchema.js"
import ExpressError from "../Middlewares/ExpressError.js"
import jwt from "jsonwebtoken";
export const registerUser = async (req, res, next) => {
    const { error, value } = userValidation.validate(req.body, { context: { isLogin: false } });
    console.log(error)
    if (error) return next(new ExpressError(400, "Please enter full details"));
    const { email, password, tenant, username, role } = value;
    const findTenant = await Tenant.findOne({ name: tenant })
    if (!findTenant) return next(new ExpressError(403, "No existing Tenant found"))
    // console.log("Found tenant SIGNUP B:", findTenant);
    const existingUser = await User.findOne({ email, tenant: findTenant._id })
    if (existingUser) return next(new ExpressError(402, "Already Registered"))
    const hashPassword = await bcrypt.hash(password, 10);
    console.log("hash", hashPassword)
    const user = await User.create({ email, password: hashPassword, tenant:findTenant._id, username, role, password: hashPassword });
    console.log("user craeted: ", user)
    res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        tenant: user.tenant
    })
}
//keep it tenant:user.tenant and not tenantId:user.tenant
const generateToken = (user) => jwt.sign({ _id: user._id, tenant: user.tenant, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" })
export const loginUser = async (req, res, next) => {
    console.log("login starts")
    const { email, password, tenant } = req.body;
    if (!email || !password || !tenant) return next(new ExpressError(400, "Wrong details. Please enter all"))
    const findTenant = await Tenant.findOne({ name: tenant })
    if (!findTenant) return next(new ExpressError(403, "No tenant exist found"))
    const user = await User.findOne({ email, tenant: findTenant._id }).populate('tenant'); // Populate the tenant field
    if (!user) return next(new ExpressError(400, "Invalid credentials"));
    if (user.tenant.name !== tenant) return next(new ExpressError(401, "Tenant not matched"))
    const token = generateToken(user)
    console.log("login done tenant ", tenant)
    res.cookie("tokenCookie", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
        token
    });
}
export const currentOwner = async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("tenant", "name");
    console.log("current owner NotesAuth: ", user.username)
    if (!user) return next(new ExpressError(404, "User not found"));
    res.json(user);
}