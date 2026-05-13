import prisma from "../../lib/prisma";

export type CreateCommentInput = {
  artifactId: string;
  projectId: string;
  userId?: string;
  userName: string;
  content: string;
  parentId?: string;
};

const create = async (input: CreateCommentInput) => {
  return prisma.comment.create({
    data: {
      artifact_id: input.artifactId,
      project_id: input.projectId,
      user_id: input.userId,
      user_name: input.userName,
      content: input.content,
      parent_id: input.parentId,
    },
  });
};

const listByArtifact = async (artifactId: string) => {
  return prisma.comment.findMany({
    where: { artifact_id: artifactId },
    orderBy: { created_at: "asc" },
  });
};

const countByArtifact = async (artifactId: string) => {
  return prisma.comment.count({
    where: { artifact_id: artifactId },
  });
};

const deleteById = async (id: string) => {
  return prisma.comment.delete({ where: { id } });
};

export const commentRepository = {
  create,
  listByArtifact,
  countByArtifact,
  deleteById,
};
