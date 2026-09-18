import React, { useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { exportReport } from '../../api/endpoints';
import { Download, Pause, Play, Square, RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    sessionState,
    sessionId,
    elapsedSeconds,
    face,
    voice,
    uploadedVoice,
    text,
    fusion,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    resetSession,
  } = useSessionStore();

  const [exporting, setExporting] = useState(false);

  const isLive = sessionState === 'Live_Recording';
  const isPaused = sessionState === 'Paused';
  const isSessionActive = isLive || isPaused;

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStopSession = () => {
    stopSession();
    resetSession();
  };

  const handleExport = async () => {
    if (!sessionId) return;
    setExporting(true);
    try {
      const activeVoice = uploadedVoice || voice;
      const result = await exportReport({
        session_id: sessionId,
        subject_label: 'Subject Alpha-01',
        face_data: face,
        voice_data: activeVoice,
        text_data: text,
        fusion_data: fusion,
      });
      window.open(`http://localhost:8000${result.download_url}`, '_blank');
    } catch {
      console.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 52,
        background: 'linear-gradient(180deg, rgba(3, 15, 26, 0.98) 0%, rgba(1, 13, 22, 0.95) 100%)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(0, 212, 255, 0.15)',
      }}
    >
      {/* ── LEFT: Logo & Brand Tagline ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Futuristic Circular Logo */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #00d4ff 0%, #0077aa 60%, #002233 100%)',
            border: '1.5px solid rgba(0, 212, 255, 0.6)',
            boxShadow: '0 0 14px rgba(0, 212, 255, 0.5), inset 0 0 6px rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#00ff88',
              boxShadow: '0 0 8px #00ff88',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontFamily: 'Space Grotesk, Inter, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            TruSight
          </span>
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 9.5,
              fontWeight: 700,
              color: '#00d4ff',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textShadow: '0 0 8px rgba(0, 212, 255, 0.4)',
            }}
          >
            TRUTH BEYOND DOUBT
          </span>
        </div>
      </div>

      {/* ── CENTER: Live Session ID & Ticking Timer Pill ────────────────── */}
      {isSessionActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(0, 20, 34, 0.85)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 20,
            padding: '4px 14px',
            boxShadow: '0 0 16px rgba(0, 212, 255, 0.15)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isLive ? '#ef4444' : '#f59e0b',
              boxShadow: isLive ? '0 0 8px #ef4444' : '0 0 6px #f59e0b',
              animation: isLive ? 'pulse-dot 1s infinite' : 'none',
            }}
          />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 10.5, fontWeight: 700, color: isLive ? '#ef4444' : '#f59e0b' }}>
            {isLive ? 'LIVE' : 'PAUSED'}
          </span>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94a3b8' }}>
            #{sessionId || 'sess_01'}
          </span>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#00ff88' }}>
            {formatTimer(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* ── RIGHT: Action Controls ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* If Idle: Start Session Button */}
        {!isSessionActive && (
          <button
            onClick={startSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0, 212, 255, 0.12)',
              color: '#00d4ff',
              border: '1px solid rgba(0, 212, 255, 0.35)',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(0, 212, 255, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <Play size={11} fill="#00d4ff" />
            <span>Start Session</span>
          </button>
        )}

        {/* If Active Session: Pause/Resume, Stop, and Reset */}
        {isSessionActive && (
          <>
            <button
              onClick={isLive ? pauseSession : resumeSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(0, 212, 255, 0.12)',
                color: '#00d4ff',
                border: '1px solid rgba(0, 212, 255, 0.35)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                cursor: 'pointer',
              }}
            >
              {isLive ? <Pause size={11} /> : <Play size={11} fill="#00d4ff" />}
              <span>{isLive ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={handleStopSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'Space Grotesk, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)',
              }}
            >
              <Square size={10} fill="#fff" />
              <span>Stop</span>
            </button>

            <button
              onClick={resetSession}
              title="Reset Session"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#94a3b8',
                border: '1px solid rgba(51, 65, 85, 0.6)',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={11} />
            </button>
          </>
        )}

        {/* Export PDF Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(10, 24, 38, 0.75)',
            color: '#e2e8f0',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 11.5,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Download size={12} color="#00d4ff" />
          <span>{exporting ? 'Exporting...' : 'Export PDF ›'}</span>
        </button>
      </div>
    </header>
  );
};
