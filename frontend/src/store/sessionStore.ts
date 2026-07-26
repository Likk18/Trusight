import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  TelemetryFrame,
  SessionState,
  FaceAnalysisData,
  VoiceAnalysisResponse,
  TextAnalysisResponse,
  FusionResponse,
  TimeSeriesPoint,
  MultiModelPoint,
  HeatmapCell,
} from '../types';

const MAX_HISTORY = 150; // ~2.5 minutes at 1Hz

interface SessionStore {
  // Session state machine
  sessionState: SessionState;
  sessionId: string;
  sessionStartTime: number | null;
  elapsedSeconds: number;

  // Latest analysis data
  face: FaceAnalysisData | null;
  voice: VoiceAnalysisResponse | null;
  text: TextAnalysisResponse | null;
  fusion: FusionResponse | null;

  // WebSocket
  wsConnected: boolean;

  // Historical data for charts
  truthScoreHistory: TimeSeriesPoint[];
  modelScoreHistory: MultiModelPoint[];
  heatmapHistory: HeatmapCell[];

  // Hardware status
  cameraActive: boolean;
  micActive: boolean;

  // Actions
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  resetSession: () => void;
  setSessionId: (id: string) => void;
  setWsConnected: (connected: boolean) => void;
  setCameraActive: (active: boolean) => void;
  setMicActive: (active: boolean) => void;
  ingestTelemetry: (frame: TelemetryFrame) => void;
  tickTimer: () => void;
}

function formatChartTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    sessionState: 'Idle',
    sessionId: '',
    sessionStartTime: null,
    elapsedSeconds: 0,
    face: null,
    voice: null,
    text: null,
    fusion: null,
    wsConnected: false,
    truthScoreHistory: [],
    modelScoreHistory: [],
    heatmapHistory: [],
    cameraActive: false,
    micActive: false,

    // ── State machine transitions ────────────────────────────────────────────
    startSession: () => {
      const id = Math.random().toString(16).slice(2, 10);
      set({
        sessionState: 'Live_Recording',
        sessionId: id,
        sessionStartTime: Date.now(),
        elapsedSeconds: 0,
        truthScoreHistory: [],
        modelScoreHistory: [],
        heatmapHistory: [],
      });
    },

    pauseSession: () => set({ sessionState: 'Paused' }),

    resumeSession: () => set({ sessionState: 'Live_Recording' }),

    stopSession: () =>
      set({ sessionState: 'Completed' }),

    resetSession: () =>
      set({
        sessionState: 'Idle',
        sessionId: '',
        sessionStartTime: null,
        elapsedSeconds: 0,
        face: null,
        voice: null,
        text: null,
        fusion: null,
        truthScoreHistory: [],
        modelScoreHistory: [],
        heatmapHistory: [],
      }),

    setSessionId: (id) => set({ sessionId: id }),
    setWsConnected: (connected) => set({ wsConnected: connected }),
    setCameraActive: (active) => set({ cameraActive: active }),
    setMicActive: (active) => set({ micActive: active }),

    tickTimer: () => {
      const { sessionState, elapsedSeconds } = get();
      if (sessionState === 'Live_Recording') {
        set({ elapsedSeconds: elapsedSeconds + 1 });
      }
    },

    // ── Telemetry ingestion (1Hz) ────────────────────────────────────────────
    ingestTelemetry: (frame: TelemetryFrame) => {
      const { sessionState, elapsedSeconds, truthScoreHistory, modelScoreHistory, heatmapHistory } = get();
      if (sessionState !== 'Live_Recording') return;

      const timeLabel = formatChartTime(elapsedSeconds);
      const fusionScore = frame.fusion.truth_likelihood_pct;
      const voiceScore = 100 - frame.voice.deception_score;

      // Append to time-series (bounded to MAX_HISTORY)
      const newTruth: TimeSeriesPoint = { timestamp: timeLabel, value: fusionScore };
      const newModel: MultiModelPoint = {
        timestamp: timeLabel,
        face: frame.face.face_score,
        voice: voiceScore,
        text: frame.text.text_score,
        evidence: frame.fusion.model_agreement.evidence_score,
      };
      const newHeat: HeatmapCell = {
        timestamp: timeLabel,
        score: fusionScore,
        label: fusionScore >= 70 ? 'High Truth' : fusionScore >= 45 ? 'Moderate' : 'Low Truth',
      };

      set({
        face: frame.face,
        voice: frame.voice,
        text: frame.text,
        fusion: frame.fusion,
        truthScoreHistory: [...truthScoreHistory, newTruth].slice(-MAX_HISTORY),
        modelScoreHistory: [...modelScoreHistory, newModel].slice(-MAX_HISTORY),
        heatmapHistory: [...heatmapHistory, newHeat].slice(-MAX_HISTORY),
      });
    },
  }))
);
