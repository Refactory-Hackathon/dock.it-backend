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

  return [
    "<article>",
    `<h1>${title}</h1>`,
    `<p><strong>Client:</strong> ${ctx.client}</p>`,
    `<p><strong>Project:</strong> ${ctx.name}</p>`,
    `<p><strong>Scope:</strong> ${clip(ctx.needs, 900)}</p>`,
    answerRows ? `<ul>${answerRows}</ul>` : "",
    "<h2>Agreement Notes</h2>",
    "<p>Both parties agree to use this document as working draft until signed.</p>",
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
