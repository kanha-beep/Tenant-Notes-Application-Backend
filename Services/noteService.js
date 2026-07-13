import Notes from "../Models/NotesSchema.js";
import User from "../Models/UserSchema.js";
import ExpressError from "../Middlewares/ExpressError.js";

const ONE_HOUR_MS = 60 * 60 * 1000;

function scoreSort(note) {
  const now = Date.now();
  const overdue = !note.check && note.dueAt && new Date(note.dueAt).getTime() < now;
  if (overdue) return 0;
  if (!note.check) return 1;
  return 2;
}

export function buildNoteSort(sortBy = "deadline") {
  const sortOptions = {
    title: { title: 1, createdAt: -1 },
    content: { content: 1, createdAt: -1 },
    deadline: { dueAt: 1, createdAt: -1 },
    newest: { createdAt: -1 },
  };

  return sortOptions[sortBy] || sortOptions.deadline;
}

export function canManageTenant(role) {
  return ["owner", "admin"].includes(role);
}

export function canCreateNote(role) {
  return ["owner", "admin", "member"].includes(role);
}

export function canCommentOnNote(role) {
  return ["owner", "admin", "member", "viewer"].includes(role);
}

export function canWriteNote(actor, note) {
  if (!actor || !note) return false;
  if (canManageTenant(actor.role)) return true;
  if (actor.role === "viewer") return false;

  const actorId = actor._id.toString();
  return (
    note.user?._id?.toString?.() === actorId ||
    note.user?.toString?.() === actorId ||
    note.createdBy?._id?.toString?.() === actorId ||
    note.createdBy?.toString?.() === actorId
  );
}

export function canReadNote(actor, note) {
  if (!actor || !note) return false;
  if (canManageTenant(actor.role)) return true;

  const actorId = actor._id.toString();
  return (
    note.user?._id?.toString?.() === actorId ||
    note.user?.toString?.() === actorId ||
    note.createdBy?._id?.toString?.() === actorId ||
    note.createdBy?.toString?.() === actorId
  );
}

export function parseMentions(body, tenantUsers) {
  const matches = String(body || "").match(/@([a-zA-Z0-9._-]+)/g) || [];
  if (matches.length === 0) return [];
  const usernames = new Set(matches.map((entry) => entry.slice(1).toLowerCase()));
  return tenantUsers
    .filter((user) => usernames.has(user.username.toLowerCase()))
    .map((user) => user._id);
}

export async function createNoteForTenant({
  actor,
  tenant,
  input,
}) {
  if (!canCreateNote(actor.role)) {
    throw new ExpressError(403, "Your role cannot create notes");
  }

  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title || !content) {
    throw new ExpressError(400, "Title and content are required");
  }

  const assigneeQuery = input.userEmail?.trim()
    ? { email: input.userEmail.trim().toLowerCase(), tenant: tenant._id }
    : input.user?.trim()
      ? { username: input.user.trim(), tenant: tenant._id }
      : input.userId
        ? { _id: input.userId, tenant: tenant._id }
        : null;

  if (!assigneeQuery) {
    throw new ExpressError(400, "An assignee is required");
  }

  const assignee = await User.findOne(assigneeQuery);
  if (!assignee) {
    throw new ExpressError(404, "User not found for this tenant");
  }

  const existingTitle = await Notes.findOne({ tenant: tenant._id, title });
  if (existingTitle) {
    throw new ExpressError(409, "A note with this title already exists");
  }

  const template = tenant.templates.id(input.templateId) || null;
  const createdAt = new Date();
  const dueAt = input.dueAt ? new Date(input.dueAt) : new Date(createdAt.getTime() + ONE_HOUR_MS);
  const issueCluster = title.toLowerCase().split(/\s+/).slice(0, 3).join(" ");

  const note = await Notes.create({
    title,
    content,
    user: assignee._id,
    createdBy: actor._id,
    tenant: tenant._id,
    dueAt,
    createdAt,
    priority: input.priority || "medium",
    template: template
      ? { id: template._id, name: template.name }
      : { id: null, name: "" },
    issueCluster,
  });

  return note;
}

