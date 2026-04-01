import { z } from "zod/v4";

/** Schema for incoming telemetry events (POST /api/v1/events) */
export const EventPayloadSchema = z.object({
  projectId: z.string(),
  timestamp: z.iso.datetime(),
  route: z.string().max(500),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  statusCode: z.int().min(100).max(599),
  latencyMs: z.int().min(0),
  environment: z.string().default("production"),
});

export type EventPayload = z.infer<typeof EventPayloadSchema>;

/** Dashboard stats returned by the metrics API */
export type DashboardStats = {
  totalRequests: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
};

/** Time-series data point for charts */
export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
};

/** Anomaly explanation response */
export type AnomalyExplanation = {
  summary: string;
  changes: string[];
  likelyCauses: string[];
  recommendedChecks: string[];
};
