import type { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  logo: (
    <>
      <path d="M5 18h14M7.5 18v-5.2L12 9l4.5 3.8V18" />
      <path d="M12 3l1.3 2.4L12 7.6l-1.3-2.2z" fill="#fbbf24" stroke="none" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  flame: (
    <path d="M12 3c2.2 3.2 6 5.9 6 10a6 6 0 0 1-12 0c0-2.5 1.2-4.6 2.7-6.3.3 1.5 1 2.7 2.3 3.3-.7-2.4-.4-4.9 1-7z" />
  ),
  brain: (
    <>
      <path d="M9.7 3.3A2.6 2.6 0 0 0 7 5.9v.5a3.5 3.5 0 0 0-2 3.2c0 .9.3 1.7.9 2.3a3.7 3.7 0 0 0 1.8 5.2c.3 2 1.8 3.6 3.6 3.6.6 0 1.1-.5 1.1-1.1V5.4a2.6 2.6 0 0 0-2.7-2.1z" />
      <path d="M14.3 3.3A2.6 2.6 0 0 1 17 5.9v.5a3.5 3.5 0 0 1 2 3.2c0 .9-.3 1.7-.9 2.3a3.7 3.7 0 0 1-1.8 5.2c-.3 2-1.8 3.6-3.6 3.6-.6 0-1.1-.5-1.1-1.1V5.4a2.6 2.6 0 0 1 2.7-2.1z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  bolt: <path d="M13 2 4.7 13.2h6L9.6 22l8.7-11.2h-6z" />,
  puzzle: (
    <path d="M10 3a2 2 0 0 1 4 0v1h4a2 2 0 0 1 2 2v4h-1a2 2 0 0 0 0 4h1v4a2 2 0 0 1-2 2h-4v-1a2 2 0 0 0-4 0v1H6a2 2 0 0 1-2-2v-4H3a2 2 0 0 1 0-4h1V6a2 2 0 0 1 2-2h4z" />
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      <path d="M9 7h7M9 10.5h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </>
  ),
  play: <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11-7.2a1 1 0 0 0 0-1.8l-11-7.2c-.7-.4-1.6.1-1.6.9z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  back: <path d="M19 12H5m6-7-7 7 7 7" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4.5 21h15" />,
  upload: <path d="M12 15V3m-5 5 5-5 5 5M4.5 21h15" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12M10 11v6M14 11v6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 9h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M7.5 2.5c-.8 1.2.8 1.8 0 3M11.5 2.5c-.8 1.2.8 1.8 0 3" />
    </>
  ),
  check: <path d="M4.5 12.5 10 18 19.5 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.8 1.6M9.5 2.5h5M12 2.5V6" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H4.5v1.5A3.5 3.5 0 0 0 8 10M16 5h3.5v1.5A3.5 3.5 0 0 1 16 10M12 14v4M8.5 21h7M12 18c-1.5 0-2.5 1-2.5 3h5c0-2-1-3-2.5-3z" />
    </>
  ),
  star: <path d="M12 3.5 14.5 9l6 .6-4.5 4 1.3 5.9L12 16.4l-5.3 3.1L8 13.6l-4.5-4 6-.6z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.8v.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.8V11c0 4.8-3.2 7.9-7 9-3.8-1.1-7-4.2-7-9V5.8L12 3z" />
      <path d="M9 11.8l2.2 2.2L15.5 9.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5z" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" />,
  sparkles: (
    <>
      <path d="M12 4l1.6 4.2L18 9.8l-4.4 1.6L12 15.6l-1.6-4.2L6 9.8l4.4-1.6z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 15.5l.7 1.8 1.8.7-1.8.7L5 20.5l-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  heart: <path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.7-3.5 6.9-8.5 10.9z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M19 13.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5h5.5" />,
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v8a1.5 1.5 0 0 1-1.5 1.5H14v-6h-4v6H5.5A1.5 1.5 0 0 1 4 19v-8z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  flag: <path d="M5 21V4m0 1h13l-2.5 4L18 13H5" />,
  zap: <path d="M13 2 4.7 13.2h6L9.6 22l8.7-11.2h-6z" />,
  hash: (
    <>
      <path d="M4 9h16M4 15h16M9 3l-2 18M17 3l-2 18" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9l-3 6-3-6 6 3z" fill="currentColor" stroke="none" />
    </>
  ),
  grid3x3: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  wand: (
    <>
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9" />
    </>
  ),
  arrowUp: <path d="M12 19V5m-6 6 6-6 6 6" />,
  arrowDown: <path d="M12 5v14m6-6-6 6-6-6" />,
};

export function Icon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.9,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {P[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
