import React from "react";
import { AbsoluteFill } from "remotion";
import { getTheme, hexToRgb } from "../theme";

/**
 * High-CTR YouTube thumbnail (1280x720) -- the "shock stat-card" archetype, rendered
 * with `npx remotion still ThumbnailStat`. Used for the COST-TRAP episode (EP001):
 * the hero is a single alarming recurring number ("$7,200/yr to rent ONE agent") and a
 * "rent-treadmill" bar climb that shows the bill compounding year after year. Pure
 * data-viz + bold type only (no faces / photoreal scenes, per the render-variance rule), fully
 * theme-driven so colours/fonts vary per render via `themeId`.
 *
 * Deliberately a DIFFERENT layout from ThumbnailROI's break-even chart so a run of
 * episodes shares a channel look without being one fingerprintable template: EP001 =
 * stat-card (the problem / big cost), EP002 = break-even chart (the payoff / savings).
 * Every string is a prop with a default, so the Python launcher can override via --props.
 */
export interface ThumbnailProps {
  /** Per-render colour/font variance (the render-variance rule). */
  themeId?: string | number;
  /** Headline. Keep to ~3-5 words so it stays legible at thumbnail scale. */
  title?: string;
  /** One word in `title` to paint with the accent colour (case-insensitive match). */
  highlight?: string;
  /** Eyebrow label above the headline. */
  eyebrow?: string;
  /** The hero stat, e.g. "$7,200". */
  metric?: string;
  /** Small unit appended to the metric, e.g. "/yr". */
  metricUnit?: string;
  /** Caption at the top of the stat card, e.g. "MANAGED API". */
  metricCaption?: string;
  /** Visceral sub-line under the metric, e.g. "to rent ONE agent". */
  metricSub?: string;
  /** Heights for the rent-treadmill bars (the recurring-cost motif). */
  bars?: number[];
}

const DEFAULTS: Required<Omit<ThumbnailProps, "themeId">> = {
  title: "Stop renting your AI.",
  highlight: "renting",
  eyebrow: "Managed cloud API · 2026",
  metric: "$7,200",
  metricUnit: "/yr",
  metricCaption: "Managed API",
  metricSub: "to rent ONE agent",
  bars: [1, 2, 3, 4, 5],
};

const W = 1280;
const H = 720;

// Stat-card (right zone) geometry.
const CARD_W = 500;
const CARD_H = 580;
const CARD_X = W - CARD_W - 70;
const CARD_Y = (H - CARD_H) / 2;
const PAD = 44;
const VIZ_W = CARD_W - PAD * 2;
const VIZ_H = 150;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/gi, "");

export const Thumbnail: React.FC<ThumbnailProps> = ({
  themeId,
  title = DEFAULTS.title,
  highlight = DEFAULTS.highlight,
  eyebrow = DEFAULTS.eyebrow,
  metric = DEFAULTS.metric,
  metricUnit = DEFAULTS.metricUnit,
  metricCaption = DEFAULTS.metricCaption,
  metricSub = DEFAULTS.metricSub,
  bars = DEFAULTS.bars,
}) => {
  const theme = getTheme(themeId);
  const rgb = hexToRgb(theme.accent);
  const words = title.split(" ");
  const hl = normalize(highlight);

  // Rent-treadmill bars: a rising staircase = the bill that keeps climbing every year.
  const maxBar = Math.max(...bars, 1);
  const gap = 16;
  const barW = (VIZ_W - gap * (bars.length - 1)) / bars.length;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        fontFamily: theme.fontDisplay,
      }}
    >
      {/* Background: data-dashboard grid + an accent glow behind the card. */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="thumb-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.3} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="bar-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.55} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={1} />
          </linearGradient>
        </defs>
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={`h${i}`} x1={0} x2={W} y1={(H / 6) * (i + 1)} y2={(H / 6) * (i + 1)} stroke={theme.grid} strokeWidth={1} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`v${i}`} y1={0} y2={H} x1={(W / 8) * (i + 1)} x2={(W / 8) * (i + 1)} stroke={theme.grid} strokeWidth={1} />
        ))}
        <circle cx={CARD_X + CARD_W / 2} cy={CARD_Y + CARD_H / 2} r={400} fill="url(#thumb-glow)" />
      </svg>

      {/* LEFT: eyebrow + headline. */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 0,
          bottom: 0,
          width: CARD_X - 72 - 40,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: theme.accent, boxShadow: `0 0 18px rgba(${rgb}, 0.9)` }} />
          <span style={{ fontFamily: theme.fontMono, fontSize: 27, letterSpacing: 4, textTransform: "uppercase", color: theme.muted }}>
            {eyebrow}
          </span>
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1.5, color: theme.text }}>
          {words.map((w, i) => {
            const isHL = normalize(w) === hl && hl.length > 0;
            return (
              <span key={i} style={{ color: isHL ? theme.accent : theme.text, textShadow: isHL ? `0 0 44px rgba(${rgb}, 0.5)` : "none" }}>
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      </div>

      {/* RIGHT: stat card. */}
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          background: theme.panel,
          border: `1px solid ${theme.grid}`,
          borderRadius: 28,
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.55)",
          padding: PAD,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: theme.fontMono, fontSize: 27, letterSpacing: 3, textTransform: "uppercase", color: theme.muted }}>
          {metricCaption}
        </div>

        {/* hero number + visceral sub */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div
              style={{
                fontSize: 132,
                fontWeight: 800,
                lineHeight: 0.95,
                color: theme.accent,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 50px rgba(${rgb}, 0.55)`,
              }}
            >
              {metric}
            </div>
            {metricUnit ? (
              <div style={{ fontSize: 50, fontWeight: 800, color: theme.accent, opacity: 0.85 }}>{metricUnit}</div>
            ) : null}
          </div>
          {metricSub ? (
            <div style={{ fontFamily: theme.fontMono, fontSize: 28, letterSpacing: 1, textTransform: "uppercase", color: theme.text, opacity: 0.9, marginTop: 8 }}>
              {metricSub}
            </div>
          ) : null}
        </div>

        {/* rent-treadmill: bars climbing year after year */}
        <svg width={VIZ_W} height={VIZ_H} style={{ overflow: "visible" }}>
          <line x1={0} x2={VIZ_W} y1={VIZ_H} y2={VIZ_H} stroke={theme.grid} strokeWidth={2} />
          {bars.map((v, i) => {
            const h = Math.max(8, (v / maxBar) * (VIZ_H - 10));
            const x = i * (barW + gap);
            const isLast = i === bars.length - 1;
            return (
              <rect
                key={i}
                x={x}
                y={VIZ_H - h}
                width={barW}
                height={h}
                rx={6}
                fill="url(#bar-grad)"
                style={isLast ? { filter: `drop-shadow(0 0 18px rgba(${rgb}, 0.85))` } : undefined}
              />
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
