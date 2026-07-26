import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../../store/sessionStore';

interface FaceCanvasProps {
  width: number;
  height: number;
}

export const FaceCanvas: React.FC<FaceCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const sessionState = useSessionStore((s) => s.sessionState);
  const face = useSessionStore((s) => s.face);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;

    const drawCornerTick = (x: number, y: number, dx: number, dy: number, len: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * len, y);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + dy * len);
      ctx.stroke();
    };

    const draw = () => {
      t += 0.02;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      if (sessionState !== 'Live_Recording') {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const confidence = face?.confidence ?? 88;
      const isHighConf = confidence >= 80;
      const boxColor = isHighConf ? '#00ff88' : '#f59e0b';
      const glowColor = isHighConf ? 'rgba(0,255,136,0.4)' : 'rgba(245,158,11,0.4)';

      // Box dimensions (simulate face bbox)
      const bx = w * 0.2 + Math.sin(t * 0.3) * 2;
      const by = h * 0.08;
      const bw = w * 0.6;
      const bh = h * 0.78;

      // Pulsing glow box
      const alpha = 0.15 + Math.sin(t * 2) * 0.05;
      ctx.fillStyle = `rgba(0,255,136,${alpha})`;
      ctx.fillRect(bx, by, bw, bh);

      // Box border
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = glowColor;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;

      // Corner ticks
      const tickLen = 16;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = boxColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = boxColor;

      drawCornerTick(bx, by, 1, 1, tickLen);
      drawCornerTick(bx + bw, by, -1, 1, tickLen);
      drawCornerTick(bx, by + bh, 1, -1, tickLen);
      drawCornerTick(bx + bw, by + bh, -1, -1, tickLen);
      ctx.shadowBlur = 0;

      // Micro mesh lines (horizontal scan lines)
      ctx.strokeStyle = `rgba(0,255,136,0.08)`;
      ctx.lineWidth = 0.5;
      for (let iy = by + 10; iy < by + bh; iy += 18) {
        ctx.beginPath();
        ctx.moveTo(bx + 2, iy);
        ctx.lineTo(bx + bw - 2, iy);
        ctx.stroke();
      }

      // Scanning line animation
      const scanY = by + ((t * 30) % bh);
      const scanGrad = ctx.createLinearGradient(bx, scanY - 8, bx, scanY + 8);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(0,255,136,0.3)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(bx, scanY - 8, bw, 16);

      // Crosshair at face center
      const cx = bx + bw / 2;
      const cy = by + bh * 0.38;
      ctx.strokeStyle = `rgba(0,255,136,0.5)`;
      ctx.lineWidth = 1;
      const crossSize = 12;
      ctx.beginPath();
      ctx.moveTo(cx - crossSize, cy); ctx.lineTo(cx + crossSize, cy);
      ctx.moveTo(cx, cy - crossSize); ctx.lineTo(cx, cy + crossSize);
      ctx.stroke();

      // Telemetry labels
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.shadowBlur = 0;

      // Top-left labels
      const labels = [
        { label: 'TARGET LOCK', value: '● CONFIRMED', color: '#00ff88' },
        { label: 'FPS', value: '30', color: '#00d4ff' },
        { label: 'CONFIDENCE', value: `${Math.round(confidence)}%`, color: confidence >= 80 ? '#00ff88' : '#f59e0b' },
      ];

      labels.forEach((item, i) => {
        const lx = bx + 6;
        const ly = by + 14 + i * 14;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(lx - 2, ly - 10, 140, 12);
        ctx.fillStyle = '#64748b';
        ctx.fillText(item.label + ':', lx, ly);
        ctx.fillStyle = item.color;
        ctx.fillText(item.value, lx + 75, ly);
      });

      // Bottom ID label
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx + 2, by + bh - 18, 120, 14);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('SUBJECT_01 | LIVE', bx + 6, by + bh - 7);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [sessionState, face]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="face-canvas-overlay"
    />
  );
};
