LIVE PROJECT LINKS (build mode - integrated real voice module):
==========================================
BACKEND (FastAPI + integrated voice_service):
  Root/API docs:   http://127.0.0.1:8000/
  Health check:    http://127.0.0.1:8000/health
  Voice endpoint:  http://127.0.0.1:8000/api/v1/voice/analyze
                   (multipart/form-data: audio file + session_id)
  Swagger/UI docs: http://127.0.0.1:8000/docs
FRONTEND (Vite React dashboard):
  Dev server:       http://localhost:5173
  (run: npm run dev in D:\Projects\Trusight\frontend)
STANDALONE REAL VOICE SERVICE (optional):
  Same backend; runs independently if needed.
COMMANDS (from terminal):
  Backend: .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
         (set PYTHONPATH to backend folder first)
  Frontend: npm run dev
EVIDENCE / BUG FIX LOGS:
  D:\Projects\Trusight\logs\live_requests.log
  D:\Projects\Trusight\docs\testing\voice-integration.tdd.md
MODULE STATE:
  Dummy voice/ deleted; real payload (datasets, zips, trainers, .pkl, docs) preserved in modules/voice/
  Adapter: modules/voice/service.py (translation layer between ML predictor and Trusight contract)
  Imports: relative (.model, .predictor) fixed in 7 app/*.py files
  Bug fixed: PYTHONPATH + librosa/parselmouth installation required for full endpoint response
