import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import {
  ApiError,
  useCreateProject,
  useGetCatalog,
  type CatalogOut,
  type ProjectIn,
} from "@/lib/api";
import selector from "@/lib/selector";

export const Route = createFileRoute("/_sidebar/intake")({
  component: () => <IntakePage />,
});

const SOLUTION_TYPE_FALLBACK = [
  "Agentic AI",
  "Automation",
  "Automation (Non-AI)",
  "Conversational AI",
  "Data Enablement",
  "Document AI",
  "Document AI + Rule-Based",
  "Document AI + Workflow Automation",
  "Generative AI",
  "Genie",
  "Language AI",
  "Predictive Analytics / ML",
  "Predictive Monitoring + Workflow Automation",
  "Process Improvement",
  "Reporting / BI",
  "UI / UX Enhancement",
];

const emptyDraft: ProjectIn = {
  request_title: "",
  business_dept: "",
  status: "New",
  current_process: "",
  problem_statement: "",
  estimated_user_population: "",
  expected_benefit: "",
  solution_summary: "",
  solution_type: "",
  systems_data_involved: "",
  notes: "",
  links: "",
  readiness_score: "",
  strategic_alignment: "",
  effort_estimate: "",
  requestor: "",
  sensitive_data: "N",
  executive_sponsor: "",
  desired_timeframe: "",
};

function IntakePage() {
  const catalog = useGetCatalog(selector<CatalogOut>());
  const queryClient = useQueryClient();
  const create = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      },
    },
  });
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProjectIn>(emptyDraft);
  const solutionTypes = catalog.data?.solution_types?.length
    ? catalog.data.solution_types
    : SOLUTION_TYPE_FALLBACK;

  function update<K extends keyof ProjectIn>(key: K, value: ProjectIn[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.solution_type) {
      toast.error("Choose a solution type.");
      return;
    }
    try {
      const created = await create.mutateAsync(draft);
      toast.success(`Filed ${created.data.id} as ${created.data.intake_type}`);
      await navigate({ to: "/projects/$projectId", params: { projectId: created.data.id } });
    } catch (error) {
      const message =
        error instanceof ApiError && typeof error.body === "object" && error.body && "detail" in error.body
          ? String((error.body as { detail: string }).detail)
          : error instanceof Error
            ? error.message
            : "Could not submit";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          New request
        </p>
        <h1 className="text-3xl font-medium tracking-tight">Intake Form</h1>
        <p className="max-w-prose text-muted-foreground">
          Submit an AI Task Force request. Intake Type is classified as AI, Data,
          or Analytics after submit and appears on the Requests list.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-10">
        <Section title="Request">
        <div className="grid gap-5 md:grid-cols-2">
        <Field label="Business Unit" htmlFor="business_dept">
          <Input
            id="business_dept"
            value={draft.business_dept ?? ""}
            onChange={(event) => update("business_dept", event.target.value)}
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <SelectField
            id="status"
            value={draft.status ?? "New"}
            onChange={(event) => update("status", event.target.value as ProjectIn["status"])}
          >
            {(catalog.data?.statuses ?? ["New"]).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </Field>
        </div>
        <Field label="Opportunity / As Is Process" htmlFor="current_process">
          <Textarea
            id="current_process"
            value={draft.current_process ?? ""}
            onChange={(event) => update("current_process", event.target.value)}
          />
        </Field>
        <Field label="Request Title" htmlFor="request_title">
          <Input
            id="request_title"
            required
            value={draft.request_title}
            onChange={(event) => update("request_title", event.target.value)}
          />
        </Field>
        <Field label="Problem Statement" htmlFor="problem_statement">
          <Textarea
            id="problem_statement"
            value={draft.problem_statement ?? ""}
            onChange={(event) => update("problem_statement", event.target.value)}
          />
        </Field>
        <Field label="Est. User Population" htmlFor="estimated_user_population">
          <Input
            id="estimated_user_population"
            value={draft.estimated_user_population ?? ""}
            onChange={(event) => update("estimated_user_population", event.target.value)}
          />
        </Field>
        <Field label="Expected Benefit" htmlFor="expected_benefit">
          <Textarea
            id="expected_benefit"
            value={draft.expected_benefit ?? ""}
            onChange={(event) => update("expected_benefit", event.target.value)}
          />
        </Field>
        </Section>

        <Section title="Solution">
        <Field label="Solution Summary" htmlFor="solution_summary">
          <Textarea
            id="solution_summary"
            value={draft.solution_summary ?? ""}
            onChange={(event) => update("solution_summary", event.target.value)}
          />
        </Field>
        <Field label="Solution Type" htmlFor="solution_type">
          <SelectField
            id="solution_type"
            required
            value={draft.solution_type}
            onChange={(event) => update("solution_type", event.target.value)}
            placeholder="Select a Solution Type"
          >
            {solutionTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Systems / Data Involved" htmlFor="systems_data_involved">
          <Textarea
            id="systems_data_involved"
            value={draft.systems_data_involved ?? ""}
            onChange={(event) => update("systems_data_involved", event.target.value)}
          />
        </Field>
        <Field label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={draft.notes ?? ""}
            onChange={(event) => update("notes", event.target.value)}
          />
        </Field>
        <Field label="Links" htmlFor="links">
          <Textarea
            id="links"
            value={draft.links ?? ""}
            onChange={(event) => update("links", event.target.value)}
          />
        </Field>
        </Section>

        <Section title="Prioritization">
        <Field label="Readiness Score" htmlFor="readiness_score">
          <Input
            id="readiness_score"
            value={draft.readiness_score ?? ""}
            onChange={(event) => update("readiness_score", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Strategic Alignment" htmlFor="strategic_alignment">
            <SelectField
              id="strategic_alignment"
              value={draft.strategic_alignment ?? ""}
              onChange={(event) =>
                update("strategic_alignment", event.target.value as ProjectIn["strategic_alignment"])
              }
              placeholder="Select Alignment"
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
                update("effort_estimate", event.target.value as ProjectIn["effort_estimate"])
              }
              placeholder="Select Effort"
            >
              {(catalog.data?.effort_estimates ?? ["S", "M", "L"]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
        </Section>

        <Section title="Requestor">
        <Field label="Requestor" htmlFor="requestor">
          <Input
            id="requestor"
            required
            value={draft.requestor}
            onChange={(event) => update("requestor", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sensitive Data? (Y/N)" htmlFor="sensitive_data">
            <SelectField
              id="sensitive_data"
              value={draft.sensitive_data}
              onChange={(event) => update("sensitive_data", event.target.value as ProjectIn["sensitive_data"])}
            >
              <option value="N">N</option>
              <option value="Y">Y</option>
            </SelectField>
          </Field>
          <Field label="Executive Sponsor" htmlFor="executive_sponsor">
            <Input
              id="executive_sponsor"
              value={draft.executive_sponsor ?? ""}
              onChange={(event) => update("executive_sponsor", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Desired Timeframe and Why" htmlFor="desired_timeframe">
          <Textarea
            id="desired_timeframe"
            value={draft.desired_timeframe ?? ""}
            onChange={(event) => update("desired_timeframe", event.target.value)}
          />
        </Field>

        </Section>

        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Submitting…" : "Submit Request"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setDraft(emptyDraft)}>
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
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
