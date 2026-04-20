import { createFileRoute } from "@tanstack/react-router";
import { LiveClock } from "@/components/LiveClock";
import { SessionCard } from "@/components/SessionCard";
import { AnnouncementSlideshow } from "@/components/AnnouncementSlideshow";
import { mockSessions, mockAnnouncements } from "@/lib/mock-data";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "School Timetable Display" },
      { name: "description", content: "Real-time school timetable and announcements display" },
    ],
  }),
  component: DisplayPage,
});

function DisplayPage() {
  return (
    <div className="h-dvh w-full bg-kiosk-bg text-kiosk-foreground p-6 flex gap-6 overflow-hidden antialiased font-display">
      {/* Left: Timetable Grid (75%) */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex justify-between items-end shrink-0 mb-6 border-b border-kiosk-foreground/10 pb-5">
          <div>
            <div className="font-mono text-kiosk-cyan font-bold tracking-[0.2em] text-sm mb-2">
              SCHOOL TIMETABLE SYSTEM
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight uppercase leading-none text-kiosk-foreground">
              Current Sessions
            </h1>
          </div>
          <LiveClock />
        </div>

        {/* Session Cards Grid */}
        <div className="grid grid-cols-3 gap-4 flex-1 content-start auto-rows-min">
          {mockSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </div>

      {/* Right: Announcements (25%) */}
      <div className="w-[320px] shrink-0 h-full flex flex-col">
        <AnnouncementSlideshow announcements={mockAnnouncements} />
      </div>
    </div>
  );
}
