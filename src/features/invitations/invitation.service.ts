import crypto from "crypto";

import prisma from "../../lib/prisma";
import { emailService } from "../../lib/email-service";
import { APIError } from "../../middleware/error.middleware";
import { invitationRepository } from "./invitation.repository";

const TOKEN_TTL_DAYS = 7;

function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const roleMap: Record<string, "OWNER" | "APPROVER" | "REVIEWER" | "EDITOR" | "VIEWER"> = {
  Viewer: "VIEWER",
  Reviewer: "REVIEWER",
  Editor: "EDITOR",
  Approver: "APPROVER",
  Owner: "OWNER",
};

const normalizeRole = (role: string) =>
  roleMap[role] || (role.toUpperCase() as "VIEWER" | "REVIEWER" | "EDITOR" | "APPROVER" | "OWNER");

export type CreateInvitationInput = {
  spaceId: string;
  projectId?: string;
  email: string;
  name: string;
  role: string;
  inviterName?: string;
};

const createInvitation = async (input: CreateInvitationInput) => {
  let spaceId = input.spaceId;
  let projectName: string | undefined;

  // If projectId is provided but spaceId is empty, resolve space from project
  if (input.projectId && !spaceId) {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          ...(isUUID(input.projectId) ? [{ id: input.projectId }] : []),
          { slug: input.projectId },
        ],
      },
      select: { id: true, name: true, space_id: true },
    });

    if (project) {
      projectName = project.name;
      if (project.space_id) {
        spaceId = project.space_id;
      }
      // Update projectId to actual UUID
      input.projectId = project.id;
    }
  }

  // If still no spaceId, create a default space
  if (!spaceId) {
    const newSpace = await prisma.space.create({
      data: { name: `${input.name}'s Space`, color: "bg-indigo-500" },
    });
    spaceId = newSpace.id;
  }

  // Validate space exists
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { id: true, name: true },
  });

  if (!space) {
    throw new APIError("Space not found", 404);
  }

  // Fetch project info if not already fetched
  if (input.projectId && !projectName) {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          ...(isUUID(input.projectId) ? [{ id: input.projectId }] : []),
          { slug: input.projectId },
        ],
      },
      select: { name: true },
    });
    projectName = project?.name;
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const role = normalizeRole(input.role);

  const invitation = await invitationRepository.create({
    token,
    spaceId,
    projectId: input.projectId,
    role,
    email: input.email,
    expiresAt,
  });

  // Create pending space member entry
  await prisma.spaceMember.create({
    data: {
      space_id: spaceId,
      name: input.name,
      email: input.email,
      role,
      // accepted_at remains null to indicate pending
    },
  });

  // Send invitation email
  const inviteLink = `${getAppUrl()}/invite/${token}`;
  let emailSent = false;
  try {
    emailSent = await emailService.sendInvitation({
      toEmail: input.email,
      inviteeName: input.name,
      spaceName: space.name,
      projectName,
      role: input.role,
      inviteLink,
      inviterName: input.inviterName,
    });
  } catch (emailError) {
    console.error("[Invitation] Email send failed:", emailError);
  }

  return {
    invitation: {
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expires_at,
      inviteLink,
      emailSent,
    },
  };
};

const validateToken = async (token: string) => {
  const invitation = await invitationRepository.findByToken(token);

  if (!invitation) {
    throw new APIError("Invalid invitation token", 404);
  }

  if (invitation.used) {
    throw new APIError("Invitation already used", 400);
  }

  if (invitation.expires_at < new Date()) {
    throw new APIError("Invitation has expired", 400);
  }

  return {
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      space: invitation.space,
      project: invitation.project,
      expiresAt: invitation.expires_at,
    },
  };
};

const acceptInvitation = async (token: string, userId?: string) => {
  const invitation = await invitationRepository.findByToken(token);

  if (!invitation) {
    throw new APIError("Invalid invitation token", 404);
  }

  if (invitation.used) {
    throw new APIError("Invitation already used", 400);
  }

  if (invitation.expires_at < new Date()) {
    throw new APIError("Invitation has expired", 400);
  }

  // Link existing pending member to user if userId provided
  if (userId) {
    // Update space member
    await prisma.spaceMember.updateMany({
      where: {
        space_id: invitation.space_id,
        email: invitation.email,
        accepted_at: null,
      },
      data: {
        user_id: userId,
        accepted_at: new Date(),
      },
    });

    // Also add as project stakeholder so project shows in their dashboard
    if (invitation.project_id) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, display_name: true },
      });

      // Check if already a stakeholder
      const existing = await prisma.projectStakeholder.findFirst({
        where: {
          project_id: invitation.project_id,
          email: user?.email,
        },
      });

      if (!existing) {
        await prisma.projectStakeholder.create({
          data: {
            project_id: invitation.project_id,
            name: user?.display_name || user?.email || invitation.email,
            email: user?.email || invitation.email,
            role: invitation.role,
          },
        });
      }
    }
  }

  await invitationRepository.markUsed(token);

  return {
    space: invitation.space,
    project: invitation.project,
    role: invitation.role,
  };
};

export const invitationService = {
  createInvitation,
  validateToken,
  acceptInvitation,
};
