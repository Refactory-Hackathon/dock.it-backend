import { commentRepository, type CreateCommentInput } from "./comment.repository";

const addComment = async (input: CreateCommentInput) => {
  const comment = await commentRepository.create(input);
  return { comment };
};

const getComments = async (artifactId: string) => {
  const comments = await commentRepository.listByArtifact(artifactId);
  return {
    comments: comments.map((c) => ({
      id: c.id,
      artifactId: c.artifact_id,
      projectId: c.project_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      parentId: c.parent_id,
      createdAt: c.created_at,
    })),
  };
};

const deleteComment = async (id: string) => {
  await commentRepository.deleteById(id);
};

export const commentService = {
  addComment,
  getComments,
  deleteComment,
};
