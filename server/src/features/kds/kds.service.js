const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createStation = async (tenantId, data) => {
  return prisma.kdsStation.create({
    data: { ...data, tenantId },
  });
};

const listStations = async (tenantId) => {
  return prisma.kdsStation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
};

const getStationById = async (tenantId, id) => {
  const station = await prisma.kdsStation.findFirst({
    where: { id, tenantId },
  });
  if (!station) {
    throw ApiError.notFound("KDS station not found");
  }
  return station;
};

const updateStation = async (tenantId, id, data) => {
  const station = await prisma.kdsStation.findFirst({ where: { id, tenantId } });
  if (!station) {
    throw ApiError.notFound("KDS station not found");
  }
  return prisma.kdsStation.update({
    where: { id },
    data,
  });
};

const deleteStation = async (tenantId, id) => {
  const station = await prisma.kdsStation.findFirst({ where: { id, tenantId } });
  if (!station) {
    throw ApiError.notFound("KDS station not found");
  }
  return prisma.kdsStation.delete({ where: { id } });
};

module.exports = { createStation, listStations, getStationById, updateStation, deleteStation };
