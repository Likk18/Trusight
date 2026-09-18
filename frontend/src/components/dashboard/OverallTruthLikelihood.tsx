import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { ArcGauge } from '../fusion/ArcGauge';
import { FloatingLines } from '../fusion/FloatingLines';
import { ShieldCheck } from 'lucide-react';

export const OverallTruthLikelihood: React.FC = () => {
  const fusion = useSessionStore((s) => s.fusion);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);

  const score = fusion ? fusion.truth_likelihood_pct : 74;
  const verdict = fusion?.verdict || 'LIKELY TRUTHFUL';

  // 10-Second Tumbling Window Clock Calculation
  const segmentElapsed = elapsedSeconds % 10;
  const progressPct = (segmentElapsed / 10) * 100;

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: 8,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top Header: Title on Left, Compact 10s Timer & Verdict in Top-Right Corner */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(30, 41, 59, 0.6)', paddingBottom: 4, zIndex: 2 }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
            Fusion Score
          </div>
          <div style={{ fontSize: 9, color: '#64748B' }}>
            Overall Truth Likelihood
          </div>
        </div>

        {/* Top-Right Corner: Compact 10s Timer Badge + Verdict */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Small 10s Sync Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0, 20, 34, 0.9)',
              border: '1px solid rgba(0, 212, 255, 0.35)',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            <span style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#00D4FF', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700, color: '#00D4FF' }}>
              10s: {segmentElapsed}s
            </span>
            <div style={{ width: 16, height: 2.5, background: 'rgba(51, 65, 85, 0.8)', borderRadius: 1.5, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: '#00D4FF',
                  boxShadow: '0 0 4px #00D4FF',
                  transition: 'width 0.9s linear',
                }}
              />
            </div>
          </div>

          {/* Verdict Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: score >= 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: score >= 50 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 5px', borderRadius: 4 }}>
            <ShieldCheck size={9.5} color={score >= 50 ? '#10B981' : '#ef4444'} />
            <span style={{ fontSize: 8.5, fontWeight: 700, color: score >= 50 ? '#10B981' : '#ef4444', fontFamily: 'Space Grotesk' }}>{verdict}</span>
          </div>
        </div>
      </div>

      {/* Center: Arc Gauge with Dynamic Floating Lines Background */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', minHeight: 0, zIndex: 1 }}>
        {/* Animated Three.js Floating Lines Component (Green >=50%, Red <50%) */}
        <FloatingLines
          key={score >= 50 ? 'green-config' : 'red-config'}
          enabledWaves="middle,bottom,top"
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive={true}
          parallax={true}
          animationSpeed={1}
          gradientStart={score >= 50 ? '#53f545' : '#f54545'}
          gradientMid={score >= 50 ? '#1d8a17' : '#8a1717'}
          gradientEnd={score >= 50 ? '#69a763' : '#a76363'}
        />

        <div style={{ transform: 'scale(0.88)', transformOrigin: 'center 60%', height: 125, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <ArcGauge score={score} size={220} />
        </div>

        {/* Center Score Overlay */}
        <div style={{ position: 'absolute', bottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 900, color: '#F8FAFC', lineHeight: 1 }}>
            {Math.round(score)}%
          </span>
          <span style={{ fontSize: 8.5, color: '#64748B', marginTop: 1, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
            CONFIDENCE {fusion?.fusion_confidence_pct ? Math.round(fusion.fusion_confidence_pct) : 93}%
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div style={{ fontSize: 9, color: '#64748B', textAlign: 'center', fontFamily: 'Inter', width: '100%', borderTop: '1px solid rgba(30, 41, 59, 0.4)', paddingTop: 2, zIndex: 1 }}>
        Weighted synthesis across 3 neural modalities
      </div>
    </div>
  );
};
