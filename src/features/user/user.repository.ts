import prisma from "../../lib/prisma";

const findById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      display_name: true,
      created_at: true,
    },
  });
};

const updateProfile = async (
  userId: string,
  data: { display_name?: string },
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      display_name: true,
      created_at: true,
    },
  });
};

export const userRepository = {
  findById,
  updateProfile,
};
