export const getHomepageData = () => ({
  brand: {
    name: "Tenant Notes",
    subtitle: "Tenant-based task assignment and note management",
  },
  hero: {
    badge: "Built around your real workflow",
    title: "Admins assign notes. Users complete them. Everything stays inside the right tenant.",
    description:
      "This software is designed for tenant-based teams where admins manage users, create notes, assign work, track completion, and export reports without losing role boundaries.",
  },
  metrics: [
    { label: "roles in the app", value: "2" },
    { label: "core admin actions", value: "6" },
    { label: "tenant plans", value: "Free / Paid" },
  ],
  intro: {
    title: "A cleaner homepage for the software you actually run.",
    description:
      "After login, admins can manage users, assign notes to tenant users, and monitor totals from the dashboard. Users see their assigned notes, complete them, and leave feedback when work is done.",
  },
  workflow: [
    {
      step: "01",
      title: "Login by tenant",
      description:
        "Users log in with email, password, and tenant so access stays scoped to the right company workspace.",
    },
    {
      step: "02",
      title: "Admin manages users",
      description:
        "Admins can create, view, update, delete, search, sort, and paginate tenant users from the admin area.",
    },
    {
      step: "03",
      title: "Assign notes as work",
      description:
        "Admins create notes with a title and content, then assign them to a specific tenant user by username or email.",
    },
    {
      step: "04",
      title: "Users complete assigned notes",
      description:
        "Assigned users open their notes, mark them complete, and submit feedback while admins keep full visibility.",
    },
  ],
  admin: {
    title: "The admin side is about control, assignment, and oversight.",
    description:
      "The backend and existing screens show a clear admin flow: dashboard totals, user management, note assignment, plan management, and CSV exports.",
    features: [
      {
        title: "Dashboard totals",
        description:
          "Admins can view total users, total notes, and all admins for the tenant from the dashboard endpoint.",
      },
      {
        title: "User lifecycle",
        description:
          "Create new users, inspect individual profiles, update account details, and remove users when needed.",
      },
      {
        title: "Assigned note management",
        description:
          "Create new notes for a chosen tenant user and review note details with user, tenant, deadline, completion, and feedback state.",
      },
      {
        title: "Search and pagination",
        description:
          "User and note lists support search, sorting, and paginated views so admin screens stay workable as data grows.",
      },
    ],
  },
  user: {
    title: "The user side is focused and simple.",
    description:
      "Users do not manage the system. They receive assigned notes, work through the list, and update completion with feedback.",
    features: [
      {
        title: "Assigned note list",
        description:
          "Users only see notes scoped to their tenant and their own assignment, while admins can see the full tenant set.",
      },
      {
        title: "Priority ordering",
        description:
          "Notes are prioritized so overdue and pending work rises to the top before completed items.",
      },
      {
        title: "Completion and feedback",
        description:
          "A user can update the note check state, add feedback, and stamp completion time on the assigned work.",
      },
      {
        title: "Profile access",
        description:
          "Users can access their own profile details and update personal information from the user routes.",
      },
    ],
  },
  evidence: [
    {
      label: "Tenant protection",
      title: "Role and tenant checks are built into the backend.",
      description:
        "Token verification, role gates, tenant checks, and note-owner checks protect who can see, assign, and update records.",
    },
    {
      label: "Plan control",
      title: "Free plans enforce a note limit.",
      description:
        "The app checks tenant plan limits before creating more notes, with paid plans unlocking unlimited note creation.",
    },
    {
      label: "Reporting",
      title: "Admins can export CSV reports.",
      description:
        "Both user reports and note reports are available from the backend so admins can audit assignments and completions outside the UI.",
    },
  ],
  plan: {
    title: "It also includes the practical admin extras.",
    description:
      "This is not just a notes page. It includes plan handling, tenant separation, and exports that make the software usable for real administration.",
    features: [
      {
        title: "Free and paid plan modes",
        description:
          "Tenants can move between free and paid plan states, with note limits changing accordingly.",
      },
      {
        title: "User report export",
        description:
          "Admins can download a CSV of tenant users for reporting and record keeping.",
      },
      {
        title: "Note report export",
        description:
          "Admins and users can generate note reports that include deadlines, completion times, and feedback.",
      },
      {
        title: "Presence tracking",
        description:
          "The backend updates last seen timestamps on authenticated requests to keep user activity fresher.",
      },
    ],
  },
  cta: {
    title: "Use the homepage as an honest preview of the real product.",
    description:
      "Sign in as an admin to manage users and assign notes, or sign in as a user to complete assigned work and send feedback back through the system.",
  },
});
