import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No projects found. Create one to get started.</p>
      </div>
    );
  }

  redirect(`/dashboard/${project.id}`);
}
