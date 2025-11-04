import express from "express";
// /api/notes
const route = express.Router();
import { verifyToken, isNoteOwner, isRole, isPaid } from "../Middlewares/middleware.js"
import { newNote, allNotes, singleNote, updateCheck, editNote,singleNoteToEdit, deleteNote, notesReport } from "../Controllers/NotesController.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
route.post("/new", verifyToken, isRole("user", "admin"), isPaid, WrapAsync(newNote))
route.get("/", verifyToken, isRole("user", "admin"), WrapAsync(allNotes))
route.get("/reports", verifyToken, isRole("user", "admin"), WrapAsync(notesReport))
route.get("/:noteId", verifyToken, isNoteOwner, isRole("user", "admin"), WrapAsync(singleNote))
//update check
route.patch("/:noteId", verifyToken, isNoteOwner, isRole("user", "admin"), updateCheck)
//edit task
route.get("/:noteId/edit", verifyToken, isNoteOwner, isRole("user", "admin"), WrapAsync(singleNoteToEdit))
route.patch("/:noteId/edit", verifyToken,isNoteOwner, isRole("user", "admin"), WrapAsync(editNote))
route.delete("/:noteId", verifyToken,isNoteOwner, isRole("user", "admin"), WrapAsync(deleteNote))
export default route;