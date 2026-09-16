# Voice Frontend & Unified Persistent Integration Design

## 1. Goal
Integrate all rich outputs from the `voice_service` (Verdict, Truth Score Gauge, Confidence Meter, 6 Acoustic Telemetry Metrics, Observations, and Key Reasons) into the frontend `VoicePanel` with file upload capability, persistent data retention across refreshes, and an inline segment history scrubber.

## 2. Architecture & Components

### A. Frontend API Layer (`frontend/src/api/endpoints.ts`)
- `uploadVoiceAudio(file: File, sessionId?: string): Promise<VoiceAnalysisResponse>`
  - Posts `multipart/form-data` to `POST /api/v1/voice/analyze-file`
  - Returns `VoiceAnalysisResponse` with full metrics, score, confidence, observations, and reasons.

### B. Global State Store (`frontend/src/store/sessionStore.ts`)
- `uploadedVoice: VoiceAnalysisResponse | null` — persists uploaded audio file results.
- `voiceHistory: VoiceAnalysisResponse[]` — tracks all analyzed live segments without data loss.
- `selectedVoiceSegmentIndex: number | null` — allows user to scrub and view previous segments.
- `setUploadedVoice(result: VoiceAnalysisResponse)` — updates uploaded voice state and syncs to fusion.
- `selectVoiceSegment(index: number | null)` — switches displayed segment in VoicePanel.
- `clearUploadedVoice()` — resets to live telemetry stream.

### C. Voice Panel UI (`frontend/src/components/voice/VoicePanel.tsx`)
- **Header:** Title, Live Status dot, `[📁 Upload Audio]` button with hidden file input, and Segment History Scrubber `[◀ Seg 2/4 ▶]`.
- **Waveform & Dropzone:** Canvas audio visualizer with drag-and-drop file overlay and processing spinner.
- **Score & Confidence Row:** Side-by-side Truth Score Ring (`0-100%`) + Model Confidence Progress Meter (`0-100%`) + Verdict Badge (`Truthful` / `Deceptive` / `Uncertain`).
- **Acoustic Telemetry Matrix (6 metrics):**
  1. Pitch Status (`Normal / High / Low`)
  2. Speech Rate (`WPM`)
  3. Vocal Energy (`%`)
  4. Hesitation Level (`Low / Medium / High`)
  5. Pause Count (`count`)
  6. Stability / Jitter-Shimmer (`Stable / Perturbation`)
- **Key Reasons & Acoustic Observations:** Rendered with distinct icons, persistent across ticks.

### D. Backend Router & Service Bridge (`backend/app/modules/voice/`)
- `POST /api/v1/voice/analyze-file` accepts audio file uploads, decodes via `utils.py`, extracts acoustic features via `feature_extractor.py`, performs inference via `predictor.py`, and returns complete `VoiceAnalysisResponse`.
- `POST /api/v1/voice/analyze` handles JSON requests with fallback / sample audio analysis.

## 3. Data Flow
1. User drops/selects an audio file or starts live session.
2. If file uploaded: Sent to `/api/v1/voice/analyze-file`, result pinned in `uploadedVoice`, fusion engine recalculates.
3. If live session: Live frames append to `voiceHistory`, user can scrub through past frames via `[◀ / ▶]` buttons.
4. No data is lost or overwritten on 1Hz telemetry ticks.
