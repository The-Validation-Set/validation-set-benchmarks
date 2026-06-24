import React from "react";
import { AbsoluteFill } from "remotion";
import { getTheme, hexToRgb } from "../theme";

/**
 * EP003 thumbnail — "the collapse". The hook is the shocking smallness of the answer:
 * you throw a swarm at one cheap rig, and only a couple of agents actually survive.
 * LEFT = the hero "ONLY 2 AGENTS" payoff; RIGHT = a thumbnail-sized version of the
 * REAL per-agent bars from the video, collapsing below a dashed "usable" floor (the
 * first two clear it in the accent colour; the rest die in warning-red).
 *
 * Distinct layout from EP001 (stat-card) and EP002 (break-even cross-chart) so a run of
 * episodes can't be visually fingerprinted as one template (the render-variance rule). Pure vector +
 * type, no photoreal (stays crisp at native 1280x720, reads as real data not slop).
 * Bars default to the measured effective per-agent tok/s in data/ep003_scaling.json
 * (N = 1,2,3,4,6,8); every string/number is a prop so the launcher can override.
 *
 * `flat` drops every neon glow/bloom (radial halo, drop-shadows, text-shadows) for a
 * flat, editorial finish — the bloom-on-dark look is the main thing that reads as
 * "AI-generated", so this de-AIs the aesthetic while keeping the same data + layout.
 */
export interface ThumbnailScalingProps {
  themeId?: string | number;
  eyebrow?: string;
  preLabel?: string;   // tiny word above the hero number, e.g. "ONLY"
  hero?: string;       // the hero number, e.g. "2"
  heroUnit?: string;   // e.g. "AGENTS"
  sub?: string;        // red sub-line, e.g. "before a cheap 8GB laptop chokes"
  /** Measured effective per-agent tok/s, one per tested concurrency level. */
  bars?: number[];
  /** The N label under each bar (same length as bars). */
  barLabels?: (string | number)[];
  /** Usable floor (tok/s); bars at/above it are "alive" (accent), below it die (red). */
  floor?: number;
  /** Flat editorial finish: no neon glows / blooms (de-AI the look). */
  flat?: boolean;
}

const DEFAULTS: Required<Omit<ThumbnailScalingProps, "themeId">> = {
  eyebrow: "THE VALIDATION SET · MEASURED",
  preLabel: "ONLY",
  hero: "2",
  heroUnit: "AGENTS",
  sub: "before a cheap 8GB laptop chokes",
  bars: [15.57, 8.09, 5.83, 4.29, 2.82, 1.97],
  barLabels: [1, 2, 3, 4, 6, 8],
  floor: 6,
  flat: false,
};

const W = 1280;
const H = 720;
const COST = "#FB7185"; // fixed warning red — "dead/stalled" in every theme

