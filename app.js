import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import ExpressError from "./Middlewares/ExpressError.js";
import AuthRoutes from "./Routes/AuthRoutes.js";
//notes admin + user
import NotesRoutes from "./Routes/NotesRoutes.js";
//user Profile
import UserRoutes from "./Routes/UsersRoute.js";
//admin   /api/admin
import AdminRoutes from "./Routes/AdminRoutes.js"
import { mongooseConnect } from "./db.js";
dotenv.config()
mongooseConnect();
const app = express();
const key = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL
app.use(cors({
  origin: ["http://localhost:5173", FRONTEND_URL],
  credentials: true
}));
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", AuthRoutes);
app.use("/api/notes", NotesRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/admin", AdminRoutes)
//health
app.get("/api/health", (req,res) => {
  res.json({ status: "ok" });
})
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  res.status(status).json({ message });
})
export default app;