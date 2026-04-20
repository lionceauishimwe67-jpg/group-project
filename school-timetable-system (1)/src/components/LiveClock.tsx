import { useState, useEffect } from "react";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayName = dayNames[time.getDay()];
  const monthName = monthNames[time.getMonth()];
  const date = time.getDate();

  return (
    <div className="text-right">
      <div className="font-mono text-6xl font-extrabold tabular-nums tracking-tighter leading-none text-kiosk-foreground">
        {hours}:{minutes}
        <span className="text-kiosk-foreground/30 text-3xl ml-1">:{seconds}</span>
      </div>
      <div className="font-mono text-kiosk-foreground/50 font-bold tracking-[0.1em] text-sm mt-3 uppercase">
        {dayName}, {monthName} {date}
      </div>
    </div>
  );
}
