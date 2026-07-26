import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';

interface UseUserMediaResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useUserMedia(): UseUserMediaResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const setCameraActive = useSessionStore((s) => s.setCameraActive);
  const setMicActive = useSessionStore((s) => s.setMicActive);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      setCameraActive(hasVideo);
      setMicActive(hasAudio);
    } catch (err) {
      console.warn('[useUserMedia] Permission denied or device unavailable:', err);
      setCameraActive(false);
      setMicActive(false);
    }
  }, [setCameraActive, setMicActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setMicActive(false);
  }, [setCameraActive, setMicActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, startCamera, stopCamera };
}
