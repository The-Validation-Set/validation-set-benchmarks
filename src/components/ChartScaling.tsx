import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChartScalingData } from "../types";
import { hexToRgb, type Theme, type Variant } from "../theme";
import { EASE_OUT } from "../animation";

interface Props {
  data: ChartScalingData;
  theme: Theme;
  variant?: Variant;
  durationInFrames: number;
}

// Semantic latency ramp (independent of the colour theme): fine -> hot -> on fire.
const WARN = "#F5B546";
const DANGER = "#FB7185";
const LAT_WARN_MS = 8000;
const LAT_DANGER_MS = 20000;

const niceCeil = (v: number, step: number) => Math.max(step, Math.ceil(v / step) * step);

/**
 * EP003 centrepiece: one rig under multi-agent load. A dual-axis plot where the
 * AGGREGATE throughput line stays flat (the box does a fixed amount of work) while
 * the EFFECTIVE per-agent line (= aggregate / N) collapses, and p99-latency bars
 * climb from neutral into a red zone behind them. A dashed "usable floor" + a knee
 * pill mark where the swarm stops being usable. Reveals left->right (a clip wipe),
 * so the collapse + the latency climb read as N grows. Restrained: colour does the
 * shouting, not motion. Robust to either a graceful fade or a cliff in the data.
 */
