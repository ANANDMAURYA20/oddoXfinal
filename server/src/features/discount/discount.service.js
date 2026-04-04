const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createDiscount = async (tenantId, data) => {
  return prisma.discount.create({
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      tenantId,
    },
  });
};

const listDiscounts = async (tenantId) => {
  return prisma.discount.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
};

const updateDiscount = async (tenantId, id, data) => {
  const discount = await prisma.discount.findFirst({ where: { id, tenantId } });
  if (!discount) {
    throw ApiError.notFound("Discount not found");
  }

  return prisma.discount.update({
    where: { id },
    data: {
      ...data,
      expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined,
    },
  });
};

const deleteDiscount = async (tenantId, id) => {
  const discount = await prisma.discount.findFirst({ where: { id, tenantId } });
  if (!discount) {
    throw ApiError.notFound("Discount not found");
  }

  return prisma.discount.delete({ where: { id } });
};

/**
 * Apply a discount code — validates it and calculates the discount amount.
 */
const applyDiscount = async (tenantId, { code, subtotal }) => {
  const discount = await prisma.discount.findFirst({
    where: {
      code: code.toUpperCase(),
      tenantId,
      isActive: true,
    },
  });

  if (!discount) {
    throw ApiError.notFound("Invalid or inactive discount code");
  }

  // Check expiry
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    throw ApiError.badRequest("This discount code has expired");
  }

  let discountAmount;
  if (discount.type === "PERCENTAGE") {
    discountAmount = (subtotal * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, subtotal); // Flat discount can't exceed subtotal
  }

  return {
    code: discount.code,
    type: discount.type,
    value: discount.value,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
  };
};

module.exports = { createDiscount, listDiscounts, updateDiscount, deleteDiscount, applyDiscount };
