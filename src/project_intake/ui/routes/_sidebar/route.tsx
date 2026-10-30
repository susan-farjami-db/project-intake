import SidebarLayout from "@/components/apx/sidebar-layout";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ClipboardList, FilePlus } from "lucide-react";

export const Route = createFileRoute("/_sidebar")({
  component: () => <Layout />,
});

function Layout() {
  const location = useLocation();

  const navItems = [
    {
      to: "/portfolio",
      label: "Requests",
      icon: <ClipboardList size={16} />,
      match: (path: string) => path === "/portfolio" || path.startsWith("/projects/"),
    },
    {
      to: "/intake",
      label: "Intake Form",
      icon: <FilePlus size={16} />,
      match: (path: string) => path === "/intake",
    },
  ];

  return (
    <SidebarLayout>
      <nav className="flex flex-col gap-1 px-2 pt-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150",
              item.match(location.pathname)
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </SidebarLayout>
  );
}
