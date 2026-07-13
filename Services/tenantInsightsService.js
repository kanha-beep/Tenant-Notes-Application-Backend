import AuditLog from "../Models/AuditLogSchema.js";
import Invite from "../Models/InviteSchema.js";
import Notes from "../Models/NotesSchema.js";
import Tenant from "../Models/TenantSchema.js";
import User from "../Models/UserSchema.js";

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getKeywordClusters(notes) {
  const counts = new Map();
  for (const note of notes) {
    const key = note.issueCluster || "general";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cluster, count]) => ({ cluster, count }));
}

export function buildAiOpsSummary({ notes, users, tenant }) {
  const now = Date.now();
  const overdue = notes.filter(
    (note) => !note.check && note.dueAt && new Date(note.dueAt).getTime() < now
  );
  const pending = notes.filter((note) => !note.check);

  const notesByUser = users.map((user) => {
    const assigned = notes.filter((note) => note.user?.toString() === user._id.toString());
    const overdueCount = assigned.filter(
      (note) => !note.check && note.dueAt && new Date(note.dueAt).getTime() < now
    ).length;
    const completedDurations = assigned
      .filter((note) => note.completedAt)
      .map((note) => new Date(note.completedAt).getTime() - new Date(note.createdAt).getTime());

    const loadScore = assigned.filter((note) => !note.check).length * 2 + overdueCount * 3 + average(completedDurations) / (1000 * 60 * 60 * 12);
    return {
      user,
      assignedCount: assigned.length,
      overdueCount,
      loadScore,
    };
  });

  const overloaded = notesByUser
    .filter((entry) => entry.loadScore >= 4)
    .sort((a, b) => b.loadScore - a.loadScore)
    .slice(0, 3)
    .map((entry) => ({
      userId: entry.user._id,
      username: entry.user.username,
      reason: `${entry.assignedCount} assigned, ${entry.overdueCount} overdue`,
    }));

  const followUps = overdue.slice(0, 3).map((note) => ({
    noteId: note._id,
    draft: `Following up on "${note.title}". This task is overdue for ${tenant.name}. Please share status, blockers, and a new ETA today.`,
  }));

  return {
    headline: `${overdue.length} overdue items across ${pending.length} open tasks`,
    overdueSummary: overdue.slice(0, 5).map((note) => ({
      noteId: note._id,
      title: note.title,
      assignee: note.user?.username || "Unknown",
      dueAt: note.dueAt,
    })),
    repeatedIssues: getKeywordClusters(notes),
    followUpDrafts: followUps,
    overloadedMembers: overloaded,
  };
}

export function computeSlaMetrics({ notes, tenant }) {
  const completed = notes.filter((note) => note.completedAt);
  const slaMs = (tenant.settings?.slaHours || 24) * 60 * 60 * 1000;
  const withinSla = completed.filter(
    (note) =>
      new Date(note.completedAt).getTime() - new Date(note.createdAt).getTime() <= slaMs
  ).length;

  return {
    slaHours: tenant.settings?.slaHours || 24,
    completedCount: completed.length,
    withinSla,
    breachCount: Math.max(0, completed.length - withinSla),
    complianceRate: completed.length === 0 ? 100 : Math.round((withinSla / completed.length) * 100),
  };
}

export async function getTenantDashboard(tenantId) {
  const [tenant, users, notes, invites, activity] = await Promise.all([
    Tenant.findById(tenantId),
    User.find({ tenant: tenantId }).select("_id username email role status createdAt"),
    Notes.find({ tenant: tenantId }).populate("user", "username"),
    Invite.find({ tenant: tenantId, acceptedAt: null }).sort({ createdAt: -1 }).limit(10),
    AuditLog.find({ tenant: tenantId })
      .populate("actor", "username email")
      .sort({ createdAt: -1 })
      .limit(12),
  ]);

  const totalNotes = notes.length;
  const totalUsers = users.length;
  const openNotes = notes.filter((note) => !note.check).length;
  const completedNotes = notes.filter((note) => note.check).length;

  return {
    tenant,
    kpis: {
      totalNotes,
      totalUsers,
      openNotes,
      completedNotes,
      activeInvites: invites.length,
    },
    billing: {
      plan: tenant?.plan || "free",
      noteLimit: tenant?.noteLimit || "10",
      seats: tenant?.billing?.seats || 5,
      paidUsers: tenant?.paidUsers || 0,
      renewalDate: tenant?.billing?.renewalDate || null,
      status: tenant?.billing?.status || "trialing",
    },
    roleMatrix: [
      { role: "owner", capabilities: ["billing", "members", "notes", "analytics", "invites"] },
      { role: "admin", capabilities: ["members", "notes", "analytics", "invites"] },
      { role: "member", capabilities: ["assigned notes", "templates", "comments"] },
      { role: "viewer", capabilities: ["read notes", "comments"] },
    ],
    activity,
    templates: tenant?.templates || [],
    sla: computeSlaMetrics({ notes, tenant }),
    usage: {
      seatsUsed: users.filter((user) => user.status === "active").length,
      seatsProvisioned: tenant?.billing?.seats || 5,
      noteUtilization:
        tenant?.noteLimit === "unlimited"
          ? "unlimited"
          : `${totalNotes}/${tenant?.noteLimit || "10"}`,
    },
    analytics: {
      notesByRole: users.map((user) => ({
        username: user.username,
        role: user.role,
        assignedOpenNotes: notes.filter(
          (note) => note.user?._id?.toString() === user._id.toString() && !note.check
        ).length,
      })),
    },
    aiAssistant: buildAiOpsSummary({ notes, users, tenant }),
  };
}
