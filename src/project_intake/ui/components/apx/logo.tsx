import { Link } from "@tanstack/react-router";

interface LogoProps {
  to?: string;
  className?: string;
  showText?: boolean;
}

export function Logo({ to = "/portfolio", className = "", showText = true }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--db-navy-900)] text-[11px] font-medium tracking-wide text-[var(--db-oat-light)] dark:bg-white dark:text-[var(--db-navy-900)]">
        AI
      </span>
      {showText ? (
        <span className="leading-tight">
          <span className="block text-sm font-medium">Project Intake</span>
          <span className="block text-xs text-muted-foreground">AI Task Force</span>
        </span>
      ) : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="transition-opacity duration-150 hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
