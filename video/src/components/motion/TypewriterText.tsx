import { useCurrentFrame } from 'remotion';
import React from 'react';

interface Props {
  text: string;
  startFrame: number;
  framesPerChar?: number;
  showCursor?: boolean;
  style?: React.CSSProperties;
}

export const TypewriterText: React.FC<Props> = ({
  text,
  startFrame,
  framesPerChar = 2,
  showCursor = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const charsVisible = Math.min(
    text.length,
    Math.floor(Math.max(0, frame - startFrame) / framesPerChar)
  );
  const isTyping = charsVisible < text.length && frame >= startFrame;
  const cursorOn = Math.floor(frame / 16) % 2 === 0;

  return (
    <span style={style}>
      {text.slice(0, charsVisible)}
      {showCursor && isTyping && (
        <span style={{ opacity: cursorOn ? 1 : 0, marginLeft: 1 }}>|</span>
      )}
    </span>
  );
};
