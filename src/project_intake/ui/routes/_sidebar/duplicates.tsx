import { createFileRoute, Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useListDuplicateClusters, type DuplicateClusterOut } from "@/lib/api";
import selector from "@/lib/selector";

export const Route = createFileRoute("/_sidebar/duplicates")({
  component: () => <DuplicatesPage />,
});

function DuplicatesPage() {
  const clusters = useListDuplicateClusters(selector<DuplicateClusterOut[]>());

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Duplicate review</h1>
        <p className="max-w-prose text-muted-foreground">
          Groups in the sample catalog that already look like the same body of work.
          Use this in a review session to confirm the matching rules.
        </p>
      </div>

      {clusters.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : null}

      {clusters.data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No likely duplicate groups in the catalog.</p>
      ) : null}

      <div className="space-y-6">
        {clusters.data?.map((cluster) => (
          <section key={cluster.id} className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{cluster.label}</h2>
              <p className="font-mono text-sm tabular-nums">Match {cluster.score}</p>
            </div>
            <ul className="space-y-3">
              {cluster.projects.map((project) => (
                <li key={project.id} className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="hover:underline underline-offset-4"
                  >
                    {project.request_title}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">{project.id}</span>
                    <StatusBadge status={project.status} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
