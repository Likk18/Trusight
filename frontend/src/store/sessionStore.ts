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
  FacialSignalPoint,
  VocalSignalPoint,
  LinguisticSignalPoint,
} from '../types';

const MAX_HISTORY = 60; // 60 10-second segments = 10 minutes

interface SessionStore {
  // Session state machine
  sessionState: SessionState;
  sessionId: string;
  sessionStartTime: number | null;
  elapsedSeconds: number;

  // 10-Second Tumbling Window Clock State
  segmentElapsed: number; // 0 to 10

  // Latest analysis data (Evaluated and latched on 10s Tumbling Windows)
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

  // Case Report & Evidence State
  activeCase: import('../types').CaseReportData | null;
  caseAnalysis: import('../types').CaseAnalysisResult | null;
  isRecordingInterview: boolean;

  // WebSocket
  wsConnected: boolean;

  // Historical data for charts (Updated every 10s at segment boundaries, starting empty)
  truthScoreHistory: TimeSeriesPoint[];
  facialSignalsHistory: FacialSignalPoint[];
  vocalSignalsHistory: VocalSignalPoint[];
  linguisticSignalsHistory: LinguisticSignalPoint[];
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
  setActiveCase: (caseData: import('../types').CaseReportData | null) => void;
  setCaseAnalysis: (res: import('../types').CaseAnalysisResult | null) => void;
  setIsRecordingInterview: (recording: boolean) => void;
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
    // Initial state (Empty charts on start)
    sessionState: 'Idle',
    sessionId: '',
    sessionStartTime: null,
    elapsedSeconds: 0,
    segmentElapsed: 0,
    face: null,
    annotatedFaceFrame: null,
    voice: null,
    text: null,
    fusion: null,
    uploadedVoice: null,
    voiceHistory: [],
    voiceFeatureHistory: [],
    selectedVoiceSegmentIndex: null,
    activeCase: null,
    caseAnalysis: null,
    isRecordingInterview: false,
    wsConnected: false,
    truthScoreHistory: [],
    facialSignalsHistory: [],
    vocalSignalsHistory: [],
    linguisticSignalsHistory: [],
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
        segmentElapsed: 0,
        selectedVoiceSegmentIndex: null,
        voiceFeatureHistory: [],
        truthScoreHistory: [],
        facialSignalsHistory: [],
        vocalSignalsHistory: [],
        linguisticSignalsHistory: [],
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
        segmentElapsed: 0,
        face: null,
        annotatedFaceFrame: null,
        voice: null,
        text: null,
        fusion: null,
        uploadedVoice: null,
        voiceHistory: [],
        voiceFeatureHistory: [],
        selectedVoiceSegmentIndex: null,
        caseAnalysis: null,
        isRecordingInterview: false,
        truthScoreHistory: [],
        facialSignalsHistory: [],
        vocalSignalsHistory: [],
        linguisticSignalsHistory: [],
        modelScoreHistory: [],
        heatmapHistory: [],
      }),

    setSessionId: (id) => set({ sessionId: id }),
    setWsConnected: (connected) => set({ wsConnected: connected }),
    setCameraActive: (active) => set({ cameraActive: active }),
    setMicActive: (active) => set({ micActive: active }),
    setAnnotatedFaceFrame: (frame) => set({ annotatedFaceFrame: frame }),
    setFace: (faceData) => set({ face: faceData }),
    setActiveCase: (caseData) => set({ activeCase: caseData }),
    setCaseAnalysis: (res) => set({ caseAnalysis: res }),
    setIsRecordingInterview: (recording) => set({ isRecordingInterview: recording }),


    setUploadedVoice: (result) => {
      if (!result) {
        set({ uploadedVoice: null });
        return;
      }

      const voiceTruth = 100 - result.deception_score;
      const hesLevel = result.metrics.hesitation_level === 'High' ? 80 : result.metrics.hesitation_level === 'Medium' ? 45 : 18;
      const energy = result.metrics.energy_pct;
      const pitchStab = result.metrics.pitch_status === 'Normal' ? 88 : result.metrics.pitch_status === 'High' ? 45 : 60;

      const uploadFeaturePoints: VoiceFeaturePoint[] = Array.from({ length: 12 }, (_, i) => ({
        timestamp: `00:${String(i * 10).padStart(2, '0')}`,
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
        const nextSec = elapsedSeconds + 1;
        set({
          elapsedSeconds: nextSec,
          segmentElapsed: nextSec % 10 === 0 ? 10 : nextSec % 10,
        });
      }
    },

    // ── Telemetry ingestion (Evaluated every 10s at segment boundaries) ─────
    ingestTelemetry: (frame: TelemetryFrame) => {
      const {
        sessionState,
        elapsedSeconds,
        truthScoreHistory,
        facialSignalsHistory,
        vocalSignalsHistory,
        linguisticSignalsHistory,
        modelScoreHistory,
        heatmapHistory,
        voiceHistory,
        voiceFeatureHistory,
        uploadedVoice,
        selectedVoiceSegmentIndex,
      } = get();
      if (sessionState !== 'Live_Recording') return;

      const timeLabel = formatChartTime(elapsedSeconds);
      const fusionScore = frame.fusion.truth_likelihood_pct;
      const voiceScore = 100 - frame.voice.deception_score;

      const segElapsed = frame.segment_info?.segment_elapsed_sec ?? (elapsedSeconds % 10 || 10);
      const isBoundary = elapsedSeconds === 0 || elapsedSeconds % 10 === 0 || frame.segment_info?.is_boundary;

      let updatedTruthHistory = truthScoreHistory;
      let updatedFacialHistory = facialSignalsHistory;
      let updatedVocalHistory = vocalSignalsHistory;
      let updatedLinguisticHistory = linguisticSignalsHistory;
      let updatedModelHistory = modelScoreHistory;
      let updatedHeatmapHistory = heatmapHistory;
      let updatedVoiceFeatureHistory = voiceFeatureHistory;

      // Update charts and histories ONLY every 10 seconds
      if (isBoundary) {
        const activeVoiceData = uploadedVoice || frame.voice;
        const vMetrics = activeVoiceData.metrics;

        const pitchVal = vMetrics.pitch_status === 'High' ? 0.46 : vMetrics.pitch_status === 'Low' ? 0.62 : Math.min(1, Math.max(0.2, (100 - (vMetrics.jitter_pct || 0.85) * 15) / 100));
        const hesitationVal = vMetrics.hesitation_level === 'High' ? 0.78 : vMetrics.hesitation_level === 'Medium' ? 0.46 : Math.min(1, Math.max(0.12, (vMetrics.pauses_count * 0.07 + (vMetrics.shimmer_pct || 2.1) * 0.04)));
        const energyVal = Number((vMetrics.energy_pct / 100).toFixed(2));
        const speechRateVal = Number(Math.min(1, Math.max(0.2, vMetrics.speech_rate_wpm / 180)).toFixed(2));

        const newVocal: VocalSignalPoint = {
          time: timeLabel,
          pitch: Number(pitchVal.toFixed(2)),
          hesitation: Number(hesitationVal.toFixed(2)),
          energy: energyVal,
          speechRate: speechRateVal,
        };

        const newVoiceFeaturePoint: VoiceFeaturePoint = {
          timestamp: timeLabel,
          truth: Math.round(voiceScore),
          hesitation: Math.round(hesitationVal * 100),
          energy: Math.round(vMetrics.energy_pct),
          pitchStability: Math.round(pitchVal * 100),
        };

        const newTruth: TimeSeriesPoint = { timestamp: timeLabel, value: fusionScore };
        const newFacial: FacialSignalPoint = {
          time: timeLabel,
          eyeContact: Number((frame.face.metrics.eye_contact_pct / 100).toFixed(2)),
          blinkRate: Number((frame.face.metrics.blink_rate_status === 'Normal' ? 0.45 : 0.75).toFixed(2)),
          headStability: Number((frame.face.metrics.head_stability_pct / 100).toFixed(2)),
          facialTension: Number((frame.face.metrics.facial_tension_pct / 100).toFixed(2)),
        };

        const newLinguistic: LinguisticSignalPoint = {
          time: timeLabel,
          consistency: Number((frame.text.text_score / 100).toFixed(2)),
          factMatch: Number((frame.text.confidence / 100).toFixed(2)),
          contradictions: 0.12,
          uncertainty: 0.18,
        };
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

        // Ensure we don't append duplicate points for the exact same 10s timestamp
        const lastPoint = truthScoreHistory[truthScoreHistory.length - 1];
        if (!lastPoint || lastPoint.timestamp !== timeLabel) {
          updatedTruthHistory = [...truthScoreHistory, newTruth].slice(-MAX_HISTORY);
          updatedFacialHistory = [...facialSignalsHistory, newFacial].slice(-MAX_HISTORY);
          updatedVocalHistory = [...vocalSignalsHistory, newVocal].slice(-MAX_HISTORY);
          updatedLinguisticHistory = [...linguisticSignalsHistory, newLinguistic].slice(-MAX_HISTORY);
          updatedModelHistory = [...modelScoreHistory, newModel].slice(-MAX_HISTORY);
          updatedHeatmapHistory = [...heatmapHistory, newHeat].slice(-MAX_HISTORY);
          updatedVoiceFeatureHistory = [...voiceFeatureHistory, newVoiceFeaturePoint].slice(-MAX_HISTORY);
        }
      }

      // Accumulate voice history
      const updatedVoiceHistory = [...voiceHistory, frame.voice].slice(-60);
      const activeVoice = uploadedVoice ?? (selectedVoiceSegmentIndex !== null && voiceHistory[selectedVoiceSegmentIndex] ? voiceHistory[selectedVoiceSegmentIndex] : frame.voice);

      set({
        segmentElapsed: segElapsed,
        face: frame.face,
        voice: activeVoice,
        text: frame.text,
        fusion: frame.fusion,
        ...(frame.case_analysis ? { caseAnalysis: frame.case_analysis } : {}),
        voiceHistory: updatedVoiceHistory,
        voiceFeatureHistory: updatedVoiceFeatureHistory,
        truthScoreHistory: updatedTruthHistory,
        facialSignalsHistory: updatedFacialHistory,
        vocalSignalsHistory: updatedVocalHistory,
        linguisticSignalsHistory: updatedLinguisticHistory,
        modelScoreHistory: updatedModelHistory,
        heatmapHistory: updatedHeatmapHistory,
      });
    },
  }))
);
