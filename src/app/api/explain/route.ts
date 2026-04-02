import { NextRequest, NextResponse } from "next/server";
import { explainAnomaly } from "@/lib/anomaly";
import { explainLimiter } from "@/lib/rate-limit";

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

  // Rate limit: 5 requests per 60 seconds per project
  if (explainLimiter) {
    const { success } = await explainLimiter.limit(projectId);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limited. Max 5 explanations per minute." },
        { status: 429 }
      );
    }
  }

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
