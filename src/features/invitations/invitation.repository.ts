import prisma from "../../lib/prisma";
import type { ProjectRole } from "../../generated/prisma/client";

export type CreateInvitationInput = {
  token: string;
  spaceId: string;
  projectId?: string;
  role: ProjectRole;
  email: string;
  expiresAt: Date;
};

const create = async (input: CreateInvitationInput) => {
  return prisma.invitationToken.create({
    data: {
      token: input.token,
      space_id: input.spaceId,
      project_id: input.projectId,
      role: input.role,
      email: input.email,
      expires_at: input.expiresAt,
    },
  });
};

const findByToken = async (token: string) => {
  return prisma.invitationToken.findUnique({
    where: { token },
    include: {
      space: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, slug: true, name: true } },
    },
  });
};

const markUsed = async (token: string) => {
  return prisma.invitationToken.update({
    where: { token },
    data: { used: true, used_at: new Date() },
  });
};

const findPendingBySpace = async (spaceId: string) => {
  return prisma.invitationToken.findMany({
    where: {
      space_id: spaceId,
      used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });
};

export const invitationRepository = {
  create,
  findByToken,
  markUsed,
  findPendingBySpace,
};
