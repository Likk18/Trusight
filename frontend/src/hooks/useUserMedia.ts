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
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      const hasVideo = stream.getVideoTracks().length > 0;
      setCameraActive(hasVideo);

      // Attempt optional audio stream for microphone without blocking video
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const hasAudio = audioStream.getAudioTracks().length > 0;
        setMicActive(hasAudio);
      } catch {
        setMicActive(false);
      }
    } catch (err) {
      console.warn('[useUserMedia] Video permission denied or device unavailable:', err);
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
