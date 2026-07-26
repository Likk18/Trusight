import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { ScoreRing } from '../common/ScoreRing';
import { GitMerge } from 'lucide-react';
import { motion } from 'framer-motion';

const RING_COLORS = {
  face: '#8b5cf6',
  voice: '#00d4ff',
  text: '#00ff88',
  evidence: '#f59e0b',
};

const CONTRIBUTOR_COLORS = {
  linguistic_consistency: '#00ff88',
  speech_patterns: '#00d4ff',
  facial_stability: '#8b5cf6',
  factual_evidence: '#f59e0b',
  minor_hesitation: '#ef4444',
};

const CONTRIBUTOR_LABELS: Record<string, string> = {
  linguistic_consistency: 'Linguistic Consistency',
  speech_patterns: 'Speech Patterns',
  facial_stability: 'Facial Stability',
  factual_evidence: 'Factual Evidence',
  minor_hesitation: 'Minor Hesitation',
};

export const ModelAgreement: React.FC = () => {
  const fusion = useSessionStore((s) => s.fusion);

  const agreement = fusion?.model_agreement ?? {
    face_score: 88, voice_score: 81, text_score: 91, evidence_score: 85, overall_agreement_pct: 96,
  };
  const contributors = fusion?.contributors ?? {
    linguistic_consistency: { weight_pct: 28, impact: 'positive' },
    speech_patterns: { weight_pct: 24, impact: 'positive' },
    facial_stability: { weight_pct: 20, impact: 'positive' },
    factual_evidence: { weight_pct: 18, impact: 'positive' },
    minor_hesitation: { weight_pct: 6, impact: 'negative' },
  };
  const systemStatus = fusion?.system_status ?? {
    uncertainty_level: 'LOW',
    video_quality: 'Good', audio_quality: 'Good',
    lighting: 'Good', background_noise: 'Low',
    processing_latency_ms: 120,
  };

  const uncertaintyPosition =
    systemStatus.uncertainty_level === 'LOW' ? 12
    : systemStatus.uncertainty_level === 'MEDIUM' ? 50
    : 88;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitMerge size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>Model Agreement</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#00ff88' }}>
          {Math.round(agreement.overall_agreement_pct)}%
        </span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Four Agreement Rings */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-around' }}>
          {[
            { label: 'Face', score: agreement.face_score, color: RING_COLORS.face },
            { label: 'Voice', score: agreement.voice_score, color: RING_COLORS.voice },
            { label: 'Text', score: agreement.text_score, color: RING_COLORS.text },
            { label: 'Evidence', score: agreement.evidence_score, color: RING_COLORS.evidence },
          ].map(({ label, score, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ScoreRing score={score} size={58} strokeWidth={4} color={color} fontSize={12} />
              <span style={{ fontSize: 9.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Contributing Factors */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Top Contributing Factors
          </div>
          {Object.entries(contributors).map(([key, val]) => {
            const color = CONTRIBUTOR_COLORS[key as keyof typeof CONTRIBUTOR_COLORS] ?? '#64748b';
            const isNeg = val.impact === 'negative';
            const barWidth = Math.abs(val.weight_pct);
            return (
              <div key={key} style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10.5, color: '#94a3b8' }}>{CONTRIBUTOR_LABELS[key] ?? key}</span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono',
                      color: isNeg ? '#ef4444' : color,
                    }}
                  >
                    {isNeg ? '-' : '+'}{val.weight_pct}%
                  </span>
                </div>
                <div className="factor-bar-track">
                  <motion.div
                    className="factor-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      background: isNeg
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : `linear-gradient(90deg, ${color}80, ${color})`,
                      maxWidth: '100%',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Uncertainty Level */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Uncertainty Level
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: systemStatus.uncertainty_level === 'LOW' ? '#00ff88'
                : systemStatus.uncertainty_level === 'MEDIUM' ? '#f59e0b' : '#ef4444',
            }}>
              {systemStatus.uncertainty_level}
            </span>
          </div>
          <div className="uncertainty-track">
            <div className="uncertainty-thumb" style={{ left: `${uncertaintyPosition}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 9, color: '#475569' }}>
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
        </div>

        {/* System Status mini */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            System Status
          </div>
          {[
            { label: 'Video Quality', value: systemStatus.video_quality },
            { label: 'Audio Quality', value: systemStatus.audio_quality },
            { label: 'Lighting', value: systemStatus.lighting },
            { label: 'Background Noise', value: systemStatus.background_noise },
            { label: 'Processing Latency', value: `${systemStatus.processing_latency_ms} ms` },
          ].map(({ label, value }) => (
            <div key={label} className="metric-row">
              <span className="metric-label">{label}</span>
              <span className="metric-value green">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
