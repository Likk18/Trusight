import React, { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { FaceCanvas } from './FaceCanvas';
import { ScoreRing } from '../common/ScoreRing';
import { CheckCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const FacePanel: React.FC = () => {
  const face = useSessionStore((s) => s.face);
  const sessionState = useSessionStore((s) => s.sessionState);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 320, h: 200 });
  const { videoRef, startCamera, stopCamera } = useUserMedia();
  const { connectStream } = useAudioAnalyser();

  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      startCamera().then(() => {
        // Connect audio analyser after camera starts
        navigator.mediaDevices.getUserMedia({ audio: true }).then(connectStream).catch(() => {});
      });
    } else if (sessionState === 'Idle') {
      stopCamera();
    }
  }, [sessionState]);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          w: Math.floor(entry.contentRect.width),
          h: Math.floor(entry.contentRect.height),
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const score = face?.face_score ?? 88;
  const metrics = face?.metrics ?? {
    eye_contact_pct: 92, blink_rate_status: 'Normal',
    head_stability_pct: 89, micro_expressions_level: 'Low',
    facial_tension_pct: 18,
  };
  const reasons = face?.key_reasons ?? [
    'Stable gaze maintained throughout response',
    'Natural blinking frequency detected',
    'Slight eyebrow raise during timestamp 01:12',
  ];

  const scoreColor = score >= 75 ? '#00ff88' : score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : 'Low';

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="section-header">
        <Eye size={12} style={{ color: 'var(--accent-cyan)' }} />
        <span>Face Analysis</span>
        {sessionState === 'Live_Recording' && <span className="live-dot" />}
        {sessionState === 'Live_Recording' && (
          <span style={{ fontSize: 9, color: 'var(--accent-green)', marginLeft: 2 }}>LIVE</span>
        )}
      </div>

      {/* Video + Canvas Overlay */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: '0 0 auto',
          height: 180,
          margin: '8px 12px 0',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#000',
          border: '1px solid rgba(30,41,59,0.6)',
        }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Camera off placeholder */}
        {sessionState !== 'Live_Recording' && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #0d1526 0%, #111827 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8,
            }}
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Eye size={20} color="rgba(0,212,255,0.5)" />
            </div>
            <span style={{ fontSize: 11, color: '#475569' }}>
              {sessionState === 'Idle' ? 'Start session to activate camera' : 'Camera paused'}
            </span>
          </div>
        )}

        {/* Canvas overlay */}
        <FaceCanvas width={containerSize.w} height={180} />
      </div>

      {/* Metrics + Score */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px 0', flex: 1, minHeight: 0 }}>
        {/* Score Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ScoreRing score={score} size={72} strokeWidth={5} color={scoreColor} label={scoreLabel} fontSize={15} />
          <span style={{ fontSize: 10, color: '#64748b' }}>Face Score</span>
        </div>

        {/* Metrics */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Key Metrics
          </div>
          <div className="metric-row">
            <span className="metric-label">Eye Contact</span>
            <span className="metric-value green">{metrics.eye_contact_pct.toFixed(0)}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Blink Rate</span>
            <span className={`metric-value ${metrics.blink_rate_status === 'Normal' ? 'green' : 'amber'}`}>
              {metrics.blink_rate_status}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Head Stability</span>
            <span className="metric-value green">{metrics.head_stability_pct.toFixed(0)}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Micro Expressions</span>
            <span className={`metric-value ${metrics.micro_expressions_level === 'Low' ? 'green' : metrics.micro_expressions_level === 'Medium' ? 'amber' : 'red'}`}>
              {metrics.micro_expressions_level}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Facial Tension</span>
            <span className={`metric-value ${metrics.facial_tension_pct < 30 ? 'green' : 'amber'}`}>
              {metrics.facial_tension_pct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Key Reasons */}
      <div style={{ padding: '8px 12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
          Key Reasons
        </div>
        {reasons.map((reason, i) => (
          <motion.div
            key={`${reason}-${i}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 5,
              marginBottom: 3, fontSize: 10.5, color: '#94a3b8', lineHeight: 1.4,
            }}
          >
            <CheckCircle size={10} color={i < 2 ? '#00ff88' : '#f59e0b'} style={{ marginTop: 2, flexShrink: 0 }} />
            {reason}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
