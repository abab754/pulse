import Anthropic from "@anthropic-ai/sdk";
import { getDashboardStats, getRouteBreakdown } from "./metrics";
import type { AnomalyExplanation } from "@/types";

const anthropic = new Anthropic();

/**
 * Compares the last 60 minutes against the previous 60 minutes,
 * computes structured diffs, and asks Claude to explain what changed.
 *
 * Key design decision: we ONLY send computed metrics to the LLM, never
 * raw events. This keeps the prompt small, costs low, and prevents
 * hallucination — the AI can only reason about real numbers.
 */
export async function explainAnomaly(
  projectId: string
): Promise<AnomalyExplanation> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Compute metrics for both windows in parallel
  const [currentStats, previousStats, currentRoutes, previousRoutes] =
    await Promise.all([
      getDashboardStats(projectId, oneHourAgo, now),
      getDashboardStats(projectId, twoHoursAgo, oneHourAgo),
      getRouteBreakdown(projectId, oneHourAgo, now),
      getRouteBreakdown(projectId, twoHoursAgo, oneHourAgo),
    ]);

  // Build a structured metrics context — this is ALL the LLM sees
  const metricsContext = {
    current: {
      window: "last 60 minutes",
      ...currentStats,
      routes: currentRoutes,
    },
    previous: {
      window: "60-120 minutes ago",
      ...previousStats,
      routes: previousRoutes,
    },
    changes: {
      requestCountDelta: currentStats.totalRequests - previousStats.totalRequests,
      requestCountPctChange: previousStats.totalRequests > 0
        ? ((currentStats.totalRequests - previousStats.totalRequests) / previousStats.totalRequests * 100).toFixed(1) + "%"
        : "N/A (no previous data)",
      avgLatencyDelta: currentStats.avgLatency - previousStats.avgLatency,
      p95LatencyDelta: currentStats.p95Latency - previousStats.p95Latency,
      errorRateDelta: Number((currentStats.errorRate - previousStats.errorRate).toFixed(4)),
    },
  };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an API observability assistant. Analyze these metrics and explain what changed.

METRICS DATA (this is the ONLY source of truth — do not invent data):
${JSON.stringify(metricsContext, null, 2)}

Respond in this exact JSON format, with no other text:
{
  "summary": "A 1-2 sentence plain-English summary of the most important change.",
  "changes": ["Change 1 with specific numbers", "Change 2 with specific numbers"],
  "likelyCauses": ["Possible cause 1", "Possible cause 2"],
  "recommendedChecks": ["Check 1", "Check 2"]
}

Rules:
- Reference specific numbers from the metrics (e.g., "error rate increased from 0.8% to 3.2%")
- Keep likely causes grounded — suggest realistic API issues, not speculative
- Limit to 3-5 items per array
- If nothing significant changed, say so clearly`,
      },
    ],
  });

  // Extract the text response and parse JSON
  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Handle case where model wraps JSON in markdown code blocks
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(jsonStr) as AnomalyExplanation;
  } catch {
    // Fallback if LLM doesn't return valid JSON
    return {
      summary: text,
      changes: [],
      likelyCauses: [],
      recommendedChecks: [],
    };
  }
}
