import prisma from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";
import type {
  AddStakeholderInput,
  CreateProjectInput,
  SaveMeetingInput,
  SignProjectDocumentInput,
} from "./project.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PrismaTransaction = Prisma.TransactionClient;

export const projectDetailInclude = {
  space: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  owner: {
    select: {
      id: true,
      email: true,
      display_name: true,
    },
  },
  meetings: {
    orderBy: { started_at: "desc" },
    take: 5,
    include: {
      lines: {
        orderBy: { order: "asc" },
      },
    },
  },
  artifacts: {
    orderBy: { updated_at: "desc" },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 8,
      },
    },
  },
  documents: {
    orderBy: { updated_at: "desc" },
    include: {
      signatures: true,
    },
  },
  stakeholders: {
    orderBy: { created_at: "asc" },
  },
  signatures: {
    orderBy: { created_at: "desc" },
  },
} as const;

const projectListInclude = {
  space: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  owner: {
    select: {
      id: true,
      email: true,
      display_name: true,
    },
  },
  documents: {
    select: {
      id: true,
      status: true,
    },
  },
  signatures: {
    select: {
      id: true,
      status: true,
    },
  },
  artifacts: {
    select: {
      id: true,
      type: true,
      status: true,
    },
  },
} as const;

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `project-${Date.now()}`;
}

async function uniqueSlug(tx: PrismaTransaction, name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (await tx.project.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function mapPriority(priority: CreateProjectInput["priority"]) {
  const map = {
    Low: "LOW",
    Medium: "MEDIUM",
    High: "HIGH",
  } as const;

  return map[priority];
}

export function mapRole(role: AddStakeholderInput["role"]) {
  const map = {
    Owner: "OWNER",
    Approver: "APPROVER",
    Reviewer: "REVIEWER",
    Editor: "EDITOR",
    Viewer: "VIEWER",
  } as const;

  return map[role];
}

export function mapDocumentType(documentType: string) {
  return documentType.toUpperCase() as
    | "MOM"
    | "MOU"
    | "NDA"
    | "SOW"
    | "PKS"
    | "BAST"
    | "QUOTATION"
    | "PRD";
}

export function mapArtifactTarget(target: string) {
  const map = {
    prd: "PRD",
    diagram: "DIAGRAM",
    documents: "DOCUMENTS",
    stakeholders: "STAKEHOLDERS",
  } as const;

  return map[target as keyof typeof map];
}

async function resolveSpaceId(
  tx: PrismaTransaction,
  input: CreateProjectInput,
  ownerId?: string,
) {
  if (input.spaceId && uuidPattern.test(input.spaceId)) {
    const space = await tx.space.findUnique({
      where: { id: input.spaceId },
      select: { id: true },
    });

    if (space) return space.id;
  }

  if (!input.spaceName) return undefined;

  const existing = await tx.space.findFirst({
    where: {
      owner_id: ownerId,
      name: input.spaceName,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await tx.space.create({
    data: {
      owner_id: ownerId,
      name: input.spaceName,
      color: input.spaceColor,
    },
    select: { id: true },
  });

  return created.id;
}

const listProjects = async () => {
  return prisma.project.findMany({
    orderBy: { updated_at: "desc" },
    include: projectListInclude,
  });
};

const findProjectByIdentifier = async (identifier: string) => {
  const where = uuidPattern.test(identifier)
    ? { OR: [{ id: identifier }, { slug: identifier }] }
    : { slug: identifier };

  return prisma.project.findFirst({
    where,
    include: projectDetailInclude,
  });
};

const createProject = async (input: CreateProjectInput, ownerId?: string) => {
  return prisma.$transaction(async (tx) => {
    const slug = await uniqueSlug(tx, input.name);
    const spaceId = await resolveSpaceId(tx, input, ownerId);

    const project = await tx.project.create({
      data: {
        slug,
        owner_id: ownerId,
        space_id: spaceId,
        name: input.name,
        client: input.client,
        industry: input.industry,
        project_type: input.type,
        needs: input.needs,
        budget: input.budget,
        start_date: parseDate(input.start),
        deadline: parseDate(input.deadline),
        priority: mapPriority(input.priority),
        selected_documents: input.docs,
        progress: 8,
        stakeholders: {
          create: {
            name: input.client,
            organization: input.client,
            position: "Client representative",
            role: "APPROVER",
          },
        },
      },
      include: projectDetailInclude,
    });

    return project;
  });
};

const saveMeeting = async (projectId: string, input: SaveMeetingInput) => {
  return prisma.meeting.create({
    data: {
      project_id: projectId,
      title: input.title,
      transcript_text: input.transcriptText,
      started_at: input.startedAt ? new Date(input.startedAt) : new Date(),
      ended_at: input.endedAt ? new Date(input.endedAt) : new Date(),
      lines: {
        create: input.lines.map((line, index) => ({
          speaker: line.speaker,
          text: line.text,
          started_at_seconds: line.startedAtSeconds,
          order: index,
        })),
      },
    },
    include: {
      lines: {
        orderBy: { order: "asc" },
      },
    },
  });
};

const upsertArtifact = async (input: {
  projectId: string;
  artifactKey: string;
  type: "PRD" | "DIAGRAM" | "DOCUMENTS" | "STAKEHOLDERS";
  documentType?: ReturnType<typeof mapDocumentType>;
  title: string;
  content: string;
  format: "MARKDOWN" | "MERMAID" | "HTML" | "JSON";
  prompt: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.generatedArtifact.findUnique({
      where: {
        project_id_artifact_key: {
          project_id: input.projectId,
          artifact_key: input.artifactKey,
        },
      },
      select: {
        id: true,
        active_version: true,
      },
    });

    if (!existing) {
      return tx.generatedArtifact.create({
        data: {
          project_id: input.projectId,
          artifact_key: input.artifactKey,
          type: input.type,
          document_type: input.documentType,
          title: input.title,
          content: input.content,
          format: input.format,
          active_version: 1,
          versions: {
            create: {
              version: 1,
              prompt: input.prompt,
              content: input.content,
            },
          },
        },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 8,
          },
        },
      });
    }

    const nextVersion = existing.active_version + 1;

    return tx.generatedArtifact.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        content: input.content,
        format: input.format,
        active_version: nextVersion,
        status: "GENERATED",
        versions: {
          create: {
            version: nextVersion,
            prompt: input.prompt,
            content: input.content,
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 8,
        },
      },
    });
  });
};

