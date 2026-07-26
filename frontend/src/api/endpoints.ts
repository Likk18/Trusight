import { apiClient } from './client';
import type {
  FaceAnalysisResponse,
  VoiceAnalysisResponse,
  TextAnalysisResponse,
  FusionResponse,
} from '../types';

// ── Face ──────────────────────────────────────────────
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
export const exportReport = async (sessionId: string): Promise<{ download_url: string; report_id: string }> => {
  const { data } = await apiClient.post('/api/v1/reports/export', {
    session_id: sessionId,
    include_timeline: true,
    include_transcript: true,
  });
  return data;
};

// ── Health ────────────────────────────────────────────
export const checkHealth = async () => {
  const { data } = await apiClient.get('/api/v1/health');
  return data;
};
