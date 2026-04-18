const createInitialStudioState = () => ({
  hero: {
    badge: "Focused system design",
    title: "Write, plan, and align in one quiet workspace.",
    description:
      "Northstar brings product plans, meeting notes, and weekly focus into a single surface with the calm visual rhythm people love in modern productivity tools.",
  },
  summary:
    "A shared operating system for product, design, and operations. Fewer tabs, clearer decisions, and much less drift.",
  metrics: [
    { label: "active projects", value: "06" },
    { label: "docs updated today", value: "18" },
    { label: "focus items complete", value: "72%" },
  ],
  navigation: [
    "Executive overview",
    "Weekly roadmap",
    "Team docs",
    "Decision log",
    "Launch prep",
  ],
  focus: [
    { id: "focus-1", title: "Lock homepage narrative", done: true },
    { id: "focus-2", title: "Review onboarding copy", done: false },
    { id: "focus-3", title: "Publish design tokens", done: false },
    { id: "focus-4", title: "Confirm launch checklist", done: true },
  ],
  projects: [
    {
      id: "project-1",
      name: "Product Narrative Refresh",
      stage: "Writing",
      percent: 84,
      description: "Clarify messaging across hero, pricing, and onboarding.",
      detail:
        "This workstream aligns the homepage, activation flow, and lifecycle emails so the whole product feels like one sentence instead of a pile of screens.",
      highlights: [
        "Hero copy now leads with outcomes instead of feature labels.",
        "Launch checklist is mapped directly to the new IA.",
        "Marketing and product teams are reviewing one shared brief.",
      ],
    },
    {
      id: "project-2",
      name: "Workspace Navigation",
      stage: "Systems",
      percent: 68,
      description: "Reduce sidebar noise and simplify pathfinding for new users.",
      detail:
        "The navigation pass trims dead-end pages, groups frequent actions, and gives every team a cleaner mental model for where work belongs.",
      highlights: [
        "Primary destinations cut from eleven to five.",
        "Templates moved closer to page creation.",
        "Search and recent activity now support re-entry flows.",
      ],
    },
    {
      id: "project-3",
      name: "Weekly Operating Rhythm",
      stage: "Ops",
      percent: 57,
      description: "Turn meetings, notes, and status updates into one weekly cadence.",
      detail:
        "Instead of separate tools for planning and reporting, the weekly rhythm centers on a shared brief, a focus list, and decision notes that stay visible after the meeting ends.",
      highlights: [
        "Monday priorities sync directly into the focus queue.",
        "Meeting notes are tagged to project workstreams.",
        "Leads can scan progress without opening ten docs.",
      ],
    },
  ],
  notes: [
    {
      id: "note-1",
      title: "Homepage Sprint Brief",
      category: "Design",
      body:
        "Keep the layout clear and editorial. Each section should feel intentional, with steady spacing, strong type hierarchy, and obvious next actions. The interface must feel productive before it feels promotional.",
      tags: ["hero", "content", "launch"],
    },
    {
      id: "note-2",
      title: "Decision Log Template",
      category: "Operations",
      body:
        "Capture the context, the final call, the owner, and the follow-up date. The point is not more writing. It is making the next conversation shorter and sharper.",
      tags: ["template", "ops", "rituals"],
    },
    {
      id: "note-3",
      title: "Customer Signal Roundup",
      category: "Research",
      body:
        "Users are asking for calm defaults, faster orientation, and less clutter in the first session. The new workspace should make progress visible without screaming for attention.",
      tags: ["research", "ux", "insights"],
    },
  ],
  activity: [
    {
      id: "activity-1",
      title: "Launch brief updated",
      description: "Three release notes were merged into the main planning page.",
      time: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "activity-2",
      title: "Design review booked",
      description: "Homepage polish review scheduled with product and brand.",
      time: new Date(Date.now() + 1000 * 60 * 60 * 11).toISOString(),
    },
    {
      id: "activity-3",
      title: "Docs handoff complete",
      description: "Editorial pass delivered to the onboarding workstream.",
      time: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    },
  ],
});

let studioState = createInitialStudioState();

export const getStudioState = () => studioState;

export const toggleFocusItem = (taskId) => {
  studioState = {
    ...studioState,
    focus: studioState.focus.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task
    ),
  };

  return studioState;
};

export const captureStudioNote = (text) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return studioState;
  }

  const excerpt =
    trimmedText.length > 220 ? `${trimmedText.slice(0, 217)}...` : trimmedText;

  const newNote = {
    id: `note-${Date.now()}`,
    title: `Captured ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`,
    category: "Quick capture",
    body: excerpt,
    tags: ["captured", "inbox"],
  };

  const newActivity = {
    id: `activity-${Date.now()}`,
    title: "Quick note captured",
    description: excerpt,
    time: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  };

  studioState = {
    ...studioState,
    notes: [newNote, ...studioState.notes],
    activity: [newActivity, ...studioState.activity].slice(0, 4),
  };

  return studioState;
};
