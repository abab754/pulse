import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // For MVP, return all projects (no auth filtering).
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}
