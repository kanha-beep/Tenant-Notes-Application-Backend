// /api/notes
import Notes from "../Models/NotesSchema.js";
import User from "../Models/UserSchema.js";
import ExpressError from "../Middlewares/ExpressError.js";

const ONE_HOUR_MS = 10 * 60 * 60 * 1000;

function prioritizeNotes(notes) {
  const now = Date.now();
  return [...notes].sort((a, b) => {
    const aOverdue = !a.check && a.dueAt && new Date(a.dueAt).getTime() < now;
    const bOverdue = !b.check && b.dueAt && new Date(b.dueAt).getTime() < now;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    const aPending = !a.check;
    const bPending = !b.check;
    if (aPending !== bPending) return aPending ? -1 : 1;

    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : 0;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : 0;
    return aDue - bDue;
  });
}

export const newNote = async (req, res, next) => {
  const { title, content, user, userEmail } = req.body;
  console.log("details: ", title, content, user, userEmail);

  const targetEmail = userEmail?.trim().toLowerCase();
  const targetUsername = user?.trim();

  const existingUser = targetEmail
    ? await User.findOne({ email: targetEmail, tenant: req.user.tenant._id })
    : await User.findOne({ username: targetUsername, tenant: req.user.tenant._id });

  if (!existingUser) return next(new ExpressError(404, "User not found for this tenant"));

  const existingNote = await Notes.findOne({ tenant: req.user.tenant._id, title });
  if (existingNote) return next(new ExpressError(401, "Note with title already exists"));

  const createdAt = new Date();
  const dueAt = new Date(createdAt.getTime() + ONE_HOUR_MS);

  const note = await Notes.create({
    title,
    content,
    check: false,
    user: existingUser._id,
    tenant: req.user.tenant._id,
    dueAt,
    completedAt: null,
    createdAt,
  });

  console.log("new note NotesRoute B: ", note);
  res.json(note);
};

export const notesReport = async (req, res, next) => {
  const notes = await Notes.find({ tenant: req?.user?.tenant?._id });
  const reportData = notes.map((n) => ({
    title: n.title,
    content: n.content,
    check: n.check,
    deadline: new Date(n.dueAt).toLocaleString(),
    completedAt: n.completedAt ? new Date(n.completedAt).toLocaleString() : "",
    date: new Date(n.createdAt).toLocaleString(),
  }));
  function csvData(data) {
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((obj) => Object.values(obj).join(","));
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
  const limit = 5;
  const skip = (page - 1) * limit;
  const query = {};
  console.log(`user id ${req.user._id}`);
  if (search) query.title = { $regex: search, $options: "i" };
  const sortOptions = {};
  if (sortBy === "title") sortOptions.title = 1;
  if (sortBy === "content") sortOptions.content = 1;
  if (sortBy === "deadline") sortOptions.dueAt = 1;

  const adminRaw = await Notes.find({ ...query, tenant: req.user.tenant._id })
    .populate("tenant")
    .populate("user", "username email")
    .sort(sortOptions);
  const userRaw = await Notes.find({ ...query, tenant: req.user.tenant._id, user: req.user._id })
    .populate("tenant")
    .populate("user", "username email")
    .sort(sortOptions);

  if (!adminRaw || !userRaw) return next(new ExpressError(401, "No notes to show"));

  const prioritizedAdminNotes = prioritizeNotes(adminRaw);
  const prioritizedUserNotes = prioritizeNotes(userRaw);
  const adminPagination = prioritizedAdminNotes.slice(skip, skip + limit);
  const userPagination = prioritizedUserNotes.slice(skip, skip + limit);

  const totalNotes = await Notes.countDocuments({ ...query, tenant: req.user.tenant._id, user: req.user._id });
  const totalNotesOfCompany = await Notes.countDocuments({ ...query, tenant: req.user.tenant._id });

  res.json({
    page,
    totalPages: Math.ceil(totalNotes / limit),
    totalNotes,
    adminNotes: adminPagination,
    userNotes: userPagination,
    totalNotesOfCompany,
  });
};

export const singleNote = async (req, res, next) => {
  const { noteId } = req.params;
  const notes = await Notes.findOne({ _id: noteId, tenant: req.user.tenant._id }).populate("tenant", "name").populate("user", "username email");
  console.log("single notes: ", notes?.user);
  if (!notes) return next(new ExpressError(401, "No single notes"));
  res.json(notes);
};

export const updateCheck = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const notes = await Notes.findOne({ _id: noteId, tenant: req.user.tenant._id }).populate("tenant", "name").populate("user", "userId");
    if (!notes) return next(ExpressError(401, "No single note found"));
    const check = req.body.check;
    const updatePayload = {
      check,
      completedAt: check ? new Date() : null,
    };
    const newNotes = await Notes.findByIdAndUpdate({ _id: noteId }, updatePayload, { new: true })
      .populate("tenant", "name")
      .populate("user", "username email");
    res.json(newNotes);
  } catch (e) {
    res.status(401).json({ message: e });
  }
};

export const singleNoteToEdit = async (req, res, next) => {
  const { noteId } = req.params;
  const notes = await Notes.findOne({ _id: noteId, tenant: req.user.tenant._id });
  if (!notes) return next(new ExpressError(404, "Note not found"));
  res.json(notes);
};

export const editNote = async (req, res, next) => {
  const { noteId } = req.params;
  const { title, content } = req.body;
  const newData = { title, content };
  const newNotes = await Notes.findOneAndUpdate(
    { _id: noteId, tenant: req.user.tenant._id },
    newData,
    { new: true }
  );
  if (!newNotes) return next(new ExpressError(404, "Note not found or unauthorized"));
  console.log("New Notes Updated: ", newNotes);
  res.json(newNotes);
};

export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;
  console.log("id delete B: ", noteId);
  console.log("params delete B: ", req.params);
  const notes = await Notes.findOneAndDelete({ _id: noteId, tenant: req.user.tenant });
  if (!notes) return next(new ExpressError(401, "No notes deleted"));
  res.json(notes);
};
