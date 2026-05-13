import { APIError } from "../../middleware/error.middleware";
import { spaceRepository } from "./space.repository";

const roleMap = {
  Viewer: "VIEWER",
  Reviewer: "REVIEWER",
  Editor: "EDITOR",
  Approver: "APPROVER",
} as const;

const fallbackSpaces: { id: string; name: string; color: string }[] = [];

const listSpaces = async (userId?: string) => {
  const spaces = await spaceRepository.listSpaces(userId);

  return {
    spaces: spaces.map((space) => ({
      id: space.id,
      name: space.name,
      color: space.color,
      projectCount: space._count.projects,
      memberCount: space._count.members,
    })),
  };
};

const getSpace = async (spaceId: string) => {
  const space = await spaceRepository.findById(spaceId);

  if (!space) {
    throw new APIError("Space not found", 404);
  }

  return {
    space: {
      id: space.id,
      name: space.name,
      color: space.color,
      projectCount: space._count.projects,
      memberCount: space._count.members,
      members: space.members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        position: m.position,
        pending: !m.accepted_at,
      })),
      projects: space.projects.map((p) => ({
        id: p.slug,
        name: p.name,
        type: p.project_type,
        status: p.status,
        progress: p.progress,
        deadline: p.deadline
          ? p.deadline.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
          : "No deadline",
      })),
    },
  };
};

const createSpace = async (input: {
  name: string;
  color: string;
  ownerId?: string;
}) => {
  const space = await spaceRepository.createSpace(input);

  return {
    space: {
      id: space.id,
      name: space.name,
      color: space.color,
    },
  };
};

const inviteMember = async (
  spaceId: string,
  input: { name: string; email?: string; role: string; position?: string },
) => {
  const mappedRole = roleMap[input.role as keyof typeof roleMap] || "VIEWER";
  const member = await spaceRepository.addMember(spaceId, {
    ...input,
    role: mappedRole,
  });

  return { member };
};

const updateMemberRole = async (memberId: string, role: string) => {
  const mappedRole = roleMap[role as keyof typeof roleMap] || "VIEWER";
  const member = await spaceRepository.updateMemberRole(memberId, mappedRole);

  return { member };
};

const removeMember = async (memberId: string) => {
  await spaceRepository.removeMember(memberId);
};

export const spaceService = {
  listSpaces,
  getSpace,
  createSpace,
  inviteMember,
  updateMemberRole,
  removeMember,
};
