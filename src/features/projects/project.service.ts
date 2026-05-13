import { APIError } from "../../middleware/error.middleware";
import {
  buildDocumentHtml,
  generateAiContent,
  type AiProjectContext,
} from "../ai/ai.service";
import { revisionService } from "../revisions/revision.service";
import {
  mapArtifactTarget,
  mapDocumentType,
  projectRepository,
} from "./project.repository";
import type {
  AddStakeholderInput,
  CreateProjectInput,
  GenerateArtifactInput,
  GenerateDocumentInput,
  SaveMeetingInput,
  SignProjectDocumentInput,
} from "./project.types";

type ProjectRecord = Awaited<
  ReturnType<typeof projectRepository.findProjectByIdentifier>
>;

const statusLabels = {
  DISCOVERY: "Discovery",
  PRD_REVIEW: "PRD Review",
  IN_PROGRESS: "In Progress",
  SIGNING: "Signing",
  DELIVERED: "Delivered",
} as const;

const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

const accents = [
  "from-indigo-500/15 to-violet-500/15",
  "from-sky-500/15 to-cyan-500/15",
  "from-emerald-500/15 to-teal-500/15",
  "from-amber-500/15 to-orange-500/15",
  "from-rose-500/15 to-pink-500/15",
];

function initials(value?: string | null) {
  if (!value) return "NA";
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDeadline(value?: Date | null) {
  if (!value) return "No deadline";
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function relativeUpdatedAt(value: Date) {
  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function parseJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function makeArtifactKey(target: string, documentType?: string) {
  return documentType ? `document:${documentType}` : target;
}

function assertProject(project: ProjectRecord) {
  if (!project) {
    throw new APIError("Project not found", 404);
  }

  return project;
}

function toProjectSummary(project: NonNullable<ProjectRecord>, index = 0) {
  const unsignedDocs = project.signatures.filter(
    (signature) => signature.status !== "SIGNED",
  ).length;
  const pendingApprovals = project.artifacts.filter(
    (artifact) => artifact.status !== "APPROVED" && artifact.type !== "DOCUMENTS",
  ).length;

  return {
    id: project.slug,
    uuid: project.id,
    slug: project.slug,
    name: project.name,
    client: project.client,
    type: project.project_type,
    status: statusLabels[project.status],
    progress: project.progress,
    deadline: formatDeadline(project.deadline),
    pendingApprovals,
    unsignedDocs,
    scopeRequests: project.artifacts.filter(
      (artifact) => artifact.status === "NEEDS_REVISION",
    ).length,
    updatedAt: relativeUpdatedAt(project.updated_at),
    owner: project.owner?.display_name || project.owner?.email || "Workspace owner",
    ownerInitials: initials(project.owner?.display_name || project.owner?.email),
    accent: accents[index % accents.length],
    space: project.space,
  };
}

function toProjectDetail(project: NonNullable<ProjectRecord>) {
  return {
    ...toProjectSummary(project),
    rawId: project.id,
    industry: project.industry,
    needs: project.needs,
    budget: project.budget,
    priority: priorityLabels[project.priority],
    selectedDocuments: parseJsonArray<string>(project.selected_documents),
    meetings: project.meetings,
    artifacts: project.artifacts,
    documents: project.documents,
    stakeholders: project.stakeholders,
    signatures: project.signatures,
  };
}

function toAiContext(
  project: NonNullable<ProjectRecord>,
  transcriptText?: string,
): AiProjectContext {
  // Extract PRD and diagram content from artifacts
  const prdArtifact = project.artifacts?.find((a) => a.type === "PRD");
  const diagramArtifact = project.artifacts?.find((a) => a.type === "DIAGRAM");

  return {
    name: project.name,
    client: project.client,
    industry: project.industry,
    projectType: project.project_type,
    needs: project.needs,
    budget: project.budget,
    startDate: project.start_date,
    deadline: project.deadline,
    selectedDocuments: project.selected_documents,
    transcriptText:
      transcriptText ||
      project.meetings[0]?.transcript_text ||
      project.meetings[0]?.lines.map((line) => line.text).join(" ") ||
      "",
    prdContent: prdArtifact?.content || null,
    diagramContent: diagramArtifact?.content || null,
  };
}

const listProjects = async (userId?: string) => {
  const projects = await projectRepository.listProjects(userId);

  return {
    projects: projects.map((project, index) => toProjectSummary(project as NonNullable<ProjectRecord>, index)),
  };
};

const getProject = async (identifier: string) => {
  const project = assertProject(
    await projectRepository.findProjectByIdentifier(identifier),
  );

  return {
    project: toProjectDetail(project),
  };
};

const createProject = async (input: CreateProjectInput, ownerId?: string) => {
  const project = await projectRepository.createProject(input, ownerId);

  return {
    project: toProjectDetail(project),
  };
};

const saveMeeting = async (identifier: string, input: SaveMeetingInput) => {
  const project = assertProject(
    await projectRepository.findProjectByIdentifier(identifier),
  );
  const meeting = await projectRepository.saveMeeting(project.id, input);

  return { meeting };
};

const generateArtifact = async (
  identifier: string,
  input: GenerateArtifactInput,
) => {
  const project = assertProject(
    await projectRepository.findProjectByIdentifier(identifier),
  );
  const aiContext = toAiContext(project, input.transcriptText);
  const generation = await generateAiContent(
    input.target,
    aiContext,
    input.revisionPrompt,
  );
  const artifact = await projectRepository.upsertArtifact({
    projectId: project.id,
    artifactKey: makeArtifactKey(input.target),
    type: mapArtifactTarget(input.target),
    title: generation.title,
    content: generation.content,
    format: generation.format,
    prompt: generation.prompt,
  });

  await projectRepository.updateProjectAfterGeneration(project.id, input.target);

  // Auto-resolve pending revisions for this artifact
  await revisionService.autoResolveForArtifact(artifact.id);

  return { artifact };
};

const generateDocument = async (
  identifier: string,
  input: GenerateDocumentInput,
) => {
  const project = assertProject(
    await projectRepository.findProjectByIdentifier(identifier),
  );
  const documentType = mapDocumentType(input.documentType);
  const aiContext = toAiContext(project);
  const html = buildDocumentHtml(input.documentType, aiContext, input.answers);
  const artifact = await projectRepository.upsertArtifact({
    projectId: project.id,
    artifactKey: makeArtifactKey("documents", input.documentType),
    type: "DOCUMENTS",
    documentType,
    title: `${documentType} - ${project.name}`,
    content: html,
    format: "HTML",
    prompt: `document:${input.documentType}`,
  });
  const document = await projectRepository.upsertDocument({
    projectId: project.id,
    artifactId: artifact.id,
    documentType,
    title: `${documentType} - ${project.name}`,
    html,
  });

  await projectRepository.updateProjectAfterGeneration(project.id, "documents");

  return { document, artifact };
};

const addStakeholder = async (
  identifier: string,
  input: AddStakeholderInput,
) => {
  const project = assertProject(
    await projectRepository.findProjectByIdentifier(identifier),
  );
  const stakeholder = await projectRepository.addStakeholder(project.id, input);

  return { stakeholder };
};

const signDocument = async (
  identifier: string,
  input: SignProjectDocumentInput,
) => {
  const project = assertProject(
    await projectRepository.findProjectByIdentifier(identifier),
  );
  const signature = await projectRepository.signDocument(project.id, input);

  return { signature };
};

export const projectService = {
  listProjects,
  getProject,
  createProject,
  saveMeeting,
  generateArtifact,
  generateDocument,
  addStakeholder,
  signDocument,
};
