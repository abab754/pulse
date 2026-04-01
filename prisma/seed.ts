import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { randomBytes } from "crypto";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// --- Configuration ---
const ROUTES = [
  { route: "/api/users", methods: ["GET", "POST"] },
  { route: "/api/orders", methods: ["GET", "POST"] },
  { route: "/api/products", methods: ["GET"] },
  { route: "/api/checkout", methods: ["POST"] },
  { route: "/api/auth/login", methods: ["POST"] },
  { route: "/api/search", methods: ["GET"] },
  { route: "/api/webhooks", methods: ["POST"] },
  { route: "/health", methods: ["GET"] },
];

const STATUS_CODES = {
  healthy: [200, 200, 200, 200, 200, 201, 204, 301],
  degraded: [200, 200, 200, 500, 500, 503, 429, 408],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomLatency(base: number, spike: boolean): number {
  const jitter = Math.random() * base * 0.5;
  const spikeMultiplier = spike ? 3 + Math.random() * 5 : 1;
  return Math.round((base + jitter) * spikeMultiplier);
}

async function main() {
  console.log("Seeding database...\n");

  // 1. Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@pulse.dev" },
    update: {},
    create: {
      email: "demo@pulse.dev",
      name: "Demo User",
    },
  });
  console.log(`User: ${user.name} (${user.id})`);

  // 2. Create demo project
  const apiKey = `pls_${randomBytes(16).toString("hex")}`;
  const project = await prisma.project.upsert({
    where: { id: "demo-project" },
    update: {},
    create: {
      id: "demo-project",
      name: "Acme API",
      apiKey,
      userId: user.id,
    },
  });
  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`API Key: ${project.apiKey}\n`);

  // 3. Create alert config
  await prisma.alertConfig.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      p95LatencyThreshold: 1000,
      errorRateThreshold: 0.05,
      enabled: true,
    },
  });

  // 4. Delete existing events for clean seed
  const deleted = await prisma.event.deleteMany({
    where: { projectId: project.id },
  });
  console.log(`Cleared ${deleted.count} existing events`);

  // 5. Generate 48 hours of telemetry data
  //    - First 47 hours: healthy baseline
  //    - Last hour: degraded (so "Explain anomaly" has something to find)
  const now = new Date();
  const events: Array<{
    projectId: string;
    timestamp: Date;
    route: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    environment: string;
  }> = [];

  const TOTAL_HOURS = 48;
  const EVENTS_PER_HOUR_BASE = 60; // ~1/min baseline

  for (let hoursAgo = TOTAL_HOURS; hoursAgo >= 0; hoursAgo--) {
    const isDegraded = hoursAgo === 0; // last hour = anomaly
    const eventsThisHour = isDegraded
      ? EVENTS_PER_HOUR_BASE * 2.5 // traffic spike
      : EVENTS_PER_HOUR_BASE + Math.floor(Math.random() * 20 - 10);

    for (let i = 0; i < eventsThisHour; i++) {
      const { route, methods } = pick(ROUTES);
      const method = pick(methods);
      const statusPool = isDegraded ? STATUS_CODES.degraded : STATUS_CODES.healthy;
      const statusCode = pick(statusPool);

      // Base latency varies by route
      const baseLatency =
        route === "/api/checkout"
          ? 200
          : route === "/api/search"
            ? 150
            : route === "/health"
              ? 10
              : 50;

      const timestamp = new Date(
        now.getTime() - hoursAgo * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000
      );

      events.push({
        projectId: project.id,
        timestamp,
        route,
        method,
        statusCode,
        latencyMs: randomLatency(baseLatency, isDegraded && route === "/api/checkout"),
        environment: "production",
      });
    }
  }

  // Batch insert for speed
  const BATCH_SIZE = 500;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    await prisma.event.createMany({ data: batch });
    process.stdout.write(`\rInserted ${Math.min(i + BATCH_SIZE, events.length)}/${events.length} events`);
  }

  console.log(`\n\nSeed complete!`);
  console.log(`  Total events: ${events.length}`);
  console.log(`  Time range: last ${TOTAL_HOURS} hours`);
  console.log(`  Anomaly window: last 1 hour (traffic spike + errors on /api/checkout)`);
  console.log(`\nDashboard: http://localhost:3000/dashboard/${project.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
