import { WS_BASE_URL } from './client';
import type { TelemetryFrame } from '../types';

type TelemetryHandler = (frame: TelemetryFrame) => void;
type ErrorHandler = (error: Event) => void;

export class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;
  private reconnectDelay = 2000;
  private onFrame: TelemetryHandler;
  private onError?: ErrorHandler;
  private onConnect?: () => void;
  private onDisconnect?: () => void;

  constructor(
    onFrame: TelemetryHandler,
    onError?: ErrorHandler,
    onConnect?: () => void,
    onDisconnect?: () => void
  ) {
    this.onFrame = onFrame;
    this.onError = onError;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
  }

  connect(): void {
    this.isManualClose = false;
    this._createSocket();
  }

  private _createSocket(): void {
    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/ws/telemetry`);

      this.ws.onopen = () => {
        console.log('[WS] Telemetry connected');
        this.reconnectDelay = 2000;
        this.onConnect?.();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const frame: TelemetryFrame = JSON.parse(event.data as string);
          this.onFrame(frame);
        } catch {
          console.error('[WS] Failed to parse telemetry frame');
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('[WS] Connection error', error);
        this.onError?.(error);
      };

      this.ws.onclose = () => {
        console.log('[WS] Telemetry disconnected');
        this.onDisconnect?.();
        if (!this.isManualClose) {
          this._scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket', err);
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      console.log(`[WS] Reconnecting in ${this.reconnectDelay}ms...`);
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 15000);
      this._createSocket();
    }, this.reconnectDelay);
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
