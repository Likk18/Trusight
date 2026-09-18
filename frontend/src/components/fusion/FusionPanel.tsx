import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { ArcGauge } from './ArcGauge';
import { FloatingLines } from './FloatingLines';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck } from 'lucide-react';

export const FusionPanel: React.FC = () => {
  const fusion = useSessionStore((s) => s.fusion);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);

  const score = fusion?.truth_likelihood_pct ?? 84;
  const confidence = fusion?.fusion_confidence_pct ?? 93;
  const verdict = fusion?.verdict ?? 'LIKELY TRUTHFUL';
  const explanation = fusion?.explanation ?? 'Overall assessment indicates high consistency across facial, vocal, and textual indicators.';

  const isTruthful = score >= 50;
  const scoreColor = isTruthful ? '#00ff88' : '#ef4444';
  const verdictColor = isTruthful ? '#00ff88' : '#ef4444';

  // 10s Tumbling window progress
  const segmentElapsed = elapsedSeconds % 10;
  const progressPct = (segmentElapsed / 10) * 100;

  return (
    <div
      className="panel panel-glow"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>Fusion Truth Likelihood</span>
        </div>

        {/* 10s Tumbling Window Countdown Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0, 20, 34, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00d4ff', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#00d4ff', fontWeight: 700 }}>
              10s: {segmentElapsed}s
            </span>
            <div style={{ width: 20, height: 3, background: 'rgba(51, 65, 85, 0.6)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: isTruthful ? '#00ff88' : '#ef4444',
                  boxShadow: `0 0 4px ${isTruthful ? '#00ff88' : '#ef4444'}`,
                  transition: 'width 0.9s linear',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: isTruthful ? 'rgba(0, 255, 136, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: isTruthful ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            <ShieldCheck size={10} color={verdictColor} />
            <span style={{ fontSize: 9, fontWeight: 700, color: verdictColor, letterSpacing: '0.05em' }}>{verdict}</span>
          </div>
        </div>
      </div>

      {/* Center: Arc Gauge with Animated Floating Lines Background */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 0 0',
          flex: 1,
          position: 'relative',
          minHeight: 0,
        }}
      >
        {/* Dynamic Three.js Floating Lines Component (Green >=50%, Red <50%) */}
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

        <div style={{ zIndex: 1 }}>
          <ArcGauge score={score} size={230} />
        </div>

        {/* Central Score */}
        <div style={{ marginTop: -26, textAlign: 'center', zIndex: 2 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={Math.round(score)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: scoreColor,
                  lineHeight: 1,
                  textShadow: `0 0 30px ${scoreColor}60, 0 0 60px ${scoreColor}30`,
                }}
              >
                {Math.round(score)}%
              </div>
            </motion.div>
          </AnimatePresence>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              color: verdictColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: 2,
              textShadow: `0 0 12px ${verdictColor}60`,
            }}
          >
            {verdict}
          </div>
        </div>

        {/* Confidence & Agreement */}
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>CONFIDENCE:</span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>
            {Math.round(confidence)}%
          </span>
          <span style={{ fontSize: 10, color: '#334155' }}>•</span>
          <span style={{ fontSize: 10, color: '#64748b' }}>TRI-MODAL CONSENSUS</span>
        </div>

        {/* Explanation text */}
        <div
          style={{
            margin: '6px 16px 0',
            fontSize: 10.5,
            color: '#94a3b8',
            textAlign: 'center',
            lineHeight: 1.35,
            zIndex: 2,
            maxHeight: 36,
            overflow: 'hidden',
          }}
        >
          {explanation}
        </div>
      </div>
    </div>
  );
};
