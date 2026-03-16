import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { colors, radius } from '../design/tokens';
import logoLogin from '../assets/logo-login.png';

export const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in from white
  const fadeIn = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Logo spring
  const logoSpring = spring({ frame, fps, config: { stiffness: 200, damping: 20 } });
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoScale   = interpolate(logoSpring, [0, 1], [0.7, 1]);

  // CTA text
  const ctaOpacity  = interpolate(frame, [20, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const urlOpacity  = interpolate(frame, [32, 56], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background:     colors.bg,
      opacity:        fadeIn,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            24,
    }}>
      {/* Logo */}
      <div style={{
        opacity:   logoOpacity,
        transform: `scale(${logoScale})`,
      }}>
        <div style={{
          width:        100,
          height:       100,
          borderRadius: radius.xl,
          overflow:     'hidden',
          boxShadow:    '0 20px 40px rgba(99,102,241,0.15), 0 8px 16px rgba(99,102,241,0.1)',
        }}>
          <img src={logoLogin} alt="Pink Gazelle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* App name */}
      <div style={{ opacity: logoOpacity, textAlign: 'center' }}>
        <div style={{
          fontSize:     42,
          fontWeight:   800,
          color:        colors.textPrimary,
          letterSpacing:'-0.02em',
          lineHeight:   1,
          marginBottom: 6,
        }}>
          Pink Gazelle
        </div>
      </div>

      {/* CTA */}
      <div style={{ opacity: ctaOpacity, textAlign: 'center' }}>
        <div style={{
          fontSize:   16,
          fontWeight: 500,
          color:      colors.textSecondary,
          marginBottom: 20,
        }}>
          Project management built for agencies and their clients.
        </div>
        <div style={{
          display:        'inline-block',
          fontSize:       15,
          fontWeight:     700,
          color:          '#fff',
          background:     'linear-gradient(135deg, #6366f1, #8b5cf6)',
          padding:        '12px 32px',
          borderRadius:   radius.full,
          letterSpacing:  '0.01em',
          boxShadow:      '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          Try Pink Gazelle
        </div>
      </div>

      {/* URL */}
      <div style={{ opacity: urlOpacity, fontSize: 13, color: colors.textTertiary, letterSpacing: '0.04em' }}>
        pink-gazelle.vercel.app
      </div>
    </AbsoluteFill>
  );
};
