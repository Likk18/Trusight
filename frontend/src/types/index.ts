// TypeScript interfaces with exact schema parity to backend Pydantic models.
// DO NOT modify these types without updating the corresponding backend schemas.

// ──────────────────────────────────────────────────────
// Face Analysis
// ──────────────────────────────────────────────────────
export interface FaceMetrics {
  eye_contact_pct: number;
  blink_rate_status: string;
  head_stability_pct: number;
  micro_expressions_level: string;
  facial_tension_pct: number;
}

export interface FaceAnalysisData {
  face_score: number;
  confidence: number;
  metrics: FaceMetrics;
  key_reasons: string[];
}

export interface FaceAnalysisResponse {
  status: 'success' | 'error';
  data: FaceAnalysisData;
}

// ──────────────────────────────────────────────────────
// Voice Analysis
// ──────────────────────────────────────────────────────
export interface VoiceMetrics {
  pitch_status: string;
  speech_rate_wpm: number;
  energy_pct: number;
  hesitation_level: string;
  pauses_count: number;
  stability_status?: string;
  jitter_pct?: number;
  shimmer_pct?: number;
}

export interface VoiceAnalysisResponse {
  verdict: string;
  deception_score: number;
  model_confidence: number;
  metrics: VoiceMetrics;
  observations: string[];
  key_reasons: string[];
}

// ──────────────────────────────────────────────────────
// Text Analysis
// ──────────────────────────────────────────────────────
export type FactCheckStatus = 'SUPPORTED' | 'UNCERTAIN' | 'CONTRADICTED';

export interface HighlightedStatement {
  text: string;
  status: FactCheckStatus;
  evidence: string;
}

export interface FactCheckResult {
  source: string;
  claim: string;
  result: FactCheckStatus;
}

export interface TextAnalysisResponse {
  text_score: number;
  confidence: number;
  transcript: string;
  highlighted_statements: HighlightedStatement[];
  fact_check_results: FactCheckResult[];
  key_reasons: string[];
}

// ──────────────────────────────────────────────────────
// Fusion Engine
// ──────────────────────────────────────────────────────
export interface ContributorDetail {
  weight_pct: number;
  impact: 'positive' | 'negative';
}

export interface ModelAgreement {
  face_score: number;
  voice_score: number;
  text_score: number;
  evidence_score: number;
  overall_agreement_pct: number;
}

export interface SystemStatus {
  uncertainty_level: 'LOW' | 'MEDIUM' | 'HIGH';
  video_quality: string;
  audio_quality: string;
  lighting: string;
  background_noise: string;
  processing_latency_ms: number;
}

export interface FusionResponse {
  truth_likelihood_pct: number;
  fusion_confidence_pct: number;
  verdict: string;
  explanation: string;
  contributors: Record<string, ContributorDetail>;
  model_agreement: ModelAgreement;
  system_status: SystemStatus;
}

// ──────────────────────────────────────────────────────
// WebSocket Telemetry Frame (1Hz)
// ──────────────────────────────────────────────────────
export interface SegmentInfo {
  segment_index: number;
  segment_elapsed_sec: number;
  window_duration_sec: number;
  is_boundary: boolean;
}

export interface TelemetryFrame {
  tick: number;
  timestamp: string;
  session_active: boolean;
  segment_info?: SegmentInfo;
  face: FaceAnalysisResponse['data'];
  voice: VoiceAnalysisResponse;
  text: TextAnalysisResponse;
  fusion: FusionResponse;
}

// ──────────────────────────────────────────────────────
// Session State Machine
// ──────────────────────────────────────────────────────
export type SessionState =
  | 'Idle'
  | 'Hardware_Request'
  | 'Live_Recording'
  | 'Paused'
  | 'Processing'
  | 'Completed';

// ──────────────────────────────────────────────────────
// Chart Data Points
// ──────────────────────────────────────────────────────
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface MultiModelPoint {
  timestamp: string;
  face: number;
  voice: number;
  text: number;
  evidence: number;
}

export interface HeatmapCell {
  timestamp: string;
  score: number;
  label: string;
}

export interface VoiceFeaturePoint {
  timestamp: string;
  truth: number;
  hesitation: number;
  energy: number;
  pitchStability: number;
}

export interface FacialSignalPoint {
  time: string;
  eyeContact: number;
  blinkRate: number;
  headStability: number;
  facialTension: number;
}

export interface VocalSignalPoint {
  time: string;
  pitch: number;
  hesitation: number;
  energy: number;
  speechRate: number;
}

export interface LinguisticSignalPoint {
  time: string;
  consistency: number;
  factMatch: number;
  contradictions: number;
  uncertainty: number;
}
