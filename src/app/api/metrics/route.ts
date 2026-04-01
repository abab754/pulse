import { NextRequest, NextResponse } from "next/server";
import {
  getDashboardStats,
  getLatencyTimeSeries,
  getVolumeTimeSeries,
  getRecentEvents,
} from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const hours = Number(searchParams.get("hours") || "24");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const now = new Date();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const [stats, latencySeries, volumeSeries, recentEvents] = await Promise.all([
    getDashboardStats(projectId, from, now),
    getLatencyTimeSeries(projectId, from, now),
    getVolumeTimeSeries(projectId, from, now),
    getRecentEvents(projectId),
  ]);

  return NextResponse.json({
    stats,
    latencySeries,
    volumeSeries,
    recentEvents,
  });
}
