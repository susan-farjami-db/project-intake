import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IntakeTypeBadge, StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import {
  useGetCatalog,
  useGetProject,
  useUpdateProject,
  type CatalogOut,
  type ProjectOut,
  type ProjectUpdate,
} from "@/lib/api";
import selector from "@/lib/selector";

export const Route = createFileRoute("/_sidebar/projects/$projectId")({
  component: () => <ProjectDetailPage />,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const catalog = useGetCatalog(selector<CatalogOut>());
  const queryClient = useQueryClient();
  const projectQuery = useGetProject({
    params: { project_id: projectId },
    ...selector<ProjectOut>(),
  });
  const project = projectQuery.data;
  const [draft, setDraft] = useState<ProjectUpdate>({});
  const update = useUpdateProject({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects/{project_id}"] });
        toast.success(`Saved ${result.data.id}`);
      },
    },
  });
  useEffect(() => {
    if (!project) return;
    setDraft({
      request_title: project.request_title,
      business_dept: project.business_dept,
      requestor: project.requestor,
      current_process: project.current_process,
      problem_statement: project.problem_statement,
      estimated_user_population: project.estimated_user_population,
      expected_benefit: project.expected_benefit,
      solution_summary: project.solution_summary,
      solution_type: project.solution_type,
      systems_data_involved: project.systems_data_involved,
      notes: project.notes,
      links: project.links,
      readiness_score: project.readiness_score,
      strategic_alignment: project.strategic_alignment,
      effort_estimate: project.effort_estimate,
      sensitive_data: project.sensitive_data,
      executive_sponsor: project.executive_sponsor,
      desired_timeframe: project.desired_timeframe,
      status: project.status,
    });
  }, [project]);

  if (projectQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!project) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-medium">Request not found</h1>
        <Button variant="outline" asChild>
          <Link to="/portfolio">Back to requests</Link>
        </Button>
      </div>
    );
  }

  function updateField<K extends keyof ProjectUpdate>(key: K, value: ProjectUpdate[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    await update.mutateAsync({
      params: { project_id: projectId },
      data: { ...draft, reclassify: true },
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          to="/portfolio"
          className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
        >
          Back to Requests
        </Link>
        <p className="font-mono text-xs text-muted-foreground">{project.id}</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <IntakeTypeBadge intakeType={project.intake_type} source={project.intake_type_source} />
        </div>
        <h1 className="text-3xl font-medium tracking-tight">{project.request_title}</h1>
      </div>

      <form onSubmit={onSave} className="max-w-3xl space-y-6">
          <Field label="Request Title" htmlFor="request_title">
            <Input
              id="request_title"
              value={draft.request_title ?? ""}
              onChange={(event) => updateField("request_title", event.target.value)}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business Unit" htmlFor="business_dept">
              <Input
                id="business_dept"
                value={draft.business_dept ?? ""}
                onChange={(event) => updateField("business_dept", event.target.value)}
              />
            </Field>
            <Field label="Requestor" htmlFor="requestor">
              <Input
                id="requestor"
                value={draft.requestor ?? ""}
                onChange={(event) => updateField("requestor", event.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <SelectField
                id="status"
                value={draft.status ?? project.status}
                onChange={(event) => updateField("status", event.target.value as ProjectOut["status"])}
              >
                {(catalog.data?.statuses ?? ["New"]).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field label="Solution Type" htmlFor="solution_type">
              <SelectField
                id="solution_type"
                value={draft.solution_type ?? ""}
                onChange={(event) => updateField("solution_type", event.target.value)}
              >
                {(catalog.data?.solution_types ?? []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field label="Sensitive Data? (Y/N)" htmlFor="sensitive_data">
              <SelectField
                id="sensitive_data"
                value={draft.sensitive_data ?? "N"}
                onChange={(event) => updateField("sensitive_data", event.target.value as ProjectOut["sensitive_data"])}
              >
                <option value="N">N</option>
                <option value="Y">Y</option>
              </SelectField>
            </Field>
          </div>
          <Field label="Opportunity / As Is Process" htmlFor="current_process">
            <Textarea
              id="current_process"
              value={draft.current_process ?? ""}
              onChange={(event) => updateField("current_process", event.target.value)}
            />
          </Field>
          <Field label="Problem Statement" htmlFor="problem_statement">
            <Textarea
              id="problem_statement"
              value={draft.problem_statement ?? ""}
              onChange={(event) => updateField("problem_statement", event.target.value)}
            />
          </Field>
          <Field label="Est. User Population" htmlFor="estimated_user_population">
            <Input
              id="estimated_user_population"
              value={draft.estimated_user_population ?? ""}
              onChange={(event) => updateField("estimated_user_population", event.target.value)}
            />
          </Field>
          <Field label="Expected Benefit" htmlFor="expected_benefit">
            <Textarea
              id="expected_benefit"
              value={draft.expected_benefit ?? ""}
              onChange={(event) => updateField("expected_benefit", event.target.value)}
            />
          </Field>
          <Field label="Solution Summary" htmlFor="solution_summary">
            <Textarea
              id="solution_summary"
              value={draft.solution_summary ?? ""}
              onChange={(event) => updateField("solution_summary", event.target.value)}
            />
          </Field>
          <Field label="Systems / Data Involved" htmlFor="systems_data_involved">
            <Textarea
              id="systems_data_involved"
              value={draft.systems_data_involved ?? ""}
              onChange={(event) => updateField("systems_data_involved", event.target.value)}
            />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              value={draft.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </Field>
          <Field label="Links" htmlFor="links">
            <Textarea
              id="links"
              value={draft.links ?? ""}
              onChange={(event) => updateField("links", event.target.value)}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Readiness Score" htmlFor="readiness_score">
              <Input
                id="readiness_score"
                value={draft.readiness_score ?? ""}
                onChange={(event) => updateField("readiness_score", event.target.value)}
              />
            </Field>
            <Field label="Strategic Alignment" htmlFor="strategic_alignment">
              <SelectField
                id="strategic_alignment"
                value={draft.strategic_alignment ?? ""}
                onChange={(event) =>
                  updateField(
                    "strategic_alignment",
                    event.target.value as ProjectOut["strategic_alignment"],
                  )
                }
                placeholder="Select alignment"
              >
                {(catalog.data?.strategic_alignments ?? ["Strategic Initiative", "Annual Goal"]).map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </SelectField>
            </Field>
            <Field label="Effort Estimate" htmlFor="effort_estimate">
              <SelectField
                id="effort_estimate"
                value={draft.effort_estimate ?? ""}
                onChange={(event) =>
                  updateField("effort_estimate", event.target.value as ProjectOut["effort_estimate"])
                }
                placeholder="Select effort"
              >
                {(catalog.data?.effort_estimates ?? ["S", "M", "L"]).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field label="Executive Sponsor" htmlFor="executive_sponsor">
              <Input
                id="executive_sponsor"
                value={draft.executive_sponsor ?? ""}
                onChange={(event) => updateField("executive_sponsor", event.target.value)}
              />
            </Field>
            <Field label="Desired Timeframe and Why" htmlFor="desired_timeframe">
              <Textarea
                id="desired_timeframe"
                value={draft.desired_timeframe ?? ""}
                onChange={(event) => updateField("desired_timeframe", event.target.value)}
              />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground">
            Saving re-runs Intake Type classification from the updated narrative.
          </p>
          <div className="flex gap-3">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/portfolio">Back to List</Link>
            </Button>
          </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
