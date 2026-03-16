import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { colors, font, radius } from '../design/tokens';
import { TypewriterText } from '../components/motion/TypewriterText';
import logoLogin from '../assets/logo-login.png';

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade: bgSubtle → white
  const bgOpacity = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Logo spring entrance
  const logoSpring = spring({ frame, fps, config: { stiffness: 80, damping: 14 } });
  const logoOpacity   = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoScale     = interpolate(logoSpring, [0, 1], [0.6, 1]);

  // Tagline appears after logo settles (~frame 20)
  const tagline = 'Where projects meet their moment.';

  // Fade-out of entire scene at the end (frames 90-119)
  const sceneOpacity = interpolate(frame, [180, 238], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: colors.bg,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 32,
      opacity: sceneOpacity,
    }}>
      {/* Logo */}
      <div style={{
        opacity:   logoOpacity,
        transform: `scale(${logoScale})`,
      }}>
        <div style={{
          width:        120,
          height:       120,
          borderRadius: radius.xl,
          overflow:     'hidden',
          boxShadow:    '0 20px 40px rgba(99,102,241,0.15), 0 8px 16px rgba(99,102,241,0.1)',
        }}>
          <img src={logoLogin} alt="Pink Gazelle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* App name */}
      <div style={{
        opacity:   logoOpacity,
        transform: `scale(${logoScale})`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize:    52,
          fontWeight:  800,
          color:       colors.textPrimary,
          letterSpacing: '-0.02em',
          lineHeight:  1,
          marginBottom: 12,
        }}>
          Pink Gazelle
        </div>
        <div style={{
          fontSize:   18,
          fontWeight: 400,
          color:      colors.textTertiary,
          letterSpacing: '0.01em',
          minHeight:  28,
        }}>
          <TypewriterText
            text={tagline}
            startFrame={50}
            framesPerChar={3.6}
          />
        </div>
      </div>

      {/* Subtle label */}
      <div style={{
        opacity:   interpolate(frame, [100, 140], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        fontSize:  12,
        fontWeight: 500,
        color:     colors.textTertiary,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        Project Management · Client Portals · Real-time
      </div>
    </AbsoluteFill>
  );
};
