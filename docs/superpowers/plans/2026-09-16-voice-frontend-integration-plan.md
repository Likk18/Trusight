# Voice Frontend & Unified Persistent Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full `voice_service` outputs (Verdict, Truth Score Gauge, Confidence Meter, 6 Acoustic Telemetry Metrics, Observations, Key Reasons) in the frontend `VoicePanel` with file upload capabilities, persistent state retention, and a segment history scrubber.

**Architecture:** 
- Backend FastAPI endpoint `/api/v1/voice/analyze-file` receives multipart audio uploads and returns full `VoiceAnalysisResponse`.
- Frontend Zustand store (`sessionStore.ts`) retains `uploadedVoice` and accumulates `voiceHistory` without losing data across 1Hz telemetry ticks.
- `VoicePanel.tsx` provides a high-density unified interface with drag-and-drop file upload, inline segment scrubber, and rich visual telemetry.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand, Lucide React, FastAPI, Python 3.12, Librosa, Praat-Parselmouth, Scikit-Learn.

---

### Task 1: Backend Audio File Upload Endpoint & Multi-format Audio Processing

**Files:**
- Modify: `backend/app/modules/voice/router.py`
- Modify: `backend/app/modules/voice/service.py`
- Test: In-memory ASGI test & curl upload verification

- [ ] **Step 1: Verify router file upload endpoint signature**
Ensure `router.py` provides:
```python
@router.post("/analyze-file", response_model=VoiceAnalysisResponse, summary="Analyze uploaded audio file")
async def analyze_voice_file(
    audio: UploadFile = File(..., description="Audio recording file (wav/mp3/ogg/webm/flac/m4a)"),
    session_id: str = Form("session_live", description="Active session ID"),
) -> VoiceAnalysisResponse:
    """Analyze raw uploaded audio file."""
    return await service.analyze_file(audio, session_id)
```

- [ ] **Step 2: Ensure `service.analyze_file` properly decodes bytes and runs inference**
In `backend/app/modules/voice/service.py`:
```python
async def analyze_file(file: UploadFile, session_id: str) -> VoiceAnalysisResponse:
    """Handle uploaded audio file."""
    logger.info(f"[VoiceService] Processing file upload '{file.filename}' for session: {session_id}")
    try:
        from app.modules.voice.app.utils import load_audio_from_bytes

        content = await file.read()
        filename = file.filename or "uploaded.wav"
        loaded = load_audio_from_bytes(content, filename)
        return await analyze_loaded_audio(loaded, session_id)
    except Exception as e:
        logger.exception(f"[VoiceService] File upload analysis failed: {e}")
        return _build_fallback_response(session_id, str(e))
```

- [ ] **Step 3: Test backend upload endpoint with sample audio**
Run command:
```powershell
$env:PYTHONPATH = "D:\Projects\Trusight\backend"
& "D:\Projects\Trusight\backend\.venv\Scripts\python.exe" -c "
import asyncio, httpx
from app.main import app
async def test_upload():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
        with open('backend/app/modules/voice/sample_audio/truthful.wav', 'rb') as f:
            files = {'audio': ('truthful.wav', f.read(), 'audio/wav')}
            data = {'session_id': 'test_upload_01'}
            res = await client.post('/api/v1/voice/analyze-file', files=files, data=data)
            print('Upload status:', res.status_code, res.json().get('verdict'), res.json().get('deception_score'))
            assert res.status_code == 200
asyncio.run(test_upload())
"
```
Expected output: `Upload status: 200 Truthful <score>`

---

