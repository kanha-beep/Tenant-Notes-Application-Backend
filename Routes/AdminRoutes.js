import express from "express";
// /api/admin
const route = express.Router();
import { verifyToken, isTenantAdmin, isRole } from "../Middlewares/middleware.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
import { getPlan, buyPlan, allUsers, newUser, singleUser, updateUser, deleteUser, dashboard, generateUserReport, createInvite, listInvites, listTemplates, createTemplate } from "../Controllers/AdminController.js"

route.get("/plan", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(getPlan))
route.post("/plan", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(buyPlan))
//download user
route.get("/users/reports", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(generateUserReport));
//all users
route.get("/users", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(allUsers))
//new user
route.post("/users/new", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(newUser))
//single user
route.get("/users/:userId", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(singleUser))
//users change
route.patch("/users/:userId/edit", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(updateUser))
//users delete
route.delete("/users/:userId", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(deleteUser))
//dashboard
route.get("/dashboard", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(dashboard))
route.get("/invites", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(listInvites))
route.post("/invites", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(createInvite))
route.get("/templates", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(listTemplates))
route.post("/templates", verifyToken, isTenantAdmin, isRole("owner", "admin"), WrapAsync(createTemplate))
export default route;
