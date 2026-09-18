import { useEffect, useRef } from 'react';
import { TelemetryWebSocket } from '../api/websocket';
import { useSessionStore } from '../store/sessionStore';
import type { TelemetryFrame } from '../types';

export function useSimulationSocket() {
  const wsRef = useRef<TelemetryWebSocket | null>(null);
  const ingestTelemetry = useSessionStore((s) => s.ingestTelemetry);
  const setWsConnected = useSessionStore((s) => s.setWsConnected);
  const sessionState = useSessionStore((s) => s.sessionState);
  const tickTimer = useSessionStore((s) => s.tickTimer);

  useEffect(() => {
    const ws = new TelemetryWebSocket(
      (frame: TelemetryFrame) => ingestTelemetry(frame),
      () => setWsConnected(false),
      () => setWsConnected(true),
      () => setWsConnected(false)
    );
    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      setWsConnected(false);
    };
  }, [ingestTelemetry, setWsConnected]);

  // Global 1-second timer tick for the session
  useEffect(() => {
    let timer: number | null = null;
    if (sessionState === 'Live_Recording') {
      timer = window.setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionState, tickTimer]);

  return {
    isConnected: sessionState !== 'Idle',
  };
}
