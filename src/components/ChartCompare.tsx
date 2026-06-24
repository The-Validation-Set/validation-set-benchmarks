import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChartCompareData, ChartCompareSeries } from "../types";
import { type Theme, type Variant } from "../theme";
import { EASE_OUT } from "../animation";

interface Props {
  data: ChartCompareData;
  theme: Theme;
  /** Length of this block's Sequence; both lines draw over the first ~70% of it. */
  durationInFrames: number;
  /** Per-render geometry (varies plot padding). */
  variant?: Variant;
}

const fmtFull = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${Math.round(v)}`;
};

/** First point (segment + fraction) where series `a` crosses series `b`. */
function findCrossover(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  for (let i = 1; i < n; i++) {
    const d0 = a[i - 1] - b[i - 1];
    const d1 = a[i] - b[i];
    if (d0 === 0) return { seg: i - 1, t: 0 };
    if ((d0 < 0 && d1 >= 0) || (d0 > 0 && d1 <= 0)) {
      return { seg: i - 1, t: d0 / (d0 - d1) };
    }
  }
  return null;
}

/**
 * Two-series "cloud vs local" cost chart: both lines draw progressively left to
 * right, the break-even crossover is annotated with a pulsing marker + vertical
 * guide, each line ends with its final-value label, and colours/fonts come from
 * the active theme (the render-variance rule per-render variance).
 */
export const ChartCompare: React.FC<Props> = ({ data, theme, durationInFrames, variant }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const series: ChartCompareSeries[] = (data.series ?? []).slice(0, 2);
  const xLabels = data.x_labels ?? [];
  const title = data.title ?? "";

  // Pick a colour per series: the "local" / advocated line takes the brand accent.
  const colorFor = (s: ChartCompareSeries, i: number) => {
    if (s.kind === "local") return theme.accent;
    if (s.kind === "cloud") return theme.secondary;
    return i === 0 ? theme.secondary : theme.accent;
  };

  // Plot geometry — extra top padding leaves room for the title + legend overlay.
  const padX = width * 0.1;
  const padTop = height * 0.3 * (variant?.chartPadTopScale ?? 1);
  const padBottom = height * 0.16;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;
  const baseline = padTop + plotH;

  const allValues = series.flatMap((s) => s.values ?? []);
  const maxV = Math.max(...allValues, 1);
  const minV = Math.min(...allValues, 0);
  const range = maxV - minV || 1;
  const pointCount = Math.max(...series.map((s) => (s.values ?? []).length), 1);

  const xAt = (i: number) =>
    pointCount <= 1 ? padX + plotW / 2 : padX + (i / (pointCount - 1)) * plotW;
  const yAt = (v: number) => baseline - ((v - minV) / range) * plotH;

  const drawFrames = Math.max(1, durationInFrames * 0.7);
  const drawP = interpolate(frame, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Breathing glow (matches ChartLine).
  const glowStd = 5 + (0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 1.2)) * 6;

  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Crossover (cloud vs local). Use computed intersection for the marker, and the
  // supplied breakout_index for the month label when present.
  const cloud = series.find((s) => s.kind === "cloud") ?? series[0];
  const local = series.find((s) => s.kind === "local") ?? series[1];
  const cross =
    cloud && local ? findCrossover(cloud.values ?? [], local.values ?? []) : null;
  let crossX = 0;
  let crossY = 0;
  let crossFrac = 1;
  if (cross) {
    const { seg, t } = cross;
    const cv = (cloud!.values[seg] ?? 0) + t * ((cloud!.values[seg + 1] ?? 0) - (cloud!.values[seg] ?? 0));
    crossX = xAt(seg + t);
    crossY = yAt(cv);
    crossFrac = (seg + t) / Math.max(1, pointCount - 1);
  }
  const crossReveal = interpolate(drawP, [crossFrac, crossFrac + 0.08], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const crossPulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2.4);
  const endReveal = interpolate(drawP, [0.88, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Count the final cumulative value up as each line nears completion.
  const endCountP = interpolate(drawP, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  // Brief "collision" flash exactly at the break-even crossover (retention peak).
  const crossFlash = interpolate(
    drawP,
    [crossFrac - 0.02, crossFrac + 0.06, crossFrac + 0.16],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const breakoutLabel =
    data.breakout_index != null && xLabels[data.breakout_index] != null
      ? xLabels[data.breakout_index]
      : cross
      ? xLabels[Math.round(cross.seg + cross.t)] ?? ""
      : "";

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => minV + f * range);

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})` }}
    >
      {/* Title + legend overlay */}
      <div
        style={{
          position: "absolute",
          top: height * 0.07,
          left: padX,
          width: plotW,
          display: "flex",
          flexDirection: "column",
          alignItems: theme.titleAlign === "center" ? "center" : "flex-start",
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: theme.fontDisplay,
            fontSize: 56,
            fontWeight: 700,
            color: theme.text,
            textAlign: theme.titleAlign,
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 18 }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 6,
                  borderRadius: 3,
                  background: colorFor(s, i),
                  boxShadow: `0 0 12px ${colorFor(s, i)}`,
                }}
              />
              <span
                style={{
                  fontFamily: theme.fontMono,
                  fontSize: 26,
                  color: theme.muted,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {series.map((s, i) => (
            <filter
              key={i}
              id={`cc-glow-${theme.id}-${i}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation={glowStd} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          {series.map((s, i) => (
            <linearGradient key={i} id={`cc-area-${theme.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorFor(s, i)} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colorFor(s, i)} stopOpacity={0} />
            </linearGradient>
          ))}
          <clipPath id={`cc-reveal-${theme.id}`}>
            <rect x={padX} y={0} width={Math.max(0, plotW * drawP)} height={height} />
          </clipPath>
        </defs>

        {/* Horizontal gridlines + $ y-axis ticks */}
        {yTicks.map((v, i) => {
          const y = yAt(v);
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke={theme.grid} strokeWidth={1} />
              <text
                x={padX - 18}
                y={y + 9}
                fill={theme.muted}
                fontFamily={theme.fontMono}
                fontSize={24}
                textAnchor="end"
                opacity={0.8}
              >
                {fmtCompact(v)}
              </text>
            </g>
          );
        })}

        {/* Areas + lines per series */}
        {series.map((s, i) => {
          const vals = s.values ?? [];
          const pts = vals.map((v, k) => ({ x: xAt(k), y: yAt(v) }));
          if (pts.length === 0) return null;
          const linePath = pts
            .map((p, k) => `${k === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
            .join(" ");
          let pathLen = 0;
          for (let k = 1; k < pts.length; k++) {
            pathLen += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
          }
          const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${baseline.toFixed(
            2
          )} L ${pts[0].x.toFixed(2)} ${baseline.toFixed(2)} Z`;
          const c = colorFor(s, i);
          const end = pts[pts.length - 1];
          return (
            <g key={i}>
              <path d={areaPath} fill={`url(#cc-area-${theme.id}-${i})`} clipPath={`url(#cc-reveal-${theme.id})`} />
              <path
                d={linePath}
                fill="none"
                stroke={c}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLen}
                strokeDashoffset={pathLen * (1 - drawP)}
                filter={`url(#cc-glow-${theme.id}-${i})`}
              />
              {/* Final-value label */}
              <text
                x={end.x + 4}
                y={end.y - 18}
                fill={c}
                fontFamily={theme.fontDisplay}
                fontSize={34}
                fontWeight={700}
                textAnchor="end"
                opacity={endReveal}
              >
                {fmtFull((vals[vals.length - 1] ?? 0) * endCountP)}
              </text>
            </g>
          );
        })}

        {/* Crossover / break-even marker */}
        {cross ? (
          <g opacity={crossReveal}>
            <line
              x1={crossX}
              y1={padTop}
              x2={crossX}
              y2={baseline}
              stroke={theme.text}
              strokeWidth={1.5}
              strokeDasharray="6 8"
              opacity={0.45}
            />
            {/* Expanding "collision" flash at the exact crossover moment */}
            <circle
              cx={crossX}
              cy={crossY}
              r={8 + crossFlash * 46}
              fill="none"
              stroke={theme.text}
              strokeWidth={3}
              opacity={crossFlash * 0.85}
            />
            <circle
              cx={crossX}
              cy={crossY}
              r={10 + crossPulse * 6}
              fill="none"
              stroke={theme.text}
              strokeWidth={2}
              opacity={0.5 * (1 - crossPulse)}
            />
            <circle cx={crossX} cy={crossY} r={8 * (1 + crossFlash * 0.7)} fill={theme.text} />
            <text
              x={crossX}
              y={padTop - 16}
              fill={theme.text}
              fontFamily={theme.fontMono}
              fontSize={24}
              fontWeight={700}
              textAnchor="middle"
              letterSpacing={2}
            >
              {`BREAK-EVEN${breakoutLabel ? ` · ${breakoutLabel}` : ""}`}
            </text>
          </g>
        ) : null}

        {/* X-axis labels, revealed with the draw */}
        {xLabels.map((lab, i) => {
          const x = xAt(i);
          const reveal = interpolate(drawP, [i / pointCount, (i + 0.6) / pointCount], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <text
              key={i}
              x={x}
              y={baseline + 42}
              fill={theme.muted}
              fontFamily={theme.fontMono}
              fontSize={24}
              textAnchor="middle"
              opacity={reveal}
            >
              {lab}
            </text>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
