import express from "express";
import { verifyToken } from "../Middlewares/middleware.js";
import wrapAsync from "../Middlewares/WrapAsync.js";
import {getUser, singleUser, editUser} from "../Controllers/UserController.js"
// /api/users
const route = express.Router();
//users current user
//first page of all notes
route.get("/", verifyToken, wrapAsync(getUser))
//view profile with id
route.get("/:userId", verifyToken, wrapAsync(singleUser))
route.patch("/:userId/edit", verifyToken, wrapAsync(editUser))
export default route