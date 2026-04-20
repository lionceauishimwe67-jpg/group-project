import { useState, useEffect } from "react";
import type { Announcement } from "@/lib/mock-data";

interface AnnouncementSlideshowProps {
  announcements: Announcement[];
  intervalMs?: number;
}

export function AnnouncementSlideshow({ announcements, intervalMs = 8000 }: AnnouncementSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [announcements.length, intervalMs]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Image */}
      <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-kiosk-bg">
          <img
            src={current.imageUrl}
            alt={current.title || "Announcement"}
            className="w-full h-full object-cover opacity-80 transition-opacity duration-700"
            key={current.id}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-kiosk-bg/60 to-kiosk-bg" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="font-mono text-kiosk-cyan font-bold tracking-widest text-xs uppercase mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-kiosk-cyan animate-pulse" />
            Campus Bulletin
          </div>
          {current.title && (
            <h3 className="text-3xl font-extrabold text-kiosk-foreground leading-tight mb-2">
              {current.title}
            </h3>
          )}
          {current.description && (
            <p className="text-kiosk-foreground/60 text-base font-medium leading-snug">
              {current.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2 mt-4 px-2">
        {announcements.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i === currentIndex ? "bg-kiosk-cyan" : "bg-kiosk-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
