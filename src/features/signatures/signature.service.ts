import { signatureRepository } from "./signature.repository";
import type { CreateSignatureInput } from "./signature.types";

const listSignatures = async (userId: string) => {
  const signatures = await signatureRepository.listByUser(userId);

  return {
    signatures: signatures.map((sig) => ({
      id: sig.id,
      name: sig.name,
      dataUrl: sig.data_url,
      createdAt: sig.created_at.toISOString(),
    })),
  };
};

const createSignature = async (userId: string, input: CreateSignatureInput) => {
  const sig = await signatureRepository.create(userId, input.name, input.dataUrl);

  return {
    signature: {
      id: sig.id,
      name: sig.name,
      dataUrl: sig.data_url,
      createdAt: sig.created_at.toISOString(),
    },
  };
};

const deleteSignature = async (userId: string, signatureId: string) => {
  await signatureRepository.deleteById(userId, signatureId);
};

export const signatureService = {
  listSignatures,
  createSignature,
  deleteSignature,
};
