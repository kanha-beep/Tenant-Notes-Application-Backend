import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ExpressError from "./Middlewares/ExpressError.js";
import AuthRoutes from "./Routes/AuthRoutes.js";
import {
  captureStudioNote,
  getStudioState,
  toggleFocusItem,
} from "./studioData.js";
import { getHomepageData } from "./homepageData.js";
//notes admin + user
import NotesRoutes from "./Routes/NotesRoutes.js";
//user Profile
import UserRoutes from "./Routes/UsersRoute.js";
//admin   /api/admin
import AdminRoutes from "./Routes/AdminRoutes.js"
import { mongooseConnect } from "./db.js";
dotenv.config()
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../client/dist");
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: false
  })
);
mongooseConnect()
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.get("/api/homepage", (req, res) => {
  res.json(getHomepageData());
});
app.get("/api/studio", (req, res) => {
  res.json(getStudioState());
});
app.post("/api/studio/capture", (req, res) => {
  const nextState = captureStudioNote(req.body?.text || "");
  res.status(201).json(nextState);
});
app.patch("/api/studio/focus/:taskId", (req, res, next) => {
  const existingTask = getStudioState().focus.find(
    (task) => task.id === req.params.taskId
  );

  if (!existingTask) {
    next(new ExpressError(404, "Focus item not found"));
    return;
  }

  res.json(toggleFocusItem(req.params.taskId));
});
app.use("/auth", AuthRoutes);
app.use("/notes", NotesRoutes);
app.use("/users", UserRoutes);
app.use("/admin", AdminRoutes)
//health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
})
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
})
app.use(express.static(clientDistPath));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  res.status(status).json({ message });
})
export default app;
