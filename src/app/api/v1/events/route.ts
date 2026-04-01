import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-key";
import { EventPayloadSchema } from "@/types";

export async function POST(req: NextRequest) {
  // 1. Authenticate via API key
  const project = await validateApiKey(req.headers.get("authorization"));
  if (!project) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Support both single event and batch (array)
  const payloads = Array.isArray(body) ? body : [body];

  if (payloads.length > 100) {
    return NextResponse.json(
      { error: "Batch size exceeds maximum of 100 events" },
      { status: 400 }
    );
  }

  const parsed = payloads.map((p) => EventPayloadSchema.safeParse(p));
  const errors = parsed
    .map((r, i) => (!r.success ? { index: i, issues: r.error.issues } : null))
    .filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 }
    );
  }

  // 3. Insert events — all validated payloads use the authenticated project ID
  const events = parsed.map((r) => {
    const data = r.data!;
    return {
      projectId: project.id,
      timestamp: new Date(data.timestamp),
      route: data.route,
      method: data.method,
      statusCode: data.statusCode,
      latencyMs: data.latencyMs,
      environment: data.environment,
    };
  });

  await prisma.event.createMany({ data: events });

  return NextResponse.json(
    { accepted: events.length },
    { status: 202 }
  );
}