### Task 2: Frontend API Client & Extended Type Contracts

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/endpoints.ts`

- [ ] **Step 1: Update TypeScript definitions in `frontend/src/types/index.ts`**
Add acoustic stability and raw features support to `VoiceMetrics`:
```typescript
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
```

- [ ] **Step 2: Add `uploadVoiceAudio` endpoint in `frontend/src/api/endpoints.ts`**
```typescript
export const uploadVoiceAudio = async (
  file: File,
  sessionId?: string
): Promise<VoiceAnalysisResponse> => {
  const formData = new FormData();
  formData.append('audio', file);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }
  const { data } = await apiClient.post<VoiceAnalysisResponse>('/api/v1/voice/analyze-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npm --prefix D:\Projects\Trusight\frontend run build`
Expected: Success with no type errors.

---

### Task 3: Zustand Session Store: Persistent State & Segment History

**Files:**
- Modify: `frontend/src/store/sessionStore.ts`

- [ ] **Step 1: Extend `SessionStore` interface with history & upload state**
In `frontend/src/store/sessionStore.ts`:
```typescript
interface SessionStore {
  // ... existing fields ...
  uploadedVoice: VoiceAnalysisResponse | null;
  voiceHistory: VoiceAnalysisResponse[];
  selectedVoiceSegmentIndex: number | null; // null = active/latest

  setUploadedVoice: (result: VoiceAnalysisResponse | null) => void;
  selectVoiceSegment: (index: number | null) => void;
  clearUploadedVoice: () => void;
}
```

- [ ] **Step 2: Implement persistent state transitions & telemetry accumulation**
Update `ingestTelemetry`:
```typescript
ingestTelemetry: (frame: TelemetryFrame) => {
  const { sessionState, elapsedSeconds, truthScoreHistory, modelScoreHistory, heatmapHistory, voiceHistory } = get();
  if (sessionState !== 'Live_Recording') return;

  const timeLabel = formatChartTime(elapsedSeconds);
  const fusionScore = frame.fusion.truth_likelihood_pct;
  const voiceScore = 100 - frame.voice.deception_score;

  // Append new voice segment to rolling history (limit to 50)
  const updatedVoiceHistory = [...voiceHistory, frame.voice].slice(-50);

  set({
    face: frame.face,
    voice: frame.voice,
    text: frame.text,
    fusion: frame.fusion,
    voiceHistory: updatedVoiceHistory,
    truthScoreHistory: [...truthScoreHistory, { timestamp: timeLabel, value: fusionScore }].slice(-MAX_HISTORY),
    modelScoreHistory: [...modelScoreHistory, {
      timestamp: timeLabel,
      face: frame.face.face_score,
      voice: voiceScore,
      text: frame.text.text_score,
      evidence: frame.fusion.model_agreement.evidence_score,
    }].slice(-MAX_HISTORY),
    heatmapHistory: [...heatmapHistory, {
      timestamp: timeLabel,
      score: fusionScore,
      label: fusionScore >= 70 ? 'High Truth' : fusionScore >= 45 ? 'Moderate' : 'Low Truth',
    }].slice(-MAX_HISTORY),
  });
},

setUploadedVoice: (result) => {
  set({
    uploadedVoice: result,
    voice: result,
    selectedVoiceSegmentIndex: null,
  });
},

selectVoiceSegment: (index) => {
  set({ selectedVoiceSegmentIndex: index });
},

clearUploadedVoice: () => {
  set({ uploadedVoice: null });
},
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npm --prefix D:\Projects\Trusight\frontend run build`
Expected: Build passes with 0 errors.

---

### Task 4: High-Density Unified VoicePanel UI Component

**Files:**
- Modify: `frontend/src/components/voice/VoicePanel.tsx`

- [ ] **Step 1: Implement file upload trigger, drag-and-drop listener, and history scrubber**
Implement within `VoicePanel.tsx`:
1. **Header Toolbar:**
   - Microphone live indicator (`LIVE`).
   - `[ 📁 Upload Audio ]` button with hidden `<input type="file" accept=".wav,.mp3,.ogg,.flac,.m4a,.webm" />`.
   - If `voiceHistory.length > 1`: Compact stepper `[ ◀ Seg X/Y ▶ ]` to scrub previous analysis windows.
   - If `uploadedVoice` active: `[ ↩ Live Stream ]` reset button to return to real-time live telemetry.
2. **Interactive Waveform / Drop Zone:**
   - Real-time Web Audio API frequency waveform canvas.
   - Visual drag-over border & backdrop blur when user drags an audio file onto the canvas.
   - Uploading spinner with active stage label ("Analyzing vocal pitch & harmonics...").
3. **Score & Confidence Row:**
   - `ScoreRing` for Truth Likelihood (`0-100%`) with dynamic verdict badge (`Truthful` / `Deceptive` / `Uncertain`).
   - Linear confidence progress bar (`0-100%`).
4. **High-Density 6-Metric Telemetry Matrix:**
   - Pitch Status (`Normal / High / Low`)
   - Speech Rate (`WPM`)
   - Vocal Energy (`%`)
   - Hesitation Level (`Low / Medium / High`)
   - Pause Count (`count`)
   - Vocal Stability (`Stable` / `Perturbation`)
5. **Acoustic Observations & Key Reasons:**
   - Renders 3 bulleted key acoustic reasons.
   - Renders detailed observations list without layout overflow.

- [ ] **Step 2: Verify component rendering & styling**
Ensure all CSS variables (`--accent-cyan`, `--accent-green`, `--accent-amber`, `--accent-red`, `--surface-card`) and icons (`Upload`, `Music2`, `CheckCircle`, `AlertTriangle`, `ChevronLeft`, `ChevronRight`) are imported and aligned with TruSight dark glassmorphism styling.

---

### Task 5: End-to-End Integration Testing & Verification

**Files:**
- Test: `frontend/src/App.tsx`
- Test: Full backend & frontend live run

- [ ] **Step 1: Execute frontend production build**
Run: `npm --prefix D:\Projects\Trusight\frontend run build`
Expected: `✓ built in ~8s` with 0 errors.

- [ ] **Step 2: Test file upload through the UI via API client**
Test uploading `truthful.wav` and `deceptive.wav` to confirm score updates and persistent pinning on the dashboard.

- [ ] **Step 3: Test live recording persistence**
Start a live session, verify that segments accumulate in history, data is not wiped on 1-second ticks, and scrubber allows review of past segments.

---

**Self-Review:**
- All requirements mapped (upload button, drag-and-drop, full `voice_service` outputs, 6-metric telemetry, persistent data retention, segment scrubber).
- No placeholders or TBDs.
- Types and contracts match between backend and frontend.
