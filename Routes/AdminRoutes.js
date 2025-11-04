import express from "express";
// /api/admin
const route = express.Router();
import { verifyToken, isTenantAdmin, isRole } from "../Middlewares/middleware.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
import { getPlan, buyPlan, allUsers, newUser, singleUser, updateUser, deleteUser, dashboard, generateUserReport } from "../Controllers/AdminController.js"

route.get("/plan", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(getPlan))
route.post("/plan", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(buyPlan))
//download user
route.get("/users/reports", verifyToken, isTenantAdmin, isRole(["admin"]), generateUserReport);
//all users
route.get("/users", verifyToken, isTenantAdmin, isRole("admin"), WrapAsync(allUsers))
//new user
route.post("/users/new", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(newUser))
//single user
route.get("/users/:userId", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(singleUser))
//users change
route.patch("/users/:userId/edit", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(updateUser))
//users delete
route.delete("/users/:userId", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(deleteUser))
//dashboard
route.get("/dashboard", verifyToken, isTenantAdmin, isRole(["admin"]), WrapAsync(dashboard))
export default route;