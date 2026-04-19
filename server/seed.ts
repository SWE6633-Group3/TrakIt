import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import { connectToDatabase, getDb, closeDatabase } from "./sqliteConnector.js";

const SQLITE_DB = process.env.SQLITE_DB ?? "trackit.db";
export const DEMO_PASSWORD = "passworD12345!";

type UserSeed = {
  name: string;
  email: string;
};

type ProjectSeed = {
  name: string;
  description: string;
};

const users: UserSeed[] = [
  { name: "Aaliyah McElrath", email: "amcelra1@students.kennesaw.edu" },
  { name: "Anthony Nguyen", email: "anguy131@students.kennesaw.edu" },
  { name: "Joseph Pentecost", email: "jpenteco@students.kennesaw.edu" },
  { name: "Matthew Maravilla", email: "mmaravil@students.kennesaw.edu" },
  { name: "Yukang Shen", email: "yshen4@students.kennesaw.edu" },
  { name: "Louis Muhammad", email: "lmuham10@students.kennesaw.edu" },
  { name: "Samantha Rhodes", email: "srhodes@mockmail.com" },
  { name: "Caleb Ortiz", email: "cortiz@mockmail.com" },
  { name: "Priya Desai", email: "pdesai@mockmail.com" },
  { name: "Miles Carter", email: "mcarter@mockmail.com" },
  { name: "Elena Park", email: "epark@mockmail.com" },
];

const projects: ProjectSeed[] = [
  {
    name: "TrakIt Launch Plan",
    description:
      "Coordinating the initial TrakIt release, including stakeholder alignment, delivery milestones, and readiness tracking for requirements, risks, and team operations.",
  },
  {
    name: "Client Portal Refresh",
    description:
      "Redesigning the client portal with improved navigation, accessibility updates, and new reporting capabilities while tracking delivery risks and requirements.",
  },
  {
    name: "Mobile Intake Workflow",
    description:
      "Building a mobile-first intake experience to capture requests in the field, sync data, and surface high-priority risks in real time.",
  },
  {
    name: "Operations Analytics Hub",
    description:
      "Creating a centralized analytics hub to monitor operational KPIs, automate weekly reporting, and align teams around decision-ready insights.",
  },
];

const requirementTemplates = [
  { title: "Capture project charter details", type: "Functional", status: "Approved" },
  { title: "Provide requirement status dashboard", type: "Functional", status: "In review" },
  { title: "Enable project milestone notifications", type: "Functional", status: "Draft" },
  { title: "System uptime above 99.5%", type: "Non-functional", status: "Approved" },
  { title: "Respond to user actions within 300ms", type: "Non-functional", status: "In review" },
  { title: "Maintain audit trail for changes", type: "Non-functional", status: "Draft" },
];

const riskTemplates = [
  { title: "Schedule slippage during integration", impact: "High", status: "Monitoring" },
  { title: "Scope creep from stakeholder requests", impact: "Medium", status: "Open" },
];

type SeedOptions = {
  closeWhenDone?: boolean;
  databasePath?: string;
};

export async function seedDatabase({
  closeWhenDone = true,
  databasePath = SQLITE_DB,
}: SeedOptions = {}) {
  await connectToDatabase(databasePath);
  const db = getDb();

  await db.exec("DELETE FROM password_reset_codes;");
  await db.exec("DELETE FROM requirements;");
  await db.exec("DELETE FROM risks;");
  await db.exec("DELETE FROM project_users;");
  await db.exec("DELETE FROM projects;");
  await db.exec("DELETE FROM users;");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of users) {
    await db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?);",
      user.name,
      user.email,
      passwordHash
    );
  }

  const userRows = await db.all<{ id: number; email: string }>(
    "SELECT id, email FROM users ORDER BY id ASC;"
  );
  const louisUser = userRows.find(
    (user) => user.email === "lmuham10@students.kennesaw.edu"
  );

  for (let i = 0; i < projects.length; i += 1) {
    const owner =
      i === 0 && louisUser ? louisUser : userRows[i % userRows.length];
    const projectSeed = projects[i];
    const projectId =
      (
        await db.run(
          "INSERT INTO projects (name, description, owner_user_id) VALUES (?, ?, ?);",
          projectSeed.name,
          projectSeed.description,
          owner.id
        )
      ).lastID ?? 0;

    await db.run(
      "INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?);",
      projectId,
      owner.id,
      "Lead"
    );

    const memberCandidates = userRows.filter((user) => user.id !== owner.id);
    const assignedMembers = memberCandidates.slice(0, 3);
    for (const member of assignedMembers) {
      await db.run(
        "INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?);",
        projectId,
        member.id,
        "Member"
      );
    }

    if (louisUser && louisUser.id !== owner.id) {
      await db.run(
        "INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?);",
        projectId,
        louisUser.id,
        "Member"
      );
    }

    for (const requirement of requirementTemplates) {
      await db.run(
        "INSERT INTO requirements (project_id, title, type, status) VALUES (?, ?, ?, ?);",
        projectId,
        requirement.title,
        requirement.type,
        requirement.status
      );
    }

    for (const risk of riskTemplates) {
      await db.run(
        "INSERT INTO risks (project_id, title, impact, status) VALUES (?, ?, ?, ?);",
        projectId,
        risk.title,
        risk.impact,
        risk.status
      );
    }

  }

  console.log("Seed complete.");
  if (closeWhenDone) {
    await closeDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
