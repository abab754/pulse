import { prisma } from "./prisma";
import { getDashboardStats } from "./metrics";

/**
 * Checks if the current metrics for a project exceed alert thresholds,
 * and sends a Slack notification if they do.
 *
 * Called after event ingestion — we check against a rolling 5-minute window
 * to keep it responsive without being noisy.
 */
export async function checkAlerts(projectId: string) {
  const config = await prisma.alertConfig.findUnique({
    where: { projectId },
    include: { project: { select: { name: true } } },
  });

  if (!config?.enabled) return;
  if (!config.slackWebhookUrl) return;

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const stats = await getDashboardStats(projectId, fiveMinAgo, now);

  // Don't alert on tiny sample sizes
  if (stats.totalRequests < 5) return;

  const violations: string[] = [];

  if (stats.p95Latency > config.p95LatencyThreshold) {
    violations.push(
      `P95 latency is ${stats.p95Latency}ms (threshold: ${config.p95LatencyThreshold}ms)`
    );
  }

  if (stats.errorRate > config.errorRateThreshold) {
    violations.push(
      `Error rate is ${(stats.errorRate * 100).toFixed(1)}% (threshold: ${(config.errorRateThreshold * 100).toFixed(1)}%)`
    );
  }

  if (violations.length === 0) return;

  await sendSlackAlert(config.slackWebhookUrl, {
    projectName: config.project.name,
    violations,
    stats,
  });
}

async function sendSlackAlert(
  webhookUrl: string,
  data: {
    projectName: string;
    violations: string[];
    stats: { totalRequests: number; avgLatency: number; p95Latency: number; errorRate: number };
  }
) {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `⚠️ Pulse Alert: ${data.projectName}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: data.violations.map((v) => `• ${v}`).join("\n"),
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Requests: ${data.stats.totalRequests} | Avg: ${data.stats.avgLatency}ms | P95: ${data.stats.p95Latency}ms | Errors: ${(data.stats.errorRate * 100).toFixed(1)}%`,
        },
      ],
    },
  ];

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
}
