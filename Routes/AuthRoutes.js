import express from "express";
const router = express.Router();
import { registerUser, loginUser,currentOwner } from "../Controllers/AuthController.js";
import { verifyToken } from "../Middlewares/middleware.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/me",verifyToken, WrapAsync(currentOwner))
export default router