// ui/components/RadarChart.tsx
// Small dependency-free SVG radar chart — the polar-coordinate math (grid
// rings, axes, polygon, vertex dots) is ported from HLOS's CapabilityRadar
// (components/learner/capability-radar.tsx), the signature visual of that
// product, at Ahmed's request to make this app's Review Dashboard actually
// look like a mastery instrument instead of a stack of progress bars.

import React from "react";

export interface RadarDatum {
  label: string;
  score: number; // 0-100
  color?: string;
}

export interface RadarChartProps {
  data: RadarDatum[];
  size?: number;
  showLabels?: boolean;
}

export default function RadarChart({ data, size = 280, showLabels = true }: RadarChartProps) {
  const n = data.length;
  if (n < 3) {
    // A polygon needs at least 3 axes to read as a shape; fall back to a
    // simple bar list rather than draw a degenerate triangle-less blob.
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: size }}>
        {data.map((d) => (
          <div key={d.label} style={{ fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ color: "var(--text-secondary)" }}>{d.label}</span>
              <span style={{ color: d.color ?? "var(--accent)", fontWeight: 700 }}>{d.score}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ width: `${d.score}%`, height: "100%", background: d.color ?? "var(--accent)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const vb = 240;
  const cx = vb / 2;
  const cy = vb / 2;
  const maxR = showLabels ? 78 : 92;
  const labelR = maxR + 26;

  const angleAt = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);

  const gridRings = [0.33, 0.66, 1].map((frac) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = angleAt(i);
      const r = maxR * frac;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
    return pts;
  });

  const axes = Array.from({ length: n }, (_, i) => {
    const a = angleAt(i);
    return { x2: cx + maxR * Math.cos(a), y2: cy + maxR * Math.sin(a) };
  });

  const dataPoints = data
    .map((d, i) => {
      const a = angleAt(i);
      const r = maxR * (Math.max(0, Math.min(100, d.score)) / 100);
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    })
    .join(" ");

  const dots = data.map((d, i) => {
    const a = angleAt(i);
    const r = maxR * (Math.max(0, Math.min(100, d.score)) / 100);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: d.color ?? "var(--accent)" };
  });

  const labels = data.map((d, i) => {
    const a = angleAt(i);
    return {
      x: cx + labelR * Math.cos(a),
      y: cy + labelR * Math.sin(a),
      anchor: Math.cos(a) > 0.3 ? "start" : Math.cos(a) < -0.3 ? "end" : "middle",
      text: d.label,
    };
  });

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size} className="ccna-anim-pop">
      {gridRings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {axes.map((ax, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax.x2} y2={ax.y2} stroke="var(--border)" strokeWidth={1} />
      ))}
      <polygon points={dataPoints} fill="var(--accent)" fillOpacity={0.18} stroke="var(--accent)" strokeWidth={2} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={4} fill={d.color} />
      ))}
      {showLabels &&
        labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor as "start" | "end" | "middle"}
            dominantBaseline="middle"
            fontSize={9.5}
            fontWeight={600}
            fill="var(--text-secondary)"
          >
            {l.text}
          </text>
        ))}
    </svg>
  );
}
