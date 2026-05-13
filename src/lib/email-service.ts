import { sendEmail } from "./email";
import {
  renderInvitationEmail,
  renderProgressNotificationEmail,
  renderRevisionRequestEmail,
  type InvitationTemplateData,
  type ProgressNotificationData,
  type RevisionRequestData,
} from "./email-templates";

export async function sendInvitation(data: InvitationTemplateData & { toEmail: string }): Promise<boolean> {
  const html = renderInvitationEmail(data);
  return sendEmail({
    to: data.toEmail,
    subject: `Undangan bergabung ke ${data.spaceName} — Dock.it`,
    html,
  });
}

export async function sendProgressNotification(data: ProgressNotificationData & { toEmail: string }): Promise<boolean> {
  const html = renderProgressNotificationEmail(data);
  return sendEmail({
    to: data.toEmail,
    subject: `Update: ${data.projectName} — ${data.status}`,
    html,
  });
}

export async function sendRevisionRequest(data: RevisionRequestData & { toEmail: string }): Promise<boolean> {
  const html = renderRevisionRequestEmail(data);
  return sendEmail({
    to: data.toEmail,
    subject: `Revision Request: ${data.artifactName} — ${data.projectName}`,
    html,
  });
}

export const emailService = {
  sendInvitation,
  sendProgressNotification,
  sendRevisionRequest,
};
