import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 38,
        background: 'rgba(1, 13, 22, 0.98)',
        borderTop: '1px solid rgba(0, 212, 255, 0.2)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* ── LEFT: Logo & Mission ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={11} color="#000" />
        </div>
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 11,
            fontWeight: 800,
            color: '#ffffff',
          }}
        >
          TruSight
        </span>
        <span style={{ color: '#334155', fontSize: 11 }}>|</span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10.5,
            color: '#64748b',
          }}
        >
          Intelligence for a Safer Tomorrow.
        </span>
      </div>

      {/* ── RIGHT: Core Pillars & Version ────────────────────────────── */}
      <div
        style={{
          fontFamily: 'Space Grotesk, JetBrains Mono, sans-serif',
          fontSize: 9.5,
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '0.12em',
        }}
      >
        <span style={{ color: '#94a3b8' }}>INTELLIGENCE</span>
        <span style={{ margin: '0 6px', color: '#334155' }}>•</span>
        <span style={{ color: '#94a3b8' }}>INTEGRITY</span>
        <span style={{ margin: '0 6px', color: '#334155' }}>•</span>
        <span style={{ color: '#94a3b8' }}>IMPACT</span>
        <span style={{ margin: '0 6px', color: '#334155' }}>•</span>
        <span style={{ color: '#00d4ff' }}>v1.0.0</span>
      </div>
    </footer>
  );
};
