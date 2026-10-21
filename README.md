# TruSight — AI Truth Verification System

<div align="center">

![TruSight Banner](https://img.shields.io/badge/TruSight-AI%20Truth%20Verification-00d4ff?style=for-the-badge&logo=eye&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square&logo=typescript)

**Explainable AI (XAI) multi-modal deception analysis system with a dark-mode forensic executive dashboard.**

</div>

---

## Overview

TruSight performs real-time truth likelihood assessment across three independent AI modalities:

| Modality | Signal | Developer |
|----------|--------|-----------|
| 🎥 **Face Analysis** | Facial behavioral signals (gaze, blink, micro-expressions) | Developer 1 |
| 🎤 **Voice Analysis** | Acoustic features (pitch, speech rate, hesitation, jitter) | Developer 2 |
| 📝 **Text & Fact-Check** | Linguistic consistency + evidence cross-reference | Developer 3 |
| 🔀 **Fusion Engine** | Weighted synthesis into final Truth Likelihood Score | Developer 4 (You) |

---

## Architecture

```
Browser (React/Vite/TypeScript)
    ↕ REST (Axios /api/v1/)    ↕ WebSocket (/ws/telemetry, 1Hz)
FastAPI Backend (Python 3.10+)
    ├── /api/v1/face/analyze       → Face module
    ├── /api/v1/voice/analyze      → Voice module
    ├── /api/v1/text/analyze       → Text module
    ├── /api/v1/fusion/synthesize  → Fusion engine
    ├── /api/v1/reports/export     → PDF generator
    └── /api/v1/health             → System health
SQLite (swap to PostgreSQL by changing DB_URL in config)
```

---

## Directory Structure

```
tru-sight/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Pydantic Settings
│   │   ├── api/
│   │   │   ├── routes.py           # Central router
│   │   │   ├── health.py           # Health endpoint
│   │   │   └── websocket.py        # 1Hz telemetry WS
│   │   ├── modules/
│   │   │   ├── face/               # schemas, service, router, utils
│   │   │   ├── voice/              # schemas, service, router, utils
│   │   │   ├── text/               # schemas, service, router, utils
│   │   │   ├── fusion/             # schemas, fusion_model, service, router
│   │   │   └── reports/            # schemas, service (PDF), router
│   │   ├── database/
│   │   │   ├── database.py         # Async SQLAlchemy
│   │   │   ├── models.py           # ORM tables
│   │   │   └── crud.py             # Repository pattern
│   │   └── shared/
│   │       ├── helpers.py          # Math utilities
│   │       └── logger.py           # JSON structured logger
│   ├── storage/
│   │   ├── uploads/
│   │   └── reports/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/                    # Axios client + WS manager
│       ├── components/
│       │   ├── face/               # FacePanel, FaceCanvas
│       │   ├── voice/              # VoicePanel, WaveformCanvas
│       │   ├── text/               # TranscriptPanel
│       │   ├── fusion/             # FusionPanel, ArcGauge
│       │   ├── charts/             # Recharts components
│       │   ├── dashboard/          # ModelAgreement, SystemStatus
│       │   ├── layout/             # Header
│       │   └── common/             # ScoreRing, StatusBadge, FactCard
│       ├── hooks/                  # useUserMedia, useAudioAnalyser, useSimulationSocket
│       ├── store/                  # Zustand session store
│       ├── types/                  # TypeScript interfaces
│       └── utils/
└── README.md
```

---

## Prerequisites

- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **pip** package manager
- A modern browser (Chrome recommended for camera/mic permissions)

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv .venv

# Activate it
# Windows PowerShell
. .\.venv\Scripts\Activate.ps1
# Windows cmd
# .venv\Scripts\activate.bat
# macOS/Linux
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
# If Windows reports WinError 10013 / socket access denied, another process is using port 8000.
# Use 127.0.0.1 for local-only dev or stop the stale server first.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
``` 

Backend will be available at:
- **API:** `http://localhost:8000`
- **Swagger UI:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/v1/health`
- **WebSocket:** `ws://localhost:8000/ws/telemetry`

### 2. Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

> **Note:** The Vite dev proxy forwards `/api` and `/ws` requests to `localhost:8000` automatically — no CORS configuration needed during development.

---

## Environment Configuration

Create `backend/.env` to override defaults:

```env
DATABASE_URL=sqlite+aiosqlite:///./storage/trusight.db
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
DEBUG=false
WS_TELEMETRY_INTERVAL=1.0
```

Create `frontend/.env.local` to override the API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Session Controls

| Button | Action |
|--------|--------|
| **Start Session** | Requests camera/mic permissions, starts WebSocket stream, begins recording |
| **Pause Session** | Pauses telemetry ingestion (hardware stays active) |
| **Resume Session** | Resumes telemetry ingestion |
| **Stop Session** | Ends session, allows report export |
| **Reset Session** | Clears all data, returns to idle state |
| **Export Report** | Calls `/api/v1/reports/export`, generates forensic PDF |

---

## Switching from SQLite to PostgreSQL

ChScripts\activate   ange **only one line** in `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trusight
```

Also install the asyncpg driver:
```bash
pip install asyncpg
```

No other code changes are required.

---

## Developer Handoff Guide

> **CRITICAL:** Each developer must replace ONLY their own `service.py` file. No other files should be modified.

---

### Developer 1 — Face AI Model

**File to replace:** `backend/app/modules/face/service.py`

**Contract:**
- Input: `FaceAnalysisRequest` (from `schemas.py`)
- Output: `FaceAnalysisResponse` (from `schemas.py`)

```python
# Required function signature:
async def analyze(request: FaceAnalysisRequest) -> FaceAnalysisResponse:
    # Your ML model inference here
    # Load model, preprocess frame, run prediction
    return FaceAnalysisResponse(
        status="success",
        data=FaceAnalysisData(
            face_score=your_score,         # 0–100
            confidence=your_confidence,     # 0–100
            metrics=FaceMetrics(
                eye_contact_pct=...,
                blink_rate_status="Normal",  # "Normal" | "Low" | "High"
                head_stability_pct=...,
                micro_expressions_level="Low",  # "Low" | "Medium" | "High"
                facial_tension_pct=...,
            ),
            key_reasons=["reason 1", "reason 2", "reason 3"],
        )
    )
```

**Do NOT modify:** `schemas.py`, `router.py`, `utils.py`

---

### Developer 2 — Voice AI Model

**File to replace:** `backend/app/modules/voice/service.py`

**Contract:**
- Input: `VoiceAnalysisRequest` (from `schemas.py`)
- Output: `VoiceAnalysisResponse` (from `schemas.py`)

> ⚠️ **IMPORTANT:** The top-level response key names (`verdict`, `deception_score`, `model_confidence`, `metrics`, `observations`, `key_reasons`) are **fixed by team agreement**. Do NOT rename them.

```python
# Required function signature:
async def analyze(request: VoiceAnalysisRequest) -> VoiceAnalysisResponse:
    # Your ML model inference here
    return VoiceAnalysisResponse(
        verdict="Truthful",           # "Truthful" | "Deceptive" | "Uncertain"
        deception_score=your_score,   # 0–100 (higher = more deceptive)
        model_confidence=confidence,  # 0–100
        metrics=VoiceMetrics(
            pitch_status="Normal",    # "Normal" | "High" | "Low"
            speech_rate_wpm=142.0,
            energy_pct=72.0,
            hesitation_level="Low",   # "Low" | "Medium" | "High"
            pauses_count=3,
        ),
        observations=["observation 1", ...],
        key_reasons=["reason 1", ...],
    )
```

**Do NOT modify:** `schemas.py`, `router.py`, `utils.py`

---

### Developer 3 — Text & Fact-Check AI Model

**File to replace:** `backend/app/modules/text/service.py`

**Contract:**
- Input: `TextAnalysisRequest` (from `schemas.py`)
- Output: `TextAnalysisResponse` (from `schemas.py`)

```python
# Required function signature:
async def analyze(request: TextAnalysisRequest) -> TextAnalysisResponse:
    # Your NLP/fact-check model here
    return TextAnalysisResponse(
        text_score=your_score,         # 0–100
        confidence=your_confidence,    # 0–100
        transcript="full text here",
        highlighted_statements=[
            HighlightedStatement(
                text="specific phrase",
                status="SUPPORTED",    # "SUPPORTED" | "UNCERTAIN" | "CONTRADICTED"
                evidence="evidence source",
            ),
            ...
        ],
        fact_check_results=[
            FactCheckResult(
                source="Evidence Source Name",
                claim="what the source says",
                result="SUPPORTED",    # "SUPPORTED" | "UNCERTAIN" | "CONTRADICTED"
            ),
            ...
        ],
        key_reasons=["reason 1", "reason 2", "reason 3"],
    )
```

**Do NOT modify:** `schemas.py`, `router.py`, `utils.py`

---

## Fusion Engine

The Fusion Engine (`backend/app/modules/fusion/fusion_model.py`) uses weighted synthesis:

| Contributor | Weight | Direction |
|-------------|--------|-----------|
| Linguistic Consistency | 28% | Positive |
| Speech Patterns | 24% | Positive |
| Facial Stability | 20% | Positive |
| Factual Evidence | 18% | Positive |
| Minor Hesitation | 10% | Negative (penalty) |

The engine **only consumes normalized scores** (0–100 numbers). It has no knowledge of how individual models compute their results.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/api/v1/health` | System health check |
| POST | `/api/v1/face/analyze` | Face analysis |
| POST | `/api/v1/voice/analyze` | Voice analysis |
| POST | `/api/v1/text/analyze` | Text & fact-check analysis |
| POST | `/api/v1/fusion/synthesize` | Multi-modal fusion |
| POST | `/api/v1/reports/export` | Generate PDF report |
| GET | `/api/v1/reports/download/{id}` | Download PDF report |
| WS | `/ws/telemetry` | 1Hz real-time telemetry stream |

Full interactive API docs available at `http://localhost:8000/docs`.

---

## Technology Stack

### Frontend
- **React 18** + **Vite** + **TypeScript** (strict)
- **TailwindCSS** — Design system with CSS custom properties
- **Zustand** — Optimized real-time state (1Hz updates without re-render lag)
- **Framer Motion** — Micro-animations
- **Recharts** — Real-time charts (area, multi-line, donut)
- **Lucide React** — Icons
- **Web APIs** — `getUserMedia`, `AudioContext`, `AnalyserNode`, `Canvas`

### Backend
- **FastAPI** + **Uvicorn** — ASGI web server
- **Pydantic v2** — Strict schema validation
- **SQLAlchemy 2.0 Async** — ORM with async sessions
- **aiosqlite** — Async SQLite driver
- **ReportLab** — PDF generation

---

## License

Proprietary — Internal use only. All rights reserved.
