import { getPrismaClient } from "@/lib/prisma";
import type {
  AuditLog as PrismaAuditLog,
  Draft as PrismaDraft,
  RepoAccess as PrismaRepoAccess,
  ScheduleItem as PrismaScheduleItem,
  ScheduleProposal as PrismaScheduleProposal,
  Task as PrismaTask,
} from "@prisma/client";
import {
  AuditLog,
  DashboardSummary,
  Draft,
  DraftStatus,
  InboxSummary,
  RepoAccess,
  ScheduleProposal,
  ScheduleStatus,
  StorageAdapter,
  Task,
  TaskStatus,
} from "./types";

const mapDraft = (draft: PrismaDraft): Draft => ({
  id: draft.id,
  projectId: draft.projectId,
  platform: draft.platform,
  title: draft.title,
  status: draft.status,
  draftJson: draft.draftJson ?? {},
  claims: draft.claims ?? [],
  createdAt: draft.createdAt.toISOString(),
  updatedAt: draft.updatedAt.toISOString(),
});

const mapSchedule = (schedule: PrismaScheduleProposal & { items: PrismaScheduleItem[] }): ScheduleProposal => ({
  id: schedule.id,
  projectId: schedule.projectId,
  status: schedule.status,
  items: (schedule.items ?? []).map((item) => ({
    id: item.id,
    draftId: item.draftId,
    channel: item.channel,
    scheduledFor: item.scheduledFor.toISOString(),
  })),
  createdAt: schedule.createdAt.toISOString(),
  updatedAt: schedule.updatedAt.toISOString(),
});

const mapTask = (task: PrismaTask): Task => ({
  id: task.id,
  projectId: task.projectId,
  title: task.title,
  status: task.status,
  dueAt: task.dueAt.toISOString(),
  copyText: task.copyText,
});

const mapRepo = (repo: PrismaRepoAccess): RepoAccess => ({
  id: repo.id,
  repo: repo.repo,
  projectTag: repo.projectTag,
  enabled: repo.enabled,
  triggerDrafts: repo.triggerDrafts,
  triggerSchedules: repo.triggerSchedules,
  triggerTasks: repo.triggerTasks,
});

const mapAudit = (audit: PrismaAuditLog): AuditLog => ({
  id: audit.id,
  createdAt: audit.createdAt.toISOString(),
  actor: audit.actor,
  action: audit.action,
  entityType: audit.entityType,
  entityId: audit.entityId,
  note: audit.note ?? undefined,
  metadata: audit.metadata ?? undefined,
});

const createAuditLog = async (entry: Omit<AuditLog, "id" | "createdAt">) => {
  const prisma = getPrismaClient();
  await prisma.auditLog.create({
    data: {
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      note: entry.note,
      metadata: entry.metadata,
    },
  });
};

export const createDbStore = (): StorageAdapter => ({
  async getDashboard(): Promise<DashboardSummary> {
    const prisma = getPrismaClient();
    const [draftsReady, schedulesReady, tasksDue, recentAudit] = await Promise.all([
      prisma.draft.count({ where: { status: "NEEDS_REVIEW" } }),
      prisma.scheduleProposal.count({ where: { status: "NEEDS_REVIEW" } }),
      prisma.task.count({ where: { status: "PENDING" } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    return {
      counts: {
        draftsReady,
        schedulesReady,
        tasksDue,
      },
      recentAudit: recentAudit.map(mapAudit),
    };
  },

  async listInbox(): Promise<InboxSummary> {
    const prisma = getPrismaClient();
    const [drafts, schedules] = await Promise.all([
      prisma.draft.findMany({ where: { status: "NEEDS_REVIEW" } }),
      prisma.scheduleProposal.findMany({
        where: { status: "NEEDS_REVIEW" },
        include: { items: true },
      }),
    ]);

    return {
      drafts: drafts.map(mapDraft),
      schedules: schedules.map(mapSchedule),
    };
  },

  async listDrafts() {
    const prisma = getPrismaClient();
    const drafts = await prisma.draft.findMany({ orderBy: { updatedAt: "desc" } });
    return drafts.map(mapDraft);
  },

  async getDraft(id: string) {
    const prisma = getPrismaClient();
    const draft = await prisma.draft.findUnique({ where: { id } });
    return draft ? mapDraft(draft) : null;
  },

  async updateDraftStatus(id: string, status: DraftStatus, note?: string) {
    const prisma = getPrismaClient();
    const existing = await prisma.draft.findUnique({ where: { id } });
    if (!existing) return null;

    const draft = await prisma.draft.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      actor: "admin",
      action: `DRAFT_${status}`,
      entityType: "Draft",
      entityId: id,
      note,
    });

    return mapDraft(draft);
  },

  async getSchedule(id: string) {
    const prisma = getPrismaClient();
    const schedule = await prisma.scheduleProposal.findUnique({
      where: { id },
      include: { items: true },
    });
    return schedule ? mapSchedule(schedule) : null;
  },

  async listSchedules() {
    const prisma = getPrismaClient();
    const schedules = await prisma.scheduleProposal.findMany({
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });
    return schedules.map(mapSchedule);
  },

  async updateScheduleStatus(id: string, status: ScheduleStatus, note?: string) {
    const prisma = getPrismaClient();
    const existing = await prisma.scheduleProposal.findUnique({ where: { id } });
    if (!existing) return null;

    const schedule = await prisma.scheduleProposal.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    await createAuditLog({
      actor: "admin",
      action: `SCHEDULE_${status}`,
      entityType: "ScheduleProposal",
      entityId: id,
      note,
    });

    return mapSchedule(schedule);
  },

  async listTasks() {
    const prisma = getPrismaClient();
    const tasks = await prisma.task.findMany({ orderBy: { dueAt: "asc" } });
    return tasks.map(mapTask);
  },

  async updateTaskStatus(id: string, status: TaskStatus) {
    const prisma = getPrismaClient();
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return null;

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      actor: "admin",
      action: `TASK_${status}`,
      entityType: "Task",
      entityId: id,
    });

    return mapTask(task);
  },

  async listRepos() {
    const prisma = getPrismaClient();
    const repos = await prisma.repoAccess.findMany({ orderBy: { repo: "asc" } });
    return repos.map(mapRepo);
  },

  async updateRepos(repos: RepoAccess[]) {
    const prisma = getPrismaClient();
    // TODO: Replace full reset with targeted upserts once repo lifecycle is defined.
    await prisma.$transaction([
      prisma.repoAccess.deleteMany(),
      prisma.repoAccess.createMany({ data: repos.map((repo) => ({
        id: repo.id,
        repo: repo.repo,
        projectTag: repo.projectTag,
        enabled: repo.enabled,
        triggerDrafts: repo.triggerDrafts,
        triggerSchedules: repo.triggerSchedules,
        triggerTasks: repo.triggerTasks,
      })) }),
    ]);

    await createAuditLog({
      actor: "admin",
      action: "SETTINGS_REPOS_UPDATED",
      entityType: "RepoAccess",
      entityId: "repo-allowlist",
      metadata: { count: repos.length },
    });

    return repos;
  },

  async listAuditLogs(limit: number) {
    const prisma = getPrismaClient();
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return logs.map(mapAudit);
  },
});
