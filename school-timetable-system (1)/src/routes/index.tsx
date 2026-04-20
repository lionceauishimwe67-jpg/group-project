import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor, Settings, Clock, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "School Timetable — Management" },
      { name: "description", content: "Manage school timetable sessions and announcements" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh bg-background font-display">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              School Timetable System
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage sessions, teachers, and announcements
            </p>
          </div>
          <Link
            to="/display"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Monitor className="size-4" />
            Open Display
          </Link>
        </div>
      </header>

      {/* Dashboard */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <DashboardCard
            icon={<Clock className="size-6" />}
            title="Active Sessions"
            value="6"
            subtitle="Currently running"
            accent="text-kiosk-cyan"
          />
          <DashboardCard
            icon={<Settings className="size-6" />}
            title="Temporary Changes"
            value="2"
            subtitle="Today only"
            accent="text-kiosk-amber"
          />
          <DashboardCard
            icon={<Bell className="size-6" />}
            title="Announcements"
            value="3"
            subtitle="Active bulletins"
            accent="text-kiosk-green"
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Settings className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Management Dashboard</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Connect Lovable Cloud to enable full timetable management — add classes, teachers,
              subjects, schedule sessions, and upload announcements.
            </p>
            <Link
              to="/display"
              className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent transition-colors"
            >
              <Monitor className="size-4" />
              Preview Display Screen
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className={`${accent} mb-4`}>{icon}</div>
      <div className="text-3xl font-extrabold text-foreground tracking-tight">{value}</div>
      <div className="text-sm font-semibold text-foreground mt-1">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
    </div>
  );
}
