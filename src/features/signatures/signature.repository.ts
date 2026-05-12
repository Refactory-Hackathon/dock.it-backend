import prisma from "../../lib/prisma";

const listByUser = async (userId: string) => {
  return prisma.userSignature.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      data_url: true,
      created_at: true,
    },
  });
};

const create = async (userId: string, name: string, dataUrl: string) => {
  return prisma.userSignature.create({
    data: {
      user_id: userId,
      name,
      data_url: dataUrl,
    },
    select: {
      id: true,
      name: true,
      data_url: true,
      created_at: true,
    },
  });
};

const deleteById = async (userId: string, signatureId: string) => {
  return prisma.userSignature.deleteMany({
    where: {
      id: signatureId,
      user_id: userId,
    },
  });
};

export const signatureRepository = {
  listByUser,
  create,
  deleteById,
};
