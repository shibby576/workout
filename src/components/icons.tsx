type IconProps = { color?: string };

export function WeekIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden="true">
      <rect x={2} y={3} width={16} height={14} rx={3} fill="none" stroke={color} strokeWidth={1.6} />
      <line x1={2} y1={8} x2={18} y2={8} stroke={color} strokeWidth={1.6} />
    </svg>
  );
}

export function RoutineIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx={4} cy={5} r={1.6} fill={color} />
      <circle cx={4} cy={10} r={1.6} fill={color} />
      <circle cx={4} cy={15} r={1.6} fill={color} />
      <rect x={8} y={4} width={10} height={2} rx={1} fill={color} />
      <rect x={8} y={9} width={10} height={2} rx={1} fill={color} />
      <rect x={8} y={14} width={10} height={2} rx={1} fill={color} />
    </svg>
  );
}

export function HistoryIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden="true">
      <rect x={3} y={10} width={3} height={7} rx={1} fill={color} />
      <rect x={8.5} y={5} width={3} height={12} rx={1} fill={color} />
      <rect x={14} y={8} width={3} height={9} rx={1} fill={color} />
    </svg>
  );
}

export function ChevronLeftIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 2 L4 8 L10 14" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 2 L12 8 L6 14" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx={8} cy={8} r={7} fill="var(--color-accent)" />
      <path d="M4.5 8.2 L7 10.7 L11.5 5.5" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClipboardIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" aria-hidden="true">
      <rect x={4} y={3} width={14} height={17} rx={2} fill="none" stroke={color} strokeWidth={1.6} />
      <rect x={8} y={1.5} width={6} height={3} rx={1} fill={color} />
      <line x1={7} y1={10} x2={15} y2={10} stroke={color} strokeWidth={1.4} />
      <line x1={7} y1={14} x2={15} y2={14} stroke={color} strokeWidth={1.4} />
    </svg>
  );
}
