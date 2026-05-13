import OpenAI from "openai";
import { envConfig } from "../../config/env.config";

export type AiTarget = "prd" | "diagram" | "documents" | "stakeholders";
export type AiFormat = "MARKDOWN" | "MERMAID" | "HTML" | "JSON";

export type AiProjectContext = {
  name: string;
  client: string;
  industry?: string | null;
  projectType: string;
  needs: string;
  budget?: string | null;
  startDate?: Date | null;
  deadline?: Date | null;
  selectedDocuments?: unknown;
  transcriptText?: string | null;
  prdContent?: string | null;
  diagramContent?: string | null;
};

export type AiGeneration = {
  title: string;
  content: string;
  format: AiFormat;
  prompt: string;
};

const MAX_TRANSCRIPT_CHARS = 6000;
const MAX_NEEDS_CHARS = 1800;

function clip(value: string | null | undefined, max: number) {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max
    ? `${normalized.slice(0, max)}...`
    : normalized;
}

function dateOnly(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function compactContext(ctx: AiProjectContext) {
  return [
    `Project: ${ctx.name}`,
    `Client: ${ctx.client}`,
    `Type: ${ctx.projectType}`,
    ctx.industry ? `Industry: ${ctx.industry}` : "",
    ctx.budget ? `Budget: ${ctx.budget}` : "",
    ctx.startDate ? `Start: ${dateOnly(ctx.startDate)}` : "",
    ctx.deadline ? `Deadline: ${dateOnly(ctx.deadline)}` : "",
    `Needs: ${clip(ctx.needs, MAX_NEEDS_CHARS)}`,
    ctx.transcriptText
      ? `Meeting transcript: ${clip(ctx.transcriptText, MAX_TRANSCRIPT_CHARS)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function targetSpec(target: AiTarget) {
  switch (target) {
    case "prd":
      return {
        title: "PRD",
        format: "MARKDOWN" as AiFormat,
        maxTokens: 2000,
        system:
          "You are Dock.it AI, a project management assistant. Generate concise PRD in markdown. Use Bahasa Indonesia if the transcript/needs are in Indonesian, otherwise English. Include: Background, Problem Statement, Goals, Target Users, Scope, Out-of-Scope, Core Features (with acceptance criteria), Risks, Open Questions.",
      };
    case "diagram":
      return {
        title: "System Diagram",
        format: "MERMAID" as AiFormat,
        maxTokens: 1000,
        system:
          "You are Dock.it AI. Generate ONLY valid Mermaid flowchart TD syntax. No explanation, no markdown fences. Include relevant system components: client, frontend, backend, database, external services, document/signature flows.",
      };
    case "documents":
      return {
        title: "Document Pack",
        format: "JSON" as AiFormat,
        maxTokens: 1500,
        system:
          "You are Dock.it AI. Return ONLY a JSON array (no markdown fences). Each item: {type, title, purpose, keyClauses: string[]}. Cover relevant documents: MOM, NDA, SOW, PKS, BAST based on project context.",
      };
    case "stakeholders":
      return {
        title: "Stakeholder Map",
        format: "JSON" as AiFormat,
        maxTokens: 1000,
        system:
          "You are Dock.it AI. Return ONLY a JSON array (no markdown fences). Each item: {name, organization, position, role: OWNER|APPROVER|REVIEWER|EDITOR|VIEWER, reason}. Infer stakeholders from project context.",
      };
  }
}

function getOpenAIClient(): OpenAI | null {
  if (!envConfig.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: envConfig.OPENAI_API_KEY });
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const model = envConfig.OPENAI_MODEL || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || null;
}

export function buildPrompt(
  target: AiTarget,
  ctx: AiProjectContext,
  revisionPrompt?: string,
) {
  const parts = [compactContext(ctx)];
  if (revisionPrompt) {
    parts.push(`\nRevision request: ${clip(revisionPrompt, 900)}`);
  }
  return parts.join("\n");
}

function getFallback(
  target: AiTarget,
  ctx: AiProjectContext,
  prompt: string,
): AiGeneration {
  const spec = targetSpec(target);
  const client = ctx.client || "Client";

  if (target === "diagram") {
    return {
      title: spec.title,
      format: spec.format,
      prompt,
      content: [
        "flowchart TD",
        `  A[${client}] --> B[Meeting Notes]`,
        "  B --> C[AI PRD Generator]",
        "  C --> D[PRD Review]",
        "  D --> E[System Diagram]",
        "  E --> F[Document Pack]",
        "  F --> G[Stakeholder Approval]",
        "  G --> H[Digital Signatures]",
        "  H --> I[Project Execution]",
        "  C --> J[(PostgreSQL)]",
        "  F --> J",
      ].join("\n"),
    };
  }

  if (target === "documents") {
    return {
      title: spec.title,
      format: spec.format,
      prompt,
      content: JSON.stringify([
        {
          type: "MOM",
          title: `Minutes of Meeting - ${ctx.name}`,
          purpose: "Lock decisions from kickoff discussion.",
          keyClauses: ["scope summary", "decisions", "action items"],
        },
        {
          type: "SOW",
          title: `Statement of Work - ${ctx.name}`,
          purpose: "Define deliverables, timeline, payment, and acceptance.",
          keyClauses: ["deliverables", "milestones", "change request"],
        },
        {
          type: "NDA",
          title: `NDA - ${client}`,
          purpose: "Protect confidential project information.",
          keyClauses: ["confidential data", "permitted use", "term"],
        },
      ]),
    };
  }

  if (target === "stakeholders") {
    return {
      title: spec.title,
      format: spec.format,
      prompt,
      content: JSON.stringify([
        {
          name: "Client Product Owner",
          organization: client,
          position: "Product Owner",
          role: "APPROVER",
          reason: "Owns scope and acceptance.",
        },
        {
          name: "Developer Project Lead",
          organization: "Internal",
          position: "Project Lead",
          role: "OWNER",
          reason: "Owns delivery and change control.",
        },
      ]),
    };
  }

  return {
    title: `${spec.title} - ${ctx.name}`,
    format: spec.format,
    prompt,
    content: [
      `# PRD - ${ctx.name}`,
      "",
      "## Background",
      `${client} needs ${ctx.projectType} support for: ${clip(ctx.needs, 500)}`,
      "",
      "## Goals",
      "- Turn meeting intent into agreed product scope.",
      "- Reduce ambiguity between client and developer.",
      "",
      "## Core Scope",
      "- Project workspace with AI generation",
      "- Document pack generation",
      "- Digital signature tracking",
      "",
      "## Out Of Scope",
      "- Work not confirmed in meeting notes.",
    ].join("\n"),
  };
}

