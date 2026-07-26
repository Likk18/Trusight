import React, { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { ScoreRing } from '../common/ScoreRing';
import { Music2, CheckCircle } from 'lucide-react';

export const VoicePanel: React.FC = () => {
  const voice = useSessionStore((s) => s.voice);
  const sessionState = useSessionStore((s) => s.sessionState);
  const { canvasRef, connectStream, disconnect } = useAudioAnalyser(256);

  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(connectStream)
        .catch(() => console.warn('Mic not available'));
    } else if (sessionState === 'Idle') {
      disconnect();
    }
    return () => {
      if (sessionState !== 'Live_Recording') disconnect();
    };
  }, [sessionState]);

  const voiceTruthScore = voice ? 100 - voice.deception_score : 81;
  const metrics = voice?.metrics ?? {
    pitch_status: 'Normal', speech_rate_wpm: 142,
    energy_pct: 72, hesitation_level: 'Low', pauses_count: 3,
  };
  const reasons = voice?.key_reasons ?? [
    'Steady fundamental frequency (F0)',
    'Minimal acoustic hesitation markers',
    'Natural pause durations between syntactic clauses',
  ];
  const observations = voice?.observations ?? [];

  const scoreColor = voiceTruthScore >= 75 ? '#00d4ff' : voiceTruthScore >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = voiceTruthScore >= 75 ? 'Good' : voiceTruthScore >= 50 ? 'Moderate' : 'Poor';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="section-header">
        <Music2 size={12} style={{ color: 'var(--accent-cyan)' }} />
        <span>Voice Analysis</span>
        {sessionState === 'Live_Recording' && <span className="live-dot" />}
        {sessionState === 'Live_Recording' && (
          <span style={{ fontSize: 9, color: 'var(--accent-green)', marginLeft: 2 }}>LIVE</span>
        )}
      </div>

      {/* Waveform Canvas */}
      <div
        style={{
          margin: '8px 12px 0',
          height: 72,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(30,41,59,0.6)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={72}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        {sessionState !== 'Live_Recording' && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Static idle waveform */}
            <svg width="100%" height="100%" viewBox="0 0 400 72" preserveAspectRatio="none">
              {Array.from({ length: 80 }, (_, i) => (
                <rect
                  key={i}
                  x={i * 5}
                  y={36 - 6}
                  width={3}
                  height={12}
                  fill="rgba(0,212,255,0.15)"
                  rx={1}
                />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Vocal Telemetry Pills */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px 0', flexWrap: 'wrap' }}>
        {[
          { label: 'Pitch', value: metrics.pitch_status, ok: metrics.pitch_status === 'Normal' },
          { label: 'Speech Rate', value: `${Math.round(metrics.speech_rate_wpm)} wpm`, ok: true },
          { label: 'Energy', value: `${Math.round(metrics.energy_pct)}%`, ok: true },
          { label: 'Hesitation', value: metrics.hesitation_level, ok: metrics.hesitation_level === 'Low' },
          { label: 'Pauses', value: String(metrics.pauses_count), ok: true },
        ].map(({ label, value, ok }) => (
          <div
            key={label}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '5px 8px',
              background: 'rgba(26, 36, 54, 0.6)',
              border: '1px solid rgba(30,41,59,0.6)',
              borderRadius: 6, flex: 1, minWidth: 50,
            }}
          >
            <span style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: ok ? '#00d4ff' : '#f59e0b', marginTop: 2 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Score + Key Reasons */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px 0', flex: 1, minHeight: 0, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ScoreRing score={voiceTruthScore} size={68} strokeWidth={5} color={scoreColor} label={scoreLabel} fontSize={14} />
          <span style={{ fontSize: 9.5, color: '#64748b' }}>Voice Score</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
            Key Reasons
          </div>
          {reasons.map((reason, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 4, fontSize: 10.5, color: '#94a3b8', alignItems: 'flex-start' }}>
              <CheckCircle size={10} color="#00ff88" style={{ marginTop: 2, flexShrink: 0 }} />
              {reason}
            </div>
          ))}
        </div>
      </div>

      {/* Observations */}
      {observations.length > 0 && (
        <div style={{ padding: '6px 12px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Observations
          </div>
          {observations.slice(0, 3).map((obs, i) => (
            <div key={i} style={{ fontSize: 10, color: '#64748b', marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ color: '#475569' }}>•</span> {obs}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
