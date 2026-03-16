import { AbsoluteFill, Sequence } from 'remotion';
import { Scene1Intro } from './scenes/Scene1Intro';
import { Scene2Dashboard } from './scenes/Scene2Dashboard';
import { Scene3ProjectDetail } from './scenes/Scene3ProjectDetail';
import { Scene4ClientPortal } from './scenes/Scene4ClientPortal';
import { Scene5Callouts } from './scenes/Scene5Callouts';
import { Scene6Outro } from './scenes/Scene6Outro';

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#ffffff' }}>
      {/* Scene 1: Intro — frames 0–239 (overlaps with scene 2 for transition) */}
      <Sequence from={0} durationInFrames={240}>
        <Scene1Intro />
      </Sequence>

      {/* Scene 2: Admin Dashboard — frames 180–479 */}
      <Sequence from={180} durationInFrames={300}>
        <Scene2Dashboard />
      </Sequence>

      {/* Scene 3: Project Detail — frames 420–779 */}
      <Sequence from={420} durationInFrames={360}>
        <Scene3ProjectDetail />
      </Sequence>

      {/* Scene 4: Client Portal — frames 720–1019 */}
      <Sequence from={720} durationInFrames={300}>
        <Scene4ClientPortal />
      </Sequence>

      {/* Scene 5: Feature Callouts — frames 960–1179 */}
      <Sequence from={960} durationInFrames={220}>
        <Scene5Callouts />
      </Sequence>

      {/* Scene 6: Outro — frames 1140–1199 */}
      <Sequence from={1140} durationInFrames={60}>
        <Scene6Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
