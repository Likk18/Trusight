import React, { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { exportReport } from '../../api/endpoints';
import {
  Eye, Mic, Settings, HelpCircle, Download,
  ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const Header: React.FC = () => {
  const { sessionState, sessionId, elapsedSeconds, cameraActive, micActive, fusion, startSession, stopSession, resetSession, pauseSession, resumeSession } = useSessionStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useSessionStore((s) => s.tickTimer);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      timerRef.current = setInterval(tickTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState, tickTimer]);

  const confidence = fusion?.fusion_confidence_pct ?? 93;
  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW';
  const confidenceColor = confidence >= 80 ? 'var(--accent-green)' : confidence >= 55 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const handleExport = async () => {
    if (!sessionId) return;
    setExporting(true);
    try {
      const result = await exportReport(sessionId);
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
        height: 56,
        background: 'linear-gradient(180deg, rgba(13, 21, 38, 0.98) 0%, rgba(10, 15, 30, 0.95) 100%)',
        borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
          }}
        >
          <Eye size={18} color="#000" />
        </div>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '0.08em', lineHeight: 1 }}>
            TRUSIGHT
          </div>
          <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            AI Truth Verification System
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {sessionId && (
          <>
            {/* Session ID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6', display: 'inline-block' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#94a3b8' }}>
                Session ID: <span style={{ color: '#e2e8f0' }}>{sessionId}</span>
              </span>
            </div>

            {/* LIVE indicator */}
            <AnimatePresence>
              {sessionState === 'Live_Recording' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#ef4444',
                      boxShadow: '0 0 8px #ef4444',
                      animation: 'pulse-dot 1s ease-in-out infinite',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '0.1em' }}>LIVE</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer */}
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
              {formatTime(elapsedSeconds)}
            </div>

            {/* Confidence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${confidenceColor}40`, borderRadius: 6 }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Confidence</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor }}>● {confidenceLabel}</span>
            </div>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Hardware status */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            background: cameraActive ? 'rgba(0, 255, 136, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${cameraActive ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 5, fontSize: 10, fontWeight: 600,
            color: cameraActive ? 'var(--accent-green)' : '#ef4444',
          }}>
            <Eye size={10} />
            {cameraActive ? 'Cam Active' : 'Cam Off'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            background: micActive ? 'rgba(0, 255, 136, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${micActive ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 5, fontSize: 10, fontWeight: 600,
            color: micActive ? 'var(--accent-green)' : '#ef4444',
          }}>
            <Mic size={10} />
            {micActive ? 'Mic Active' : 'Mic Off'}
          </div>
        </div>

        {/* Session Controls */}
        {sessionState === 'Idle' && (
          <button
            id="btn-start-session"
            onClick={startSession}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
              border: 'none', borderRadius: 7, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: '#000',
              boxShadow: '0 0 16px rgba(0,212,255,0.3)',
              transition: 'all 0.2s',
            }}
          >
            <Zap size={13} />
            Start Session
          </button>
        )}
        {sessionState === 'Live_Recording' && (
          <button
            id="btn-pause-session"
            onClick={pauseSession}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#f59e0b' }}
          >
            Pause
          </button>
        )}
        {sessionState === 'Paused' && (
          <button
            id="btn-resume-session"
            onClick={resumeSession}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--accent-cyan)' }}
          >
            Resume
          </button>
        )}
        {(sessionState === 'Live_Recording' || sessionState === 'Paused') && (
          <button
            id="btn-stop-session"
            onClick={stopSession}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ef4444' }}
          >
            Stop
          </button>
        )}
        {(sessionState === 'Completed') && (
          <button
            id="btn-reset-session"
            onClick={resetSession}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8b5cf6' }}
          >
            Reset
          </button>
        )}

        <div style={{ width: 1, height: 28, background: 'rgba(30,41,59,0.8)', margin: '0 4px' }} />

        <button
          id="btn-export-report"
          onClick={handleExport}
          disabled={exporting || !sessionId}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            background: sessionId ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${sessionId ? 'rgba(0,212,255,0.3)' : 'rgba(30,41,59,0.4)'}`,
            borderRadius: 7, cursor: sessionId ? 'pointer' : 'not-allowed',
            fontSize: 12, fontWeight: 600,
            color: sessionId ? 'var(--accent-cyan)' : '#475569',
            transition: 'all 0.2s',
            opacity: exporting ? 0.7 : 1,
          }}
        >
          <Download size={13} />
          {exporting ? 'Generating...' : 'Export Report'}
          <ChevronRight size={11} />
        </button>

        <button id="btn-settings" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 4 }}>
          <Settings size={16} />
        </button>
        <button id="btn-help" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 4 }}>
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
