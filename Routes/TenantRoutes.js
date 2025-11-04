// import express from "express";
// // /api/notes
// import Tenant from "../NotesModels/TenantSchema.js"
// const route = express.Router();
// import { verifyToken, isRole } from "../Extra/middleware.js"
// //plan @@
// route.post("/tenant/plan", verifyToken, isTenantAdmin, isRole(["admin"]), async (req, res) => {
//     try {
//         const tenants = await Tenant.findById(req.user.tenant._id);
//         if (!tenants) return res.status(401).json("No tenant AdminRoute")
//         const plan = tenants.plan;
//         if (!plan) return res.status(402).json("No plan AdminRoute");
//         console.log("tenant found AdminRoute: ", tenants)
//         console.log("all users")
//         console.log("plan: ", plan)
//         res.json(plan);
//     } catch (e) {
//         console.log("error AdminRoutes: ", e)
//         res.status(401).json(e);
//     }
// })
// //plan change
// route.post("/tenant/plan", verifyToken, isTenantAdmin, isRole(["admin"]), async (req, res) => {
//     console.log("tenant id: ", req.user.tenant._id);
//     const tenants = await Tenant.findById(req.user.tenant._id);
//     if (!tenants) return res.status(401).json("No tenant AdminRoute")
//     console.log("tenant found AdminRoute: ", tenants)
// })
// export default route;