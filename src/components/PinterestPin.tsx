import React from "react";
import { AbsoluteFill } from "remotion";
import { getTheme, getVariant, hexToRgb } from "../theme";

export interface PinterestPinProps {
  themeId?: string | number;
  eyebrow?: string;
  headline?: string;
  statValue?: string;
  context?: string;
  footer?: string;
}

/** Big-number tiers (same philosophy as StatCallout) for a 1000px-wide canvas. */
function valueFontSize(len: number): number {
  if (len <= 4) return 220;
  if (len <= 7) return 168;
  if (len <= 11) return 122;
  if (len <= 16) return 94;
  if (len <= 24) return 70;
  return 54;
}

/**
 * 1000x1500 vertical Pinterest infographic pin — a static stat card sharing the
 * channel's theme system, so every pin inherits per-render colour/font/layout
 * variance (anti-template, consistent with the render-variance rule). Pure vector + text: crisp
 * at native res, no --scale needed. Rendered via distribution/render_pins.sh.
 */
export const PinterestPin: React.FC<PinterestPinProps> = ({
  themeId,
  eyebrow = "DATA_MEASURED",
  headline = "The benchmark",
  statValue = "15/15",
  context = "measured on real hardware, deterministic grader",
  footer = "The Validation Set · full teardown on YouTube",
}) => {
  const theme = getTheme(themeId);
  const variant = getVariant(themeId);
  const align = variant.statAlign === "left" ? "flex-start" : "center";
  const textAlign = variant.statAlign === "left" ? ("left" as const) : ("center" as const);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.bgFrom}, ${theme.bgTo})`,
        fontFamily: theme.fontDisplay,
        color: theme.text,
        padding: "90px 80px",
        justifyContent: "space-between",
        alignItems: align,
      }}
    >
      {/* soft radial glow behind the value */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(${hexToRgb(theme.accent)}, 0.16), transparent 55%)`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 28, zIndex: 1 }}>
        <div
          style={{
            fontFamily: theme.fontMono,
            fontSize: 26,
            letterSpacing: 6,
            color: theme.accent,
            border: `2px solid rgba(${hexToRgb(theme.accent)}, 0.45)`,
            borderRadius: 999,
            padding: "12px 28px",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08, textAlign, maxWidth: 840 }}>
          {headline}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 36, zIndex: 1 }}>
        <div
          style={{
            fontSize: valueFontSize(statValue.length),
            fontWeight: 900,
            color: theme.accent,
            lineHeight: 1,
            textAlign,
            textShadow: `0 0 80px rgba(${hexToRgb(theme.accent)}, 0.35)`,
          }}
        >
          {statValue}
        </div>
        <div style={{ width: 180, height: 8, background: theme.secondary, borderRadius: 4 }} />
        <div style={{ fontSize: 34, color: theme.muted, lineHeight: 1.45, textAlign, maxWidth: 800 }}>
          {context}
        </div>
      </div>
      <div
        style={{
          zIndex: 1,
          fontFamily: theme.fontMono,
          fontSize: 26,
          color: theme.muted,
          borderTop: `1px solid ${theme.grid}`,
          paddingTop: 28,
          width: "100%",
          textAlign,
        }}
      >
        {footer}
      </div>
    </AbsoluteFill>
  );
};
