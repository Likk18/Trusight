import { useEffect, useRef, useCallback } from 'react';

interface UseAudioAnalyserResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  connectStream: (stream: MediaStream) => void;
  disconnect: () => void;
}

export function useAudioAnalyser(fftSize = 256): UseAudioAnalyserResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

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
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const connectStream = useCallback(
    (stream: MediaStream) => {
      disconnect();

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteTimeDomainData(dataArray);

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        // Gradient waveform
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
          const v = dataArray[i] / 128.0;
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
      };

      draw();
    },
    [disconnect, fftSize]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { canvasRef, connectStream, disconnect };
}
