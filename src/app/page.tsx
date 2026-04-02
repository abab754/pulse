import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Pulse</h1>
          <Link href={isLoggedIn ? "/dashboard" : "/login"}>
            <Button size="sm">
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-6">
          <div className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            API Observability for Indie Developers
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Know when your API
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">
              breaks before your users do
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Lightweight monitoring for small teams. Send events, track latency
            and errors, get AI-powered anomaly explanations, and Slack alerts —
            all in under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={isLoggedIn ? "/dashboard" : "/login"}>
              <Button size="lg" className="px-8">
                {isLoggedIn ? "Go to Dashboard" : "Get Started"}
              </Button>
            </Link>
            <Link href="#quickstart">
              <Button size="lg" variant="outline" className="px-8">
                Quickstart Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div
          id="quickstart"
          className="max-w-4xl w-full mt-20 mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              title: "5-Min Setup",
              desc: "Add 3 lines to your API. No agents, no sidecars, no YAML.",
            },
            {
              title: "Real-Time Dashboard",
              desc: "Request volume, avg/p95 latency, error rates — all live.",
            },
            {
              title: "AI Explanations",
              desc: "One-click anomaly analysis grounded in real metrics, not guesses.",
            },
            {
              title: "Slack Alerts",
              desc: "Get notified when p95 latency or error rate crosses your threshold.",
            },
            {
              title: "Route-Level Breakdown",
              desc: "See which endpoints are slow, erroring, or getting hammered.",
            },
            {
              title: "Deploy Anywhere",
              desc: "Works with any backend — Express, FastAPI, Rails, Go, whatever.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border bg-card p-5 space-y-2"
            >
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Integration Example */}
        <div className="max-w-2xl w-full mb-20">
          <h3 className="text-lg font-semibold mb-3 text-center">
            Add to your API in seconds
          </h3>
          <div className="rounded-lg border bg-zinc-950 text-zinc-100 p-6 text-sm font-mono overflow-x-auto">
            <pre>{`// In your API middleware or request handler
await fetch("https://your-pulse.vercel.app/api/v1/events", {
  method: "POST",
  headers: {
    "Authorization": "Bearer pls_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    route: req.path,
    method: req.method,
    statusCode: res.statusCode,
    latencyMs: Date.now() - start,
  }),
});`}</pre>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Next.js, Prisma, and Claude.
        </div>
      </footer>
    </div>
  );
}
