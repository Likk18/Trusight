# Real Face Module Integration & 1:1 Live Webcam OpenCV Overlay Specification

**Date:** 2026-09-18  
**Topic:** Face Module Error Resolution, Real Face Module Integration, and Live Webcam Stream Parity  
**Status:** Approved for Implementation

---

## 1. Overview & Objectives

TruSight requires an authentic, production-grade Computer Vision pipeline to replace dummy mock metrics and simulated canvas drawings. The goal is to integrate `backend/app/modules/real_face_module/facial_cues/` with the FastAPI backend, fix missing models and import errors, and provide a 1:1 OpenCV annotated video stream and live behavioral metrics on the frontend Live Cockpit dashboard.

---

## 2. Architecture & Directory Structure

```
backend/app/modules/
├── real_face_module/
│   └── facial_cues/
│       ├── models/
│       │   ├── blaze_face_short_range.tflite
│       │   └── face_landmarker.task
│       ├── detection/face_detector.py
│       ├── landmarks/face_mesh.py
│       ├── head_pose/pose_estimator.py
│       ├── gaze/gaze_estimator.py
│       ├── au_detection/
│       │   ├── au_extractor.py
│       │   ├── pixel_proxy_extractor.py
│       │   └── pytorch_au_extractor.py
│       ├── visualization/visualizer.py
│       └── pipeline/orchestrator.py
└── face/
    ├── __init__.py
    ├── schemas.py       # Pydantic schemas (Request, Response, Metrics, Frame)
    ├── service.py       # Adapter bridging real_face_module to API schemas
    ├── router.py        # FastAPI routes (/analyze, /analyze-file, /analyze-frame)
    └── utils.py         # Base64 image codecs and video frame samplers
```

---

## 3. Detailed Component Specifications

### 3.1 Model Asset Resolution & Linking
- Copy `blaze_face_short_range.tflite` (227 KB) and `face_landmarker.task` (3.6 MB) into `backend/app/modules/real_face_module/facial_cues/models/`.
- Ensure `face_detector.py` and `face_mesh.py` dynamically locate `.tflite` and `.task` files relative to `Path(__file__).resolve().parent.parent / "models"`.

### 3.2 PyTorch & Dependency Resilience
- For environments where PyTorch (`torch`) is not installed, add safe `TORCH_AVAILABLE` fallback stubs in:
  - `real_face_module/facial_cues/au_detection/pytorch_au_extractor.py`
  - `real_face_module/facial_cues/temporal_spotting/tcn_spotter.py`
  - `real_face_module/facial_cues/ml_models/expression_classifier.py`
- Pipeline defaults gracefully to MediaPipe 478-Landmark FaceMesh, solvePnP 3D Head Pose, Iris Gaze Vectors, and Geometric AU Proxy Extraction.

### 3.3 Face API Adapter (`backend/app/modules/face/`)
- **`schemas.py`**: Defines `FaceAnalysisRequest`, `FaceMetrics`, `FaceAnalysisData`, `FaceAnalysisResponse`, and `FaceFrameResponse` with `annotated_frame` (base64 data URI).
- **`service.py`**: Invokes `PipelineOrchestrator` and `Visualizer`, drawing 3D Pose axes, iris gaze vectors, and AU bars on the input frame and computing:
  - `eye_contact_pct`: derived from gaze yaw/pitch magnitude.
  - `head_stability_pct`: derived from pose velocity/variance.
  - `blink_rate_status`: calculated via Eye Aspect Ratio (EAR).
  - `facial_tension_pct`: calculated via AU4 (brow lowerer) + AU14 (dimpler) activations.
  - `face_score`: aggregate truthfulness/composure likelihood (0–100).
- **`router.py`**: Exposes `/analyze`, `/analyze-file`, and `/analyze-frame`.
- **`utils.py`**: Handles base64 string decoding, OpenCV `cv2.imdecode`, and `cv2.imencode` to JPEG.

### 3.4 Live Webcam 1:1 Stream (`frontend/src/`)
- `FacePanel.tsx`: Captures frames from `HTMLVideoElement` at 10 FPS and posts to `/api/v1/face/analyze-frame`.
- `FaceCanvas.tsx`: Renders the received `annotated_frame` directly onto the canvas, giving the user exact 1:1 visual output from the OpenCV visualizer.
- `sessionStore.ts`: Updates `annotatedFaceFrame` and live face metrics (`eye_contact_pct`, `head_stability_pct`, `blink_rate_status`, `facial_tension_pct`, `face_score`).

---

## 4. Verification & Testing Criteria

1. `backend/app/main.py` imports cleanly with `app.modules.face.router` loaded.
2. `facial_cues/tests/test_pipeline.py` executes and passes module initialization, face detection, mesh, pose, gaze, and visualizer rendering.
3. `POST /api/v1/face/analyze-frame` receives a base64 frame, detects landmarks, and returns valid JSON with `annotated_frame` containing `data:image/jpeg;base64,...`.
4. Frontend `npm run build` succeeds with 0 errors.
