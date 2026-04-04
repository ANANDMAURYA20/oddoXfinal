const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const getSettings = async (tenantId) => {
  let settings = await prisma.settings.findUnique({
    where: { tenantId },
  });

  // Auto-create default settings if none exist
  if (!settings) {
    settings = await prisma.settings.create({
      data: { tenantId },
    });
  }

  return settings;
};

const updateSettings = async (tenantId, data) => {
  // Upsert: create if not exists, update if exists
  return prisma.settings.upsert({
    where: { tenantId },
    update: data,
    create: { ...data, tenantId },
  });
};

module.exports = { getSettings, updateSettings };
