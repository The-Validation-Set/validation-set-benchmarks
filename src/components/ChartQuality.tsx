import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChartQualityData } from "../types";
import { hexToRgb, type Theme, type Variant } from "../theme";
import { EASE_OUT, EASE_OUT_BACK } from "../animation";

interface Props {
  data: ChartQualityData;
  theme: Theme;
  variant?: Variant;
  durationInFrames: number;
}

// Semantic "can't use it" colour, independent of the palette (matches ChartScaling).
const DANGER = "#FB7185";

const niceCeil = (v: number, step: number) => Math.max(step, Math.ceil(v / step) * step);

/** Parse the parameter count out of a label like "3B" / "14B" -> 3 / 14 (for bubble size). */
const paramOf = (label: string): number => {
  const m = String(label).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 7;
};

/**
 * EP004 centrepiece: the quality-vs-speed frontier on ONE 8GB rig. x = throughput
 * (tok/s), y = verifiable accuracy (% of graded tasks correct). A dashed "usable
 * floor" (EP003's readable-speed line, reused) cuts the plane in two and the slow
 * half is shaded: models to the RIGHT are fast enough to actually use, models to the
 * LEFT are smart-but-stranded (swap-thrashed under 8GB). Each model is a bubble sized
 * by its parameter count -- so the eye sees the big, smart models pinned in the
 * unusable zone while the little one that fits sits alone on the usable side. Bubbles
 * pop in with a slight overshoot; colour does the shouting, not motion.
 */
export const ChartQuality: React.FC<Props> = ({ data, theme, variant, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labels = data.models ?? [];
  const acc = data.accuracy_pct ?? [];
  const tok = data.tok_s ?? [];
  const usable = data.usable ?? [];
  const timeouts = data.timeouts ?? [];
  const len = Math.min(labels.length, acc.length, tok.length);
  const idx = Array.from({ length: len }, (_, i) => i);
  const floor = data.usable_floor_tok_s ?? 6;

  // ---- plot geometry (SVG user units) ----
  const W = 1600, H = 760;
  const L = 160, R = 1440, T = 96 * (variant?.chartPadTopScale ?? 1), B = 560;
  const plotW = R - L, plotH = B - T;

  // x: speed. Keep the floor line off the left edge and leave headroom past the fastest.
  const xMax = niceCeil(Math.max(floor * 2.2, ...tok.map((v) => v * 1.15), 5), 5);
  const xAt = (v: number) => L + (Math.min(Math.max(v, 0), xMax) / xMax) * plotW;
  const yAt = (pct: number) => B - (Math.min(Math.max(pct, 0), 100) / 100) * plotH;
  const xFloor = xAt(floor);

  // ---- timing ----
  const head = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp", easing: EASE_OUT });
  const zone = interpolate(frame, [4, 4 + fps * 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 5%",
      }}
    >
      <div style={{ opacity: head, textAlign: "center", marginBottom: 6 }}>
        {data.title ? (
          <div style={{ fontFamily: theme.fontDisplay, fontSize: 50, fontWeight: 700, color: theme.text, lineHeight: 1.05 }}>
            {data.title}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 34, justifyContent: "center", marginTop: 18, fontFamily: theme.fontMono, fontSize: 23 }}>
          <Legend swatch={theme.accent} label="fast enough to use" glow />
          <Legend swatch={DANGER} label="too slow / won't fit on 8GB" />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 1500 }}>
        {/* unusable (too-slow) zone: everything left of the usable floor */}
        <rect x={L} y={T} width={Math.max(0, xFloor - L)} height={plotH} fill={`rgba(${hexToRgb(DANGER)}, 0.07)`} style={{ opacity: zone }} />

        {/* horizontal gridlines + accuracy axis */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, k) => (
          <g key={`g${k}`}>
            <line x1={L} x2={R} y1={B - g * plotH} y2={B - g * plotH} stroke={theme.grid} strokeWidth={1} />
            <text x={L - 18} y={B - g * plotH + 7} textAnchor="end" fontFamily={theme.fontMono} fontSize={22} fill={theme.muted} style={{ opacity: head }}>
              {Math.round(g * 100)}
            </text>
          </g>
        ))}
        <text x={L - 18} y={T - 26} textAnchor="end" fontFamily={theme.fontMono} fontSize={22} fill={theme.accent} style={{ opacity: head }}>% correct</text>

        {/* usable floor: the vertical line that splits usable from stranded */}
        <line x1={xFloor} x2={xFloor} y1={T - 8} y2={B} stroke={DANGER} strokeWidth={2} strokeDasharray="10 8" opacity={0.75 * zone} />
        <text x={xFloor} y={T - 20} textAnchor="middle" fontFamily={theme.fontMono} fontSize={22} fill={DANGER} opacity={zone}>
          usable floor · {floor} tok/s
        </text>

        {/* speed axis ticks */}
        {[0, floor, xMax / 2, xMax].map((v, k) => (
          <text key={`xt${k}`} x={xAt(v)} y={B + 44} textAnchor="middle" fontFamily={theme.fontMono} fontSize={24} fill={theme.muted} style={{ opacity: head }}>
            {Math.round(v)}
          </text>
        ))}
        <text x={(L + R) / 2} y={B + 92} textAnchor="middle" fontFamily={theme.fontMono} fontSize={24} fill={theme.muted} style={{ opacity: head }}>
          speed → tokens / sec
        </text>

        {/* model bubbles, sized by parameter count */}
        {idx.map((i) => {
          const cx = xAt(tok[i]);
          const cy = yAt(acc[i]);
          const isUsable = !!usable[i];
          const color = isUsable ? theme.accent : DANGER;
          const r = Math.min(58, 20 + Math.sqrt(paramOf(labels[i])) * 7);
          const pop = interpolate(frame, [10 + i * 6, 10 + i * 6 + 16], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_BACK,
          });
          const walled = (timeouts[i] ?? 0) > 0;
          return (
            <g key={`m${i}`} style={{ opacity: pop }} transform={`translate(${cx}, ${cy})`}>
              <circle
                r={r * pop}
                fill={`rgba(${hexToRgb(color)}, ${isUsable ? 0.22 : 0.16})`}
                stroke={color}
                strokeWidth={isUsable ? 4 : 3}
                style={{ filter: isUsable ? `drop-shadow(0 0 16px rgba(${hexToRgb(color)}, 0.55))` : "none" }}
              />
              <text textAnchor="middle" y={-r - 18} fontFamily={theme.fontDisplay} fontSize={34} fontWeight={800} fill={color}>
                {labels[i]}
              </text>
              <text textAnchor="middle" y={12} fontFamily={theme.fontDisplay} fontSize={34} fontWeight={800} fill={theme.text}>
                {Math.round(acc[i])}%
              </text>
              {walled && (
                <text textAnchor="middle" y={r + 34} fontFamily={theme.fontMono} fontSize={20} fill={DANGER}>
                  swap wall
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Legend: React.FC<{ swatch: string; label: string; glow?: boolean }> = ({ swatch, label, glow }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 18, height: 18, borderRadius: 9, background: swatch, boxShadow: glow ? `0 0 12px ${swatch}` : "none" }} />
    <span style={{ color: swatch }}>{label}</span>
  </div>
);
