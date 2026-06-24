import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ScreenClipData } from "../types";
import { hexToRgb, type Theme } from "../theme";
import { EASE_OUT } from "../animation";

interface Props {
  data: ScreenClipData;
  theme: Theme;
  /** This block's Sequence length; drives the slow Ken Burns span. */
  durationInFrames: number;
}

/**
 * The EP002 "proof" beat: a REAL screen-recording (the local terminal actually
 * running llama3.2:3b, then the cloud Colab T4) shown inside a themed device
 * window. Pure captured footage in a branded frame — no faces / photoreal scenes
 * (the render-variance rule). A slow Ken Burns keeps an otherwise-static capture alive; the
 * dissolve in/out is handled by the <SceneTransition/> wrapper in TimelineManager.
 */
export const ScreenClip: React.FC<Props> = ({ data, theme, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(theme.accent);

  const src = data.src;
  const caption = data.caption ?? "";
  const label = data.label ?? "";
  const barText = data.barText ?? "";
  const objectPosition = data.objectPosition ?? "center top";
  const zoom = data.zoom ?? 1;

  // Entrance: rise + fade over ~0.5s.
  const enter = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const rise = interpolate(frame, [0, fps * 0.5], [26, 0], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  // Very slow zoom so a near-static capture never sits dead still (premium-restrained).
  const kb = interpolate(frame, [0, durationInFrames], [1.0, 1.035], {
    extrapolateRight: "clamp",
  });
  // Subtle "live" pulse on the rec indicator.
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2 * 0.8);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: theme.fontDisplay,
      }}
    >
      {/* accent glow behind the window */}
      <div
        style={{
          position: "absolute",
          width: 1150,
          height: 640,
          background: `radial-gradient(closest-side, rgba(${rgb}, 0.16), transparent)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          opacity: enter,
          transform: `translateY(${rise}px)`,
        }}
      >
        {label ? (
          <div
            style={{
              fontFamily: theme.fontMono,
              fontSize: 28,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: theme.accent,
              marginBottom: 22,
              textShadow: `0 0 24px rgba(${rgb}, 0.45)`,
            }}
          >
            {label}
          </div>
        ) : null}

        {/* device window */}
        <div
          style={{
            width: "78%",
            aspectRatio: "16 / 9",
            borderRadius: 18,
            overflow: "hidden",
            background: "#05070D",
            border: `1px solid ${theme.grid}`,
            boxShadow: `0 50px 130px rgba(0,0,0,0.6), 0 0 0 1px rgba(${rgb}, 0.10)`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* title bar */}
          <div
            style={{
              height: 46,
              flexShrink: 0,
              background: theme.panel,
              borderBottom: `1px solid ${theme.grid}`,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              gap: 9,
            }}
          >
            <Dot c="#ff5f56" />
            <Dot c="#ffbd2e" />
            <Dot c="#27c93f" />
            {barText ? (
              <div
                style={{
                  fontFamily: theme.fontMono,
                  fontSize: 19,
                  color: theme.muted,
                  marginLeft: 16,
                  letterSpacing: 0.5,
                }}
              >
                {barText}
              </div>
            ) : null}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: theme.fontMono,
                fontSize: 17,
                letterSpacing: 2,
                color: theme.accent,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: theme.accent,
                  boxShadow: `0 0 10px ${theme.accent}`,
                  opacity: pulse,
                }}
              />
              REC
            </div>
          </div>

          {/* video body */}
          <div style={{ position: "relative", flex: 1, overflow: "hidden", background: "#05070D" }}>
            <OffthreadVideo
              src={staticFile(src)}
              muted
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition,
                transform: `scale(${zoom * kb})`,
                transformOrigin: objectPosition,
              }}
            />
          </div>
        </div>

        {caption ? (
          <div
            style={{
              fontFamily: theme.fontMono,
              fontSize: 24,
              color: theme.muted,
              marginTop: 24,
              letterSpacing: 1,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 13, height: 13, borderRadius: "50%", background: c, opacity: 0.92 }} />
);
