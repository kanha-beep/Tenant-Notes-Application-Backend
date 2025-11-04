import jwt from "jsonwebtoken"
import Notes from "../Models/NotesSchema.js"
import Tenant from "../Models/TenantSchema.js";
const verifyToken = async (req, res, next) => {
    const token = req.cookies.tokenCookie;
    // const auth = req.headers["authorization"]
    // const token = auth && auth.split(" ")[1]
    if (!token) return res.status(401).json("No token provided");
    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) return res.status(401).json("Why error in MW");
        req.user = user;
        //user, password, tenant
        // console.log("user verified and saved verifyToken B: ", req.user);
        next();
    })
}
const isNoteOwner = async (req, res, next) => {
    try {
        const notes = await Notes.findById(req.params.noteId).populate("tenant").populate("user")
        // console.log("Raw note from DB:", JSON.stringify(notes, null, 2));
        // console.log("User field:", notes?.user);
        if (!notes) return res.status(404).json({ message: "Note not found" });
        if (notes.tenant._id.toString() !== req.user.tenant._id.toString()) return res.status(403).json({ message: "Note belongs to different tenant" });
        if (req.user.role === "admin") return next();
        if (!notes.user) {
            console.log("User field is null/undefined:", notes.user);
            return res.status(500).json({ message: "Note user not populated" });
        }
        // console.log("Checking ownership: ", req.user._id, notes.user._id);
        if (req.user._id.toString() !== notes.user._id.toString()) return res.status(403).json({ message: "Unauthorized: not the owner" });
        next();
    } catch (e) {
        console.log("Error in isNotesOwner middleware:", e);
        res.status(500).json({ message: "Server error in verifying note owner" });
    }
}
const isRole = (...roles) => {
    return function (req, res, next) {
        const userRole = req.user.role.toString().toLowerCase().trim();
        // console.log(" user role MW:", userRole)
        const allowedRoles = roles.map(r => r.toString().toLowerCase().trim());
        // console.log(" allowed role MW:", allowedRoles)
        // console.log("user role isRole MW:", userRole);
        if (!allowedRoles.includes(userRole)) return res.status(403).json({ message: "Forbidden: No role", user: "user", admin: "admin" });
        // console.log("roles checked isRole MW");
        next();
    }
}
const isTenantAdmin = async (req, res, next) => {
    try {
        // console.log("tenant id MW: ", req.user.tenant._id)
        // console.log("tennat id: ", req.user.tenant._id)
        const tenantId = req.user.tenant._id; // from JWT
        if (!tenantId) return res.status(403).json({ message: "No tenant found in token" });
        // ensure the tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) return res.status(404).json({ message: "Tenant not found" });
        // attach tenant for next steps
        req.tenant = tenant;
        next();
    } catch (err) {
        console.error("Error in isTenantAdmin middleware:", err);
        res.status(500).json({ message: "Server error in verifying admin" });
    }
};
const isPaid = async (req, res, next) => {
    try {
        // console.log("tenant id MW: ", req.user.tenant._id)
        const tenantId = req.user.tenant._id; // from JWT
        if (!tenantId) return res.status(403).json({ message: "No tenant found in token" });
        // ensure the tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) return res.status(404).json({ message: "Tenant not found" });
        console.log("tenant found:", tenant);
        //unlimited
        const noteLimit = tenant.noteLimit;
        console.log("note limit:", noteLimit);
        if (noteLimit === "unlimited") {
            return next();
        }
        //for free
        const limit = Number(tenant.noteLimit);
        console.log("note limit number", limit);
        const noteCount = await Notes.countDocuments({ tenant: tenantId });
        if (limit <= noteCount) return res.status(403).json(`Free Plan Limit ended. Upgrade to Pro`);
        next();
    } catch (err) {
        console.error("Error in isTenantAdmin middleware:", err);
        res.status(500).json({ message: "Server error in verifying amount paid" });
    }
};
export { verifyToken, isNoteOwner, isRole, isTenantAdmin, isPaid }