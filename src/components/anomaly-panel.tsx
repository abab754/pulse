"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnomalyExplanation } from "@/types";

export function AnomalyPanel({ projectId }: { projectId: string }) {
  const [explanation, setExplanation] = useState<AnomalyExplanation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  async function handleExplain() {
    if (cooldown) return;
    setLoading(true);
    // 60-second cooldown between clicks
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60_000);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to explain");
      }
      const data: AnomalyExplanation = await res.json();
      setExplanation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          AI Anomaly Explanation
        </CardTitle>
        <Button
          onClick={handleExplain}
          disabled={loading || cooldown}
          size="sm"
          variant="outline"
        >
          {loading ? "Analyzing..." : cooldown ? "Wait 60s..." : "Explain Last 60 Min"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!explanation && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Click the button to analyze recent metrics and identify anomalies.
          </p>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        )}

        {explanation && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <p className="text-sm font-medium">{explanation.summary}</p>
            </div>

            {/* Changes */}
            {explanation.changes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  What Changed
                </h4>
                <ul className="text-sm space-y-1">
                  {explanation.changes.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-500 shrink-0">*</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Likely Causes */}
            {explanation.likelyCauses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Likely Causes
                </h4>
                <ul className="text-sm space-y-1">
                  {explanation.likelyCauses.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500 shrink-0">?</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Checks */}
            {explanation.recommendedChecks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Recommended Checks
                </h4>
                <ul className="text-sm space-y-1">
                  {explanation.recommendedChecks.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-500 shrink-0">→</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
