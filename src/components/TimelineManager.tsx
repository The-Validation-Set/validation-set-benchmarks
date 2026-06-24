import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
// The aligned timeline (Whisper word-timings mapped onto each paragraph). Requires
// "resolveJsonModule": true in tsconfig (Remotion templates enable it).
// This public repo ships a small synthetic example so the engine compiles without
// any private script. Point this import at your own aligned script to render for real.
import scriptData from "../data/script.aligned.example.json";
import type {
  ChartBarsData,
  ChartCompareData,
  ChartLineData,
  ChartScalingData,
  ChartQualityData,
  CodeHighlightData,
  ScreenClipData,
  ScriptDoc,
  StatCalloutData,
  TimelineBlock,
} from "../types";
import { getTheme, getVariant, type Theme, type Variant } from "../theme";
import { SceneTransition } from "../animation";
import { ChartLine } from "./ChartLine";
import { ChartCompare } from "./ChartCompare";
import { ChartBars } from "./ChartBars";
import { ChartScaling } from "./ChartScaling";
import { ChartQuality } from "./ChartQuality";
import { CodeHighlight } from "./CodeHighlight";
import { StatCallout } from "./StatCallout";
import { ScreenClip } from "./ScreenClip";

interface Props {
  /** Defaults to the bundled example script; pass explicitly to override. */
  data?: ScriptDoc;
  /** Drives per-render colour/font/layout variance (so renders don't look templated). */
  themeId?: string | number;
}

const secToFrames = (s: number, fps: number) => Math.round(s * fps);

/** Total composition length = last paragraph's end time. Use it in Root.tsx. */
export function getTotalDurationInFrames(data: ScriptDoc, fps: number): number {
  const ends = data.timeline.map((b) => b.visual_end_time ?? 0);
  return Math.max(1, secToFrames(Math.max(0, ...ends), fps));
}

/**
 * The conductor. Reads the aligned script and mounts each paragraph's visual
 * only within [visual_start_time, visual_end_time) -- implemented with Remotion
 * <Sequence>, which both enforces that window and gives each child a local frame
 * timeline (so the child draw/entrance animations are relative to its own start).
 */
export const TimelineManager: React.FC<Props> = ({
  data = scriptData as unknown as ScriptDoc,
  themeId,
}) => {
  const { fps } = useVideoConfig();
  const theme = getTheme(themeId);
  const variant = getVariant(themeId);

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})` }}
    >
      {/* Voiceover track. Drop your own enhanced VO into public/ and point staticFile()
          at it, e.g.  <Audio src={staticFile("voiceover.wav")} />
          (omitted here so the example renders silently with no asset dependency). */}
      {data.timeline.map((block) => {
        if (block.visual_start_time == null || block.visual_end_time == null) {
          return null; // aligner found no match for this paragraph -> skip
        }
        const from = secToFrames(block.visual_start_time, fps);
        const to = secToFrames(block.visual_end_time, fps);
        const durationInFrames = Math.max(1, to - from);
        return (
          <Sequence
            key={block.paragraph_id}
            from={from}
            durationInFrames={durationInFrames}
            name={`p${block.paragraph_id}: ${block.visual_cue}`}
          >
            <SceneTransition durationInFrames={durationInFrames} inFrames={8} outFrames={12}>
              {renderCue(block, theme, variant, durationInFrames)}
            </SceneTransition>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

function renderCue(
  block: TimelineBlock,
  theme: Theme,
  variant: Variant,
  durationInFrames: number
) {
  switch (block.visual_cue) {
    case "CHART_LINE":
      return (
        <ChartLine
          data={block.visual_data as ChartLineData}
          theme={theme}
          variant={variant}
          durationInFrames={durationInFrames}
        />
      );
    case "CHART_COMPARE":
      return (
        <ChartCompare
          data={block.visual_data as ChartCompareData}
          theme={theme}
          variant={variant}
          durationInFrames={durationInFrames}
        />
      );
    case "CHART_BARS":
      return (
        <ChartBars
          data={block.visual_data as ChartBarsData}
          theme={theme}
          durationInFrames={durationInFrames}
        />
      );
    case "CHART_SCALING":
      return (
        <ChartScaling
          data={block.visual_data as ChartScalingData}
          theme={theme}
          variant={variant}
          durationInFrames={durationInFrames}
        />
      );
    case "CHART_QUALITY":
      return (
        <ChartQuality
          data={block.visual_data as ChartQualityData}
          theme={theme}
          variant={variant}
          durationInFrames={durationInFrames}
        />
      );
    case "CODE_HIGHLIGHT":
      return (
        <CodeHighlight
          data={block.visual_data as CodeHighlightData}
          theme={theme}
          durationInFrames={durationInFrames}
        />
      );
    case "SCREEN_CLIP":
      return (
        <ScreenClip
          data={block.visual_data as ScreenClipData}
          theme={theme}
          durationInFrames={durationInFrames}
        />
      );
    case "STAT_CALLOUT":
    default:
      // STAT_CALLOUT and any unrecognized cue render the stat card, so a block
      // never produces a blank frame.
      return (
        <StatCallout
          data={block.visual_data as StatCalloutData}
          theme={theme}
          seed={block.paragraph_id}
          variant={variant}
          durationInFrames={durationInFrames}
        />
      );
  }
}
