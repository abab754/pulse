# Pulse — API Observability for Indie Developers

Lightweight API monitoring for small teams. Send telemetry events from any backend, view real-time dashboards, get AI-powered anomaly explanations, and receive Slack alerts when things break.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-teal) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## Features

- **Real-Time Dashboard** — Total requests, avg/p95 latency, error rate, time-series charts
- **Event Ingestion API** — `POST /api/v1/events` with API key auth, Zod validation, batch support
- **AI Anomaly Explanation** — Compares last 60 min vs previous 60 min, sends structured metrics to Claude for grounded analysis
- **Slack Alerts** — Configurable thresholds for p95 latency and error rate, fires on ingestion
- **Route-Level Breakdown** — See which endpoints are slow, erroring, or getting hammered

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Validation | Zod |
| AI | Claude (Anthropic SDK) |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- An [Anthropic API key](https://console.anthropic.com) (for AI anomaly feature)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/abab754/pulse.git
cd pulse
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY

# 3. Run migrations
pnpm dlx prisma migrate dev

# 4. Seed demo data
pnpm seed

# 5. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page, or go directly to the dashboard.

### Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables: `DATABASE_URL`, `ANTHROPIC_API_KEY`
4. Deploy — Vercel auto-detects Next.js

## API Reference

### Ingest Events

```
POST /api/v1/events
Authorization: Bearer pls_your_api_key
Content-Type: application/json
```

**Single event:**
```json
{
  "timestamp": "2026-04-01T12:00:00Z",
  "route": "/api/checkout",
  "method": "POST",
  "statusCode": 200,
  "latencyMs": 142,
  "environment": "production"
}
```

**Batch (up to 100):**
```json
[
  { "timestamp": "...", "route": "/api/users", "method": "GET", "statusCode": 200, "latencyMs": 45 },
  { "timestamp": "...", "route": "/api/orders", "method": "POST", "statusCode": 500, "latencyMs": 1200 }
]
```

**Response:** `{ "accepted": 2 }` (HTTP 202)

### Integration Example

```typescript
// Express middleware example
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    fetch("https://your-pulse.vercel.app/api/v1/events", {
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
    }).catch(() => {}); // Fire and forget
  });
  next();
});
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/[projectId]/      # Dashboard (server component)
│   └── api/
│       ├── v1/events/              # Event ingestion
│       ├── metrics/                # Dashboard metrics
│       ├── explain/                # AI anomaly explanation
│       └── alerts/                 # Alert configuration
├── components/                     # React components
├── lib/
│   ├── prisma.ts                   # Database client
│   ├── metrics.ts                  # Metric computations
│   ├── anomaly.ts                  # AI analysis logic
│   ├── alerts.ts                   # Slack webhook logic
│   └── api-key.ts                  # API key utils
└── types/                          # Shared TypeScript types
```

## License

MIT
