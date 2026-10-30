import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IntakeTypeBadge } from "@/components/status-badge";
import {
  useGetCatalog,
  useListProjects,
  useUpdateProject,
  type CatalogOut,
  type ProjectListOut,
  type ProjectOut,
  type ProjectUpdate,
} from "@/lib/api";
import selector from "@/lib/selector";

export const Route = createFileRoute("/_sidebar/portfolio")({
  component: () => <PortfolioPage />,
});

const HEADERS = [
  "ID",
  "Business Unit",
  "Status",
  "Opportunity / As Is Process",
  "Request Title",
  "Problem Statement",
  "Est. User Population",
  "Expected Benefit",
  "Solution Summary",
  "Solution Type",
  "Intake Type",
  "Systems / Data Involved",
  "Notes",
  "Links",
  "Readiness Score",
  "Strategic Alignment",
  "Effort Estimate",
  "Requestor",
  "Sensitive Data? (Y/N)",
  "Executive Sponsor",
  "Desired Timeframe and Why",
  "",
] as const;

function PortfolioPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [intakeType, setIntakeType] = useState("");
  const catalog = useGetCatalog(selector<CatalogOut>());
  const list = useListProjects({
    params: {
      q,
      status: status || null,
      intake_type: intakeType || null,
    },
    query: {
      ...selector<ProjectListOut>().query,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Portfolio
          </p>
          <h1 className="text-3xl font-medium tracking-tight">Requests</h1>
          <p className="max-w-prose text-muted-foreground">
            Review submitted requests and edit free-form fields inline. Intake
            Type is classified and is not edited here.
          </p>
        </div>
        <Button asChild>
          <Link to="/intake">New Request</Link>
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-3">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search Title, Dept, Requestor"
          aria-label="Search Requests"
        />
        <SelectField
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          placeholder="All Statuses"
          aria-label="Status"
        >
          {(catalog.data?.statuses ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField
          value={intakeType}
          onChange={(event) => setIntakeType(event.target.value)}
          placeholder="All Intake Types"
          aria-label="Intake Type"
        >
          {(catalog.data?.intake_types ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <div className="text-2xl font-medium tabular-nums">{list.data?.total ?? "—"}</div>
          <div className="text-muted-foreground">Matching Requests</div>
        </div>
      </div>

      {list.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {list.isError ? (
        <p className="text-sm text-destructive">Could not load requests. Start the API and retry.</p>
      ) : null}

      {list.data && list.data.items.length === 0 ? (
        <div className="rounded-xl border bg-card p-8">
          <h2 className="text-lg font-medium">No Matching Requests</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Clear filters or file a new request.
          </p>
        </div>
      ) : null}

      {list.data && list.data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[120rem] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b bg-muted text-xs uppercase tracking-wide text-foreground">
              <tr>
                {HEADERS.map((header) => (
                  <th
                    key={header || "actions"}
                    className={
                      header
                        ? "whitespace-nowrap px-4 py-3 font-medium"
                        : "sticky right-0 whitespace-nowrap bg-muted px-4 py-3 font-medium"
                    }
                  >
                    {header || "Save"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.items.map((project) => (
                <EditableRow key={project.id} project={project} catalog={catalog.data} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

type RowDraft = {
  business_dept: string;
  status: ProjectOut["status"];
  current_process: string;
  request_title: string;
  problem_statement: string;
  estimated_user_population: string;
  expected_benefit: string;
  solution_summary: string;
  solution_type: string;
  systems_data_involved: string;
  notes: string;
  links: string;
  readiness_score: string;
  strategic_alignment: NonNullable<ProjectOut["strategic_alignment"]>;
  effort_estimate: NonNullable<ProjectOut["effort_estimate"]>;
  requestor: string;
  sensitive_data: ProjectOut["sensitive_data"];
  executive_sponsor: string;
  desired_timeframe: string;
};

function draftFromProject(project: ProjectOut): RowDraft {
  return {
    business_dept: project.business_dept ?? "",
    status: project.status,
    current_process: project.current_process ?? "",
    request_title: project.request_title ?? "",
    problem_statement: project.problem_statement ?? "",
    estimated_user_population: project.estimated_user_population ?? "",
    expected_benefit: project.expected_benefit ?? "",
    solution_summary: project.solution_summary ?? "",
    solution_type: project.solution_type ?? "",
    systems_data_involved: project.systems_data_involved ?? "",
    notes: project.notes ?? "",
    links: project.links ?? "",
    readiness_score: project.readiness_score ?? "",
    strategic_alignment: project.strategic_alignment ?? "",
    effort_estimate: project.effort_estimate ?? "",
    requestor: project.requestor ?? "",
    sensitive_data: project.sensitive_data,
    executive_sponsor: project.executive_sponsor ?? "",
    desired_timeframe: project.desired_timeframe ?? "",
  };
}

function EditableText({
  value,
  onChange,
  ariaLabel,
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  multiline?: boolean;
}) {
  const className = "min-w-[14rem] bg-background";
  if (multiline) {
    return (
      <td className="px-3 py-2 align-top">
        <Textarea
          aria-label={ariaLabel}
          className={`${className} min-h-20`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </td>
    );
  }
  return (
    <td className="px-3 py-2 align-top">
      <Input
        aria-label={ariaLabel}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </td>
  );
}

function EditableRow({
  project,
  catalog,
}: {
  project: ProjectOut;
  catalog?: CatalogOut;
}) {
  const queryClient = useQueryClient();
  const serverDraft = draftFromProject(project);
  const serverKey = JSON.stringify(serverDraft);
  const [draft, setDraft] = useState<RowDraft>(serverDraft);
  const update = useUpdateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        toast.success(`Updated ${project.id}`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Could not update this request.");
      },
    },
  });

  useEffect(() => {
    setDraft(JSON.parse(serverKey) as RowDraft);
  }, [serverKey]);

  function setField<K extends keyof RowDraft>(key: K, value: RowDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const dirty = JSON.stringify(draft) !== serverKey;
  const solutionTypes = catalog?.solution_types?.length
    ? catalog.solution_types
    : [draft.solution_type].filter(Boolean);

  function onSave() {
    if (!draft.request_title.trim() || !draft.requestor.trim()) {
      toast.error("Request Title and Requestor are required.");
      return;
    }
    const narrativeChanged =
      draft.request_title !== project.request_title ||
      draft.problem_statement !== project.problem_statement ||
      draft.solution_summary !== project.solution_summary ||
      draft.solution_type !== project.solution_type ||
      draft.systems_data_involved !== project.systems_data_involved;
    const data: ProjectUpdate = {
      ...draft,
      reclassify: narrativeChanged,
    };
    update.mutate({ params: { project_id: project.id }, data });
  }

  return (
    <tr className="align-top transition-colors duration-150 hover:bg-muted/40">
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{project.id}</td>
      <EditableText
        ariaLabel={`Business Unit for ${project.id}`}
        value={draft.business_dept}
        onChange={(value) => setField("business_dept", value)}
      />
      <td className="px-3 py-2">
        <SelectField
          aria-label={`Status for ${project.id}`}
          className="min-w-[12rem] bg-background"
          value={draft.status}
          onChange={(event) => setField("status", event.target.value as ProjectOut["status"])}
        >
          <option value="New">New</option>
          <option value="Initial review completed">Initial review completed</option>
          <option value="Ready for prioritization">Ready for prioritization</option>
          <option value="Prioritized">Prioritized</option>
          <option value="Moved to active mission">Moved to active mission</option>
        </SelectField>
      </td>
      <EditableText
        multiline
        ariaLabel={`Opportunity / As Is Process for ${project.id}`}
        value={draft.current_process}
        onChange={(value) => setField("current_process", value)}
      />
      <EditableText
        ariaLabel={`Request Title for ${project.id}`}
        value={draft.request_title}
        onChange={(value) => setField("request_title", value)}
      />
      <EditableText
        multiline
        ariaLabel={`Problem Statement for ${project.id}`}
        value={draft.problem_statement}
        onChange={(value) => setField("problem_statement", value)}
      />
      <EditableText
        ariaLabel={`Est. User Population for ${project.id}`}
        value={draft.estimated_user_population}
        onChange={(value) => setField("estimated_user_population", value)}
      />
      <EditableText
        multiline
        ariaLabel={`Expected Benefit for ${project.id}`}
        value={draft.expected_benefit}
        onChange={(value) => setField("expected_benefit", value)}
      />
      <EditableText
        multiline
        ariaLabel={`Solution Summary for ${project.id}`}
        value={draft.solution_summary}
        onChange={(value) => setField("solution_summary", value)}
      />
      <td className="px-3 py-2">
        <SelectField
          aria-label={`Solution Type for ${project.id}`}
          className="min-w-[14rem] bg-background"
          value={draft.solution_type}
          onChange={(event) => setField("solution_type", event.target.value)}
        >
          {solutionTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </td>
      <td className="px-4 py-3">
        <IntakeTypeBadge intakeType={project.intake_type} source={project.intake_type_source} />
      </td>
      <EditableText
        multiline
        ariaLabel={`Systems / Data Involved for ${project.id}`}
        value={draft.systems_data_involved}
        onChange={(value) => setField("systems_data_involved", value)}
      />
      <EditableText
        multiline
        ariaLabel={`Notes for ${project.id}`}
        value={draft.notes}
        onChange={(value) => setField("notes", value)}
      />
      <EditableText
        multiline
        ariaLabel={`Links for ${project.id}`}
        value={draft.links}
        onChange={(value) => setField("links", value)}
      />
      <EditableText
        ariaLabel={`Readiness Score for ${project.id}`}
        value={draft.readiness_score}
        onChange={(value) => setField("readiness_score", value)}
      />
      <td className="px-3 py-2">
        <SelectField
          aria-label={`Strategic Alignment for ${project.id}`}
          className="min-w-[12rem] bg-background"
          value={draft.strategic_alignment}
          onChange={(event) =>
            setField("strategic_alignment", event.target.value as RowDraft["strategic_alignment"])
          }
          placeholder="Select Alignment"
        >
          {(catalog?.strategic_alignments ?? ["Strategic Initiative", "Annual Goal"]).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </td>
      <td className="px-3 py-2">
        <SelectField
          aria-label={`Effort Estimate for ${project.id}`}
          className="min-w-[6rem] bg-background"
          value={draft.effort_estimate}
          onChange={(event) =>
            setField("effort_estimate", event.target.value as RowDraft["effort_estimate"])
          }
          placeholder="Select Effort"
        >
          {(catalog?.effort_estimates ?? ["S", "M", "L"]).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </td>
      <EditableText
        ariaLabel={`Requestor for ${project.id}`}
        value={draft.requestor}
        onChange={(value) => setField("requestor", value)}
      />
      <td className="px-3 py-2">
        <SelectField
          aria-label={`Sensitive Data for ${project.id}`}
          className="min-w-[5rem] bg-background"
          value={draft.sensitive_data}
          onChange={(event) =>
            setField("sensitive_data", event.target.value as RowDraft["sensitive_data"])
          }
        >
          <option value="N">N</option>
          <option value="Y">Y</option>
        </SelectField>
      </td>
      <EditableText
        ariaLabel={`Executive Sponsor for ${project.id}`}
        value={draft.executive_sponsor}
        onChange={(value) => setField("executive_sponsor", value)}
      />
      <EditableText
        multiline
        ariaLabel={`Desired Timeframe and Why for ${project.id}`}
        value={draft.desired_timeframe}
        onChange={(value) => setField("desired_timeframe", value)}
      />
      <td className="sticky right-0 bg-card px-4 py-3 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-2">
          <Button size="sm" disabled={!dirty || update.isPending} onClick={onSave}>
            {update.isPending ? "Saving…" : "Update"}
          </Button>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="text-xs font-medium hover:underline underline-offset-4"
          >
            Open
          </Link>
        </div>
      </td>
    </tr>
  );
}
