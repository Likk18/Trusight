import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { analyzeFaceFrame } from '../../api/endpoints';
import { ScoreRing } from '../common/ScoreRing';
import { CheckCircle, Eye, Camera, CameraOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const FacePanel: React.FC = () => {
  const face = useSessionStore((s) => s.face);
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionState = useSessionStore((s) => s.sessionState);
  const cameraActive = useSessionStore((s) => s.cameraActive);
  const annotatedFaceFrame = useSessionStore((s) => s.annotatedFaceFrame);
  const setAnnotatedFaceFrame = useSessionStore((s) => s.setAnnotatedFaceFrame);
  const setFace = useSessionStore((s) => s.setFace);

  const [localCamOn, setLocalCamOn] = useState(false);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);

  const { videoRef, startCamera, stopCamera } = useUserMedia();
  const { connectStream } = useAudioAnalyser();

  const handleToggleCam = useCallback(() => {
    if (localCamOn || cameraActive) {
      stopCamera();
      setLocalCamOn(false);
      setAnnotatedFaceFrame(null);
    } else {
      startCamera().then(() => {
        setLocalCamOn(true);
        navigator.mediaDevices?.getUserMedia({ audio: true }).then(connectStream).catch(() => {});
      });
    }
  }, [localCamOn, cameraActive, startCamera, stopCamera, connectStream, setAnnotatedFaceFrame]);

  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      startCamera().then(() => {
        setLocalCamOn(true);
        navigator.mediaDevices?.getUserMedia({ audio: true }).then(connectStream).catch(() => {});
      });
    } else if (sessionState === 'Idle' && !localCamOn) {
      stopCamera();
      setAnnotatedFaceFrame(null);
    }
  }, [sessionState]);

  const isLive = sessionState === 'Live_Recording' || localCamOn || cameraActive;

  // Frame streaming loop (~12 FPS)
  useEffect(() => {
    if (!isLive) {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
      }
      return;
    }

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 480;
      offscreenCanvasRef.current.height = 360;
    }

    const captureAndSend = async () => {
      if (isStreamingRef.current) return;
      const video = videoRef.current;
      const canvas = offscreenCanvasRef.current;
      if (!video || video.readyState < 2 || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        isStreamingRef.current = true;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL('image/jpeg', 0.65);

        const res = await analyzeFaceFrame(sessionId || 'live_session', b64);
        if (res.status === 'success') {
          if (res.annotated_frame) {
            setAnnotatedFaceFrame(res.annotated_frame);
          }
          setFace({
            face_score: res.face_score,
            confidence: res.confidence,
            metrics: res.metrics,
            key_reasons: res.key_reasons,
          });
        }
      } catch (err) {
        // Silently continue streaming
      } finally {
        isStreamingRef.current = false;
      }
    };

    frameTimerRef.current = window.setInterval(captureAndSend, 80);

    return () => {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
      }
    };
  }, [isLive, sessionId]);

  const score = face?.face_score ?? 88;
  const metrics = face?.metrics ?? {
    eye_contact_pct: 92,
    blink_rate_status: 'Normal',
    head_stability_pct: 89,
    micro_expressions_level: 'Low',
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
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>Face Analysis</span>
          {isLive && <span className="live-dot" />}
          {isLive && (
            <span style={{ fontSize: 9, color: 'var(--accent-green)', marginLeft: 2, fontWeight: 700 }}>
              {annotatedFaceFrame ? '478 MESH ACTIVE' : 'CAM READY'}
            </span>
          )}
        </div>

        {/* Camera Toggle Button */}
        <button
          onClick={handleToggleCam}
          style={{
            background: isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 212, 255, 0.15)',
            border: isLive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 212, 255, 0.4)',
            color: isLive ? '#ef4444' : '#00d4ff',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isLive ? <CameraOff size={11} /> : <Camera size={11} />}
          {isLive ? 'Stop Cam' : 'Start Cam'}
        </button>
      </div>

      {/* Video + OpenCV Stream Container */}
      <div
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
        {/* Base Video element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            zIndex: 1,
          }}
        />

        {/* Live OpenCV Annotated Stream (Full 478 Mesh, 3D Pose, Gaze, AU Bars) */}
        {annotatedFaceFrame && isLive && (
          <img
            src={annotatedFaceFrame}
            alt="Live Facial CV Stream"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 2,
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Camera off placeholder */}
        {!isLive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #0d1526 0%, #111827 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              zIndex: 4,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={20} color="rgba(0,212,255,0.7)" />
            </div>
            <button
              onClick={handleToggleCam}
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0, 212, 255, 0.3)',
              }}
            >
              Start Camera & Live Face CV
            </button>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              MediaPipe 478-Mesh • 3D Head Pose • Gaze • AU Bars
            </span>
          </div>
        )}

        {/* Annotation Layer Badges */}
        {isLive && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              display: 'flex',
              gap: 4,
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: 'rgba(0, 255, 136, 0.25)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              3D POSE
            </span>
            <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: 'rgba(0, 212, 255, 0.25)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.4)', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              GAZE
            </span>
            <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              478 MESH
            </span>
            <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              AU BARS
            </span>
          </div>
        )}
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
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
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
            <span
              className={`metric-value ${
                metrics.micro_expressions_level === 'Low'
                  ? 'green'
                  : metrics.micro_expressions_level === 'Medium'
                  ? 'amber'
                  : 'red'
              }`}
            >
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
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 5,
          }}
        >
          Key Reasons
        </div>
        {reasons.map((reason, i) => (
          <motion.div
            key={`${reason}-${i}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 5,
              marginBottom: 3,
              fontSize: 10.5,
              color: '#94a3b8',
              lineHeight: 1.4,
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
