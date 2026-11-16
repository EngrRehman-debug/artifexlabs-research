import type { Status } from "@/lib/projects";

/*
 * Figma stage group (101 x 22.28):
 *  - "Line 19": 99.02 wide at x 1.98, dashed stroke 3.3px #FF6720, dashes 0.66 / 4.62
 *  - "Rectangle 2154": 44.23 x 3.96, radius 33, #FF6720, at x 0
 *  - knob "%": 22.28 circle #ED5735 at x 36.72, label Inter 500 7.13px white
 */
export function StageBar({ value, scale = 1 }: { value: number; scale?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: 101 * scale, height: 22.28 * scale }}
      aria-label={`${value}% complete`}
    >
    <div
      className="absolute top-0 left-0 h-[22.28px] w-[101px] origin-top-left"
      style={scale === 1 ? undefined : { transform: `scale(${scale})` }}
    >
      <svg
        className="absolute top-1/2 left-[1.98px] -translate-y-1/2"
        width="99.02"
        height="3.3"
        aria-hidden
      >
        <line
          x1="0"
          x2="99.02"
          y1="1.65"
          y2="1.65"
          stroke="#FF6720"
          strokeWidth="3.3"
          strokeDasharray="0.66 4.62"
        />
      </svg>
      <div className="absolute top-1/2 left-0 h-[3.96px] w-[44.23px] -translate-y-1/2 rounded-[33px] bg-[#FF6720]" />
      <div className="absolute top-0 left-[36.72px] flex size-[22.28px] items-center justify-center rounded-full bg-[#ED5735] text-[7.13px] leading-none font-medium text-white">
        {value}%
      </div>
    </div>
    </div>
  );
}

/* Figma "complete": 88.29 x 32, padding 12.64, text Inter 500 12px.
 * Projects table uses radius 8, the overview Work Packages table radius 10. */
export function StatusBadge({
  status,
  radius = 8,
}: {
  status: Status;
  radius?: 8 | 10;
}) {
  const styles =
    status === "Pending"
      ? "bg-[#2054FF]/10 text-[#2054FF]"
      : "bg-[#ED5735]/10 text-[#FF6720]";
  return (
    <span
      className={`inline-flex h-8 min-w-[88.29px] items-center justify-center px-[12.64px] text-xs leading-[1.5] font-medium tracking-[-0.02em] whitespace-nowrap ${
        radius === 10 ? "rounded-[10px]" : "rounded-lg"
      } ${styles}`}
    >
      {status}
    </span>
  );
}
