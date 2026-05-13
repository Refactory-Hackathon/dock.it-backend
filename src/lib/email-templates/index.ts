const APP_NAME = "Dock.it";

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
    .logo { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 24px; }
    h1 { font-size: 18px; color: #1e293b; margin: 0 0 12px; }
    p { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .btn:hover { background: #4f46e5; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
    .badge { display: inline-block; background: #f1f5f9; border-radius: 4px; padding: 2px 8px; font-size: 12px; color: #64748b; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">${APP_NAME}</div>
      ${content}
    </div>
    <div class="footer">
      <p>Sent by ${APP_NAME} • Do not reply to this email</p>
    </div>
  </div>
</body>
</html>`;
}

export type InvitationTemplateData = {
  inviteeName: string;
  spaceName: string;
  projectName?: string;
  role: string;
  inviteLink: string;
  inviterName?: string;
};

export function renderInvitationEmail(data: InvitationTemplateData): string {
  const projectLine = data.projectName
    ? `<p>Project: <strong>${data.projectName}</strong></p>`
    : "";

  return baseLayout(`
    <h1>Kamu diundang ke workspace</h1>
    <p>Hai ${data.inviteeName || "there"},</p>
    <p>${data.inviterName ? `<strong>${data.inviterName}</strong> mengundang kamu` : "Kamu diundang"} untuk bergabung ke space <strong>${data.spaceName}</strong> sebagai <span class="badge">${data.role}</span>.</p>
    ${projectLine}
    <p style="margin-top: 24px;">
      <a href="${data.inviteLink}" class="btn">Join Workspace</a>
    </p>
    <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">Link ini berlaku selama 7 hari.</p>
  `);
}

export type ProgressNotificationData = {
  recipientName: string;
  projectName: string;
  status: string;
  progress: number;
  projectLink: string;
  message?: string;
};

export function renderProgressNotificationEmail(data: ProgressNotificationData): string {
  return baseLayout(`
    <h1>Update Progress Project</h1>
    <p>Hai ${data.recipientName},</p>
    <p>Ada update untuk project <strong>${data.projectName}</strong>:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #64748b;">Status</td>
        <td style="padding: 8px 0; font-size: 13px; font-weight: 600;">${data.status}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #64748b;">Progress</td>
        <td style="padding: 8px 0; font-size: 13px; font-weight: 600;">${data.progress}%</td>
      </tr>
    </table>
    ${data.message ? `<p>${data.message}</p>` : ""}
    <p style="margin-top: 24px;">
      <a href="${data.projectLink}" class="btn">Lihat Project</a>
    </p>
  `);
}

export type RevisionRequestData = {
  recipientName: string;
  projectName: string;
  artifactName: string;
  reviewerName: string;
  notes: string;
  artifactLink: string;
};

export function renderRevisionRequestEmail(data: RevisionRequestData): string {
  return baseLayout(`
    <h1>Revision Request</h1>
    <p>Hai ${data.recipientName},</p>
    <p><strong>${data.reviewerName}</strong> meminta revisi pada <strong>${data.artifactName}</strong> di project <strong>${data.projectName}</strong>.</p>
    <div style="background: #f8fafc; border-left: 3px solid #6366f1; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 13px; color: #334155;">${data.notes}</p>
    </div>
    <p style="margin-top: 24px;">
      <a href="${data.artifactLink}" class="btn">Lihat & Revisi</a>
    </p>
  `);
}
