const { config } = require("dotenv");
const { existsSync } = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, ".env");
const envLocalPath = path.join(repoRoot, ".env.local");

if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}

if (process.env.NODE_ENV === "production") {
  console.error("seed-dev-data: Refusing to run in production.");
  process.exit(1);
}

if (process.env.STORAGE_MODE !== "db") {
  console.error("seed-dev-data: STORAGE_MODE must be set to db.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("seed-dev-data: DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysAhead = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const ids = {
  project: "project-ledger-internal",
  repo: "repo-ledger-internal",
  brief: "brief-ledger-internal",
  drafts: [
    "draft-ledger-li",
    "draft-ledger-x",
    "draft-ledger-fb",
  ],
  schedule: "schedule-ledger-001",
  scheduleItems: [
    "schedule-item-ledger-li",
    "schedule-item-ledger-x",
    "schedule-item-ledger-fb",
  ],
  task: "task-ledger-manual-001",
  auditLogs: [
    "audit-ledger-project",
    "audit-ledger-brief",
    "audit-ledger-draft-li",
    "audit-ledger-draft-x",
    "audit-ledger-draft-fb",
    "audit-ledger-schedule",
    "audit-ledger-task",
  ],
};

async function main() {
  const project = await prisma.project.upsert({
    where: { tag: "LEDGER_INTERNAL" },
    update: { name: "Ledger (Internal)" },
    create: {
      id: ids.project,
      name: "Ledger (Internal)",
      tag: "LEDGER_INTERNAL",
    },
  });

  await prisma.repoAccess.upsert({
    where: { id: ids.repo },
    update: {
      repo: "jason_marshall/ledger",
      projectTag: project.tag,
      enabled: true,
      triggerDrafts: false,
      triggerSchedules: false,
      triggerTasks: false,
      projectId: project.id,
    },
    create: {
      id: ids.repo,
      repo: "jason_marshall/ledger",
      projectTag: project.tag,
      enabled: true,
      triggerDrafts: false,
      triggerSchedules: false,
      triggerTasks: false,
      projectId: project.id,
    },
  });

  await prisma.brief.upsert({
    where: { id: ids.brief },
    update: {
      summary:
        "Internal brief: Ledger scaffolding updates are ready for review.\n" +
        "What changed: new auth flow, API routes, and Prisma 7 config.\n" +
        "Why it matters: validates review workflow end-to-end for dogfooding.\n" +
        "Constraints: no external integrations, no automated posting, admin-only access.",
      projectId: project.id,
    },
    create: {
      id: ids.brief,
      projectId: project.id,
      summary:
        "Internal brief: Ledger scaffolding updates are ready for review.\n" +
        "What changed: new auth flow, API routes, and Prisma 7 config.\n" +
        "Why it matters: validates review workflow end-to-end for dogfooding.\n" +
        "Constraints: no external integrations, no automated posting, admin-only access.",
      createdAt: daysAgo(4),
    },
  });

  const draftData = [
    {
      id: ids.drafts[0],
      platform: "LinkedIn",
      title: "Ledger internal ops panel (draft)",
      draftJson: {
        headline: "Ledger internal ops panel is ready for review",
        body: "Drafting a quick internal update for the team. Focus is on review workflow and guardrails, not launch messaging.",
        cta: "Reply with feedback",
      },
      claims: ["Internal-only update", "No external release"],
    },
    {
      id: ids.drafts[1],
      platform: "X",
      title: "Ledger ops update (draft)",
      draftJson: {
        text: "Draft: Ledger ops panel ready for internal review. Keeping scope tight: auth gate, review queues, and audit logs.",
      },
      claims: ["Internal review stage"],
    },
    {
      id: ids.drafts[2],
      platform: "Facebook",
      title: "Ledger pipeline note (draft)",
      draftJson: {
        headline: "Ledger pipeline update",
        body: "This is a rough internal draft meant for review. No external posting yet.",
      },
      claims: ["Draft quality"],
    },
  ];

  for (const draft of draftData) {
    await prisma.draft.upsert({
      where: { id: draft.id },
      update: {
        projectId: project.id,
        platform: draft.platform,
        title: draft.title,
        status: "NEEDS_REVIEW",
        draftJson: draft.draftJson,
        claims: draft.claims,
      },
      create: {
        id: draft.id,
        projectId: project.id,
        platform: draft.platform,
        title: draft.title,
        status: "NEEDS_REVIEW",
        draftJson: draft.draftJson,
        claims: draft.claims,
        createdAt: daysAgo(3),
      },
    });
  }

  await prisma.scheduleProposal.upsert({
    where: { id: ids.schedule },
    update: {
      projectId: project.id,
      status: "NEEDS_REVIEW",
    },
    create: {
      id: ids.schedule,
      projectId: project.id,
      status: "NEEDS_REVIEW",
      createdAt: daysAgo(2),
    },
  });

  const scheduleItems = [
    {
      id: ids.scheduleItems[0],
      draftId: ids.drafts[0],
      channel: "LinkedIn",
      scheduledFor: daysAhead(3),
    },
    {
      id: ids.scheduleItems[1],
      draftId: ids.drafts[1],
      channel: "X",
      scheduledFor: daysAhead(2),
    },
    {
      id: ids.scheduleItems[2],
      draftId: ids.drafts[2],
      channel: "Facebook",
      scheduledFor: daysAhead(4),
    },
  ];

  for (const item of scheduleItems) {
    await prisma.scheduleItem.upsert({
      where: { id: item.id },
      update: {
        scheduleProposalId: ids.schedule,
        draftId: item.draftId,
        channel: item.channel,
        scheduledFor: item.scheduledFor,
      },
      create: {
        id: item.id,
        scheduleProposalId: ids.schedule,
        draftId: item.draftId,
        channel: item.channel,
        scheduledFor: item.scheduledFor,
      },
    });
  }

  await prisma.task.upsert({
    where: { id: ids.task },
    update: {
      projectId: project.id,
      title: "Manual post required",
      status: "PENDING",
      dueAt: daysAhead(2),
      copyText:
        "Manual posting required for internal update. Confirm final copy after approvals.",
    },
    create: {
      id: ids.task,
      projectId: project.id,
      title: "Manual post required",
      status: "PENDING",
      dueAt: daysAhead(2),
      copyText:
        "Manual posting required for internal update. Confirm final copy after approvals.",
      createdAt: daysAgo(1),
    },
  });

  const auditEntries = [
    {
      id: ids.auditLogs[0],
      actor: "system:project_assistant",
      action: "PROJECT_SEEDED",
      entityType: "Project",
      entityId: project.id,
      note: "Seeded internal project for local workflow review.",
      createdAt: daysAgo(4),
    },
    {
      id: ids.auditLogs[1],
      actor: "system:project_assistant",
      action: "BRIEF_GENERATED",
      entityType: "Brief",
      entityId: ids.brief,
      note: "Generated internal brief for review.",
      createdAt: daysAgo(4),
    },
    {
      id: ids.auditLogs[2],
      actor: "system:drafter",
      action: "DRAFT_GENERATED",
      entityType: "Draft",
      entityId: ids.drafts[0],
      note: "Generated draft for LinkedIn review.",
      createdAt: daysAgo(3),
    },
    {
      id: ids.auditLogs[3],
      actor: "system:drafter",
      action: "DRAFT_GENERATED",
      entityType: "Draft",
      entityId: ids.drafts[1],
      note: "Generated draft for X review.",
      createdAt: daysAgo(3),
    },
    {
      id: ids.auditLogs[4],
      actor: "system:drafter",
      action: "DRAFT_GENERATED",
      entityType: "Draft",
      entityId: ids.drafts[2],
      note: "Generated draft for Facebook review.",
      createdAt: daysAgo(3),
    },
    {
      id: ids.auditLogs[5],
      actor: "system:scheduler",
      action: "SCHEDULE_PROPOSED",
      entityType: "ScheduleProposal",
      entityId: ids.schedule,
      note: "Proposed draft schedule based on review readiness.",
      createdAt: daysAgo(2),
    },
    {
      id: ids.auditLogs[6],
      actor: "system:project_assistant",
      action: "TASK_CREATED",
      entityType: "Task",
      entityId: ids.task,
      note: "Created manual posting task for review flow.",
      createdAt: daysAgo(1),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.upsert({
      where: { id: entry.id },
      update: {
        actor: entry.actor,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        note: entry.note,
        createdAt: entry.createdAt,
      },
      create: entry,
    });
  }

  console.log("seed-dev-data: Done.");
}

main()
  .catch((error) => {
    console.error("seed-dev-data: FAILED", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
