import { Composition } from "remotion";
import { Trailer, TRAILER_FRAMES, FPS } from "./Trailer";
import { ExchangeClip, EXCHANGE_FRAMES } from "./ExchangeClip";
import { BuildingClip, BUILDINGS, BUILDING_FRAMES } from "./BuildingClip";
import { WheelClip, WHEEL_FRAMES } from "./WheelClip";
import { CosmeticsClip, COSMETICS_FRAMES } from "./CosmeticsClip";
import { BattlePassClip, BATTLEPASS_FRAMES } from "./BattlePassClip";
import { DeedsClip, DEEDS_FRAMES } from "./DeedsClip";
import { LandClip, LAND_FRAMES } from "./LandClip";
import { FrontierClip, FRONTIER_FRAMES } from "./FrontierClip";
import { ExpansionTrailer, EXPANSION_FRAMES } from "./ExpansionTrailer";
import { ExchangeGif, EXGIF_FRAMES, EXGIF_W, EXGIF_H, FPS as GIF_FPS } from "./ExchangeGif";

export const Root: React.FC = () => (
  <>
    <Composition
      id="NaevyrLaunch"
      component={Trailer}
      durationInFrames={TRAILER_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition id="WheelClip" component={WheelClip} durationInFrames={WHEEL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="CosmeticsClip" component={CosmeticsClip} durationInFrames={COSMETICS_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="BattlePassClip" component={BattlePassClip} durationInFrames={BATTLEPASS_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="DeedsClip" component={DeedsClip} durationInFrames={DEEDS_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="LandClip" component={LandClip} durationInFrames={LAND_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="FrontierClip" component={FrontierClip} durationInFrames={FRONTIER_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="ExpansionLaunch" component={ExpansionTrailer} durationInFrames={EXPANSION_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="ExchangeGif" component={ExchangeGif} durationInFrames={EXGIF_FRAMES} fps={GIF_FPS} width={EXGIF_W} height={EXGIF_H} />
    <Composition
      id="ExchangeClip"
      component={ExchangeClip}
      durationInFrames={EXCHANGE_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {BUILDINGS.map((conf) => (
      <Composition
        key={conf.id}
        id={`Building-${conf.id}`}
        component={BuildingClip}
        durationInFrames={BUILDING_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ id: conf.id }}
      />
    ))}
  </>
);
