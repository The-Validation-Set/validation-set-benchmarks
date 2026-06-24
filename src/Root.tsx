import { Composition, Still, getInputProps } from "remotion";
// The data-driven pipeline composition: TimelineManager conducts an aligned script.
import { TimelineManager, getTotalDurationInFrames } from "./components/TimelineManager";
import scriptData from "./data/script.aligned.example.json";
import type { ScriptDoc } from "./types";
import { Thumbnail } from "./components/Thumbnail";

// Per-render colour/font/layout variance. Pass --props='{"themeId": <n>}' at render
// time for a reproducible look; otherwise it's randomized so renders never look templated.
const VS_FPS = 30;
const vsData = scriptData as unknown as ScriptDoc;

export const RemotionRoot: React.FC = () => {
  const vsThemeId =
    (getInputProps() as { themeId?: number }).themeId ?? Math.floor(Math.random() * 1000);

  return (
    <>
      {/* The data-driven video. Render:
          npx remotion render ValidationSetVideo out/video.mp4 --props='{"themeId":3}' */}
      <Composition
        id="ValidationSetVideo"
        component={TimelineManager}
        durationInFrames={getTotalDurationInFrames(vsData, VS_FPS)}
        fps={VS_FPS}
        width={1920}
        height={1080}
        defaultProps={{ themeId: vsThemeId }}
      />

      {/* Example still (1280x720). Render at 2x for a crisp upload:
          npx remotion still Thumbnail out/thumbnail.png --scale=2 --image-format=jpeg --jpeg-quality=92 */}
      <Still
        id="Thumbnail"
        component={Thumbnail}
        width={1280}
        height={720}
        defaultProps={{
          themeId: 3,
          eyebrow: "Measured · cost per year",
          title: "Stop renting your AI.",
          highlight: "renting",
          metric: "$7,200",
          metricUnit: "/yr",
          metricCaption: "Managed API",
          metricSub: "to rent ONE agent",
          bars: [1, 2, 3, 4, 5],
        }}
      />
    </>
  );
};
