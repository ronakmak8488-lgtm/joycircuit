import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="11" cy="11" r="7" /><path d="m16.2 16.2 4 4" /></IconBase>;
}

export function HeartIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" /></IconBase>;
}

export function PlayIcon({ size = 20, ...props }: IconProps) {
  return <IconBase size={size} fill="currentColor" stroke="none" {...props}><path d="m9 7 8 5-8 5V7Z" /></IconBase>;
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14m-5-5 5 5-5 5" /></IconBase>;
}

export function BoltIcon(props: IconProps) {
  return <IconBase {...props}><path d="m13.5 2-8 11h6L10.5 22l8-12h-6l1-8Z" /></IconBase>;
}

export function WheelIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path d="M12 4v5m0 6v5M4 12h5m6 0h5" /></IconBase>;
}

export function PuzzleIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 4h6a2 2 0 1 0 4 0h6v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 0 0-4V4Z" /></IconBase>;
}

export function BallIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9" /><path d="m8 9 4-3 4 3-1.5 4.5h-5L8 9Zm1.5 4.5L7 17m8-3.5 2 3.5M12 6V3" /></IconBase>;
}

export function ChessIcon(props: IconProps) {
  return <IconBase {...props}><path d="M9 3h6l-1 5 3 4-2 3 2 4H7l2-4-2-3 3-4-1-5Z" /></IconBase>;
}

export function LeafIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 4C10 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 10-16Z" /><path d="M4 21c3-6 7-9 13-12" /></IconBase>;
}

export function UsersIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-4 2-6 6-6s6 2 6 6m0-5c4 0 6 2 6 5" /></IconBase>;
}

export function HomeIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3 11 9-8 9 8v9h-6v-6H9v6H3v-9Z" /></IconBase>;
}

export function GridIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></IconBase>;
}

export function HistoryIcon(props: IconProps) {
  return <IconBase {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></IconBase>;
}

export function ExpandIcon(props: IconProps) {
  return <IconBase {...props}><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5" /></IconBase>;
}

export function VolumeIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 10v4h4l5 4V6L9 10H5Z" /><path d="M18 9a4 4 0 0 1 0 6" /></IconBase>;
}

export function MutedIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 10v4h4l5 4V6L9 10H5Z" /><path d="m18 10 4 4m0-4-4 4" /></IconBase>;
}

export function SoundscapeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="4.8" className="soundscape-orbit" />
      <circle cx="19.2" cy="10" r="1.25" fill="currentColor" stroke="none" />
      <path className="soundscape-wave soundscape-wave-one" d="M8.5 13.5v-3" />
      <path className="soundscape-wave soundscape-wave-two" d="M12 15.5v-7" />
      <path className="soundscape-wave soundscape-wave-three" d="M15.5 13.5v-3" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 6v5h-5M4 18v-5h5" /><path d="M18.5 10A7 7 0 0 0 6 6L4 8m2 6a7 7 0 0 0 12 4l2-2" /></IconBase>;
}

export function FlagIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 21V4m0 1h11l-2 4 2 4H5" /></IconBase>;
}

export function CloseIcon(props: IconProps) {
  return <IconBase {...props}><path d="m6 6 12 12M18 6 6 18" /></IconBase>;
}

export function MenuIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 7h16M4 12h16M4 17h16" /></IconBase>;
}

export function SlidersIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4M8 15v4" /></IconBase>;
}

export function KeyboardIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M18 10h.01M7 14h10" /></IconBase>;
}

export function MouseIcon(props: IconProps) {
  return <IconBase {...props}><rect x="7" y="2" width="10" height="20" rx="5" /><path d="M12 2v6" /></IconBase>;
}

export function GamepadIcon(props: IconProps) {
  return <IconBase {...props}><path d="M7 8h10a5 5 0 0 1 4.6 6.9l-1.2 3a2 2 0 0 1-3.1.8L15 17h-6l-2.3 1.7a2 2 0 0 1-3.1-.8l-1.2-3A5 5 0 0 1 7 8Z" /><path d="M7 11v4m-2-2h4m7-1h.01m2 2h.01" /></IconBase>;
}
