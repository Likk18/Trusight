import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { analyzeFaceFrame } from '../../api/endpoints';
import { Camera, Mic, Maximize2, CameraOff, MicOff } from 'lucide-react';

export const LiveCameraCard: React.FC = () => {
  const sessionState = useSessionStore((s) => s.sessionState);
  const sessionId = useSessionStore((s) => s.sessionId);
  const cameraActive = useSessionStore((s) => s.cameraActive);
  const micActive = useSessionStore((s) => s.micActive);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const annotatedFaceFrame = useSessionStore((s) => s.annotatedFaceFrame);
  const setAnnotatedFaceFrame = useSessionStore((s) => s.setAnnotatedFaceFrame);
  const setFace = useSessionStore((s) => s.setFace);

  const [localCamOn, setLocalCamOn] = useState(false);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);

  const { videoRef, startCamera, stopCamera } = useUserMedia();
  const { equalizerBars, connectStream, disconnect: disconnectAudio } = useAudioAnalyser();

  const isLive = sessionState === 'Live_Recording' || localCamOn || cameraActive;

  const handleToggleCam = useCallback(() => {
    if (localCamOn || cameraActive) {
      stopCamera();
      disconnectAudio();
      setLocalCamOn(false);
      setAnnotatedFaceFrame(null);
    } else {
      startCamera().then(() => {
        setLocalCamOn(true);
        navigator.mediaDevices
          ?.getUserMedia({ audio: true })
          .then(connectStream)
          .catch(() => {});
      });
    }
  }, [localCamOn, cameraActive, startCamera, stopCamera, connectStream, disconnectAudio, setAnnotatedFaceFrame]);

  useEffect(() => {
    if (sessionState === 'Live_Recording') {
      startCamera().then(() => {
        setLocalCamOn(true);
        navigator.mediaDevices
          ?.getUserMedia({ audio: true })
          .then(connectStream)
          .catch(() => {});
      });
    } else if (sessionState === 'Idle' && !localCamOn) {
      stopCamera();
      disconnectAudio();
      setAnnotatedFaceFrame(null);
    }
  }, [sessionState, connectStream, disconnectAudio, startCamera, stopCamera, setAnnotatedFaceFrame, localCamOn]);

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
  }, [isLive, sessionId, setAnnotatedFaceFrame, setFace, videoRef]);

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
      {/* ── High-Contrast, Clean Header HUD ──────────────────────────── */}
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
              background: '#ef4444',
              boxShadow: '0 0 8px #ef4444',
              animation: isLive ? 'pulse-dot 1s infinite' : 'none',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 11,
              fontWeight: 800,
              color: '#F8FAFC',
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

        {/* 1:1 OpenCV Annotated Image Stream */}
        {annotatedFaceFrame && isLive && (
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
        {!isLive && (
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
              Start Camera & Tracking
            </button>
          </div>
        )}
      </div>

      {/* ── Zero-Padding Flush Bottom Strip HUD: Dynamic Equalizer + Active Session Timer ─ */}
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
        {/* Real-time Voice Audio Equalizer & Session Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Dynamic 4 Cyan Equalizer Bars (Bouncing with voice audio level) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
            <span
              style={{
                width: 2.5,
                height: isLive ? `${equalizerBars[0]}px` : '3px',
                background: '#00d4ff',
                borderRadius: 1,
                transition: 'height 0.08s ease',
                boxShadow: isLive && equalizerBars[0] > 6 ? '0 0 6px #00d4ff' : 'none',
              }}
            />
            <span
              style={{
                width: 2.5,
                height: isLive ? `${equalizerBars[1]}px` : '4px',
                background: '#00d4ff',
                borderRadius: 1,
                transition: 'height 0.08s ease',
                boxShadow: isLive && equalizerBars[1] > 6 ? '0 0 6px #00d4ff' : 'none',
              }}
            />
            <span
              style={{
                width: 2.5,
                height: isLive ? `${equalizerBars[2]}px` : '2px',
                background: '#00d4ff',
                borderRadius: 1,
                transition: 'height 0.08s ease',
                boxShadow: isLive && equalizerBars[2] > 6 ? '0 0 6px #00d4ff' : 'none',
              }}
            />
            <span
              style={{
                width: 2.5,
                height: isLive ? `${equalizerBars[3]}px` : '3px',
                background: '#00d4ff',
                borderRadius: 1,
                transition: 'height 0.08s ease',
                boxShadow: isLive && equalizerBars[3] > 6 ? '0 0 6px #00d4ff' : 'none',
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

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button
            onClick={handleToggleCam}
            title={isLive ? 'Turn off camera' : 'Turn on camera'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLive ? '#00ff88' : '#64748b', padding: 1 }}
          >
            {isLive ? <Camera size={11} /> : <CameraOff size={11} />}
          </button>
          <button
            title={micActive ? 'Microphone active' : 'Microphone off'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: micActive ? '#00ff88' : '#64748b', padding: 1 }}
          >
            {micActive ? <Mic size={11} /> : <MicOff size={11} />}
          </button>
          <button
            title="Fullscreen view"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 1 }}
          >
            <Maximize2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
