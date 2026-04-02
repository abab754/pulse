"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
};

export function ProjectSwitcher({
  projects,
  currentProjectId,
}: {
  projects: Project[];
  currentProjectId: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentProjectId}
        onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
        className="text-sm font-medium bg-transparent border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Link
        href="/dashboard/new"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Create new project"
      >
        + New
      </Link>
    </div>
  );
}