export const ChartScaling: React.FC<Props> = ({ data, theme, variant, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n = data.n ?? [];
  const agg = data.agg_tok_s ?? [];
  const eff = data.effective_per_agent_tok_s ?? [];
  const p99 = data.p99_ms ?? [];
  const len = Math.min(n.length, agg.length, eff.length, p99.length);
  const idx = Array.from({ length: len }, (_, i) => i);
  const floor = data.usable_floor_tok_s ?? 6;
  const kneeN = data.knee_n;
  const kneeI = kneeN != null ? n.indexOf(kneeN) : -1;

  // ---- plot geometry (SVG user units) ----
  const W = 1600, H = 760;
  const L = 150, R = 1450, T = 90 * (variant?.chartPadTopScale ?? 1), B = 560;
  const plotW = R - L, plotH = B - T;
  const xAt = (i: number) => (len <= 1 ? (L + R) / 2 : L + (i / (len - 1)) * plotW);

  const tokMax = niceCeil(Math.max(1, ...agg, ...eff), 4);
  const yTok = (v: number) => B - (Math.max(0, v) / tokMax) * plotH;
  const latS = p99.map((m) => m / 1000);
  const latMax = niceCeil(Math.max(1, ...latS), 10);
  const yLat = (s: number) => B - (Math.max(0, s) / latMax) * plotH;
  const latColor = (ms: number) =>
    ms >= LAT_DANGER_MS ? DANGER : ms >= LAT_WARN_MS ? WARN : "rgba(148, 165, 196, 0.5)";

  // ---- timing ----
  const head = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp", easing: EASE_OUT });
  const revealDur = Math.min(durationInFrames * 0.55, fps * 2.2);
  const reveal = interpolate(frame, [6, 6 + revealDur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT,
  });
  const late = interpolate(frame, [6 + revealDur, 6 + revealDur + 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT,
  });

  const aggPts = idx.map((i) => `${xAt(i)},${yTok(agg[i])}`).join(" ");
  const effPts = idx.map((i) => `${xAt(i)},${yTok(eff[i])}`).join(" ");
  const barW = Math.min(96, (len > 1 ? plotW / (len - 1) : plotW) * 0.42);
  const yFloor = yTok(floor);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 5%",
      }}
    >
      <div style={{ opacity: head, textAlign: "center", marginBottom: 6 }}>
        {data.title ? (
          <div style={{ fontFamily: theme.fontDisplay, fontSize: 52, fontWeight: 700, color: theme.text, lineHeight: 1.05 }}>
            {data.title}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 34, justifyContent: "center", marginTop: 18, fontFamily: theme.fontMono, fontSize: 23 }}>
          <Legend swatch={theme.accent} label="effective tok/s / agent" glow />
          <Legend swatch={theme.secondary} label="aggregate tok/s" glow />
          <Legend swatch={DANGER} label="p99 latency" />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 1500 }}>
        <defs>
          <clipPath id="scaling-reveal">
            <rect x={L - 70} y={0} width={(plotW + 140) * reveal} height={H} />
          </clipPath>
        </defs>

        {/* unusable zone below the floor */}
        <rect x={L} y={yFloor} width={plotW} height={B - yFloor} fill={`rgba(${hexToRgb(DANGER)}, 0.06)`} style={{ opacity: late }} />

        {/* faint gridlines */}
        {[0.25, 0.5, 0.75, 1].map((g, k) => (
          <line key={`g${k}`} x1={L} x2={R} y1={B - g * plotH} y2={B - g * plotH} stroke={theme.grid} strokeWidth={1} />
        ))}

        {/* data marks, revealed left -> right */}
        <g clipPath="url(#scaling-reveal)">
          {idx.map((i) => {
            const by = yLat(latS[i]);
            return <rect key={`b${i}`} x={xAt(i) - barW / 2} y={by} width={barW} height={B - by} rx={8} fill={latColor(p99[i])} opacity={0.42} />;
          })}
          <polyline points={aggPts} fill="none" stroke={theme.secondary} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 11" opacity={0.95} />
          <polyline points={effPts} fill="none" stroke={theme.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px rgba(${hexToRgb(theme.accent)}, 0.5))` }} />
          {idx.map((i) => <circle key={`da${i}`} cx={xAt(i)} cy={yTok(agg[i])} r={6} fill={theme.secondary} />)}
          {idx.map((i) => <circle key={`de${i}`} cx={xAt(i)} cy={yTok(eff[i])} r={8} fill={theme.accent} />)}
        </g>

        {/* usable floor */}
        <line x1={L} x2={R} y1={yFloor} y2={yFloor} stroke={DANGER} strokeWidth={2} strokeDasharray="10 8" opacity={0.7 * late} />
        <text x={R} y={yFloor - 12} textAnchor="end" fontFamily={theme.fontMono} fontSize={22} fill={DANGER} opacity={late}>
          usable floor · {floor} tok/s
        </text>

        {/* knee marker */}
        {kneeI >= 0 && (
          <g style={{ opacity: late }}>
            <line x1={xAt(kneeI)} x2={xAt(kneeI)} y1={T - 6} y2={B} stroke={theme.text} strokeWidth={2} strokeDasharray="6 8" opacity={0.5} />
            <g transform={`translate(${xAt(kneeI)}, ${T - 16})`}>
              <rect x={-118} y={-46} width={236} height={56} rx={28} fill={theme.accent} />
              <text x={0} y={-9} textAnchor="middle" fontFamily={theme.fontDisplay} fontSize={29} fontWeight={800} fill={theme.bgTo}>
                KNEE · {kneeN} agents
              </text>
            </g>
          </g>
        )}

        {/* axes: left tok/s, right p99 seconds, bottom N */}
        {[0, 0.5, 1].map((g, k) => (
          <text key={`ly${k}`} x={L - 16} y={B - g * plotH + 7} textAnchor="end" fontFamily={theme.fontMono} fontSize={20} fill={theme.muted} style={{ opacity: head }}>
            {Math.round(g * tokMax)}
          </text>
        ))}
        <text x={L - 16} y={T - 22} textAnchor="end" fontFamily={theme.fontMono} fontSize={20} fill={theme.accent} style={{ opacity: head }}>tok/s</text>
        {[0, 0.5, 1].map((g, k) => (
          <text key={`ry${k}`} x={R + 16} y={B - g * plotH + 7} textAnchor="start" fontFamily={theme.fontMono} fontSize={20} fill={theme.muted} style={{ opacity: head }}>
            {Math.round(g * latMax)}s
          </text>
        ))}
        <text x={R + 16} y={T - 22} textAnchor="start" fontFamily={theme.fontMono} fontSize={20} fill={DANGER} style={{ opacity: head }}>p99</text>
        {idx.map((i) => (
          <text key={`x${i}`} x={xAt(i)} y={B + 44} textAnchor="middle" fontFamily={theme.fontMono} fontSize={26} fill={theme.muted} style={{ opacity: head }}>
            {n[i]}
          </text>
        ))}
        <text x={(L + R) / 2} y={B + 92} textAnchor="middle" fontFamily={theme.fontMono} fontSize={24} fill={theme.muted} style={{ opacity: head }}>
          {data.x_label ?? "concurrent agents (N)"}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

const Legend: React.FC<{ swatch: string; label: string; glow?: boolean }> = ({ swatch, label, glow }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 26, height: 12, borderRadius: 4, background: swatch, boxShadow: glow ? `0 0 12px ${swatch}` : "none" }} />
    <span style={{ color: swatch }}>{label}</span>
  </div>
);
