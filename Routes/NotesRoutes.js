import express from "express";
// /api/notes
const route = express.Router();
import { verifyToken, isNoteOwner, isRole, isPaid } from "../Middlewares/middleware.js"
import { newNote, allNotes, singleNote, updateCheck, editNote,singleNoteToEdit, deleteNote, notesReport } from "../Controllers/NotesController.js";
import wrapAsync from "../Middlewares/WrapAsync.js";
route.post("/new", verifyToken, isRole("user", "admin"), isPaid, wrapAsync(newNote))
route.get("/", verifyToken, isRole("user", "admin"), wrapAsync(allNotes))
route.get("/reports", verifyToken, isRole("user", "admin"), wrapAsync(notesReport))
route.get("/:noteId", verifyToken, isNoteOwner, isRole("user", "admin"), wrapAsync(singleNote))
//update check
route.patch("/:noteId", verifyToken, isNoteOwner, isRole("user", "admin"), updateCheck)
//edit task
route.get("/:noteId/edit", verifyToken, isNoteOwner, isRole("user", "admin"), wrapAsync(singleNoteToEdit))
route.patch("/:noteId/edit", verifyToken,isNoteOwner, isRole("user", "admin"), wrapAsync(editNote))
route.delete("/:noteId", verifyToken,isNoteOwner, isRole("user", "admin"), wrapAsync(deleteNote))
export default route;