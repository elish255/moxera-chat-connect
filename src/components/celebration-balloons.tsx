import type { CSSProperties } from "react";

type Balloon = { x: number; y: number; size: number; color: string; tilt: number };

const LEFT: Balloon[] = [
  { x: 2, y: 0, size: 30, color: "var(--primary)", tilt: -10 },
  { x: 20, y: 22, size: 26, color: "var(--chart-4)", tilt: 6 },
  { x: 4, y: 52, size: 24, color: "var(--lime)", tilt: -4 },
];

const RIGHT: Balloon[] = [
  { x: 2, y: 0, size: 30, color: "var(--chart-4)", tilt: 10 },
  { x: 20, y: 24, size: 26, color: "var(--lime)", tilt: -6 },
  { x: 4, y: 54, size: 24, color: "var(--primary)", tilt: 4 },
];

function Cluster({ balloons, side }: { balloons: Balloon[]; side: "left" | "right" }) {
  return (
    <div className={`absolute top-6 h-32 w-14 ${side === "left" ? "left-1" : "right-1"}`}>
      {balloons.map((b, i) => (
        <span
          key={i}
          className="celebration-balloon-static"
          style={
            {
              [side]: b.x,
              top: b.y,
              width: b.size,
              height: b.size * 1.2,
              "--balloon-color": b.color,
              transform: `rotate(${side === "left" ? b.tilt : -b.tilt}deg)`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function CelebrationBalloons() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Cluster balloons={LEFT} side="left" />
      <Cluster balloons={RIGHT} side="right" />
    </div>
  );
}
