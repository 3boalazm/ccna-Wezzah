// ui/components/icons.tsx
// Small inline-SVG icon set (search / sun / moon / menu / close) matching
// the stroke weight of lucide-react icons used in the HLOS reference shell,
// without adding a new dependency to this Vite project.

import React from "react";

type IconProps = { size?: number; style?: React.CSSProperties };

const base: React.SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function SearchIcon({ size = 16, style }: IconProps) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24" style={style}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function SunIcon({ size = 16, style }: IconProps) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24" style={style}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}

export function MoonIcon({ size = 16, style }: IconProps) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function MenuIcon({ size = 16, style }: IconProps) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function CloseIcon({ size = 16, style }: IconProps) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
