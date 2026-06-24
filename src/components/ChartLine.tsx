import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChartLineData } from "../types";
import type { Theme, Variant } from "../theme";
import { EASE_OUT } from "../animation";

interface Props {
  data: ChartLineData;
  theme: Theme;
  /** Length of this block's Sequence; the line draws over the first ~70% of it. */
  durationInFrames: number;
  /** Per-render geometry (varies plot padding). */
  variant?: Variant;
}

/**
 * Dark-mode SVG line chart with a progressive left-to-right "draw" (animated
 * strokeDashoffset), an animated accent glow, an area fill that reveals with the
 * line, and a leading dot at the draw frontier.
 */
export const ChartLine: React.FC<Props> = ({ data, theme, durationInFrames, variant }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const labels = data.labels ?? [];
  const values = data.values ?? [];
  const title = data.title ?? "";

  // Plot geometry.
  const padX = width * 0.1;
  const padTop = height * 0.26 * (variant?.chartPadTopScale ?? 1);
  const padBottom = height * 0.16;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;
  const baseline = padTop + plotH;

  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const points = values.map((v, i) => {
    const x =
      values.length <= 1 ? padX + plotW / 2 : padX + (i / (values.length - 1)) * plotW;
    const y = baseline - ((v - minV) / range) * plotH;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  // Analytic path length so we can drive strokeDashoffset deterministically.
  let pathLen = 0;
  for (let i = 1; i < points.length; i++) {
    pathLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  const drawFrames = Math.max(1, durationInFrames * 0.7);
  const drawP = interpolate(frame, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const dashOffset = pathLen * (1 - drawP);

  // Subtle, breathing glow (nods to add_glow() in generate_assets.py).
  const glowPulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 1.2);
  const glowStd = 6 + glowPulse * 6;

  const titleSlide = interpolate(frame, [0, fps * 0.5], [-22, 0], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baseline.toFixed(
          2
        )} L ${points[0].x.toFixed(2)} ${baseline.toFixed(2)} Z`
      : "";

  // Leading dot rides the draw frontier.
  let dot: { x: number; y: number } | null = null;
  if (points.length > 0) {
    const idxF = drawP * (points.length - 1);
    const i0 = Math.floor(idxF);
    const i1 = Math.min(points.length - 1, i0 + 1);
    const f = idxF - i0;
    dot = {
      x: points[i0].x + (points[i1].x - points[i0].x) * f,
      y: points[i0].y + (points[i1].y - points[i0].y) * f,
    };
  }

  const uid = theme.id;

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})` }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={theme.accent} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>
          <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.28} />
            <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glowStd} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`reveal-${uid}`}>
            <rect x={padX} y={0} width={Math.max(0, plotW * drawP)} height={height} />
          </clipPath>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padTop + plotH * t;
          return (
            <line
              key={i}
              x1={padX}
              y1={y}
              x2={padX + plotW}
              y2={y}
              stroke={theme.grid}
              strokeWidth={1}
            />
          );
        })}

        {areaPath ? (
          <path d={areaPath} fill={`url(#area-${uid})`} clipPath={`url(#reveal-${uid})`} />
        ) : null}

        <path
          d={linePath}
          fill="none"
          stroke={`url(#stroke-${uid})`}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={dashOffset}
          filter={`url(#glow-${uid})`}
        />

        {dot ? (
          <circle cx={dot.x} cy={dot.y} r={8} fill={theme.accent} filter={`url(#glow-${uid})`} />
        ) : null}

        {labels.map((lab, i) => {
          if (points[i] === undefined) return null;
          const n = Math.max(1, values.length);
          const reveal = interpolate(drawP, [i / n, (i + 0.6) / n], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <text
              key={i}
              x={points[i].x}
              y={baseline + 44}
              fill={theme.muted}
              fontFamily={theme.fontMono}
              fontSize={26}
              textAnchor="middle"
              opacity={reveal}
            >
              {lab}
            </text>
          );
        })}

        {title ? (
          <text
            x={theme.titleAlign === "center" ? width / 2 : padX}
            y={padTop * 0.5 + titleSlide}
            fill={theme.text}
            fontFamily={theme.fontDisplay}
            fontSize={54}
            fontWeight={700}
            textAnchor={theme.titleAlign === "center" ? "middle" : "start"}
            opacity={titleOpacity}
          >
            {title}
          </text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
