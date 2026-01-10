import { randomUUID } from "crypto";
import {
  AuditLog,
  DashboardSummary,
  Draft,
  DraftStatus,
  InboxSummary,
  Project,
  RepoAccess,
  Brief,
  ScheduleProposal,
  ScheduleStatus,
  StorageAdapter,
  Task,
  TaskStatus,
} from "./types";

const nowIso = () => new Date().toISOString();

type MemoryData = {
  projects: Project[];
  briefs: Brief[];
  drafts: Draft[];
  schedules: ScheduleProposal[];
  tasks: Task[];
  repos: RepoAccess[];
  auditLogs: AuditLog[];
};

const seedData = (): MemoryData => {
  const createdAt = nowIso();
  const drafts: Draft[] = [
    {
      id: "draft-jamarq-li-001",
      projectId: "project-jamarq",
      platform: "LinkedIn",
      title: "JAMARQ Q1 Launch",
      status: "NEEDS_REVIEW",
      draftJson: {
        headline: "JAMARQ launches Ledger",
        body: "Introducing Ledger for pipeline visibility.",
        cta: "Book a demo",
      },
      claims: ["Launch date confirmed", "Internal tooling only"],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "draft-jamarq-x-001",
      projectId: "project-jamarq",
      platform: "X",
      title: "JAMARQ Ledger teaser",
      status: "NEEDS_REVIEW",
      draftJson: {
        text: "Ledger keeps the post pipeline clear: repo -> brief -> drafts -> approvals -> schedule.",
      },
      claims: ["Internal workflow summary"],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "draft-jamarq-fb-001",
      projectId: "project-jamarq",
      platform: "Facebook",
      title: "Ledger v1 announcement",
      status: "NEEDS_REVIEW",
      draftJson: {
        headline: "Ledger v1",
        body: "An internal ops panel for the social pipeline.",
      },
      claims: ["Internal-only app"],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "draft-tenra-li-001",
      projectId: "project-tenra",
      platform: "LinkedIn",
      title: "TENRA monthly update",
      status: "NEEDS_REVIEW",
      draftJson: {
        headline: "TENRA product update",
        body: "Pipeline visibility and approvals tightened.",
      },
      claims: ["Internal approval flow"],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "draft-tenra-x-001",
      projectId: "project-tenra",
      platform: "X",
      title: "TENRA schedule note",
      status: "NEEDS_REVIEW",
      draftJson: {
        text: "TENRA posts now follow a clear review and schedule path.",
      },
      claims: ["Schedule path defined"],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "draft-tenra-fb-001",
      projectId: "project-tenra",
      platform: "Facebook",
      title: "TENRA ops panel",
      status: "NEEDS_REVIEW",
      draftJson: {
        headline: "TENRA ops",
        body: "Review drafts, approve schedules, keep reminders on track.",
      },
      claims: ["Internal review steps"],
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const schedules: ScheduleProposal[] = [
    {
      id: "schedule-001",
      projectId: "project-jamarq",
      status: "NEEDS_REVIEW",
      items: drafts.map((draft) => ({
        id: `item-${draft.id}`,
        draftId: draft.id,
        channel: draft.platform,
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      })),
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const tasks: Task[] = [
    {
      id: "task-001",
      projectId: "project-jamarq",
      title: "Send LinkedIn post to Legal",
      status: "PENDING",
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      copyText: "Please review the JAMARQ LinkedIn draft for compliance.",
    },
    {
      id: "task-002",
      projectId: "project-jamarq",
      title: "Collect asset approvals",
      status: "PENDING",
      dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      copyText: "Confirm the final hero image is approved for Ledger v1.",
    },
    {
      id: "task-003",
      projectId: "project-tenra",
      title: "Confirm schedule with PM",
      status: "PENDING",
      dueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
      copyText: "Confirm TENRA social schedule for next week.",
    },
    {
      id: "task-004",
      projectId: "project-tenra",
      title: "Draft reminder email",
      status: "PENDING",
      dueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      copyText: "Draft a reminder for TENRA content owners.",
    },
  ];

  const repos: RepoAccess[] = [
    {
      id: "repo-001",
      repo: "jamarq/ledger-content",
      projectTag: "JAMARQ",
      enabled: true,
      triggerDrafts: true,
      triggerSchedules: true,
      triggerTasks: true,
    },
    {
      id: "repo-002",
      repo: "tenra/social-kit",
      projectTag: "TENRA",
      enabled: true,
      triggerDrafts: true,
      triggerSchedules: false,
      triggerTasks: true,
    },
  ];

  const projects: Project[] = [
    { id: "project-jamarq", name: "JAMARQ", tag: "JAMARQ" },
    { id: "project-tenra", name: "TENRA", tag: "TENRA" },
  ];

  const briefs: Brief[] = [
    {
      id: "brief-001",
      projectId: "project-jamarq",
      summary: "Launch Ledger v1 with clear internal positioning and review steps.",
      createdAt,
    },
  ];

  return {
    projects,
    briefs,
    drafts,
    schedules,
    tasks,
    repos,
    auditLogs: [],
  };
};

const data = seedData();

const addAuditLog = (entry: Omit<AuditLog, "id" | "createdAt">) => {
  data.auditLogs.unshift({
    id: randomUUID(),
    createdAt: nowIso(),
    ...entry,
  });
};

export const createMemoryStore = (): StorageAdapter => ({
  async getDashboard(): Promise<DashboardSummary> {
    return {
      counts: {
        draftsReady: data.drafts.filter((draft) => draft.status === "NEEDS_REVIEW").length,
        schedulesReady: data.schedules.filter((schedule) => schedule.status === "NEEDS_REVIEW").length,
        tasksDue: data.tasks.filter((task) => task.status === "PENDING").length,
      },
      recentAudit: data.auditLogs.slice(0, 10),
    };
  },

  async listInbox(): Promise<InboxSummary> {
    return {
      drafts: data.drafts.filter((draft) => draft.status === "NEEDS_REVIEW"),
      schedules: data.schedules.filter((schedule) => schedule.status === "NEEDS_REVIEW"),
    };
  },

  async listDrafts() {
    return data.drafts;
  },

  async getDraft(id: string) {
    return data.drafts.find((draft) => draft.id === id) ?? null;
  },

  async updateDraftStatus(id: string, status: DraftStatus, note?: string) {
    const draft = data.drafts.find((item) => item.id === id);
    if (!draft) return null;
    draft.status = status;
    draft.updatedAt = nowIso();
    addAuditLog({
      actor: "admin",
      action: `DRAFT_${status}`,
      entityType: "Draft",
      entityId: draft.id,
      note,
    });
    return draft;
  },

  async getSchedule(id: string) {
    return data.schedules.find((schedule) => schedule.id === id) ?? null;
  },

  async listSchedules() {
    return data.schedules;
  },

  async updateScheduleStatus(id: string, status: ScheduleStatus, note?: string) {
    const schedule = data.schedules.find((item) => item.id === id);
    if (!schedule) return null;
    schedule.status = status;
    schedule.updatedAt = nowIso();
    addAuditLog({
      actor: "admin",
      action: `SCHEDULE_${status}`,
      entityType: "ScheduleProposal",
      entityId: schedule.id,
      note,
    });
    return schedule;
  },

  async listTasks() {
    return [...data.tasks].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  },

  async updateTaskStatus(id: string, status: TaskStatus) {
    const task = data.tasks.find((item) => item.id === id);
    if (!task) return null;
    task.status = status;
    addAuditLog({
      actor: "admin",
      action: `TASK_${status}`,
      entityType: "Task",
      entityId: task.id,
    });
    return task;
  },

  async listRepos() {
    return data.repos;
  },

  async updateRepos(repos: RepoAccess[]) {
    data.repos = repos;
    addAuditLog({
      actor: "admin",
      action: "SETTINGS_REPOS_UPDATED",
      entityType: "RepoAccess",
      entityId: "repo-allowlist",
      metadata: { count: repos.length },
    });
    return data.repos;
  },

  async listAuditLogs(limit: number) {
    return data.auditLogs.slice(0, limit);
  },
});