const updateProjectAfterGeneration = async (
  projectId: string,
  target: "prd" | "diagram" | "documents" | "stakeholders",
) => {
  const patch = {
    prd: { status: "PRD_REVIEW" as const, progress: 35 },
    diagram: { status: "IN_PROGRESS" as const, progress: 48 },
    documents: { status: "SIGNING" as const, progress: 62 },
    stakeholders: { progress: 42 },
  }[target];

  return prisma.project.update({
    where: { id: projectId },
    data: patch,
    select: { id: true },
  });
};

const upsertDocument = async (input: {
  projectId: string;
  artifactId?: string;
  documentType: ReturnType<typeof mapDocumentType>;
  title: string;
  html: string;
}) => {
  return prisma.projectDocument.upsert({
    where: {
      project_id_type: {
        project_id: input.projectId,
        type: input.documentType,
      },
    },
    create: {
      project_id: input.projectId,
      artifact_id: input.artifactId,
      type: input.documentType,
      title: input.title,
      html: input.html,
      status: "GENERATED",
    },
    update: {
      artifact_id: input.artifactId,
      title: input.title,
      html: input.html,
      status: "GENERATED",
    },
    include: {
      signatures: true,
    },
  });
};

const addStakeholder = async (projectId: string, input: AddStakeholderInput) => {
  return prisma.projectStakeholder.create({
    data: {
      project_id: projectId,
      name: input.name,
      email: input.email,
      organization: input.organization,
      position: input.position,
      role: mapRole(input.role),
    },
  });
};

const signDocument = async (
  projectId: string,
  input: SignProjectDocumentInput,
) => {
  return prisma.projectSignature.create({
    data: {
      project_id: projectId,
      project_document_id: input.documentId,
      signer_name: input.signerName,
      signer_email: input.signerEmail,
      signature_data_url: input.signatureDataUrl,
      status: "SIGNED",
      signed_at: new Date(),
    },
  });
};

export const projectRepository = {
  listProjects,
  findProjectByIdentifier,
  createProject,
  saveMeeting,
  upsertArtifact,
  updateProjectAfterGeneration,
  upsertDocument,
  addStakeholder,
  signDocument,
};
