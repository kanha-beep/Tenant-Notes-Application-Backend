import express from "express";
const router = express.Router();
import { registerUser, loginUser,currentOwner } from "../Controllers/AuthController.js";
import { verifyToken } from "../Middlewares/middleware.js";
import wrapAsync from "../Middlewares/wrapAsync.js";
router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/me",verifyToken, wrapAsync(currentOwner))
export default router