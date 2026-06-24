// Shared types for the render engine.
//
// Mirrors the schema of the aligned timeline: a script's paragraphs, each tagged
// with a visual cue and its data, after an alignment step (Whisper word-timings)
// injects `visual_start_time` / `visual_end_time` into every paragraph.

export type VisualCue =
  | "CHART_LINE"
  | "CHART_COMPARE"
  | "CHART_BARS"
  | "CHART_SCALING"
  | "CHART_QUALITY"
  | "CODE_HIGHLIGHT"
  | "STAT_CALLOUT"
  | "SCREEN_CLIP"
  | (string & {});

export interface ChartLineData {
  title?: string;
  labels: string[];
  values: number[];
}

export interface ChartCompareSeries {
  label: string;
  /** Free-form tag, e.g. "cloud" | "local"; used only for the legend/colour pick. */
  kind?: string;
  values: number[];
}

export interface ChartCompareData {
  title?: string;
  unit?: string;
  x_labels: string[];
  series: ChartCompareSeries[];
  /** Index on x_labels to annotate as the break-even / crossover point. */
  breakout_index?: number;
}

/** One head-to-head metric: local vs cloud, normalised within its own scale so
 *  mixed units (tok/s, ms, $) coexist. `better` drives which bar gets the accent. */
export interface ChartBarsMetric {
  label: string;
  local: number;
  cloud: number;
  unit?: string;
  better?: "higher" | "lower";
  decimals?: number;
}

/** Grouped local-vs-cloud benchmark bars (a measured head-to-head). */
export interface ChartBarsData {
  title?: string;
  localLabel?: string;
  cloudLabel?: string;
  metrics: ChartBarsMetric[];
}

/** Concurrency scaling: how one rig behaves as N agents pile on. Aggregate
 *  throughput (flat once saturated) vs EFFECTIVE per-agent throughput (= agg / N,
 *  collapsing), with p99 latency climbing into a red zone. `knee_n` = last usable N. */
export interface ChartScalingData {
  title?: string;
  x_label?: string;
  n: number[];
  agg_tok_s: number[];
  effective_per_agent_tok_s: number[];
  eval_per_agent_tok_s?: number[];
  p99_ms: number[];
  usable_floor_tok_s?: number;
  knee_n?: number;
}

/** Quality frontier: each model placed at (speed tok/s, verifiable accuracy %),
 *  split by the usable-speed floor into "fast enough to use" vs "smart but
 *  stranded on 8GB". `usable` / `timeouts` drive each bubble's colour + swap badge. */
export interface ChartQualityData {
  title?: string;
  usable_floor_tok_s?: number;
  models: string[];
  accuracy_pct: number[];
  tok_s: number[];
  usable?: boolean[];
  timeouts?: number[];
}

export interface CodeHighlightData {
  language?: string;
  code: string;
  highlight_line?: number;
}

export interface StatCalloutData {
  label?: string;
  value?: string;
  context?: string;
}

/** A real screen-recording shown in a themed device window. */
export interface ScreenClipData {
  /** Filename in public/, served via staticFile(), e.g. "broll_local.mp4". */
  src: string;
  /** Descriptive caption under the window. */
  caption?: string;
  /** Short label above the window (mono/accent). */
  label?: string;
  /** Small mono title shown in the window's title bar. */
  barText?: string;
  /** CSS object-position for the video inside the window (default "center top"). */
  objectPosition?: string;
  /** Extra zoom into the framed region so sparse captures fill the window (default 1). */
  zoom?: number;
}

export type VisualData =
  | ChartLineData
  | ChartCompareData
  | ChartBarsData
  | ChartScalingData
  | ChartQualityData
  | CodeHighlightData
  | StatCalloutData
  | ScreenClipData
  | Record<string, unknown>;

export interface TimelineBlock {
  paragraph_id: number;
  spoken_text: string;
  visual_cue: VisualCue;
  visual_data: VisualData;
  /** Seconds. Injected by the alignment step; null when no match was found. */
  visual_start_time: number | null;
  visual_end_time: number | null;
  /** Ad-placement marker set on ~one block near the 5-min mark. Informational
   *  today (nothing renders from it yet); read it here when wiring mid-roll cues
   *  so 10-min files are monetization-ready. */
  is_midroll_breakpoint?: boolean;
}

export interface ScriptDoc {
  metadata: { title: string; description: string };
  timeline: TimelineBlock[];
}
