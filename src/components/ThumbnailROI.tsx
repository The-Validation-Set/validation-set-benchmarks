import React from "react";
import { AbsoluteFill } from "remotion";
import { getTheme, hexToRgb } from "../theme";

/**
 * EP002 thumbnail — "the savings wedge". A code-drawn break-even chart where the
 * REAL payoff is made the hero: the rising CLOUD-rent line ($7,200/yr) crosses the
 * flat LOCAL line around month 5, and the triangle that opens up after the crossover
 * is filled in the accent colour — that shaded area literally *is* the money you keep.
 * A big accent "$4,500 — YOU KEEP" headline gives the chart its punchline.
 *
 * Design rules this satisfies:
 *  - Pure data-viz + bold type, NO faces / photoreal objects (the render-variance rule). The whole
 *    frame is vector, so it stays crisp at native 1280x720 and reads as "real data",
 *    not AI slop.
 *  - ONE focal hierarchy: (1) the savings number + green wedge, (2) the red $7,200
 *    pain anchor, (3) the MONTH 5 break-even node, (4) the line labels + eyebrow.
 *  - Fully theme-driven (accent = "smart money"); cost stays a fixed warning red so it
 *    reads as "expensive" in every theme. Deliberately not the EP001 stat-card layout,
 *    so a run of episodes can't be visually fingerprinted as one template.
 *
 * Numbers are honest and match data/ep002_bench.json + the publish kit: cloud
 * rent $600/mo ($7,200/yr); local = ~$2,655 year-one (one-time rig + electricity);
 * year-one net saving = 7200 - 2655 = ~$4,545, rounded to $4,500. Every string is a
 * prop so the Python launcher can override copy via --props.
 */
export interface ThumbnailROIProps {
  themeId?: string | number;
  eyebrow?: string;
  /** Tiny tag above the hero number, e.g. "YOU KEEP". */
  savingsTag?: string;
  /** The hero payoff number, e.g. "$4,500". */
  savings?: string;
  /** Small caption under the hero number, e.g. "IN YEAR ONE". */
  savingsCaption?: string;
  /** Label at the top of the rising cloud line. */
  peakLabel?: string;
  /** Tag above the peak label. */
  cloudLabel?: string;
  /** Hero callout at the crossover node. */
  nodeLabel?: string;
  /** Small tag under the node label. */
  nodeSub?: string;
  /** Tag on the flat (local) line. */
  localLabel?: string;
}

const DEFAULTS: Required<Omit<ThumbnailROIProps, "themeId">> = {
  eyebrow: "MEASURED · 12-MONTH COST",
  savingsTag: "YOU KEEP",
  savings: "$4,500",
  savingsCaption: "IN YEAR ONE",
  peakLabel: "$7,200/yr",
  cloudLabel: "CLOUD API",
  nodeLabel: "MONTH 5",
  nodeSub: "BREAK-EVEN",
  localLabel: "YOUR RIG",
};

const W = 1280;
const H = 720;
// Cost = fixed warning red (reads as "expensive" regardless of theme); the local
// line, savings wedge and hero number take the theme accent (the "smart money" colour).
const COST = "#FB7185";

// Plot geometry (months 0..12 on x; dollars 0..vMax on y). Chart fills the lower-right
// majority; the top-left band stays clear for the hero number.
const PLOT = { x0: 70, x1: 1210, yTop: 250, yBot: 660, vMax: 7600 };
const mx = (m: number) => PLOT.x0 + (m / 12) * (PLOT.x1 - PLOT.x0);
const vy = (v: number) => PLOT.yBot - (v / PLOT.vMax) * (PLOT.yBot - PLOT.yTop);

// Real cost model: cloud $600/mo cumulative; local = one-time rig + tiny electricity.
const CLOUD_PER_MO = 600;
const LOCAL_BASE = 2655;
const LOCAL_SLOPE = 12.9;

