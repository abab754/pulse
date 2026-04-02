"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await res.json();
      setApiKey(project.apiKey);
      setProjectId(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Create a New Project</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each project gets its own API key and dashboard.
          </p>
        </CardHeader>
        <CardContent>
          {!apiKey ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My SaaS API"
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                  Project created! Save your API key now — you won&apos;t see it again.
                </p>
                <code className="block text-sm font-mono bg-white dark:bg-zinc-900 rounded px-3 py-2 select-all break-all">
                  {apiKey}
                </code>
              </div>

              <div className="rounded-md border p-4">
                <p className="text-sm font-medium mb-2">Quick Integration</p>
                <pre className="text-xs font-mono bg-zinc-950 text-zinc-100 rounded p-3 overflow-x-auto">
{`// Add to your API middleware
await fetch("${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/events", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    route: req.path,
    method: req.method,
    statusCode: res.statusCode,
    latencyMs: Date.now() - start,
  }),
});`}
                </pre>
              </div>

              <Button
                onClick={() => router.push(`/dashboard/${projectId}`)}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