export async function generateAiContent(
  target: AiTarget,
  ctx: AiProjectContext,
  revisionPrompt?: string,
): Promise<AiGeneration> {
  const spec = targetSpec(target);
  const userPrompt = buildPrompt(target, ctx, revisionPrompt);

  try {
    const content = await callOpenAI(spec.system, userPrompt, spec.maxTokens);
    if (content) {
      return {
        title: target === "prd" ? `${spec.title} - ${ctx.name}` : spec.title,
        content,
        format: spec.format,
        prompt: userPrompt,
      };
    }
  } catch (error) {
    console.error("[ai.service] OpenAI call failed, using fallback:", error);
  }

  return getFallback(target, ctx, userPrompt);
}

export function buildDocumentHtml(
  docType: string,
  ctx: AiProjectContext,
  answers: Record<string, string> = {},
) {
  const title = `${docType.toUpperCase()} - ${ctx.name}`;
  const answerRows = Object.entries(answers)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `<li><strong>${key}</strong>: ${value}</li>`)
    .join("");

  // Include PRD knowledge if available (strip markdown headers for clean display)
  const cleanPrd = ctx.prdContent
    ? ctx.prdContent
        .replace(/^#{1,6}\s+/gm, "") // Remove # headers
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
        .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
        .replace(/^- (.*)/gm, "<li>$1</li>") // List items
        .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>") // Wrap lists
        .replace(/\n\n/g, "</p><p>") // Paragraphs
    : null;

  const prdSection = cleanPrd
    ? `<h2>Project Requirements (from PRD)</h2><div style="font-size:12px;color:#334155;border-left:3px solid #6366f1;padding-left:12px;margin:12px 0;"><p>${clip(cleanPrd, 3000)}</p></div>`
    : "";

  // Include diagram as description (not raw mermaid code)
  const diagramSection = ctx.diagramContent
    ? `<h2>System Architecture</h2><p style="font-size:12px;color:#475569;">Diagram arsitektur sistem telah di-generate dan tersedia di tab Diagram pada workspace project.</p>`
    : "";

  const deadlineStr = ctx.deadline
    ? new Date(ctx.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "TBD";

  return [
    "<article style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:0 auto;padding:32px;'>",
    `<h1 style="font-size:24px;margin-bottom:8px;">${title}</h1>`,
    `<p style="color:#64748b;margin-bottom:24px;">Generated by Dock.it</p>`,
    "<hr style='border:none;border-top:1px solid #e2e8f0;margin:16px 0;'>",
    "<h2>Project Information</h2>",
    "<table style='width:100%;border-collapse:collapse;margin:12px 0;'>",
    `<tr><td style="padding:6px 0;color:#64748b;width:140px;">Client</td><td style="padding:6px 0;font-weight:600;">${ctx.client}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#64748b;">Project</td><td style="padding:6px 0;font-weight:600;">${ctx.name}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#64748b;">Type</td><td style="padding:6px 0;">${ctx.projectType}</td></tr>`,
    ctx.industry ? `<tr><td style="padding:6px 0;color:#64748b;">Industry</td><td style="padding:6px 0;">${ctx.industry}</td></tr>` : "",
    ctx.budget ? `<tr><td style="padding:6px 0;color:#64748b;">Budget</td><td style="padding:6px 0;">${ctx.budget}</td></tr>` : "",
    `<tr><td style="padding:6px 0;color:#64748b;">Deadline</td><td style="padding:6px 0;">${deadlineStr}</td></tr>`,
    "</table>",
    "<h2>Scope & Requirements</h2>",
    `<p>${ctx.needs}</p>`,
    answerRows ? `<h2>Document Details</h2><ul>${answerRows}</ul>` : "",
    prdSection,
    diagramSection,
    "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0;'>",
    "<h2>Agreement</h2>",
    "<p>Both parties agree to use this document as working draft until signed. This document was generated based on project requirements, PRD, and system architecture.</p>",
    `<p style="margin-top:24px;color:#64748b;font-size:12px;">Document generated on ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>`,
    "</article>",
  ].join("");
}

/**
 * Transcribe audio using OpenAI Whisper API.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language?: string,
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI API key not configured.");
  }

  const file = new File([audioBuffer], fileName, { type: "audio/webm" });

  const response = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: language || "id",
    response_format: "text",
  });

  return response as unknown as string;
}