export const ThumbnailROI: React.FC<ThumbnailROIProps> = ({
  themeId,
  eyebrow = DEFAULTS.eyebrow,
  savingsTag = DEFAULTS.savingsTag,
  savings = DEFAULTS.savings,
  savingsCaption = DEFAULTS.savingsCaption,
  peakLabel = DEFAULTS.peakLabel,
  cloudLabel = DEFAULTS.cloudLabel,
  nodeLabel = DEFAULTS.nodeLabel,
  nodeSub = DEFAULTS.nodeSub,
  localLabel = DEFAULTS.localLabel,
}) => {
  const theme = getTheme(themeId);
  const rgb = hexToRgb(theme.accent);
  const costRgb = hexToRgb(COST);

  const cloudA = { x: mx(0), y: vy(0) };
  const cloudB = { x: mx(12), y: vy(CLOUD_PER_MO * 12) };
  const localA = { x: mx(0), y: vy(LOCAL_BASE) };
  const localB = { x: mx(12), y: vy(LOCAL_BASE + LOCAL_SLOPE * 12) };

  // Crossover: 600m = 2655 + 12.9m  ->  m = 2655 / (600 - 12.9) ≈ 4.52 ("~month 5").
  const mc = LOCAL_BASE / (CLOUD_PER_MO - LOCAL_SLOPE);
  const node = { x: mx(mc), y: vy(CLOUD_PER_MO * mc) };

  const cloudArea = `M ${cloudA.x} ${PLOT.yBot} L ${cloudA.x} ${cloudA.y} L ${cloudB.x} ${cloudB.y} L ${cloudB.x} ${PLOT.yBot} Z`;
  // The savings wedge: the triangle between the two lines AFTER the crossover. It widens
  // to the right because every month you keep more — the single most important visual.
  const savingsWedge = `M ${node.x} ${node.y} L ${cloudB.x} ${cloudB.y} L ${localB.x} ${localB.y} Z`;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        fontFamily: theme.fontDisplay,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="cloudfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COST} stopOpacity={0.18} />
            <stop offset="100%" stopColor={COST} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="savefill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.12} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0.42} />
          </linearGradient>
          <radialGradient id="nodeglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.6} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* faint dashboard grid */}
        {Array.from({ length: 3 }).map((_, i) => {
          const y = PLOT.yTop + ((PLOT.yBot - PLOT.yTop) / 3) * (i + 1);
          return <line key={`h${i}`} x1={PLOT.x0} x2={PLOT.x1} y1={y} y2={y} stroke={theme.grid} strokeWidth={1} />;
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = mx((i + 1) * 2);
          return <line key={`v${i}`} x1={x} x2={x} y1={PLOT.yTop} y2={PLOT.yBot} stroke={theme.grid} strokeWidth={1} />;
        })}

        {/* cloud cost area + line (rising = danger) */}
        <path d={cloudArea} fill="url(#cloudfill)" />
        {/* the savings wedge — the money you keep, sitting on top so its edges are crisp */}
        <path d={savingsWedge} fill="url(#savefill)" />

        <line
          x1={cloudA.x} y1={cloudA.y} x2={cloudB.x} y2={cloudB.y}
          stroke={COST} strokeWidth={12} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 18px rgba(${costRgb}, 0.75))` }}
        />
        {/* local line (flat = smart money) */}
        <line
          x1={localA.x} y1={localA.y} x2={localB.x} y2={localB.y}
          stroke={theme.accent} strokeWidth={12} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 18px rgba(${rgb}, 0.75))` }}
        />

        {/* endpoint dots */}
        <circle cx={cloudB.x} cy={cloudB.y} r={13} fill={COST} />
        <circle cx={localB.x} cy={localB.y} r={13} fill={theme.accent} />

        {/* connector from the node down to its label */}
        <line x1={node.x} y1={node.y + 18} x2={node.x} y2={node.y + 70} stroke={theme.accent} strokeWidth={2} opacity={0.7} strokeDasharray="3 7" />

        {/* crossover node — the break-even point */}
        <circle cx={node.x} cy={node.y} r={62} fill="url(#nodeglow)" />
        <circle cx={node.x} cy={node.y} r={24} fill="none" stroke={theme.accent} strokeWidth={3} opacity={0.55} />
        <circle cx={node.x} cy={node.y} r={14} fill={theme.accent} stroke={theme.bgTo} strokeWidth={5}
          style={{ filter: `drop-shadow(0 0 18px rgba(${rgb}, 1))` }} />
      </svg>

      {/* TOP-LEFT: eyebrow + the hero payoff number */}
      <div style={{ position: "absolute", left: 74, top: 62, width: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: theme.accent, boxShadow: `0 0 16px rgba(${rgb}, 0.9)` }} />
          <span style={{ fontFamily: theme.fontMono, fontSize: 23, letterSpacing: 3, textTransform: "uppercase", color: theme.muted }}>
            {eyebrow}
          </span>
        </div>
        <div style={{ fontFamily: theme.fontMono, fontSize: 30, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", color: theme.text, opacity: 0.92, marginBottom: 2 }}>
          {savingsTag}
        </div>
        <div
          style={{
            fontSize: 168,
            fontWeight: 800,
            lineHeight: 0.92,
            letterSpacing: -3,
            color: theme.accent,
            textShadow: `0 0 60px rgba(${rgb}, 0.6)`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {savings}
        </div>
        <div style={{ fontFamily: theme.fontMono, fontSize: 28, fontWeight: 700, letterSpacing: 7, textTransform: "uppercase", color: theme.text, opacity: 0.85, marginTop: 6 }}>
          {savingsCaption}
        </div>
      </div>

      {/* cloud peak label ($7,200/yr) at the top of the rising line */}
      <div style={{ position: "absolute", left: cloudB.x - 392, top: cloudB.y - 142, width: 380, textAlign: "right" }}>
        <div style={{ fontFamily: theme.fontMono, fontSize: 23, letterSpacing: 3, textTransform: "uppercase", color: COST, opacity: 0.92 }}>
          {cloudLabel}
        </div>
        <div style={{ fontSize: 62, fontWeight: 800, color: COST, lineHeight: 1.04, textShadow: `0 0 36px rgba(${costRgb}, 0.5)` }}>
          {peakLabel}
        </div>
      </div>

      {/* local line tag (rides just above the flat line, far left) */}
      <div
        style={{
          position: "absolute",
          left: localA.x + 14,
          top: localA.y - 44,
          fontFamily: theme.fontMono,
          fontSize: 25,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: theme.accent,
        }}
      >
        {localLabel}
      </div>

      {/* MONTH 5 break-even pill, hung under the node */}
      <div
        style={{
          position: "absolute",
          left: node.x - 150,
          top: node.y + 78,
          width: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "8px 26px",
            borderRadius: 14,
            background: `rgba(${rgb}, 0.12)`,
            border: `2px solid ${theme.accent}`,
            boxShadow: `0 0 40px rgba(${rgb}, 0.45)`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, color: theme.accent, lineHeight: 1, textShadow: `0 0 30px rgba(${rgb}, 0.7)` }}>
            {nodeLabel}
          </div>
        </div>
        <div style={{ fontFamily: theme.fontMono, fontSize: 21, letterSpacing: 5, textTransform: "uppercase", color: theme.muted, marginTop: 10 }}>
          {nodeSub}
        </div>
      </div>
    </AbsoluteFill>
  );
};