export const ThumbnailScaling: React.FC<ThumbnailScalingProps> = ({
  themeId,
  eyebrow = DEFAULTS.eyebrow,
  preLabel = DEFAULTS.preLabel,
  hero = DEFAULTS.hero,
  heroUnit = DEFAULTS.heroUnit,
  sub = DEFAULTS.sub,
  bars = DEFAULTS.bars,
  barLabels = DEFAULTS.barLabels,
  floor = DEFAULTS.floor,
  flat = DEFAULTS.flat,
}) => {
  const theme = getTheme(themeId);
  const rgb = hexToRgb(theme.accent);
  const costRgb = hexToRgb(COST);

  // Right-side mini-chart geometry.
  const PX0 = 720, PX1 = 1210, PY_TOP = 150, PY_BOT = 600;
  const vMax = Math.max(...bars, floor) * 1.08;
  const by = (v: number) => PY_BOT - (v / vMax) * (PY_BOT - PY_TOP);
  const n = bars.length;
  const slot = (PX1 - PX0) / n;
  const barW = slot * 0.56;
  const yFloor = by(floor);

  return (
    <AbsoluteFill
      style={{
        background: flat ? theme.bgFrom : `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        fontFamily: theme.fontDisplay,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="heroglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* soft glow behind the hero number (skipped in the flat finish) */}
        {!flat && <circle cx={250} cy={370} r={290} fill="url(#heroglow)" />}

        {/* mini-chart bars: alive (accent, glowing) vs dead (red) */}
        {bars.map((v, i) => {
          const alive = v >= floor;
          const c = alive ? theme.accent : COST;
          const cx = PX0 + slot * i + slot / 2;
          const h = Math.max(6, PY_BOT - by(v));
          return (
            <g key={i}>
              <rect
                x={cx - barW / 2}
                y={by(v)}
                width={barW}
                height={h}
                rx={10}
                fill={c}
                opacity={alive ? 1 : 0.85}
                style={{ filter: flat ? "none" : alive ? `drop-shadow(0 0 22px rgba(${rgb}, 0.8))` : `drop-shadow(0 0 10px rgba(${costRgb}, 0.5))` }}
              />
              {/* a small marker: ✓ for alive, × for dead */}
              <text
                x={cx}
                y={by(v) - 18}
                textAnchor="middle"
                fontFamily={theme.fontDisplay}
                fontSize={alive ? 40 : 34}
                fontWeight={800}
                fill={c}
              >
                {alive ? "✓" : "✕"}
              </text>
              {/* N label */}
              <text x={cx} y={PY_BOT + 42} textAnchor="middle" fontFamily={theme.fontMono} fontSize={26} fill={theme.muted}>
                {String(barLabels[i] ?? i + 1)}
              </text>
            </g>
          );
        })}

        {/* usable-floor line */}
        <line x1={PX0 - 10} x2={PX1} y1={yFloor} y2={yFloor} stroke={COST} strokeWidth={3} strokeDasharray="11 9" opacity={0.85} />
        <text x={PX1} y={yFloor - 14} textAnchor="end" fontFamily={theme.fontMono} fontSize={22} fill={COST}>
          usable floor
        </text>
        {/* x-axis caption */}
        <text x={(PX0 + PX1) / 2} y={PY_BOT + 84} textAnchor="middle" fontFamily={theme.fontMono} fontSize={23} fill={theme.muted}>
          agents at once  →  each one slower
        </text>
      </svg>

      {/* eyebrow */}
      <div style={{ position: "absolute", left: 72, top: 52, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: theme.accent, boxShadow: flat ? "none" : `0 0 16px rgba(${rgb}, 0.9)` }} />
        <span style={{ fontFamily: theme.fontMono, fontSize: 23, letterSpacing: 3, textTransform: "uppercase", color: theme.muted }}>
          {eyebrow}
        </span>
      </div>

      {/* LEFT hero: ONLY 2 AGENTS */}
      <div style={{ position: "absolute", left: 74, top: 150 }}>
        <div style={{ fontFamily: theme.fontMono, fontSize: 40, fontWeight: 700, letterSpacing: 8, textTransform: "uppercase", color: theme.text, opacity: 0.9 }}>
          {preLabel}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
          <span
            style={{
              fontSize: 320,
              fontWeight: 800,
              lineHeight: 0.8,
              letterSpacing: -6,
              color: theme.accent,
              textShadow: flat ? "none" : `0 0 70px rgba(${rgb}, 0.7)`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {hero}
          </span>
          <span style={{ fontSize: 84, fontWeight: 800, color: theme.text, paddingBottom: 40, letterSpacing: -1 }}>
            {heroUnit}
          </span>
        </div>
      </div>

      {/* red pain sub-line */}
      <div
        style={{
          position: "absolute",
          left: 78,
          top: 560,
          maxWidth: 600,
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.05,
          color: COST,
          textShadow: flat ? "none" : `0 0 30px rgba(${costRgb}, 0.45)`,
        }}
      >
        {sub}
      </div>
    </AbsoluteFill>
  );
};
