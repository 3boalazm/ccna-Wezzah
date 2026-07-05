// ui/components/ProgressRing.tsx
// Small circular progress indicator (SVG, no deps) — pattern ported from
// HLOS's dashboard "path progress" ring. Reused for accuracy/coverage
// stats on the Dashboard and for score reveals on Exam/Question Bank.

import React from "react";

export interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
}

export default function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  color = "var(--accent)",
  trackColor = "var(--border)",
  label,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c * (1 - clamped / 100);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {label !== undefined && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.22,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
