import { NextRequest, NextResponse } from "next/server";
import { explainAnomaly } from "@/lib/anomaly";

// Simple in-memory rate limit: 1 request per project per 30 seconds.
// Resets on deploy (serverless cold start), which is fine for MVP.
const lastCall = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 }
    );
  }

  // Rate limit check
  const now = Date.now();
  const last = lastCall.get(projectId) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000);
    return NextResponse.json(
      { error: `Rate limited. Try again in ${waitSec}s.` },
      { status: 429 }
    );
  }
  lastCall.set(projectId, now);

  try {
    const explanation = await explainAnomaly(projectId);
    return NextResponse.json(explanation);
  } catch (error) {
    console.error("Anomaly explanation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
