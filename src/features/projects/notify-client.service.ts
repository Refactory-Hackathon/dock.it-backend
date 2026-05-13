import prisma from "../../lib/prisma";
import { emailService } from "../../lib/email-service";
import { APIError } from "../../middleware/error.middleware";
import { notificationRepository } from "../notifications/notification.repository";

const APP_URL = () => process.env.APP_URL || "http://localhost:3000";

// In-memory rate limit: projectId -> lastSentAt (timestamp ms)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

const statusLabels: Record<string, string> = {
  DISCOVERY: "Discovery",
  PRD_REVIEW: "PRD Review",
  IN_PROGRESS: "In Progress",
  SIGNING: "Signing",
  DELIVERED: "Delivered",
};

export type NotifyClientInput = {
  projectIdentifier: string;
  message?: string;
  senderName?: string;
};

export const notifyClientService = {
  notifyClient: async (input: NotifyClientInput) => {
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: input.projectIdentifier }, { slug: input.projectIdentifier }],
      },
      include: {
        stakeholders: true,
        owner: true,
      },
    });

    if (!project) {
      throw new APIError("Project not found", 404);
    }

    // Rate limit check
    const lastSent = rateLimitMap.get(project.id);
    const now = Date.now();
    if (lastSent && now - lastSent < RATE_LIMIT_MS) {
      const remainingMinutes = Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 60_000);
      throw new APIError(
        `Notifikasi sudah dikirim baru-baru ini. Coba lagi dalam ${remainingMinutes} menit.`,
        429,
      );
    }

    // Recipients: stakeholders with APPROVER or REVIEWER role
    const recipients = project.stakeholders.filter(
      (s) => s.role === "APPROVER" || s.role === "REVIEWER",
    );

    const projectLink = `${APP_URL()}/projects/${project.slug}`;
    const status = statusLabels[project.status] || project.status;

    let sentCount = 0;

    for (const recipient of recipients) {
      // Send email if email is available
      if (recipient.email) {
        const sent = await emailService.sendProgressNotification({
          toEmail: recipient.email,
          recipientName: recipient.name,
          projectName: project.name,
          status,
          progress: project.progress,
          projectLink,
          message: input.message,
        });
        if (sent) sentCount++;
      }

      // In-app notification if recipient has user account (not available for stakeholders directly)
      // Skip — stakeholders are not tied to users
    }

    // Also notify project owner
    if (project.owner) {
      await notificationRepository.create({
        userId: project.owner.id,
        type: "PROGRESS_UPDATE",
        title: `Progress notification sent for ${project.name}`,
        message: `Notifikasi progress dikirim ke ${recipients.length} stakeholder`,
        link: `/projects/${project.slug}`,
      });
    }

    rateLimitMap.set(project.id, now);

    return {
      sentCount,
      recipientCount: recipients.length,
      status,
      progress: project.progress,
    };
  },
};
