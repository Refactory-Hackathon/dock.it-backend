import prisma from "../../lib/prisma";

const listSpaces = async (userId?: string) => {
  const where = userId
    ? {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      }
    : {};

  return prisma.space.findMany({
    where,
    orderBy: { updated_at: "desc" },
    include: {
      _count: {
        select: {
          projects: true,
          members: true,
        },
      },
    },
  });
};

const findById = async (spaceId: string) => {
  return prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      members: {
        orderBy: { invited_at: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          position: true,
          invited_at: true,
          accepted_at: true,
        },
      },
      projects: {
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          project_type: true,
          status: true,
          progress: true,
          deadline: true,
        },
      },
      _count: {
        select: {
          projects: true,
          members: true,
        },
      },
    },
  });
};

const createSpace = async (input: {
  name: string;
  color: string;
  ownerId?: string;
}) => {
  const existing = await prisma.space.findFirst({
    where: {
      owner_id: input.ownerId,
      name: input.name,
    },
  });

  if (existing) return existing;

  return prisma.space.create({
    data: {
      name: input.name,
      color: input.color,
      owner_id: input.ownerId,
    },
  });
};

const addMember = async (
  spaceId: string,
  input: { name: string; email?: string; role: string; position?: string },
) => {
  return prisma.spaceMember.create({
    data: {
      space_id: spaceId,
      name: input.name,
      email: input.email,
      role: input.role as "OWNER" | "APPROVER" | "REVIEWER" | "EDITOR" | "VIEWER",
      position: input.position,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      position: true,
      invited_at: true,
    },
  });
};

const updateMemberRole = async (memberId: string, role: string) => {
  return prisma.spaceMember.update({
    where: { id: memberId },
    data: { role: role as "OWNER" | "APPROVER" | "REVIEWER" | "EDITOR" | "VIEWER" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

const removeMember = async (memberId: string) => {
  return prisma.spaceMember.delete({
    where: { id: memberId },
  });
};

export const spaceRepository = {
  listSpaces,
  findById,
  createSpace,
  addMember,
  updateMemberRole,
  removeMember,
};
