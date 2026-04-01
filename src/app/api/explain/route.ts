import { NextRequest, NextResponse } from "next/server";
import { explainAnomaly } from "@/lib/anomaly";

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
