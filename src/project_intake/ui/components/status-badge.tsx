import { Badge } from "@/components/ui/badge";
import type { ProjectOut, ProjectStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

type IntakeType = ProjectOut["intake_type"];

const statusClass: Record<ProjectStatus, string> = {
  New: "bg-[var(--db-oat-medium)] text-[var(--db-navy-900)] border-transparent",
  "Initial review completed":
    "border-transparent bg-[color-mix(in_srgb,var(--db-info)_12%,white)] text-[var(--db-info)]",
  "Ready for prioritization":
    "border-transparent bg-[color-mix(in_srgb,var(--db-teal)_12%,white)] text-[var(--db-teal)]",
  Prioritized:
    "border-transparent bg-[color-mix(in_srgb,var(--db-success)_12%,white)] text-[var(--db-success)]",
  "Moved to active mission": "bg-secondary text-secondary-foreground border-transparent",
};

const intakeClass: Record<IntakeType, string> = {
  AI: "border-transparent bg-[color-mix(in_srgb,var(--db-info)_14%,white)] text-[var(--db-info)]",
  Data: "border-transparent bg-[color-mix(in_srgb,var(--db-teal)_14%,white)] text-[var(--db-teal)]",
  Analytics:
    "border-transparent bg-[color-mix(in_srgb,var(--db-success)_14%,white)] text-[var(--db-success)]",
  Other: "bg-[var(--db-oat-medium)] text-[var(--db-navy-900)] border-transparent",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusClass[status])}>
      {status}
    </Badge>
  );
}

export function IntakeTypeBadge({
  intakeType,
  source,
}: {
  intakeType: IntakeType;
  source?: ProjectOut["intake_type_source"];
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", intakeClass[intakeType])}>
      {intakeType}
      {source === "heuristic" ? (
        <span className="ml-1 font-normal text-[0.65rem] uppercase tracking-wide opacity-70">
          suggested
        </span>
      ) : null}
      {source === "ai_classify" ? (
        <span className="ml-1 font-normal text-[0.65rem] uppercase tracking-wide opacity-70">
          ai_classify
        </span>
      ) : null}
    </Badge>
  );
}

export function ScoreBar({ score, band }: { score: number; band: "likely" | "possible" }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {band === "likely" ? "Likely duplicate" : "Possible overlap"}
        </span>
        <span className="font-mono text-sm tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--db-oat-medium)]">
        <div
          className={cn(
            "h-1.5 rounded-full",
            band === "likely" ? "bg-[var(--db-accent)]" : "bg-[var(--db-info)]",
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
