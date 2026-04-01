import { randomBytes } from "crypto";
import { prisma } from "./prisma";

/**
 * Generates a prefixed API key: "pls_" + 32 random hex chars.
 * The prefix makes it easy to identify Pulse keys in logs/configs.
 */
export function generateApiKey(): string {
  return `pls_${randomBytes(16).toString("hex")}`;
}

/**
 * Validates an API key from the Authorization header and returns the project.
 * Expected format: "Bearer pls_..."
 */
export async function validateApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith("pls_")) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { apiKey },
    select: { id: true, name: true },
  });

  return project;
}
