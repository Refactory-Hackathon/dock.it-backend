import prisma from "../../lib/prisma";
import { emailService } from "../../lib/email-service";
import { notificationRepository } from "../notifications/notification.repository";
import { revisionRepository, type CreateRevisionInput } from "./revision.repository";

const getAppUrl = () => process.env.APP_URL || "http://localhost:3000";

const requestRevision = async (input: CreateRevisionInput) => {
  const revision = await revisionRepository.create(input);

  // Fetch artifact + project for notification/email context
  const artifact = await prisma.generatedArtifact.findUnique({
    where: { id: input.artifactId },
    include: {
      project: {
        include: { owner: true },
      },
    },
  });

  if (artifact?.project?.owner) {
    // In-app notification
    await notificationRepository.create({
      userId: artifact.project.owner.id,
      type: "REVISION_REQUEST",
      title: `Revision Request on ${artifact.title}`,
      message: input.notes,
      link: `/projects/${artifact.project.slug}`,
    });

    // Email
    if (artifact.project.owner.email) {
      await emailService.sendRevisionRequest({
        toEmail: artifact.project.owner.email,
        recipientName: artifact.project.owner.display_name || artifact.project.owner.email,
        projectName: artifact.project.name,
        artifactName: artifact.title,
        reviewerName: input.requestedBy,
        notes: input.notes,
        artifactLink: `${getAppUrl()}/projects/${artifact.project.slug}`,
      });
    }
  }

  return { revision };
};

const getRevisions = async (artifactId: string) => {
  const revisions = await revisionRepository.listByArtifact(artifactId);
  const pendingCount = revisions.filter((r) => r.status === "PENDING").length;

  return {
    revisions: revisions.map((r) => ({
      id: r.id,
      artifactId: r.artifact_id,
      version: r.version,
      requestedBy: r.requested_by,
      assignedTo: r.assigned_to,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
    })),
    pendingCount,
  };
};

const getPendingByProject = async (projectId: string) => {
  const revisions = await revisionRepository.listPendingByProject(projectId);
  return { revisions };
};

const resolveRevision = async (revisionId: string) => {
  const revision = await revisionRepository.resolve(revisionId);
  return { revision };
};

const autoResolveForArtifact = async (artifactId: string) => {
  await revisionRepository.resolveAllForArtifact(artifactId);
};

export const revisionService = {
  requestRevision,
  getRevisions,
  getPendingByProject,
  resolveRevision,
  autoResolveForArtifact,
};
