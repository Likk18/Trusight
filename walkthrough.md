# TruSight — Project Execution & Run Walkthrough

A quick-reference guide with copy-pasteable commands to run and test both backend and frontend services.

---

## 1. Start the Backend API (FastAPI + ML Engine)

Open **Terminal 1** (PowerShell):

```powershell
cd D:\Trusight\backend
$env:PYTHONPATH = "D:\Trusight\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

> **Backend Service Details:**
> - **API Base URL:** `http://127.0.0.1:8000`
> - **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
> - **Health Check:** `http://127.0.0.1:8000/api/v1/health`
> - **WebSocket Telemetry Stream:** `ws://127.0.0.1:8000/ws/telemetry`

---

## 2. Start the Frontend Dashboard (React + Vite)

Open **Terminal 2** (PowerShell):

```powershell
cd D:\Trusight\frontend
npm run dev
```

> **Frontend Dashboard URL:** `http://localhost:5173`

---

## 3. Run Backend Verification Test Suite

To verify all 7 API endpoints, the live Voice ML model, report generation, and WebSocket telemetry:

```powershell
cd D:\Trusight
& ".\backend\.venv\Scripts\python.exe" test_backend.py
```

---

## 4. Key Endpoints & Testing Quick-Reference

### Test Voice Analysis (Multipart Audio File Upload)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/voice/analyze-file" `
  -Method Post `
  -Form @{
    audio = Get-Item "D:\Trusight\backend\app\modules\voice\sample_audio\truthful.wav"
    session_id = "test_cli_sess"
  }
```

### Test Forensic PDF Report Generation & Download
```powershell
# 1. Trigger export
$res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/reports/export" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"session_id": "test_cli_sess", "subject_label": "Subject 01"}'

# 2. Download generated PDF
Invoke-WebRequest -Uri "http://127.0.0.1:8000$($res.download_url)" -OutFile "downloaded_report.pdf"
```

---

## 5. Summary of Architecture

| Service | Port | Primary Tech | Function |
| --- | --- | --- | --- |
| **Backend API** | `8000` | FastAPI, Uvicorn | Face, Voice (Parselmouth/Librosa ML), Text, Fusion, Reports |
| **Frontend UI** | `5173` | React 19, TypeScript, Vite, Tailwind CSS, Recharts | Multimodal real-time dashboard & live charts |
| **WebSocket** | `8000` | FastAPI WebSockets | 1Hz streaming telemetry frames |
