import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CodeHighlightData } from "../types";
import { hexToRgb, type Theme } from "../theme";
import { EASE_OUT } from "../animation";

interface Props {
  data: CodeHighlightData;
  theme: Theme;
  durationInFrames: number;
}

// Dependency-free, good-enough highlighter: comments, strings, numbers, keywords.
// Swap in Prism/Shiki later if you want full grammar coverage.
const TOKEN =
  /(#.*|\/\/.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:def|return|class|import|from|as|if|elif|else|for|while|in|and|or|not|None|True|False|const|let|var|function|export|new|await|async|print|lambda|yield|try|except|finally|raise|pass|break|continue|with|self|this|fn|mut|pub|use|struct|impl|trait|func|package|type|interface|range|defer|void|int|str|float|bool)\b)|(\b(?:ollama|pip3?|python3?|npm|npx|node|curl|wget|cd|ls|echo|export|source|sudo|brew|apt|git|docker|make|cargo|chmod|mkdir|pull|run|install|serve|build|start)\b)/g;

function tokenize(line: string, theme: Theme): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push(<span key={k++}>{line.slice(last, m.index)}</span>);
    let color = theme.text;
    let fontStyle: "normal" | "italic" = "normal";
    if (m[1]) {
      color = theme.muted;
      fontStyle = "italic";
    } else if (m[2]) {
      color = theme.secondary;
    } else if (m[3]) {
      color = theme.secondary;
    } else if (m[4]) {
      color = theme.accent;
    } else if (m[5]) {
      color = theme.accent;
    }
    out.push(
      <span key={k++} style={{ color, fontStyle }}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
    if (m.index === TOKEN.lastIndex) TOKEN.lastIndex++; // guard zero-length matches
  }
  if (last < line.length) out.push(<span key={k++}>{line.slice(last)}</span>);
  return out;
}

/**
 * Dark-themed code panel that emphasizes `highlight_line`: lines stagger in, and
 * the target row gets a brightening accent-tinted background, an accent gutter
 * bar, and a soft glow.
 */
export const CodeHighlight: React.FC<Props> = ({ data, theme, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const code = (data.code ?? "").replace(/\t/g, "  ");
  const lines = code.split("\n");
  const highlight = data.highlight_line ?? 0;

  const panelW = width * 0.8;
  // Fit the font to BOTH the vertical space (line count) and the horizontal space
  // (longest line) so long lines no longer overflow the panel's right edge.
  // Monospace advance width ≈ 0.62em; textArea = panel minus padding (32*2) and the
  // line-number gutter (52px + 22px gap).
  const maxLineLen = Math.max(1, ...lines.map((l) => l.length));
  const textAreaW = panelW - 64 - 74;
  const fontFromHeight = (height * 0.55) / Math.max(lines.length, 1);
  const fontFromWidth = textAreaW / (maxLineLen * 0.62);
  const fontSize = Math.min(40, Math.max(18, Math.min(fontFromHeight, fontFromWidth)));
  const lineH = fontSize * 1.6;

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: Math.min(20, Math.max(8, durationInFrames)),
  });
  // Highlight emphasis ramps in just after the panel settles.
  const hl = interpolate(frame, [fps * 0.4, fps * 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  // Blinking caret on the highlighted line (~1 Hz) once the emphasis is in.
  const caretOn = Math.floor(frame / (fps * 0.5)) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: panelW,
          background: theme.panel,
          border: `1px solid ${theme.grid}`,
          borderRadius: 18,
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.5)",
          padding: "36px 32px",
          transform: `scale(${0.96 + enter * 0.04})`,
          opacity: enter,
          fontFamily: theme.fontMono,
          fontSize,
          lineHeight: `${lineH}px`,
        }}
      >
        {data.language ? (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 18,
              fontFamily: theme.fontMono,
              fontSize: fontSize * 0.5,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: theme.muted,
            }}
          >
            {data.language}
          </div>
        ) : null}

        {lines.map((line, i) => {
          const lineNo = i + 1;
          const isHL = lineNo === highlight;
          const appear = interpolate(frame, [i * 2, i * 2 + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                opacity: appear,
                transform: `translateX(${(1 - appear) * 12}px)`,
                background: isHL ? `rgba(${hexToRgb(theme.accent)}, ${0.1 * hl})` : "transparent",
                borderRadius: 8,
              }}
            >
              {isHL ? (
                <div
                  style={{
                    position: "absolute",
                    left: -32,
                    top: 4,
                    bottom: 4,
                    width: 4,
                    background: theme.accent,
                    borderRadius: 2,
                    transform: `scaleY(${hl})`,
                    transformOrigin: "top",
                  }}
                />
              ) : null}
              <span
                style={{
                  width: 52,
                  flexShrink: 0,
                  textAlign: "right",
                  marginRight: 22,
                  color: theme.muted,
                  opacity: isHL ? 0.95 : 0.45,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {lineNo}
              </span>
              <span
                style={{
                  whiteSpace: "pre",
                  opacity: isHL ? 1 : 0.85,
                  filter: isHL ? `drop-shadow(0 0 ${6 * hl}px ${theme.accent})` : "none",
                }}
              >
                {tokenize(line, theme)}
                {isHL ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: fontSize * 0.5,
                      height: fontSize,
                      marginLeft: 4,
                      verticalAlign: "text-bottom",
                      background: theme.accent,
                      opacity: hl * (caretOn ? 1 : 0),
                      boxShadow: `0 0 10px ${theme.accent}`,
                    }}
                  />
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
