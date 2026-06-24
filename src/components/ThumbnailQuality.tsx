import React from "react";
import { AbsoluteFill } from "remotion";
import { getTheme, hexToRgb } from "../theme";

/**
 * EP004 thumbnail — "the report card". The hook is the surprise: the FREE little model
 * that actually fits a cheap 8GB rig scored ~80% on a verifiable, machine-graded exam;
 * the popular 8B barely beat it (+7 pts) for ~4x the wait; and the genuinely-clever 14B
 * wouldn't load at all. LEFT = the hero "80%" payoff; RIGHT = a thumbnail-sized speed-vs-
 * accuracy scatter (the same frontier as the video's CHART_QUALITY): the 3B sits fast-and-
 * smart up the right, the 8B clings to the dashed "usable speed" floor on the slow left,
 * and the 14B is a dead red ✕ that never ran.
 *
 * Distinct archetype from EP001 (stat-card), EP002 (break-even cross) and EP003 (collapsing
 * bars) so a run of episodes can't be fingerprinted as one template (the render-variance rule). Pure vector
 * + type, no photoreal (stays crisp at native 1280x720). Stills don't read the script, so
 * every value is a literal prop — and the numbers are the REAL measured results from
 * data/ep004_quality.json (3B 80% @ ~26 tok/s, 8B 87% @ ~6 tok/s, 14B DNF).
 *
 * `flat` drops every neon glow/bloom (radial halo, dot drop-shadows, text-shadow) for a
 * flat, editorial finish — the bloom-on-dark look is the main thing that reads as
 * "AI-generated", so this de-AIs the aesthetic while keeping the same data + layout.
 */
export interface QualityPoint {
  label: string; // e.g. "3B"
  tok_s: number; // measured throughput
  acc: number; // verifiable accuracy %
  tone?: "hero" | "dim"; // hero = accent + glow; dim = secondary
}

export interface ThumbnailQualityProps {
  themeId?: string | number;
  eyebrow?: string;
  preLabel?: string; // small line above the hero number
  hero?: string; // the hero number, e.g. "80%"
  sub?: string; // red sub-line (the twist)
  /** The models that actually ran, plotted speed (x) vs accuracy (y). */
  points?: QualityPoint[];
  floor?: number; // usable-speed floor (tok/s); left of it = too slow to use
  speedMax?: number; // x-axis max (tok/s)
  dnfLabel?: string; // the model that never finished, drawn as a dead ✕
  /** Flat editorial finish: no neon glows / blooms (de-AI the look). */
  flat?: boolean;
}

const DEFAULT_POINTS: QualityPoint[] = [
  { label: "3B", tok_s: 25.6, acc: 80, tone: "hero" },
  { label: "8B", tok_s: 6.3, acc: 87, tone: "dim" },
];

const DEFAULTS: Required<Omit<ThumbnailQualityProps, "themeId">> = {
  eyebrow: "THE VALIDATION SET · GRADED",
  preLabel: "THE CHEAP 3B SCORED",
  hero: "80%",
  sub: "bigger barely won — at 4× the wait",
  points: DEFAULT_POINTS,
  floor: 6,
  speedMax: 30,
  dnfLabel: "14B",
  flat: false,
};

const W = 1280;
const H = 720;
const COST = "#FB7185"; // fixed warning red — "dead / won't run" in every theme

