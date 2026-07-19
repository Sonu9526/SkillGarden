import type { GrowthState } from "@/app/lib/types";

type PlantProps = {
  state: GrowthState;
  progress: number;
  wilted?: boolean;
};

export function Plant({ state, progress, wilted = false }: PlantProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${wilted ? "wilt" : ""}`}>
      <svg
        viewBox="0 0 160 170"
        role="img"
        aria-label={`${state} plant`}
        className="h-36 w-36"
      >
        <ellipse cx="80" cy="144" rx="48" ry="14" fill="#7a513d" opacity="0.28" />
        <path d="M42 139h76l-11 23H53z" fill="#9f6b4f" />
        <path d="M50 139h60l-7 15H57z" fill="#754734" opacity="0.42" />
        {state === "seed" && (
          <g>
            <ellipse cx="80" cy="124" rx="18" ry="11" fill="#74523f" />
            <path d="M73 120c5-4 13-4 18 0" stroke="#4d362d" strokeWidth="3" fill="none" />
          </g>
        )}
        {state !== "seed" && (
          <g>
            <path
              d="M80 127 C80 105 80 85 80 58"
              stroke="#3f8f56"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M80 101 C61 90 54 78 53 64 C71 65 80 75 82 94"
              fill="#3aa466"
            />
            {state !== "sprout" && (
              <path
                d="M81 91 C102 78 112 66 112 50 C91 52 80 65 78 86"
                fill="#50b36f"
              />
            )}
            {(state === "bud" || state === "bloom") && (
              <ellipse cx="80" cy="50" rx="17" ry="20" fill="#c54d70" />
            )}
            {state === "bloom" && (
              <g>
                <circle cx="80" cy="49" r="11" fill="#f3bd41" />
                <ellipse cx="80" cy="28" rx="12" ry="19" fill="#e85d75" />
                <ellipse cx="101" cy="42" rx="12" ry="19" fill="#f07c63" transform="rotate(58 101 42)" />
                <ellipse cx="94" cy="65" rx="12" ry="19" fill="#e85d75" transform="rotate(130 94 65)" />
                <ellipse cx="66" cy="65" rx="12" ry="19" fill="#f07c63" transform="rotate(230 66 65)" />
                <ellipse cx="59" cy="42" rx="12" ry="19" fill="#e85d75" transform="rotate(302 59 42)" />
              </g>
            )}
          </g>
        )}
      </svg>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-leaf transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
