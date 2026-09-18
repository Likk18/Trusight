import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../../store/sessionStore';

interface FaceCanvasProps {
  width: number;
  height: number;
}

export const FaceCanvas: React.FC<FaceCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotatedFaceFrame = useSessionStore((s) => s.annotatedFaceFrame);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!annotatedFaceFrame) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    if (!imageRef.current) {
      imageRef.current = new Image();
    }
    const img = imageRef.current;
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = annotatedFaceFrame;
  }, [annotatedFaceFrame, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        objectFit: 'cover',
        zIndex: 2,
      }}
    />
  );
};