export const ThumbnailQuality: React.FC<ThumbnailQualityProps> = ({
  themeId,
  eyebrow = DEFAULTS.eyebrow,
  preLabel = DEFAULTS.preLabel,
  hero = DEFAULTS.hero,
  sub = DEFAULTS.sub,
  points = DEFAULTS.points,
  floor = DEFAULTS.floor,
  speedMax = DEFAULTS.speedMax,
  dnfLabel = DEFAULTS.dnfLabel,
  flat = DEFAULTS.flat,
}) => {
  const theme = getTheme(themeId);
  const rgb = hexToRgb(theme.accent);
  const secRgb = hexToRgb(theme.secondary);
  const costRgb = hexToRgb(COST);

  // Right-side scatter geometry. Accuracy axis is zoomed to [50, 95] so an 80 vs 87
  // gap is legible while both still read as "high".
  const PX0 = 745;
  const PX1 = 1215;
  const PY_TOP = 165;
  const PY_BOT = 585;
  const ACC_LO = 50;
  const ACC_HI = 95;
  const xAt = (v: number) =>
    PX0 + (Math.min(Math.max(v, 0), speedMax) / speedMax) * (PX1 - PX0);
  const yAt = (p: number) =>
    PY_BOT - ((Math.min(Math.max(p, ACC_LO), ACC_HI) - ACC_LO) / (ACC_HI - ACC_LO)) * (PY_BOT - PY_TOP);
  const xFloor = xAt(floor);

  return (
    <AbsoluteFill
      style={{
        background: flat ? theme.bgFrom : `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        fontFamily: theme.fontDisplay,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="hq_glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* soft glow behind the hero number (skipped in the flat finish) */}
        {!flat && <circle cx={250} cy={360} r={290} fill="url(#hq_glow)" />}

        {/* scatter axes */}
        <line x1={PX0} x2={PX1} y1={PY_BOT} y2={PY_BOT} stroke={theme.grid} strokeWidth={2} />
        <line x1={PX0} x2={PX0} y1={PY_TOP - 6} y2={PY_BOT} stroke={theme.grid} strokeWidth={2} />

        {/* too-slow zone (left of the usable floor) + dashed floor line */}
        <rect
          x={PX0}
          y={PY_TOP - 6}
          width={Math.max(0, xFloor - PX0)}
          height={PY_BOT - (PY_TOP - 6)}
          fill={`rgba(${costRgb}, 0.08)`}
        />
        <line x1={xFloor} x2={xFloor} y1={PY_TOP - 22} y2={PY_BOT} stroke={COST} strokeWidth={3} strokeDasharray="11 9" opacity={0.85} />
        <text x={xFloor} y={PY_TOP - 30} textAnchor="middle" fontFamily={theme.fontMono} fontSize={22} fill={COST}>
          usable speed
        </text>

        {/* axis hints */}
        <text x={(PX0 + PX1) / 2} y={PY_BOT + 46} textAnchor="middle" fontFamily={theme.fontMono} fontSize={24} fill={theme.muted}>
          slower ←   speed   → faster
        </text>
        <text x={PX0 - 20} y={PY_TOP + 4} textAnchor="end" fontFamily={theme.fontMono} fontSize={22} fill={theme.muted}>
          smarter ↑
        </text>

        {/* DNF ghost: the 14B that never ran */}
        <g>
          <text x={xAt(1.6)} y={yAt(60) + 18} textAnchor="middle" fontFamily={theme.fontDisplay} fontSize={64} fontWeight={800} fill={COST} opacity={0.92}>
            ✕
          </text>
          <text x={xAt(1.6)} y={yAt(60) + 58} textAnchor="middle" fontFamily={theme.fontMono} fontSize={23} fill={COST} opacity={0.9}>
            {dnfLabel} · DNF
          </text>
        </g>

        {/* the models that actually ran */}
        {points.map((p, i) => {
          const isHero = p.tone !== "dim";
          const c = isHero ? theme.accent : theme.secondary;
          const cRgb = isHero ? rgb : secRgb;
          const cx = xAt(p.tok_s);
          const cy = yAt(p.acc);
          const r = isHero ? 30 : 24;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={`rgba(${cRgb}, ${isHero ? 0.28 : 0.2})`}
                stroke={c}
                strokeWidth={isHero ? 5 : 4}
                style={{
                  filter: flat
                    ? "none"
                    : isHero
                    ? `drop-shadow(0 0 26px rgba(${cRgb}, 0.85))`
                    : `drop-shadow(0 0 12px rgba(${cRgb}, 0.5))`,
                }}
              />
              <text x={cx} y={cy - r - 16} textAnchor="middle" fontFamily={theme.fontDisplay} fontSize={isHero ? 44 : 36} fontWeight={800} fill={c}>
                {p.label}
              </text>
              <text x={cx} y={cy + 11} textAnchor="middle" fontFamily={theme.fontDisplay} fontSize={isHero ? 30 : 26} fontWeight={800} fill={theme.text}>
                {Math.round(p.acc)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* eyebrow */}
      <div style={{ position: "absolute", left: 72, top: 52, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: theme.accent, boxShadow: flat ? "none" : `0 0 16px rgba(${rgb}, 0.9)` }} />
        <span style={{ fontFamily: theme.fontMono, fontSize: 23, letterSpacing: 3, textTransform: "uppercase", color: theme.muted }}>
          {eyebrow}
        </span>
      </div>

      {/* LEFT hero: THE CHEAP 3B SCORED / 80% */}
      <div style={{ position: "absolute", left: 74, top: 168 }}>
        <div
          style={{
            fontFamily: theme.fontMono,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: theme.text,
            opacity: 0.9,
            maxWidth: 600,
          }}
        >
          {preLabel}
        </div>
        <span
          style={{
            display: "block",
            fontSize: 300,
            fontWeight: 800,
            lineHeight: 0.82,
            letterSpacing: -6,
            color: theme.accent,
            textShadow: flat ? "none" : `0 0 70px rgba(${rgb}, 0.7)`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {hero}
        </span>
      </div>

      {/* red twist sub-line */}
      <div
        style={{
          position: "absolute",
          left: 78,
          top: 558,
          maxWidth: 600,
          fontSize: 46,
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
