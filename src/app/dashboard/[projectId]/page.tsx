import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getDashboardStats,
  getLatencyTimeSeries,
  getVolumeTimeSeries,
  getRecentEvents,
} from "@/lib/metrics";
import { StatsCards } from "@/components/stats-cards";
import { LatencyChart } from "@/components/latency-chart";
import { VolumeChart } from "@/components/volume-chart";
import { RecentEvents } from "@/components/recent-events";

type Params = Promise<{ projectId: string }>;

export default async function DashboardPage({ params }: { params: Params }) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, apiKey: true },
  });

  if (!project) notFound();

  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [stats, latencySeries, volumeSeries, recentEvents] = await Promise.all([
    getDashboardStats(project.id, from, now),
    getLatencyTimeSeries(project.id, from, now),
    getVolumeTimeSeries(project.id, from, now),
    getRecentEvents(project.id),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Pulse</h1>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{project.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {project.apiKey.slice(0, 12)}...
            </code>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Last 24 Hours</h2>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LatencyChart data={latencySeries} />
          <VolumeChart data={volumeSeries} />
        </div>

        <RecentEvents events={recentEvents.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
        }))} />
      </main>
    </div>
  );
}
