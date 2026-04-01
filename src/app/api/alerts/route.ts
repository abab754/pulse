import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const config = await prisma.alertConfig.findUnique({
    where: { projectId },
  });

  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, slackWebhookUrl, p95LatencyThreshold, errorRateThreshold, enabled } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const config = await prisma.alertConfig.upsert({
    where: { projectId },
    update: {
      ...(slackWebhookUrl !== undefined && { slackWebhookUrl }),
      ...(p95LatencyThreshold !== undefined && { p95LatencyThreshold }),
      ...(errorRateThreshold !== undefined && { errorRateThreshold }),
      ...(enabled !== undefined && { enabled }),
    },
    create: {
      projectId,
      slackWebhookUrl: slackWebhookUrl || null,
      p95LatencyThreshold: p95LatencyThreshold ?? 1000,
      errorRateThreshold: errorRateThreshold ?? 0.05,
      enabled: enabled ?? true,
    },
  });

  return NextResponse.json(config);
}
