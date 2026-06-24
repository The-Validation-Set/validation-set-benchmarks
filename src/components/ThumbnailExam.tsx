import React from "react";
import { AbsoluteFill } from "remotion";
import { getTheme, hexToRgb } from "../theme";

/**
 * EP006 "exam scorecard" thumbnail archetype (1280x720). A new layout in the
 * thumbnail family (EP001 stat-card, EP002 break-even chart, EP003 swarm collapse,
 * EP004 speed×accuracy scatter) so consecutive episodes never share a fingerprintable
 * template: the hero is a GRADE ("15/15") over two rows of per-task tick marks that
 * make the frontier-vs-local gap legible at feed size — one row flawless, one row
 * with its failures marked ✕. Pure type + marks, no faces/photoreal (the render-variance rule),
 * fully theme-driven via `themeId`; every string/number is a prop with a default so
 * render.sh / --props can override.
 *
 * Eyeball / render:
 *   npx remotion still ThumbnailFableExam ../../exports/thumbnail.ep006.png --props='{"themeId":3}'
 * For the EP006 final render, repoint the `Thumbnail` Still at this component so
 * render.sh's `still Thumbnail` emits it (same swap EP004/EP005 used).
 */

// Semantic "wrong answer" colour, independent of the palette (matches ChartQuality/ChartScaling).
const DANGER = "#FB7185";
const GOOD_FALLBACK = "#26F0AA";

export interface ScoreRow {
  /** Row label, e.g. "CLAUDE FABLE 5". */
  label: string;
  /** Ticks drawn. */
  total: number;
  /** First `correct` ticks are ✓ (accent); the rest are ✕ (danger). */
  correct: number;
  /** Right-aligned mini-grade, e.g. "15/15". */
  grade: string;
}

export interface ThumbnailExamProps {
  themeId?: string | number;
  /** Headline, ~4-6 words. */
  title?: string;
  /** One word in `title` painted in the accent colour (case-insensitive). */
  highlight?: string;
  eyebrow?: string;
  /** Hero grade on the card. */
  grade?: string;
  /** Caption above the hero grade. */
  gradeCaption?: string;
  /** Visceral sub-line under the tick rows. */
  gradeSub?: string;
  rows?: ScoreRow[];
}

const DEFAULTS: Required<Omit<ThumbnailExamProps, "themeId">> = {
  title: "Perfect score. Brutal price.",
  highlight: "Brutal",
  eyebrow: "Same 15-task exam · same grader",
  grade: "15/15",
  gradeCaption: "Claude Fable 5",
  gradeSub: "657× the price per correct answer",
  rows: [
    { label: "FABLE 5 · API", total: 15, correct: 15, grade: "15/15" },
    { label: "LLAMA 8B · MY 8GB RIG", total: 15, correct: 13, grade: "13/15" },
  ],
};

const W = 1280;
const H = 720;
const CARD_W = 560;
const CARD_H = 600;
const CARD_X = W - CARD_W - 64;
const CARD_Y = (H - CARD_H) / 2;
const PAD = 40;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/gi, "");

const Tick: React.FC<{ ok: boolean; size: number; color: string }> = ({ ok, size, color }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 7,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.74,
      fontWeight: 900,
      lineHeight: 1,
      color: ok ? color : DANGER,
      background: ok ? `${color}1f` : `${DANGER}24`,
      border: `2.5px solid ${ok ? color : DANGER}`,
    }}
  >
    {ok ? "✓" : "✕"}
  </div>
);

export const ThumbnailExam: React.FC<ThumbnailExamProps> = ({
  themeId,
  title = DEFAULTS.title,
  highlight = DEFAULTS.highlight,
  eyebrow = DEFAULTS.eyebrow,
  grade = DEFAULTS.grade,
  gradeCaption = DEFAULTS.gradeCaption,
  gradeSub = DEFAULTS.gradeSub,
  rows = DEFAULTS.rows,
}) => {
  const theme = getTheme(themeId);
  const accent = theme.accent || GOOD_FALLBACK;
  const rgb = hexToRgb(accent);
  const words = title.split(" ");
  const hl = normalize(highlight);

  const tickSize = 27;
  const tickGap = 5;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        fontFamily: theme.fontDisplay,
      }}
    >
      {/* faint grid, house texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(${rgb}, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${rgb}, 0.05) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* left zone: eyebrow + headline */}
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 0,
          bottom: 0,
          width: W - CARD_W - 64 * 2 - 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: theme.fontMono,
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: `rgba(${rgb}, 0.95)`,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1.04, color: theme.text }}>
          {words.map((w, i) => (
            <span key={i} style={{ color: normalize(w) === hl ? accent : theme.text }}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 30, color: `${theme.text}B3`, fontWeight: 600 }}>
          measured · graded · re-runnable
        </div>
      </div>

      {/* right zone: the report card */}
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 28,
          padding: PAD,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(160deg, rgba(${rgb}, 0.16), rgba(${rgb}, 0.05))`,
          border: `3px solid rgba(${rgb}, 0.85)`,
          boxShadow: `0 0 90px rgba(${rgb}, 0.35)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fontMono,
            fontSize: 27,
            letterSpacing: 3.5,
            textTransform: "uppercase",
            color: `rgba(${rgb}, 0.95)`,
          }}
        >
          {gradeCaption}
        </div>

        <div style={{ fontSize: 188, fontWeight: 900, lineHeight: 0.95, color: theme.text }}>
          {grade}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontFamily: theme.fontMono,
                  fontSize: 21,
                  letterSpacing: 2,
                  color: `${theme.text}99`,
                }}
              >
                <span>{row.label}</span>
                <span style={{ color: theme.text, fontWeight: 800, fontSize: 25 }}>{row.grade}</span>
              </div>
              <div style={{ display: "flex", gap: tickGap }}>
                {Array.from({ length: row.total }, (_, i) => (
                  <Tick key={i} ok={i < row.correct} size={tickSize} color={accent} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 31, fontWeight: 800, color: theme.secondary ?? DANGER }}>
          {gradeSub}
        </div>
      </div>
    </AbsoluteFill>
  );
};
