import express from "express";
import { verifyToken } from "../Middlewares/middleware.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
import {getUser, singleUser, editUser} from "../Controllers/UserController.js"
// /api/users
const route = express.Router();
//users current user
//first page of all notes
route.get("/", verifyToken, WrapAsync(getUser))
//view profile with id
route.get("/:userId", verifyToken, WrapAsync(singleUser))
route.patch("/:userId/edit", verifyToken, WrapAsync(editUser))
export default route