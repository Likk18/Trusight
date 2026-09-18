import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';

interface UseAudioAnalyserResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  audioLevel: number; // 0 - 100
  equalizerBars: [number, number, number, number]; // pixel heights 2 - 12px
  startMic: () => Promise<boolean>;
  stopMic: () => void;
  connectStream: (stream: MediaStream) => void;
  disconnect: () => void;
}

export function useAudioAnalyser(fftSize = 256): UseAudioAnalyserResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const setMicActive = useSessionStore((s) => s.setMicActive);

  const [audioLevel, setAudioLevel] = useState(0);
  const [equalizerBars, setEqualizerBars] = useState<[number, number, number, number]>([3, 4, 2, 3]);

  const disconnect = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
    setEqualizerBars([3, 4, 2, 3]);
  }, []);

  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    disconnect();
    setMicActive(false);
  }, [disconnect, setMicActive]);

  const connectStream = useCallback(
    (stream: MediaStream) => {
      disconnect();

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        const timeData = new Uint8Array(bufferLength);

        const analyze = () => {
          animFrameRef.current = requestAnimationFrame(analyze);

          analyser.getByteFrequencyData(freqData);
          analyser.getByteTimeDomainData(timeData);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += freqData[i];
          }
          const avg = sum / bufferLength;
          setAudioLevel(Math.min(100, Math.round((avg / 255) * 100 * 1.5)));

          const b1End = Math.floor(bufferLength * 0.15);
          const b2End = Math.floor(bufferLength * 0.35);
          const b3End = Math.floor(bufferLength * 0.65);

          const getBandAvg = (start: number, end: number) => {
            let s = 0;
            const count = Math.max(1, end - start);
            for (let i = start; i < end; i++) s += freqData[i];
            return s / count;
          };

          const v1 = getBandAvg(0, b1End) / 255;
          const v2 = getBandAvg(b1End, b2End) / 255;
          const v3 = getBandAvg(b2End, b3End) / 255;
          const v4 = getBandAvg(b3End, bufferLength) / 255;

          const h1 = Math.max(2, Math.min(12, Math.round(v1 * 12 + 2)));
          const h2 = Math.max(2, Math.min(12, Math.round(v2 * 14 + 3)));
          const h3 = Math.max(2, Math.min(12, Math.round(v3 * 11 + 2)));
          const h4 = Math.max(2, Math.min(12, Math.round(v4 * 13 + 2)));

          setEqualizerBars([h1, h2, h3, h4]);

          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const { width, height } = canvas;
              ctx.clearRect(0, 0, width, height);

              const gradient = ctx.createLinearGradient(0, 0, width, 0);
              gradient.addColorStop(0, '#8b5cf6');
              gradient.addColorStop(0.5, '#00d4ff');
              gradient.addColorStop(1, '#00ff88');

              ctx.lineWidth = 2;
              ctx.strokeStyle = gradient;
              ctx.shadowBlur = 8;
              ctx.shadowColor = '#00d4ff';
              ctx.beginPath();

              const sliceWidth = width / bufferLength;
              let x = 0;
              for (let i = 0; i < bufferLength; i++) {
                const v = timeData[i] / 128.0;
                const y = (v * height) / 2;
                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
                x += sliceWidth;
              }
              ctx.lineTo(width, height / 2);
              ctx.stroke();
            }
          }
        };

        analyze();
      } catch (err) {
        console.warn('[useAudioAnalyser] Web Audio API initialization failed:', err);
      }
    },
    [disconnect, fftSize]
  );

  const startMic = useCallback(async () => {
    stopMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      connectStream(stream);
      setMicActive(true);
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or device unavailable:', err);
      setMicActive(false);
      return false;
    }
  }, [stopMic, connectStream, setMicActive]);

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, [stopMic]);

  return { canvasRef, audioLevel, equalizerBars, startMic, stopMic, connectStream, disconnect };
}
