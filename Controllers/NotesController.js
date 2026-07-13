// /api/notes
import Notes from "../Models/NotesSchema.js";
import ExpressError from "../Middlewares/ExpressError.js";
import { recordAuditLog } from "../Services/auditService.js";
import {
  addCommentToNote,
  createNoteForTenant,
  deleteNoteForActor,
  getNoteForActor,
  listNotesForActor,
  updateNoteDetailsForActor,
  updateNoteProgressForActor,
} from "../Services/noteService.js";

function escapeCsvValue(value) {
  const stringValue = value == null ? "" : String(value);
  if (/["\n,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export const newNote = async (req, res, next) => {
  const note = await createNoteForTenant({
    actor: req.user,
    tenant: req.tenant,
    input: req.body,
  });

  await recordAuditLog({
    tenantId: req.tenant._id,
    actorId: req.user._id,
    action: "note.created",
    entityType: "note",
    entityId: note._id,
    metadata: { assigneeId: note.user, priority: note.priority },
  });

  res.status(201).json(note);
};

export const notesReport = async (req, res, next) => {
  const query = { tenant: req.user.tenant._id };
  if (!["owner", "admin"].includes(req.user.role)) {
    query.user = req.user._id;
  }
  const notes = await Notes.find(query);
  if (notes.length === 0) {
    return next(new ExpressError(404, "No notes found to export"));
  }

  const reportData = notes.map((n) => ({
    title: n.title,
    content: n.content,
    check: n.check,
    userFeedback: n.userFeedback || "",
    deadline: new Date(n.dueAt).toLocaleString(),
    completedAt: n.completedAt ? new Date(n.completedAt).toLocaleString() : "",
    feedbackAt: n.feedbackAt ? new Date(n.feedbackAt).toLocaleString() : "",
    date: new Date(n.createdAt).toLocaleString(),
  }));
  function csvData(data) {
    const headers = Object.keys(data[0]).map(escapeCsvValue).join(",");
    const rows = data.map((obj) => Object.values(obj).map(escapeCsvValue).join(","));
    return [headers, ...rows].join("\n");
  }
  const csv = csvData(reportData);
  console.log("final: ", csv);
  res.header("Content-Type", "text/csv");
  res.attachment("Notes_Report.csv");
  res.send(csv);
};

export const allNotes = async (req, res, next) => {
  const search = req.query.search || "";
  const sortBy = req.query.sort || "title";
  const page = parseInt(req.query.page) || 1;
  const data = await listNotesForActor({
    actor: req.user,
    tenantId: req.user.tenant._id,
    search,
    sort: sortBy,
    page,
  });
  res.json(data);
};

export const singleNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await getNoteForActor({
    actor: req.user,
    tenantId: req.user.tenant._id,
    noteId,
  });
  res.json(note);
};

export const updateCheck = async (req, res, next) => {
  const note = await updateNoteProgressForActor({
    actor: req.user,
    tenantId: req.user.tenant._id,
    noteId: req.params.noteId,
    updates: req.body,
  });
  await recordAuditLog({
    tenantId: req.user.tenant._id,
    actorId: req.user._id,
    action: "note.progress.updated",
    entityType: "note",
    entityId: note._id,
    metadata: { check: note.check, status: note.status },
  });
  res.json(note);
};

export const singleNoteToEdit = async (req, res, next) => {
  const note = await getNoteForActor({
    actor: req.user,
    tenantId: req.user.tenant._id,
    noteId: req.params.noteId,
  });
  res.json(note);
};

export const editNote = async (req, res, next) => {
  const note = await updateNoteDetailsForActor({
    actor: req.user,
    tenantId: req.user.tenant._id,
    noteId: req.params.noteId,
    updates: req.body,
  });
  await recordAuditLog({
    tenantId: req.user.tenant._id,
    actorId: req.user._id,
    action: "note.updated",
    entityType: "note",
    entityId: note._id,
  });
  res.json(note);
};

export const deleteNote = async (req, res, next) => {
  const note = await deleteNoteForActor({
    actor: req.user,
    tenantId: req.user.tenant._id,
    noteId: req.params.noteId,
  });
  await recordAuditLog({
    tenantId: req.user.tenant._id,
    actorId: req.user._id,
    action: "note.deleted",
    entityType: "note",
    entityId: note._id,
  });
  res.json(note);
};

export const addComment = async (req, res, next) => {
  const note = await addCommentToNote({
    actor: req.user,
    tenantId: req.user.tenant._id,
    noteId: req.params.noteId,
    body: req.body.body,
  });
  await recordAuditLog({
    tenantId: req.user.tenant._id,
    actorId: req.user._id,
    action: "note.comment.added",
    entityType: "note",
    entityId: req.params.noteId,
  });
  res.status(201).json(note);
};
