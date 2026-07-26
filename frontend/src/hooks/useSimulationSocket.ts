import { useEffect, useRef } from 'react';
import { TelemetryWebSocket } from '../api/websocket';
import { useSessionStore } from '../store/sessionStore';
import type { TelemetryFrame } from '../types';

export function useSimulationSocket() {
  const wsRef = useRef<TelemetryWebSocket | null>(null);
  const ingestTelemetry = useSessionStore((s) => s.ingestTelemetry);
  const setWsConnected = useSessionStore((s) => s.setWsConnected);
  const sessionState = useSessionStore((s) => s.sessionState);

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

  return {
    isConnected: sessionState !== 'Idle',
  };
}
