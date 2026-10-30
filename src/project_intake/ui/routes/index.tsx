import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/apx/navbar";
import { FolderSearch, FilePlus2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => <Index />,
});

function Index() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:py-24">
          <div className="space-y-7">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              AI Task Force
            </p>
            <h1 className="max-w-xl text-4xl font-medium tracking-tight md:text-5xl">
              Intake and request review
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              File a request, then review and edit it on the Requests list.
              Intake Type is classified as AI, Data, or Analytics after submit.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/intake">
                  <FilePlus2 />
                  New Request
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/portfolio">
                  <FolderSearch />
                  Open Requests
                </Link>
              </Button>
            </div>
          </div>
          <aside className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Flow
            </h2>
            <ol className="space-y-5 text-sm">
              <li className="space-y-1">
                <p className="font-medium">1. Submit</p>
                <p className="text-muted-foreground">
                  Use the intake form. Solution Type is a dropdown; Intake Type
                  is not chosen by the submitter.
                </p>
              </li>
              <li className="space-y-1">
                <p className="font-medium">2. Classify</p>
                <p className="text-muted-foreground">
                  AI, Data, or Analytics is assigned after submit and shown on
                  the Requests list.
                </p>
              </li>
              <li className="space-y-1">
                <p className="font-medium">3. Review</p>
                <p className="text-muted-foreground">
                  Edit free-form fields inline, or open a record for the full
                  form.
                </p>
              </li>
            </ol>
          </aside>
        </div>
      </main>
    </div>
  );
}
