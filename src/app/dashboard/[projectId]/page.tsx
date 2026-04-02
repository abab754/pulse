import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";
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
import { AnomalyPanel } from "@/components/anomaly-panel";
import { AlertSettings } from "@/components/alert-settings";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ projectId: string }>;

export default async function DashboardPage({ params }: { params: Params }) {
  const { projectId } = await params;
  const session = await auth();

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session?.user?.id },
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
      <header className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight hover:opacity-70 transition-opacity"
            >
              Pulse
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{project.name}</span>
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <code className="hidden sm:block text-xs bg-muted px-3 py-1.5 rounded-md font-mono select-all">
              {project.apiKey}
            </code>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Last 24 Hours</h2>
          <p className="text-xs text-muted-foreground">
            Auto-refreshes on page load
          </p>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LatencyChart data={latencySeries} />
          <VolumeChart data={volumeSeries} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnomalyPanel projectId={project.id} />
          <AlertSettings projectId={project.id} />
        </div>

        <RecentEvents
          events={recentEvents.map((e) => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
          }))}
        />
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          Pulse — Lightweight API Observability
        </div>
      </footer>
    </div>
  );
}
