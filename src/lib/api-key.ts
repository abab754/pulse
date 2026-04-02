import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";

/**
 * Generates a prefixed API key: "pls_" + 32 random hex chars.
 * The prefix makes it easy to identify Pulse keys in logs/configs.
 */
export function generateApiKey(): string {
  return `pls_${randomBytes(16).toString("hex")}`;
}

/**
 * SHA-256 hash of an API key. This is what we store in the DB.
 * The plaintext key is shown once to the user at creation time,
 * then only the hash is kept.
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Validates an API key from the Authorization header and returns the project.
 * Expected format: "Bearer pls_..."
 *
 * Lookup strategy: hash the incoming key and find by apiKeyHash.
 * Falls back to plaintext lookup for keys created before hashing was added.
 */
export async function validateApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith("pls_")) {
    return null;
  }

  const keyHash = hashApiKey(apiKey);

  // Try hash-based lookup first (new keys)
  let project = await prisma.project.findFirst({
    where: { apiKeyHash: keyHash },
    select: { id: true, name: true },
  });

  // Fallback: plaintext lookup (legacy keys pre-hashing)
  if (!project) {
    project = await prisma.project.findUnique({
      where: { apiKey },
      select: { id: true, name: true },
    });

    // Backfill the hash if found via plaintext
    if (project) {
      await prisma.project.update({
        where: { id: project.id },
        data: { apiKeyHash: keyHash },
      });
    }
  }

  return project;
}
