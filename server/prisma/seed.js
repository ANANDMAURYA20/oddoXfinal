const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
require("dotenv").config();

const prisma = new PrismaClient();

// Configuration
const NUM_TENANTS = 10;
const USERS_PER_TENANT = 50; 
const CATEGORIES_PER_TENANT = 5;
const PRODUCTS_PER_TENANT = 50;
const ORDERS_PER_TENANT = 100;
const DEFAULT_PASSWORD = "123456";

async function main() {
  console.log("🚀 Starting Massive Scalability Seed...");
  const startTime = Date.now();

  // 0. Seed Super Admin (upsert so it's idempotent)
  console.log("👑 Seeding Super Admin...");
  const superAdminPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: "admin@pos.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@pos.com",
      password: superAdminPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      tenantId: null,
    },
  });
  console.log(`   ✅ Super Admin seeded (admin@pos.com / ${DEFAULT_PASSWORD})`);

  // 1. Pre-hash password for speed
  console.log("🔐 Hashing default password...");
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 2. Clean up (Optional - but recommended for clean scalability checks)
  // console.log("🧹 Cleaning up old data...");
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });
  // await prisma.tenant.deleteMany();

  for (let t = 0; t < NUM_TENANTS; t++) {
    const tenantName = faker.company.name();
    const tenantEmail = faker.internet.email().toLowerCase();
    
    console.log(`🏢 Seeding Tenant ${t + 1}/${NUM_TENANTS}: ${tenantName}`);

    // Create Tenant & Settings
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        email: tenantEmail,
        plan: faker.helpers.arrayElement(["TRIAL", "BASIC", "PRO"]),
        settings: {
          create: {
            storeName: tenantName,
            currency: "INR",
            taxRate: 5,
            onboardingCompleted: true,
            totalTables: 20
          }
        }
      }
    });

    // Create Users for this tenant
    console.log(`   👥 Creating ${USERS_PER_TENANT} users...`);
    const usersData = Array.from({ length: USERS_PER_TENANT }).map((_, i) => ({
      name: faker.person.fullName(),
      email: `t${t}_u${i}_${faker.string.alphanumeric(4)}@${faker.internet.domainName()}`,
      password: hashedPassword,
      role: i === 0 ? "TENANT_ADMIN" : faker.helpers.arrayElement(["CASHIER", "KDS_STAFF"]),
      tenantId: tenant.id
    }));
    await prisma.user.createMany({ data: usersData });
    
    // Create Categories
    console.log(`   🏷️  Creating ${CATEGORIES_PER_TENANT} categories...`);
    const categories = [];
    for (let c = 0; c < CATEGORIES_PER_TENANT; c++) {
      const cat = await prisma.category.create({
        data: {
          name: `${faker.commerce.department()} ${faker.string.alphanumeric(3)}`,
          tenantId: tenant.id
        }
      });
      categories.push(cat);
    }

    // Create Products
    console.log(`   📦 Creating ${PRODUCTS_PER_TENANT} products...`);
    const productsData = Array.from({ length: PRODUCTS_PER_TENANT }).map(() => ({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 50, max: 1000 })),
      costPrice: parseFloat(faker.commerce.price({ min: 10, max: 400 })),
      stock: faker.number.int({ min: 0, max: 500 }),
      lowStock: 10,
      categoryId: faker.helpers.arrayElement(categories).id,
      tenantId: tenant.id,
      vegType: faker.helpers.arrayElement(["veg", "non-veg", "egg"])
    }));
    await prisma.product.createMany({ data: productsData });
    const tenantProducts = await prisma.product.findMany({ where: { tenantId: tenant.id } });

    // Create Orders
    console.log(`   💰 Creating ${ORDERS_PER_TENANT} orders...`);
    for (let o = 0; o < ORDERS_PER_TENANT; o++) {
      const orderDate = faker.date.recent({ days: 30 });
      const orderNum = `ORD-${t}-${o}-${faker.string.alphanumeric(5).toUpperCase()}`;
      
      const order = await prisma.order.create({
        data: {
          orderNumber: orderNum,
          subtotal: 0, // Calculated below
          totalAmount: 0,
          status: "COMPLETED",
          paymentMethod: faker.helpers.arrayElement(["CASH", "CARD", "UPI"]),
          paymentStatus: "PAID",
          tenantId: tenant.id,
          createdAt: orderDate,
          orderSource: "POS"
        }
      });

      // Randomized items per order
      const numItems = faker.number.int({ min: 1, max: 5 });
      let subtotal = 0;
      const itemsData = [];

      for (let i = 0; i < numItems; i++) {
        const prod = faker.helpers.arrayElement(tenantProducts);
        const qty = faker.number.int({ min: 1, max: 3 });
        subtotal += prod.price * qty;

        itemsData.push({
          orderId: order.id,
          productId: prod.id,
          quantity: qty,
          price: prod.price,
          status: "COMPLETED"
        });
      }

      await prisma.orderItem.createMany({ data: itemsData });
      
      // Update order total
      await prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal: subtotal,
          tax: subtotal * 0.05,
          totalAmount: subtotal * 1.05
        }
      });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Seeding Complete!`);
  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log(`📊 Statistics Generated:`);
  console.log(`   - Tenants: ${NUM_TENANTS}`);
  console.log(`   - Users: ${NUM_TENANTS * USERS_PER_TENANT}`);
  console.log(`   - Products: ${NUM_TENANTS * PRODUCTS_PER_TENANT}`);
  console.log(`   - Orders: ${NUM_TENANTS * ORDERS_PER_TENANT}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
