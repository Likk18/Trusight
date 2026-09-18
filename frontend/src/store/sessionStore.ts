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
  VoiceFeaturePoint,
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
  annotatedFaceFrame: string | null;
  voice: VoiceAnalysisResponse | null;
  text: TextAnalysisResponse | null;
  fusion: FusionResponse | null;

  // Persistent voice states & history
  uploadedVoice: VoiceAnalysisResponse | null;
  voiceHistory: VoiceAnalysisResponse[];
  voiceFeatureHistory: VoiceFeaturePoint[];
  selectedVoiceSegmentIndex: number | null;

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
  setAnnotatedFaceFrame: (frame: string | null) => void;
  setFace: (faceData: FaceAnalysisData) => void;
  setUploadedVoice: (result: VoiceAnalysisResponse | null) => void;
  selectVoiceSegment: (index: number | null) => void;
  clearUploadedVoice: () => void;
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
    annotatedFaceFrame: null,
    voice: null,
    text: null,
    fusion: null,
    uploadedVoice: null,
    voiceHistory: [],
    voiceFeatureHistory: [],
    selectedVoiceSegmentIndex: null,
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
        selectedVoiceSegmentIndex: null,
        voiceFeatureHistory: [],
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
        annotatedFaceFrame: null,
        voice: null,
        text: null,
        fusion: null,
        uploadedVoice: null,
        voiceHistory: [],
        voiceFeatureHistory: [],
        selectedVoiceSegmentIndex: null,
        truthScoreHistory: [],
        modelScoreHistory: [],
        heatmapHistory: [],
      }),

    setSessionId: (id) => set({ sessionId: id }),
    setWsConnected: (connected) => set({ wsConnected: connected }),
    setCameraActive: (active) => set({ cameraActive: active }),
    setMicActive: (active) => set({ micActive: active }),
    setAnnotatedFaceFrame: (frame) => set({ annotatedFaceFrame: frame }),
    setFace: (faceData) => set({ face: faceData }),

    setUploadedVoice: (result) => {
      if (!result) {
        set({ uploadedVoice: null });
        return;
      }

      // Generate a representative sequence of feature points for the uploaded file
      const voiceTruth = 100 - result.deception_score;
      const hesLevel = result.metrics.hesitation_level === 'High' ? 80 : result.metrics.hesitation_level === 'Medium' ? 45 : 18;
      const energy = result.metrics.energy_pct;
      const pitchStab = result.metrics.pitch_status === 'Normal' ? 88 : result.metrics.pitch_status === 'High' ? 45 : 60;

      const uploadFeaturePoints: VoiceFeaturePoint[] = Array.from({ length: 12 }, (_, i) => ({
        timestamp: `00:${String(i * 2).padStart(2, '0')}`,
        truth: Math.round(Math.min(100, Math.max(0, voiceTruth + Math.sin(i * 0.6) * 4))),
        hesitation: Math.round(Math.min(100, Math.max(0, hesLevel + Math.cos(i * 0.7) * 6))),
        energy: Math.round(Math.min(100, Math.max(0, energy + Math.sin(i * 0.5 + 1) * 5))),
        pitchStability: Math.round(Math.min(100, Math.max(0, pitchStab + Math.cos(i * 0.4) * 4))),
      }));

      set({
        uploadedVoice: result,
        voice: result,
        voiceFeatureHistory: uploadFeaturePoints,
        selectedVoiceSegmentIndex: null,
      });
    },

    selectVoiceSegment: (index) => {
      set({ selectedVoiceSegmentIndex: index });
    },

    clearUploadedVoice: () => {
      const { voiceHistory } = get();
      const latest = voiceHistory.length > 0 ? voiceHistory[voiceHistory.length - 1] : null;
      set({
        uploadedVoice: null,
        voice: latest,
        selectedVoiceSegmentIndex: null,
      });
    },

    tickTimer: () => {
      const { sessionState, elapsedSeconds } = get();
      if (sessionState === 'Live_Recording') {
        set({ elapsedSeconds: elapsedSeconds + 1 });
      }
    },

    // ── Telemetry ingestion (1Hz) ────────────────────────────────────────────
    ingestTelemetry: (frame: TelemetryFrame) => {
      const { sessionState, elapsedSeconds, truthScoreHistory, modelScoreHistory, heatmapHistory, voiceHistory, voiceFeatureHistory, uploadedVoice, selectedVoiceSegmentIndex } = get();
      if (sessionState !== 'Live_Recording') return;

      const timeLabel = formatChartTime(elapsedSeconds);
      const fusionScore = frame.fusion.truth_likelihood_pct;
      const voiceScore = 100 - frame.voice.deception_score;

      // Compute acoustic hesitation index & pitch stability for the time-series chart
      const hesBase = frame.voice.metrics.hesitation_level === 'High' ? 75 : frame.voice.metrics.hesitation_level === 'Medium' ? 45 : 15;
      const hesScore = Math.min(95, Math.max(5, hesBase + (frame.voice.metrics.pauses_count * 3)));
      const pitchStab = frame.voice.metrics.pitch_status === 'Normal' ? 88 : frame.voice.metrics.pitch_status === 'High' ? 40 : 58;

      const newVoiceFeaturePoint: VoiceFeaturePoint = {
        timestamp: timeLabel,
        truth: Math.round(voiceScore),
        hesitation: Math.round(hesScore),
        energy: Math.round(frame.voice.metrics.energy_pct),
        pitchStability: Math.round(pitchStab),
      };

      // Accumulate voice history without dropping past segments (max 60)
      const updatedVoiceHistory = [...voiceHistory, frame.voice].slice(-60);
      const updatedVoiceFeatureHistory = [...voiceFeatureHistory, newVoiceFeaturePoint].slice(-MAX_HISTORY);

      // Determine active voice displayed: if inspecting a segment, keep it; if uploaded file pinned, keep it; else update to live
      const activeVoice = uploadedVoice ?? (selectedVoiceSegmentIndex !== null && voiceHistory[selectedVoiceSegmentIndex] ? voiceHistory[selectedVoiceSegmentIndex] : frame.voice);

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
        voice: activeVoice,
        text: frame.text,
        fusion: frame.fusion,
        voiceHistory: updatedVoiceHistory,
        voiceFeatureHistory: updatedVoiceFeatureHistory,
        truthScoreHistory: [...truthScoreHistory, newTruth].slice(-MAX_HISTORY),
        modelScoreHistory: [...modelScoreHistory, newModel].slice(-MAX_HISTORY),
        heatmapHistory: [...heatmapHistory, newHeat].slice(-MAX_HISTORY),
      });
    },
  }))
);
