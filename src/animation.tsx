import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
} from "remotion";

/**
 * Shared motion-design system for "The Validation Set" render engine.
 *
 * One easing + transition vocabulary so every component animates the same way and
 * the video reads as a single production (not a scaffolded template). Built only on
 * Remotion primitives (interpolate / spring / Easing) -- no extra dependencies.
 */

// ---------------------------------------------------------------------------
// Easing presets (cubic-bezier). Replace linear interpolate() defaults.
// ---------------------------------------------------------------------------

/** Snappy decelerate -- the default for entrances, line draws and count-ups. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
/** Symmetric accelerate/decelerate -- good for exits and cross-fades. */
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
/** Slight overshoot + settle ("follow-through") -- for bars / emphasis pops. */
export const EASE_OUT_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

// ---------------------------------------------------------------------------
// Spring presets (mirror StatCallout's original tuned springs).
// ---------------------------------------------------------------------------

/** Calm settle for whole-element entrances. */
export const enterSpring = (frame: number, fps: number, delay = 0): number =>
  spring({ frame, fps, delay, config: { damping: 200 }, durationInFrames: 16 });

/** Bouncy pop for a hero value/number. */
export const popSpring = (frame: number, fps: number, delay = 5): number =>
  spring({ frame, fps, delay, config: { damping: 13, stiffness: 120, mass: 0.85 } });

// ---------------------------------------------------------------------------
// Enter / exit envelope -- kills hard cuts by dissolving every scene in and out.
// ---------------------------------------------------------------------------

export interface EnterExit {
  /** Combined in/out opacity, 0..1. */
  opacity: number;
  /** Pixels to translate on entry (eases to 0), for a subtle lift. */
  translateY: number;
  /** Subtle scale, ~0.985..1. */
  scale: number;
  /** Raw entrance progress 0..1. */
  enter: number;
  /** Raw exit progress 0..1 (1 = fully gone). */
  exit: number;
}

export interface EnterExitOpts {
  inFrames?: number;
  outFrames?: number;
  lift?: number;
}

/**
 * Entrance + exit envelope based on the LOCAL frame inside a <Sequence>. Because it
 * only reads local time it never touches the audio-pinned Sequence placement, so it
 * is sync-safe. `durationInFrames` is the Sequence length.
 */
export function useEnterExit(
  durationInFrames: number,
  opts: EnterExitOpts = {}
): EnterExit {
  const frame = useCurrentFrame();
  const inFrames = opts.inFrames ?? 12;
  const outFrames = opts.outFrames ?? 12;
  const lift = opts.lift ?? 0;

  const enter = interpolate(frame, [0, inFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const exitStart = Math.max(inFrames, durationInFrames - outFrames);
  const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  return {
    enter,
    exit,
    opacity: Math.max(0, enter - exit),
    translateY: (1 - enter) * lift,
    scale: 0.985 + enter * 0.015,
  };
}

// ---------------------------------------------------------------------------
// SceneTransition -- wrap a cue so consecutive scenes cross-dissolve through the
// shared TimelineManager background instead of hard-cutting.
// ---------------------------------------------------------------------------

export const SceneTransition: React.FC<{
  durationInFrames: number;
  inFrames?: number;
  outFrames?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, inFrames, outFrames, children }) => {
  const { opacity } = useEnterExit(durationInFrames, { inFrames, outFrames });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// CountUp -- animate a number 0 -> target. Structured props (NOT a regex over a
// formatted string) so it never silently drops to static on odd inputs.
// ---------------------------------------------------------------------------

export interface CountUpProps {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Frames to count over (after `delay`). */
  durationInFrames?: number;
  delay?: number;
  /** Insert thousands separators (default true). */
  group?: boolean;
  style?: React.CSSProperties;
}

function formatNumber(n: number, decimals: number, group: boolean): string {
  const fixed = n.toFixed(decimals);
  if (!group) return fixed;
  const parts = fixed.split(".");
  const grouped = (parts[0] ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts[1] ? `${grouped}.${parts[1]}` : grouped;
}

export const CountUp: React.FC<CountUpProps> = ({
  target,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationInFrames = 26,
  delay = 6,
  group = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {formatNumber(target * p, decimals, group)}
      {suffix}
    </span>
  );
};

export interface ParsedStatValue {
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
}

/**
 * Convenience parser for an authored StatCallout `value` STRING. Returns null when
 * the string has zero or MORE THAN ONE numeric run -- pure-text values ("Own the
 * stack") and multi-number head-to-heads ("42 vs 78") are then rendered statically
 * (the latter belong in <ChartBars/>, which animates each number on its own).
 */
export function parseStatValue(value: string): ParsedStatValue | null {
  const matches = value.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!matches || matches.length !== 1) return null;
  const numStr = matches[0];
  // A leading-zero integer (e.g. "LLM01") is an identifier, not a stat — counting
  // it up would drop the zero ("01" -> "1"). Render the whole value literally.
  if (/^0\d/.test(numStr.replace(/,/g, ""))) return null;
  const idx = value.indexOf(numStr);
  const cleaned = numStr.replace(/,/g, "");
  const target = parseFloat(cleaned);
  if (!Number.isFinite(target)) return null;
  const frac = cleaned.split(".")[1];
  return {
    target,
    prefix: value.slice(0, idx),
    suffix: value.slice(idx + numStr.length),
    decimals: frac ? frac.length : 0,
  };
}

// ---------------------------------------------------------------------------
// KineticText -- word-by-word reveal with an optional accent word, for the hook.
// ---------------------------------------------------------------------------

export const KineticText: React.FC<{
  text: string;
  highlight?: string;
  accent?: string;
  delayPerWord?: number;
  startDelay?: number;
  style?: React.CSSProperties;
}> = ({ text, highlight, accent, delayPerWord = 3, startDelay = 0, style }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const hl = highlight ? highlight.toLowerCase() : null;
  return (
    <span style={style}>
      {words.map((w, i) => {
        const start = startDelay + i * delayPerWord;
        const appear = interpolate(frame, [start, start + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        const isHl =
          hl !== null && w.toLowerCase().replace(/[^\w]/g, "").includes(hl);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: appear,
              transform: `translateY(${(1 - appear) * 14}px)`,
              color: isHl && accent ? accent : undefined,
              marginRight: "0.28em",
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
};
