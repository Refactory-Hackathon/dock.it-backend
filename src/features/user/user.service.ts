import { APIError } from "../../middleware/error.middleware";
import { userRepository } from "./user.repository";

const getProfile = async (userId: string) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new APIError("User not found", 404);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at.toISOString(),
    },
  };
};

const updateProfile = async (
  userId: string,
  input: { displayName?: string },
) => {
  const user = await userRepository.updateProfile(userId, {
    display_name: input.displayName,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at.toISOString(),
    },
  };
};

export const userService = {
  getProfile,
  updateProfile,
};
