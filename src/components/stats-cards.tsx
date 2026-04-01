"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

const cards = [
  {
    key: "totalRequests" as const,
    label: "Total Requests",
    format: (v: number) => v.toLocaleString(),
    subtitle: "events in period",
  },
  {
    key: "avgLatency" as const,
    label: "Avg Latency",
    format: (v: number) => `${v}ms`,
    subtitle: "mean response time",
  },
  {
    key: "p95Latency" as const,
    label: "P95 Latency",
    format: (v: number) => `${v}ms`,
    subtitle: "95th percentile",
  },
  {
    key: "errorRate" as const,
    label: "Error Rate",
    format: (v: number) => `${(v * 100).toFixed(2)}%`,
    subtitle: "5xx responses",
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.format(stats[card.key])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
