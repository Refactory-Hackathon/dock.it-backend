import prisma from "../../lib/prisma";

export type CreateRevisionInput = {
  artifactId: string;
  projectId: string;
  version: number;
  requestedBy: string;
  assignedTo?: string;
  notes: string;
};

const create = async (input: CreateRevisionInput) => {
  return prisma.revision.create({
    data: {
      artifact_id: input.artifactId,
      project_id: input.projectId,
      version: input.version,
      requested_by: input.requestedBy,
      assigned_to: input.assignedTo,
      notes: input.notes,
    },
  });
};

const listByArtifact = async (artifactId: string) => {
  return prisma.revision.findMany({
    where: { artifact_id: artifactId },
    orderBy: { created_at: "desc" },
  });
};

const listPendingByArtifact = async (artifactId: string) => {
  return prisma.revision.findMany({
    where: { artifact_id: artifactId, status: "PENDING" },
    orderBy: { created_at: "desc" },
  });
};

const listPendingByProject = async (projectId: string) => {
  return prisma.revision.findMany({
    where: { project_id: projectId, status: "PENDING" },
    orderBy: { created_at: "desc" },
  });
};

const countPendingByArtifact = async (artifactId: string) => {
  return prisma.revision.count({
    where: { artifact_id: artifactId, status: "PENDING" },
  });
};

const resolveAllForArtifact = async (artifactId: string) => {
  return prisma.revision.updateMany({
    where: { artifact_id: artifactId, status: "PENDING" },
    data: { status: "RESOLVED", resolved_at: new Date() },
  });
};

const resolve = async (revisionId: string) => {
  return prisma.revision.update({
    where: { id: revisionId },
    data: { status: "RESOLVED", resolved_at: new Date() },
  });
};

export const revisionRepository = {
  create,
  listByArtifact,
  listPendingByArtifact,
  listPendingByProject,
  countPendingByArtifact,
  resolveAllForArtifact,
  resolve,
};
