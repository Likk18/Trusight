import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { FileText, Mic } from 'lucide-react';

export const LiveTranscriptStrip: React.FC = () => {
  const text = useSessionStore((s) => s.text);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const sessionState = useSessionStore((s) => s.sessionState);

  const isLive = sessionState === 'Live_Recording';

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const transcript = text?.transcript || 'I was at home last night.';

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: '0 16px',
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        flexShrink: 0,
      }}
    >
      {/* ── LEFT: Icon, Title, Timer, Subject, and Transcript ──────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {/* Purple Document Icon */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileText size={12} color="#a855f7" />
        </div>

        {/* Title */}
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 12,
            fontWeight: 800,
            color: '#F8FAFC',
            whiteSpace: 'nowrap',
          }}
        >
          Live Transcript
        </span>

        {/* Timestamp */}
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10.5,
            fontWeight: 600,
            color: '#64748b',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTimer(elapsedSeconds || 766)}
        </span>

        {/* Blue Subject Pill */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            background: 'rgba(0, 212, 255, 0.12)',
            color: '#00d4ff',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            borderRadius: 4,
            padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          Subject
        </span>

        {/* Transcript Text */}
        <span
          style={{
            fontSize: 12,
            color: '#e2e8f0',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          &ldquo;{transcript}&rdquo;
        </span>
      </div>

      {/* ── RIGHT: Speaking Indicator ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 16 }}>
        <Mic size={13} color="#00d4ff" />
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 10.5,
            fontWeight: 700,
            color: '#00d4ff',
            letterSpacing: '0.04em',
          }}
        >
          {isLive ? 'Speaking...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};
