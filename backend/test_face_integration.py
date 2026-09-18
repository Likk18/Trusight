"""
Automated Test Suite for Face Module and Real OpenCV Integration.
"""
import sys
import base64
import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_face_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("✓ Health check passed")


def test_face_analyze():
    response = client.post("/api/v1/face/analyze", json={"session_id": "test_sess_01"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "face_score" in data["data"]
    assert "metrics" in data["data"]
    assert "annotated_frame" in data
    assert data["annotated_frame"].startswith("data:image/jpeg;base64,")
    print(f"✓ /face/analyze passed (score={data['data']['face_score']})")


def test_face_analyze_frame_synthetic():
    # Generate test synthetic BGR frame
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.circle(frame, (320, 240), 100, (255, 255, 255), -1)
    _, buffer = cv2.imencode(".jpg", frame)
    b64_frame = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

    response = client.post(
        "/api/v1/face/analyze-frame",
        json={"session_id": "live_webcam_01", "frame_base64": b64_frame},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "metrics" in data
    assert "annotated_frame" in data
    assert data["annotated_frame"].startswith("data:image/jpeg;base64,")
    print(f"✓ /face/analyze-frame passed (faces_detected={data['faces_detected']})")


def test_face_analyze_file():
    frame = np.zeros((200, 200, 3), dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", frame)
    file_bytes = buffer.tobytes()

    response = client.post(
        "/api/v1/face/analyze-file",
        files={"file": ("test_face.jpg", file_bytes, "image/jpeg")},
        data={"session_id": "file_sess_01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "face_score" in data["data"]
    print("✓ /face/analyze-file passed")


if __name__ == "__main__":
    print("==================================================")
    print(" RUNNING REAL FACE INTEGRATION TEST SUITE")
    print("==================================================")
    test_face_health()
    test_face_analyze()
    test_face_analyze_frame_synthetic()
    test_face_analyze_file()
    print("==================================================")
    print(" ALL FACE INTEGRATION TESTS PASSED ✓")
    print("==================================================")
