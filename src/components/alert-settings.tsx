"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AlertConfig = {
  slackWebhookUrl: string | null;
  p95LatencyThreshold: number;
  errorRateThreshold: number;
  enabled: boolean;
};

export function AlertSettings({ projectId }: { projectId: string }) {
  const [config, setConfig] = useState<AlertConfig>({
    slackWebhookUrl: "",
    p95LatencyThreshold: 1000,
    errorRateThreshold: 0.05,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/alerts?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) setConfig(data);
      });
  }, [projectId]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...config }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Saved!");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Alert Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Slack Webhook URL
            </label>
            <input
              type="url"
              value={config.slackWebhookUrl || ""}
              onChange={(e) =>
                setConfig({ ...config, slackWebhookUrl: e.target.value })
              }
              placeholder="https://hooks.slack.com/services/..."
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">
                P95 Latency Threshold (ms)
              </label>
              <input
                type="number"
                value={config.p95LatencyThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    p95LatencyThreshold: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                Error Rate Threshold (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={Number((config.errorRateThreshold * 100).toFixed(1))}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    errorRateThreshold: Number(e.target.value) / 100,
                  })
                }
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) =>
                  setConfig({ ...config, enabled: e.target.checked })
                }
                className="rounded"
              />
              Alerts enabled
            </label>

            <div className="flex items-center gap-2">
              {message && (
                <span className="text-xs text-muted-foreground">{message}</span>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                variant="outline"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
