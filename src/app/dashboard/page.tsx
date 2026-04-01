import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  // Redirect to the first project's dashboard
  const project = await prisma.project.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No projects found. Run the seed script first.</p>
      </div>
    );
  }

  redirect(`/dashboard/${project.id}`);
}
