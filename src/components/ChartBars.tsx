import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ChartBarsData, ChartBarsMetric } from "../types";
import { hexToRgb, type Theme } from "../theme";
import { CountUp, EASE_OUT } from "../animation";

interface Props {
  data: ChartBarsData;
  theme: Theme;
  /** Length of this block's Sequence; bars grow over the first ~50% of it. */
  durationInFrames: number;
}

/** Does `side` win this metric? (Respects whether higher or lower is better.) */
function isWinner(m: ChartBarsMetric, side: "local" | "cloud"): boolean {
  if (m.local === m.cloud) return false;
  const localWins = m.better === "lower" ? m.local < m.cloud : m.local > m.cloud;
  return side === "local" ? localWins : !localWins;
}

/**
 * EP002's measured head-to-head: grouped local-vs-cloud bars. Each metric is
 * normalised within its OWN scale (so tok/s, ms and $ can sit side by side), bars
 * grow with an eased rise, value labels count up in sync, and the better side of
 * each pair takes the brand accent glow.
 */
export const ChartBars: React.FC<Props> = ({ data, theme, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = (data.metrics ?? []).slice(0, 4);
  const title = data.title ?? "";
  const localLabel = data.localLabel ?? "Local";
  const cloudLabel = data.cloudLabel ?? "Cloud";

  const titleOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const growDur = Math.max(1, durationInFrames * 0.5);
  const maxBarPx = 360;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8%",
      }}
    >
      <div style={{ opacity: titleOpacity, textAlign: "center", marginBottom: 56 }}>
        {title ? (
          <div
            style={{
              fontFamily: theme.fontDisplay,
              fontSize: 56,
              fontWeight: 700,
              color: theme.text,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            gap: 40,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Legend color={theme.accent} label={localLabel} mono={theme.fontMono} />
          <Legend color={theme.secondary} label={cloudLabel} mono={theme.fontMono} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 64, alignItems: "flex-end" }}>
        {metrics.map((m, i) => {
          const max = Math.max(m.local, m.cloud, 1e-9);
          const delay = i * 4;
          const grow = interpolate(frame, [delay, delay + growDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          const localH = (m.local / max) * maxBarPx * grow;
          const cloudH = (m.cloud / max) * maxBarPx * grow;
          return (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 22,
                  alignItems: "flex-end",
                  height: maxBarPx + 60,
                }}
              >
                <Bar
                  heightPx={localH}
                  color={theme.accent}
                  winner={isWinner(m, "local")}
                  target={m.local}
                  unit={m.unit}
                  decimals={m.decimals ?? 0}
                  delay={delay}
                  growDur={growDur}
                  theme={theme}
                />
                <Bar
                  heightPx={cloudH}
                  color={theme.secondary}
                  winner={isWinner(m, "cloud")}
                  target={m.cloud}
                  unit={m.unit}
                  decimals={m.decimals ?? 0}
                  delay={delay}
                  growDur={growDur}
                  theme={theme}
                />
              </div>
              <div
                style={{
                  fontFamily: theme.fontMono,
                  fontSize: 26,
                  color: theme.muted,
                  marginTop: 26,
                  textAlign: "center",
                  maxWidth: 280,
                }}
              >
                {m.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Legend: React.FC<{ color: string; label: string; mono: string }> = ({
  color,
  label,
  mono,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 30,
        height: 14,
        borderRadius: 4,
        background: color,
        boxShadow: `0 0 14px ${color}`,
      }}
    />
    <span style={{ fontFamily: mono, fontSize: 26, color }}>{label}</span>
  </div>
);

interface BarProps {
  heightPx: number;
  color: string;
  winner: boolean;
  target: number;
  unit?: string;
  decimals: number;
  delay: number;
  growDur: number;
  theme: Theme;
}

const Bar: React.FC<BarProps> = ({
  heightPx,
  color,
  winner,
  target,
  unit,
  decimals,
  delay,
  growDur,
  theme,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-end",
    }}
  >
    <div
      style={{
        fontFamily: theme.fontDisplay,
        fontSize: 40,
        fontWeight: 800,
        color,
        marginBottom: 12,
        whiteSpace: "nowrap",
        textShadow: winner ? `0 0 26px rgba(${hexToRgb(color)}, 0.6)` : "none",
      }}
    >
      <CountUp
        target={target}
        prefix={unit === "$" ? "$" : ""}
        suffix={unit && unit !== "$" ? ` ${unit}` : ""}
        decimals={decimals}
        delay={delay + 2}
        durationInFrames={growDur}
      />
    </div>
    <div
      style={{
        width: 96,
        height: Math.max(2, heightPx),
        borderRadius: "10px 10px 4px 4px",
        background: `linear-gradient(180deg, ${color}, rgba(${hexToRgb(color)}, 0.35))`,
        boxShadow: winner
          ? `0 0 34px rgba(${hexToRgb(color)}, 0.55)`
          : `0 0 14px rgba(${hexToRgb(color)}, 0.18)`,
        opacity: winner ? 1 : 0.82,
      }}
    />
  </div>
);
