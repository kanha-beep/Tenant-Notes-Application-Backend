import express from "express";
const router = express.Router();
import { registerUser, loginUser,currentOwner, logoutUser, getInviteDetails } from "../Controllers/AuthController.js";
import { verifyToken } from "../Middlewares/middleware.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", verifyToken, WrapAsync(logoutUser))
router.get("/me",verifyToken, WrapAsync(currentOwner))
router.get("/invites/:token", WrapAsync(getInviteDetails))
export default router
