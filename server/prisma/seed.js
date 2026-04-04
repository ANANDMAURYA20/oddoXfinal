const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const email = process.env.SUPER_ADMIN_EMAIL || "admin@pos.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";

  // Check if super admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("⚠️  Super Admin already exists. Skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      tenantId: null, // Super admin is not tied to any tenant
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
