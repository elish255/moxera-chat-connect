import type { CSSProperties } from "react";

const BALLOONS = [
  { left: "6%", color: "var(--primary)", delay: "0s", duration: "4.2s", size: 34 },
  { left: "20%", color: "var(--chart-4)", delay: "0.6s", duration: "5s", size: 28 },
  { left: "34%", color: "var(--lime)", delay: "1.2s", duration: "4.6s", size: 32 },
  { left: "50%", color: "var(--chart-2)", delay: "0.3s", duration: "5.4s", size: 30 },
  { left: "64%", color: "var(--primary)", delay: "1.5s", duration: "4.4s", size: 26 },
  { left: "78%", color: "var(--chart-4)", delay: "0.9s", duration: "5.2s", size: 34 },
  { left: "90%", color: "var(--lime)", delay: "0.2s", duration: "4.8s", size: 28 },
];

export function CelebrationBalloons() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BALLOONS.map((b, i) => (
        <span
          key={i}
          className="celebration-balloon"
          style={
            {
              left: b.left,
              width: b.size,
              height: b.size * 1.2,
              "--balloon-color": b.color,
              animationDelay: b.delay,
              animationDuration: b.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
