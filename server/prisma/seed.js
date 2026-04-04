const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const email = process.env.SUPER_ADMIN_EMAIL || "admin@pos.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";

  // 1. Create/Update Super Admin
  const hashedPassword = await bcrypt.hash(password, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      tenantId: null,
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // 2. Create Demo Tenant (Store)
  const demoTenant = await prisma.tenant.upsert({
    where: { email: "demo@store.com" },
    update: {},
    create: {
      name: "Oddo Demo Store",
      email: "demo@store.com",
      plan: "PRO",
      isActive: true,
      settings: {
        create: {
          storeName: "Oddo Demo Store",
          currency: "INR",
          taxRate: 5,
          taxLabel: "GST",
          receiptNote: "Enjoy your coffee!",
        },
      },
    },
  });
  console.log(`✅ Demo Tenant: ${demoTenant.name} (${demoTenant.id})`);

  // 3. Create Categories
  const categories = ["Coffee", "Bakery", "Beverages", "Merchandise"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name_tenantId: { name, tenantId: demoTenant.id } },
      update: {},
      create: { name, tenantId: demoTenant.id },
    });
  }
  const coffeeCat = await prisma.category.findFirst({ where: { name: "Coffee", tenantId: demoTenant.id } });
  const bakeryCat = await prisma.category.findFirst({ where: { name: "Bakery", tenantId: demoTenant.id } });
  console.log("✅ Categories created");

  // 4. Create Products
  const products = [
    { name: "Caffe Latte", price: 180, stock: 100, categoryId: coffeeCat.id, tenantId: demoTenant.id },
    { name: "Cappuccino", price: 160, stock: 100, categoryId: coffeeCat.id, tenantId: demoTenant.id },
    { name: "Espresso", price: 120, stock: 100, categoryId: coffeeCat.id, tenantId: demoTenant.id },
    { name: "Caramel Macchiato", price: 210, stock: 50, categoryId: coffeeCat.id, tenantId: demoTenant.id },
    { name: "Butter Croissant", price: 95, stock: 20, categoryId: bakeryCat.id, tenantId: demoTenant.id },
    { name: "Chocolate Muffin", price: 110, stock: 15, categoryId: bakeryCat.id, tenantId: demoTenant.id },
    { name: "Blueberry Cheesecake", price: 240, stock: 8, categoryId: bakeryCat.id, tenantId: demoTenant.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `demo-prod-${p.name.replace(/\s+/g, '-').toLowerCase()}` }, // Stable ID for upsert simulation or just create
      update: { price: p.price, stock: p.stock },
      create: { ...p, id: undefined }, // Let Prisma generate UUID
    });
  }
  console.log("✅ Products created");

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