export async function listNotesForActor({
  actor,
  tenantId,
  search = "",
  sort = "deadline",
  page = 1,
  limit = 6,
}) {
  const query = { tenant: tenantId };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { issueCluster: { $regex: search, $options: "i" } },
    ];
  }

  if (!canManageTenant(actor.role)) {
    query.user = actor._id;
  }

  const notes = await Notes.find(query)
    .populate("tenant", "name plan noteLimit")
    .populate("user", "username email role")
    .populate("createdBy", "username email")
    .sort(buildNoteSort(sort));

  const prioritized = [...notes].sort((a, b) => {
    const scoreDelta = scoreSort(a) - scoreSort(b);
    if (scoreDelta !== 0) return scoreDelta;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  const skip = (page - 1) * limit;
  const items = prioritized.slice(skip, skip + limit);
  const total = prioritized.length;

  return {
    items,
    meta: {
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
      scope: canManageTenant(actor.role) ? "tenant" : "assigned",
    },
  };
}

export async function getNoteForActor({ actor, tenantId, noteId }) {
  const note = await Notes.findOne({ _id: noteId, tenant: tenantId })
    .populate("tenant", "name plan noteLimit")
    .populate("user", "username email role")
    .populate("createdBy", "username email")
    .populate("comments.author", "username email")
    .populate("comments.mentions", "username email");

  if (!note) {
    throw new ExpressError(404, "Note not found");
  }

  if (!canReadNote(actor, note)) {
    throw new ExpressError(403, "Forbidden");
  }

  return note;
}

export async function updateNoteDetailsForActor({ actor, tenantId, noteId, updates }) {
  const note = await getNoteForActor({ actor, tenantId, noteId });
  if (!canWriteNote(actor, note)) {
    throw new ExpressError(403, "Forbidden");
  }

  const nextTitle = updates.title?.trim();
  const nextContent = updates.content?.trim();
  if (!nextTitle || !nextContent) {
    throw new ExpressError(400, "Title and content are required");
  }

  note.title = nextTitle;
  note.content = nextContent;
  if (updates.priority) note.priority = updates.priority;
  if (updates.dueAt) note.dueAt = new Date(updates.dueAt);
  await note.save();
  return note;
}

export async function updateNoteProgressForActor({ actor, tenantId, noteId, updates }) {
  const note = await getNoteForActor({ actor, tenantId, noteId });
  if (!canWriteNote(actor, note) && note.user._id.toString() !== actor._id.toString()) {
    throw new ExpressError(403, "Forbidden");
  }

  const check = Boolean(updates.check);
  const trimmedFeedback =
    typeof updates.userFeedback === "string" ? updates.userFeedback.trim() : note.userFeedback || "";

  note.check = check;
  note.status = check ? "completed" : updates.status || "in_progress";
  note.completedAt = check ? new Date() : null;
  note.userFeedback = trimmedFeedback;
  note.feedbackAt = trimmedFeedback ? new Date() : null;
  await note.save();
  return note;
}

export async function addCommentToNote({ actor, tenantId, noteId, body }) {
  const note = await getNoteForActor({ actor, tenantId, noteId });
  if (!canCommentOnNote(actor.role)) {
    throw new ExpressError(403, "Forbidden");
  }

  const message = body?.trim();
  if (!message) {
    throw new ExpressError(400, "Comment body is required");
  }

  const tenantUsers = await User.find({ tenant: tenantId }).select("_id username");
  const mentions = parseMentions(message, tenantUsers);
  note.comments.push({
    body: message,
    author: actor._id,
    mentions,
  });
  await note.save();
  return getNoteForActor({ actor, tenantId, noteId });
}

export async function deleteNoteForActor({ actor, tenantId, noteId }) {
  const note = await getNoteForActor({ actor, tenantId, noteId });
  if (!canWriteNote(actor, note)) {
    throw new ExpressError(403, "Forbidden");
  }

  await Notes.deleteOne({ _id: noteId, tenant: tenantId });
  return note;
}
