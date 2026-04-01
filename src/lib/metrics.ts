import { prisma } from "./prisma";
import type { DashboardStats, TimeSeriesPoint } from "@/types";

/**
 * Core dashboard stats: total requests, avg latency, p95 latency, error rate.
 */
export async function getDashboardStats(
  projectId: string,
  from: Date,
  to: Date
): Promise<DashboardStats> {
  const events = await prisma.event.findMany({
    where: { projectId, timestamp: { gte: from, lte: to } },
    select: { latencyMs: true, statusCode: true },
  });

  if (events.length === 0) {
    return { totalRequests: 0, avgLatency: 0, p95Latency: 0, errorRate: 0 };
  }

  const latencies = events.map((e) => e.latencyMs).sort((a, b) => a - b);
  const errors = events.filter((e) => e.statusCode >= 500).length;
  const p95Index = Math.floor(latencies.length * 0.95);

  return {
    totalRequests: events.length,
    avgLatency: Math.round(
      latencies.reduce((sum, l) => sum + l, 0) / latencies.length
    ),
    p95Latency: latencies[p95Index] ?? 0,
    errorRate: Number((errors / events.length).toFixed(4)),
  };
}

/**
 * Time-series data for latency chart (avg latency per bucket).
 */
export async function getLatencyTimeSeries(
  projectId: string,
  from: Date,
  to: Date,
  bucketMinutes: number = 15
): Promise<TimeSeriesPoint[]> {
  const events = await prisma.event.findMany({
    where: { projectId, timestamp: { gte: from, lte: to } },
    select: { timestamp: true, latencyMs: true },
    orderBy: { timestamp: "asc" },
  });

  return bucketize(events, bucketMinutes, (bucket) => {
    const avg = bucket.reduce((s, e) => s + e.latencyMs, 0) / bucket.length;
    return Math.round(avg);
  });
}

/**
 * Time-series data for request volume chart (count per bucket).
 */
export async function getVolumeTimeSeries(
  projectId: string,
  from: Date,
  to: Date,
  bucketMinutes: number = 15
): Promise<TimeSeriesPoint[]> {
  const events = await prisma.event.findMany({
    where: { projectId, timestamp: { gte: from, lte: to } },
    select: { timestamp: true },
    orderBy: { timestamp: "asc" },
  });

  return bucketize(
    events.map((e) => ({ ...e, latencyMs: 0 })),
    bucketMinutes,
    (bucket) => bucket.length
  );
}

/**
 * Route-level breakdown for anomaly detection.
 */
export async function getRouteBreakdown(
  projectId: string,
  from: Date,
  to: Date
) {
  const events = await prisma.event.findMany({
    where: { projectId, timestamp: { gte: from, lte: to } },
    select: { route: true, method: true, statusCode: true, latencyMs: true },
  });

  const routes = new Map<
    string,
    { count: number; errors: number; latencies: number[] }
  >();

  for (const e of events) {
    const key = `${e.method} ${e.route}`;
    const entry = routes.get(key) || { count: 0, errors: 0, latencies: [] };
    entry.count++;
    if (e.statusCode >= 500) entry.errors++;
    entry.latencies.push(e.latencyMs);
    routes.set(key, entry);
  }

  return Array.from(routes.entries()).map(([route, data]) => {
    const sorted = data.latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return {
      route,
      count: data.count,
      errorRate: Number((data.errors / data.count).toFixed(4)),
      avgLatency: Math.round(
        sorted.reduce((s, l) => s + l, 0) / sorted.length
      ),
      p95Latency: sorted[p95Index] ?? 0,
    };
  });
}

/**
 * Recent events for the events table.
 */
export async function getRecentEvents(projectId: string, limit: number = 50) {
  return prisma.event.findMany({
    where: { projectId },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      route: true,
      method: true,
      statusCode: true,
      latencyMs: true,
      environment: true,
    },
  });
}

// --- Helpers ---

function bucketize<T extends { timestamp: Date }>(
  events: T[],
  bucketMinutes: number,
  aggregator: (bucket: T[]) => number
): TimeSeriesPoint[] {
  if (events.length === 0) return [];

  const buckets = new Map<string, T[]>();
  const bucketMs = bucketMinutes * 60 * 1000;

  for (const event of events) {
    const bucketStart = new Date(
      Math.floor(event.timestamp.getTime() / bucketMs) * bucketMs
    );
    const key = bucketStart.toISOString();
    const bucket = buckets.get(key) || [];
    bucket.push(event);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, bucket]) => ({
      timestamp,
      value: aggregator(bucket),
    }));
}
