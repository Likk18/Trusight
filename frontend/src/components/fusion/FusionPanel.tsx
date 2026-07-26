import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { ArcGauge } from './ArcGauge';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export const FusionPanel: React.FC = () => {
  const fusion = useSessionStore((s) => s.fusion);

  const score = fusion?.truth_likelihood_pct ?? 84;
  const confidence = fusion?.fusion_confidence_pct ?? 93;
  const verdict = fusion?.verdict ?? 'LIKELY TRUTHFUL';
  const explanation = fusion?.explanation ?? 'Overall assessment indicates high consistency across multiple behavioral and linguistic indicators. No strong signs of deception detected.';

  const scoreColor = score >= 75 ? '#00ff88' : score >= 50 ? '#f59e0b' : '#ef4444';
  const verdictColor = score >= 75 ? '#00ff88' : score >= 50 ? '#f59e0b' : '#ef4444';

  // Mini sparkline data (fake history for display)
  const sparkline = Array.from({ length: 20 }, (_, i) =>
    score + Math.sin(i * 0.5) * 4 + (Math.random() - 0.5) * 3
  );
  const sparkMin = Math.min(...sparkline);
  const sparkMax = Math.max(...sparkline);
  const sparkH = 28;
  const sparkW = 160;
  const sparkPoints = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * sparkW;
      const y = sparkH - ((v - sparkMin) / (sparkMax - sparkMin + 1)) * sparkH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="panel panel-glow" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="section-header">
        <Zap size={12} style={{ color: 'var(--accent-cyan)' }} />
        <span>Truth Likelihood</span>
      </div>

      {/* Arc Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 0', flex: 1 }}>
        <ArcGauge score={score} size={240} />

        {/* Central Score */}
        <div style={{ marginTop: -28, textAlign: 'center' }}>
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
                  fontSize: 56,
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
              fontSize: 15,
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

        {/* Confidence */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Fusion Confidence:</span>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>
            {Math.round(confidence)}%
          </span>
        </div>

        {/* Mini sparkline */}
        <div style={{ marginTop: 6, position: 'relative' }}>
          <svg width={sparkW} height={sparkH} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={scoreColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={scoreColor}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 3px ${scoreColor})` }}
            />
          </svg>
        </div>

        {/* Explanation */}
        <div
          style={{
            margin: '8px 16px 12px',
            padding: '10px 14px',
            background: 'rgba(0, 212, 255, 0.04)',
            border: '1px solid rgba(0, 212, 255, 0.1)',
            borderRadius: 8,
            fontSize: 11.5,
            color: '#94a3b8',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          {explanation}
        </div>
      </div>
    </div>
  );
};
