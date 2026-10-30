import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBar, StatusBadge } from "@/components/status-badge";
import type { DuplicateMatchOut } from "@/lib/api";

export function DuplicateCard({ match }: { match: DuplicateMatchOut }) {
  const { project, score, band, reasons } = match;
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <ScoreBar score={score} band={band} />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="font-medium hover:underline underline-offset-4"
            >
              {project.request_title}
            </Link>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground max-w-prose">{project.problem_statement}</p>
          <p className="text-xs text-muted-foreground">
            {project.id} · {project.business_dept} · {project.solution_type}
          </p>
        </div>
        {reasons.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
