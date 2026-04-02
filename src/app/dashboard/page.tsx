import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const session = await auth();

  // Redirect to the user's first project
  const project = await prisma.project.findFirst({
    where: { userId: session?.user?.id },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Welcome to Pulse</h2>
        <p className="text-muted-foreground">
          Create your first project to start monitoring your API.
        </p>
        <Link href="/dashboard/new">
          <Button size="lg">Create Project</Button>
        </Link>
      </div>
    );
  }

  redirect(`/dashboard/${project.id}`);
}
