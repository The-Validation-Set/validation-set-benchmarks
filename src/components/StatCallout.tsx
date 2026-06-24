import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { StatCalloutData } from "../types";
import { hexToRgb, type Theme, type Variant } from "../theme";
import { CountUp, parseStatValue } from "../animation";

interface Props {
  data: StatCalloutData;
  theme: Theme;
  /** Stable per-scene seed (paragraph_id) so consecutive callouts alternate colour. */
  seed?: number;
  /** Per-render geometry (alignment / accent motif / entrance) — anti-template. */
  variant?: Variant;
  durationInFrames: number;
}

/** Big-number tiers so short stats read huge and long phrases still fit one card. */
function valueFontSize(len: number): number {
  if (len <= 4) return 240;
  if (len <= 7) return 184;
  if (len <= 11) return 134;
  if (len <= 16) return 104;
  if (len <= 24) return 78;
  return 62;
}

/**
 * Animated stat card: accent motif, eyebrow label, a large value that springs in
 * over a soft radial glow (numeric values COUNT UP via <CountUp/>), an animated
 * underline, then a context line. Colour alternates by `seed`; the alignment /
 * accent motif / entrance come from `variant` so a run of callouts never looks like
 * the same repeated template (the render-variance rule anti-"repetitious" requirement). The scene
 * dissolve in/out is handled by the <SceneTransition/> wrapper in TimelineManager.
 */
export const StatCallout: React.FC<Props> = ({ data, theme, seed = 0, variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const label = data.label ?? "";
  const value = data.value ?? "";
  const context = data.context ?? "";
  const parsed = parseStatValue(value);

  const align = variant?.statAlign ?? "center";
  const motif = variant?.accentMotif ?? "tick";
  const entrance = variant?.entrance ?? "lift";
  const left = align === "left";

  const primary = seed % 2 === 1 ? theme.secondary : theme.accent;
  const secondary = seed % 2 === 1 ? theme.accent : theme.secondary;

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  const valuePop = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 13, stiffness: 120, mass: 0.85 },
  });

  const labelShift = interpolate(frame, [0, fps * 0.4], [18, 0], { extrapolateRight: "clamp" });
  const labelOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp" });
  const underline = interpolate(frame, [fps * 0.3, fps * 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctxOpacity = interpolate(frame, [fps * 0.55, fps * 0.95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctxShift = interpolate(frame, [fps * 0.55, fps * 0.95], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const vSize = valueFontSize(value.length);
  const containerTransform =
    entrance === "scale"
      ? `scale(${interpolate(enter, [0, 1], [0.92, 1])})`
      : `translateY(${(1 - enter) * 28}px)`;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        justifyContent: "center",
        alignItems: left ? "flex-start" : "center",
        padding: left ? "0 9%" : 0,
        opacity: enter,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: left ? "flex-start" : "center",
          textAlign: left ? "left" : "center",
          maxWidth: left ? "82%" : "84%",
          transform: containerTransform,
        }}
      >
        <AccentMotif motif={motif} color={primary} reveal={underline} opacity={labelOpacity} />

        {label ? (
          <div
            style={{
              fontFamily: theme.fontMono,
              fontSize: 32,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: theme.muted,
              opacity: labelOpacity,
              transform: `translateY(${labelShift}px)`,
              marginBottom: 18,
            }}
          >
            {label}
          </div>
        ) : null}

        {/* Value with soft radial glow behind it */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: left ? "flex-start" : "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-40% -10%",
              background: `radial-gradient(closest-side, rgba(${hexToRgb(primary)}, 0.28), transparent)`,
              opacity: valuePop,
            }}
          />
          <div
            style={{
              position: "relative",
              fontFamily: theme.fontDisplay,
              fontSize: vSize,
              fontWeight: 800,
              lineHeight: 1.02,
              color: primary,
              textShadow: `0 0 60px rgba(${hexToRgb(primary)}, 0.45)`,
              transform: `scale(${interpolate(valuePop, [0, 1], [0.72, 1])})`,
              transformOrigin: left ? "left center" : "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {parsed ? (
              <CountUp
                target={parsed.target}
                prefix={parsed.prefix}
                suffix={parsed.suffix}
                decimals={parsed.decimals}
                delay={6}
                durationInFrames={28}
              />
            ) : (
              value
            )}
          </div>
        </div>

        {/* Animated underline */}
        <div
          style={{
            width: Math.min(640, Math.max(220, value.length * 26)),
            height: 4,
            marginTop: 16,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${primary}, ${secondary})`,
            transform: `scaleX(${underline})`,
            transformOrigin: left ? "left" : "center",
            opacity: 0.9,
          }}
        />

        {context ? (
          <div
            style={{
              fontFamily: theme.fontDisplay,
              fontSize: 38,
              color: theme.text,
              opacity: 0.9 * ctxOpacity,
              transform: `translateY(${ctxShift}px)`,
              marginTop: 30,
              maxWidth: 1200,
            }}
          >
            {context}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** The small shape above the label — varies per render (tick | bar | dot). */
const AccentMotif: React.FC<{
  motif: "tick" | "bar" | "dot";
  color: string;
  reveal: number;
  opacity: number;
}> = ({ motif, color, reveal, opacity }) => {
  const glow = `0 0 18px ${color}`;
  if (motif === "dot") {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: color,
          boxShadow: glow,
          opacity,
          marginBottom: 26,
          transform: `scale(${0.4 + 0.6 * reveal})`,
        }}
      />
    );
  }
  const isBar = motif === "bar";
  return (
    <div
      style={{
        width: isBar ? 88 : 64,
        height: isBar ? 8 : 5,
        borderRadius: 4,
        background: color,
        boxShadow: glow,
        opacity,
        marginBottom: 26,
        transform: `scaleX(${0.3 + 0.7 * reveal})`,
      }}
    />
  );
};
