/**
 * Idempotent seed for the system roles that authentication depends on.
 *
 * Login / authMiddleware resolve `user.role.name` and its permissions; without
 * these rows every login returns an undefined role. Unlike `prisma/seed.ts`
 * (which wipes every table and inserts demo data), this script only upserts the
 * four system roles and is safe to run on every deploy.
 *
 * Run:  npm run seed:roles
 */
import prisma from "../src/config/prismaClient";

const SYSTEM_ROLES = [
  { name: "OWNER", description: "Community Owner" },
  { name: "ADMIN", description: "Community Administrator" },
  { name: "MODERATOR", description: "Community Moderator" },
  { name: "MEMBER", description: "Community Member" },
];

async function main() {
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, is_system_role: true },
      create: { ...role, is_system_role: true },
    });
  }
  console.log(`Seeded ${SYSTEM_ROLES.length} system roles`);
}

main()
  .catch((error) => {
    console.error("Role seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
