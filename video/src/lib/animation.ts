import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface SpringOpts {
  delay?: number;
  mass?: number;
  stiffness?: number;
  damping?: number;
  overshootClamping?: boolean;
}

/** Returns a 0→1 spring value starting at `delay` frames into the current sequence. */
export function useSpring(opts: SpringOpts = {}): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: Math.max(0, frame - (opts.delay ?? 0)),
    fps,
    config: {
      mass:              opts.mass              ?? 1,
      stiffness:         opts.stiffness         ?? 100,
      damping:           opts.damping           ?? 15,
      overshootClamping: opts.overshootClamping ?? false,
    },
  });
}

/** Returns 0→1 opacity between startFrame and endFrame (local frames). */
export function useFade(startFrame: number, endFrame: number): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });
}

/** Returns the visible substring for a typewriter effect. */
export function useTypewriter(
  text: string,
  startFrame: number,
  framesPerChar = 2
): string {
  const frame = useCurrentFrame();
  const charsToShow = Math.min(
    text.length,
    Math.floor(Math.max(0, frame - startFrame) / framesPerChar)
  );
  return text.slice(0, charsToShow);
}

/** Returns a cursor visibility boolean (blinking). */
export function useCursorVisible(interval = 8): boolean {
  const frame = useCurrentFrame();
  return Math.floor(frame / interval) % 2 === 0;
}

/** Interpolate with clamp on both sides (convenience). */
export function lerp(
  frame: number,
  [f0, f1]: [number, number],
  [v0, v1]: [number, number]
): number {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });
}
