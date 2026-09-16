# Voice Time-Series Feature Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a real-time Recharts time-series graph inside `VoicePanel.tsx` tracking Truthfulness Score, Hesitation Index, Vocal Energy %, and Pitch Stability % over time, replacing the manual segment stepper.

**Tech Stack:** React 19, TypeScript, Recharts, Zustand, Lucide React, Tailwind CSS v4.

---

### Task 1: Type Definitions & State Store Integration

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/store/sessionStore.ts`

- [ ] **Step 1: Add `VoiceFeaturePoint` to `frontend/src/types/index.ts`**
```typescript
export interface VoiceFeaturePoint {
  timestamp: string;
  truth: number;
  hesitation: number;
  energy: number;
  pitchStability: number;
}
```

- [ ] **Step 2: Add `voiceFeatureHistory` and update `ingestTelemetry` in `frontend/src/store/sessionStore.ts`**
Compute hesitation index from hesitation level (`Low: 15%`, `Medium: 50%`, `High: 85%`) + pause density + jitter/shimmer.
Compute pitch stability from pitch status (`Normal: 88%`, `High: 40%`, `Low: 60%`).
Append to `voiceFeatureHistory` (limit 60 points).

---

### Task 2: Build Time-Series Feature Chart in `VoicePanel.tsx`

**Files:**
- Modify: `frontend/src/components/voice/VoicePanel.tsx`

- [ ] **Step 1: Remove segment scrubber buttons from header**
- [ ] **Step 2: Implement Recharts `ResponsiveContainer`, `LineChart`, `Area`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`**
Chart properties:
- `truth`: `#00d4ff` (Cyan)
- `hesitation`: `#f59e0b` (Amber)
- `energy`: `#8b5cf6` (Purple)
- `pitchStability`: `#00ff88` (Emerald)
- Custom tooltip with dark glass background.

---

### Task 3: Build & Verification

**Files:**
- Test: `frontend/src/components/voice/VoicePanel.tsx`
- Run: `npm --prefix D:\Projects\Trusight\frontend run build`
- Run: `python test_backend.py`

- [ ] **Step 1: Run frontend build and ensure 0 errors**
- [ ] **Step 2: Test live streaming and file upload with the new graph**
