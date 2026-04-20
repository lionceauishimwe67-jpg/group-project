import type { Session } from "@/lib/mock-data";

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const borderClass = session.isTemporary
    ? "border-kiosk-cyan/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    : "border-kiosk-foreground/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";

  return (
    <div
      className={`bg-kiosk-panel rounded-3xl p-6 border relative overflow-hidden flex flex-col justify-between ${borderClass}`}
    >
      {session.isTemporary && (
        <div className="absolute top-0 inset-x-0 h-[3px] bg-kiosk-cyan" />
      )}

      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="font-mono text-lg font-bold tabular-nums text-kiosk-foreground/60">
            {session.startTime} – {session.endTime}
          </div>
          {session.isTemporary && (
            <div className="bg-kiosk-cyan/10 text-kiosk-cyan px-3 py-1 rounded-full font-mono text-xs font-bold tracking-widest uppercase border border-kiosk-cyan/20">
              Temporary
            </div>
          )}
        </div>

        <h2 className="text-2xl font-extrabold text-kiosk-foreground mb-1 leading-tight tracking-tight">
          {session.className}
        </h2>
        <p className="text-xl font-bold text-kiosk-amber mb-1">{session.subjectName}</p>
        <p className="text-kiosk-foreground/50 font-semibold text-base">{session.teacherName}</p>
      </div>

      <div className="mt-5 flex items-center">
        <div className="bg-kiosk-foreground/10 text-kiosk-foreground px-4 py-2 rounded-xl font-mono text-xl font-bold border border-kiosk-foreground/5">
          {session.classroomName}
        </div>
      </div>
    </div>
  );
}
