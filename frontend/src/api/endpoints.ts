import { apiClient } from './client';
import type {
  FaceAnalysisData,
  FaceAnalysisResponse,
  VoiceAnalysisResponse,
  TextAnalysisResponse,
  FusionResponse,
} from '../types';

export interface ExportReportPayload {
  session_id: string;
  subject_label?: string;
  include_timeline?: boolean;
  include_transcript?: boolean;
  face_data?: FaceAnalysisData | null;
  voice_data?: VoiceAnalysisResponse | null;
  text_data?: TextAnalysisResponse | null;
  fusion_data?: FusionResponse | null;
}

// ── Face ──────────────────────────────────────────────
export interface FaceFrameAnalysisResult {
  status: string;
  faces_detected: number;
  face_score: number;
  confidence: number;
  metrics: {
    eye_contact_pct: number;
    blink_rate_status: string;
    head_stability_pct: number;
    micro_expressions_level: string;
    facial_tension_pct: number;
  };
  key_reasons: string[];
  annotated_frame?: string | null;
}

export const analyzeFace = async (
  sessionId: string,
  frameTimestampMs?: number
): Promise<FaceAnalysisResponse> => {
  const { data } = await apiClient.post<FaceAnalysisResponse>('/api/v1/face/analyze', {
    session_id: sessionId,
    frame_timestamp_ms: frameTimestampMs,
  });
  return data;
};

export const analyzeFaceFrame = async (
  sessionId: string,
  frameBase64: string
): Promise<FaceFrameAnalysisResult> => {
  const { data } = await apiClient.post<FaceFrameAnalysisResult>('/api/v1/face/analyze-frame', {
    session_id: sessionId,
    frame_base64: frameBase64,
  });
  return data;
};

export const uploadFaceFile = async (
  file: File,
  sessionId?: string
): Promise<FaceAnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId || 'session_upload');
  const { data } = await apiClient.post<FaceAnalysisResponse>('/api/v1/face/analyze-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ── Voice ─────────────────────────────────────────────
export const analyzeVoice = async (
  sessionId: string,
  audioChunkId?: number
): Promise<VoiceAnalysisResponse> => {
  const { data } = await apiClient.post<VoiceAnalysisResponse>('/api/v1/voice/analyze', {
    session_id: sessionId,
    audio_chunk_id: audioChunkId,
  });
  return data;
};

export const uploadVoiceAudio = async (
  file: File,
  sessionId?: string
): Promise<VoiceAnalysisResponse> => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('session_id', sessionId || 'session_upload');
  const { data } = await apiClient.post<VoiceAnalysisResponse>('/api/v1/voice/analyze-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ── Text ──────────────────────────────────────────────
export const analyzeText = async (
  sessionId: string,
  transcript?: string
): Promise<TextAnalysisResponse> => {
  const { data } = await apiClient.post<TextAnalysisResponse>('/api/v1/text/analyze', {
    session_id: sessionId,
    transcript,
  });
  return data;
};

// ── Fusion ────────────────────────────────────────────
export const synthesizeFusion = async (params: {
  session_id: string;
  face_score: number;
  face_confidence: number;
  voice_score: number;
  voice_confidence: number;
  text_score: number;
  text_confidence: number;
}): Promise<FusionResponse> => {
  const { data } = await apiClient.post<FusionResponse>('/api/v1/fusion/synthesize', params);
  return data;
};

// ── Report Export ─────────────────────────────────────
export const exportReport = async (
  payload: ExportReportPayload | string
): Promise<{ download_url: string; report_id: string }> => {
  const body =
    typeof payload === 'string'
      ? {
          session_id: payload,
          include_timeline: true,
          include_transcript: true,
        }
      : {
          include_timeline: true,
          include_transcript: true,
          ...payload,
        };
  const { data } = await apiClient.post('/api/v1/reports/export', body);
  return data;
};

// ── Health ────────────────────────────────────────────
export const checkHealth = async () => {
  const { data } = await apiClient.get('/api/v1/health');
  return data;
};
