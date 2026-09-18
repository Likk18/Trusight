import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { analyzeFaceFrame } from '../../api/endpoints';
import { Camera, Mic, Maximize2, CameraOff, MicOff, Eye, EyeOff } from 'lucide-react';

export const LiveCameraCard: React.FC = () => {
  const sessionState = useSessionStore((s) => s.sessionState);
  const sessionId = useSessionStore((s) => s.sessionId);
  const cameraActive = useSessionStore((s) => s.cameraActive);
  const micActive = useSessionStore((s) => s.micActive);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const annotatedFaceFrame = useSessionStore((s) => s.annotatedFaceFrame);
  const setAnnotatedFaceFrame = useSessionStore((s) => s.setAnnotatedFaceFrame);

  const [showAnnotations, setShowAnnotations] = useState(true); // Toggle for facial landmark/tracking overlay
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);

  const { videoRef, startCamera, stopCamera } = useUserMedia();
  const { equalizerBars, startMic, stopMic } = useAudioAnalyser();

  // Independent Camera toggle
  const handleToggleCam = useCallback(() => {
    if (cameraActive) {
      stopCamera();
      setAnnotatedFaceFrame(null);
    } else {
      startCamera();
    }
  }, [cameraActive, startCamera, stopCamera, setAnnotatedFaceFrame]);

  // Independent Mic toggle
  const handleToggleMic = useCallback(() => {
    if (micActive) {
      stopMic();
    } else {
      startMic();
    }
  }, [micActive, startMic, stopMic]);

  // Auto-start hardware on recording start
  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      startCamera();
      startMic();
    } else if (sessionState === 'Idle') {
      stopCamera();
      stopMic();
      setAnnotatedFaceFrame(null);
    }
  }, [sessionState]);

  // Frame streaming loop (~12 FPS)
  useEffect(() => {
    if (!cameraActive) {
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
        if (res.status === 'success' && res.annotated_frame) {
          setAnnotatedFaceFrame(res.annotated_frame);
        }
      } catch (err) {
        // Continue stream
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
  }, [cameraActive, sessionId, setAnnotatedFaceFrame, videoRef]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      style={{
        background: '#001422',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: 8,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── High-Contrast Header HUD ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '5px 10px',
          background: 'rgba(0, 14, 24, 0.94)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: cameraActive ? '#ef4444' : '#64748b',
              boxShadow: cameraActive ? '0 0 8px #ef4444' : 'none',
              animation: cameraActive ? 'pulse-dot 1s infinite' : 'none',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 11,
              fontWeight: 800,
              color: cameraActive ? '#F8FAFC' : '#94a3b8',
              letterSpacing: '0.06em',
            }}
          >
            LIVE
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, fontSize: 8.5, color: '#94a3b8', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
          <span>1080p</span>
          <span>•</span>
          <span style={{ color: '#00ff88' }}>FPS 30</span>
        </div>
      </div>

      {/* ── Full Coverage Video & Face CV Container (Frameless) ──────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: '#000814',
          overflow: 'hidden',
        }}
      >
        {/* Raw Video Feed */}
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
          }}
        />

        {/* 1:1 OpenCV Annotated Image Stream (478 Landmarks / Mesh / Gaze / Pose / AU Overlay) */}
        {annotatedFaceFrame && cameraActive && showAnnotations && (
          <img
            src={annotatedFaceFrame}
            alt="Facial Tracking Stream"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Placeholder if camera off */}
        {!cameraActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #03101c 0%, #010810 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              zIndex: 4,
            }}
          >
            <Camera size={26} color="rgba(0, 212, 255, 0.7)" />
            <button
              onClick={handleToggleCam}
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                color: '#000',
                border: 'none',
                borderRadius: 5,
                padding: '5px 14px',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'Space Grotesk',
                cursor: 'pointer',
              }}
            >
              Start Camera
            </button>
          </div>
        )}
      </div>

      {/* ── Zero-Padding Flush Bottom Strip HUD ──────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '2px 8px',
          height: 22,
          background: 'rgba(0, 14, 24, 0.94)',
          borderTop: '1px solid rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Audio Equalizer & Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 9 }}>
            <span
              style={{
                width: 2,
                height: micActive ? `${equalizerBars[0]}px` : '3px',
                background: micActive ? '#00d4ff' : '#475569',
                borderRadius: 1,
                transition: 'height 0.08s ease',
              }}
            />
            <span
              style={{
                width: 2,
                height: micActive ? `${equalizerBars[1]}px` : '4px',
                background: micActive ? '#00d4ff' : '#475569',
                borderRadius: 1,
                transition: 'height 0.08s ease',
              }}
            />
            <span
              style={{
                width: 2,
                height: micActive ? `${equalizerBars[2]}px` : '2px',
                background: micActive ? '#00d4ff' : '#475569',
                borderRadius: 1,
                transition: 'height 0.08s ease',
              }}
            />
            <span
              style={{
                width: 2,
                height: micActive ? `${equalizerBars[3]}px` : '3px',
                background: micActive ? '#00d4ff' : '#475569',
                borderRadius: 1,
                transition: 'height 0.08s ease',
              }}
            />
          </div>

          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              color: '#e2e8f0',
              fontWeight: 600,
            }}
          >
            {formatTimer(elapsedSeconds)}
          </span>
        </div>

        {/* Action Controls: Eye (Face Annotation Overlay Toggle), Camera, Microphone, Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Eye Face Annotation Overlay Toggle Button */}
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            title={showAnnotations ? 'Hide face tracking annotations' : 'Show face tracking annotations'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: showAnnotations ? '#00d4ff' : '#64748b',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showAnnotations ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* Camera Toggle Button */}
          <button
            onClick={handleToggleCam}
            title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: cameraActive ? '#00ff88' : '#ef4444',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {cameraActive ? <Camera size={11} /> : <CameraOff size={11} />}
          </button>

          {/* Microphone Toggle Button */}
          <button
            onClick={handleToggleMic}
            title={micActive ? 'Mute microphone' : 'Unmute microphone'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: micActive ? '#00ff88' : '#ef4444',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {micActive ? <Mic size={11} /> : <MicOff size={11} />}
          </button>

          {/* Fullscreen Button */}
          <button
            title="Fullscreen view"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Maximize2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
