import express from "express";
// /api/notes
const route = express.Router();
import { verifyToken, isNoteOwner, isRole, isPaid } from "../Middlewares/middleware.js"
import { newNote, allNotes, singleNote, updateCheck, editNote,singleNoteToEdit, deleteNote, notesReport, addComment } from "../Controllers/NotesController.js";
import WrapAsync from "../Middlewares/WrapAsync.js";
route.post("/new", verifyToken, isRole("owner", "admin", "member"), isPaid, WrapAsync(newNote))
route.get("/", verifyToken, isRole("owner", "admin", "member", "viewer"), WrapAsync(allNotes))
route.get("/reports", verifyToken, isRole("owner", "admin", "member", "viewer"), WrapAsync(notesReport))
route.get("/:noteId", verifyToken, isNoteOwner, isRole("owner", "admin", "member", "viewer"), WrapAsync(singleNote))
//update check
route.patch("/:noteId", verifyToken, isNoteOwner, isRole("owner", "admin", "member", "viewer"), WrapAsync(updateCheck))
route.post("/:noteId/comments", verifyToken, isRole("owner", "admin", "member", "viewer"), WrapAsync(addComment))
//edit task
route.get("/:noteId/edit", verifyToken, isNoteOwner, isRole("owner", "admin", "member", "viewer"), WrapAsync(singleNoteToEdit))
route.patch("/:noteId/edit", verifyToken,isNoteOwner, isRole("owner", "admin", "member"), WrapAsync(editNote))
route.delete("/:noteId", verifyToken,isNoteOwner, isRole("owner", "admin", "member"), WrapAsync(deleteNote))
export default route;
