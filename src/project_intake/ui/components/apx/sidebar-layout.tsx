import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/apx/mode-toggle";
import Logo from "@/components/apx/logo";

interface SidebarLayoutProps {
  children?: ReactNode;
}

function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="px-3 py-3">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>{children}</SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex h-screen flex-col">
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">AI Task Force</p>
            <p className="truncate text-xs text-muted-foreground">Project intake</p>
          </div>
          <div className="flex-1" />
          <ModeToggle />
        </header>
        <div className="flex flex-1 justify-center overflow-auto bg-background">
          <div className="flex w-full flex-1 flex-col gap-6 px-6 py-8 lg:px-10">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
export default SidebarLayout;
