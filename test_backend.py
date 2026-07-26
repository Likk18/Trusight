import asyncio
import json
import httpx
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/telemetry"

async def test_backend():
    print("--- Testing Backend Endpoints ---")
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Health check
        res = await client.get("/api/v1/health")
        print(f"GET /api/v1/health -> {res.status_code}")
        print("Response:", res.json())
        assert res.status_code == 200, "Health check failed"

        # 2. Face Analyze
        res = await client.post("/api/v1/face/analyze", json={"session_id": "test_sess_01"})
        print(f"\nPOST /api/v1/face/analyze -> {res.status_code}")
        print("Response:", res.json())
        assert res.status_code == 200, "Face analyze failed"

        # 3. Voice Analyze
        res = await client.post("/api/v1/voice/analyze", json={"session_id": "test_sess_01"})
        print(f"\nPOST /api/v1/voice/analyze -> {res.status_code}")
        print("Response:", res.json())
        assert res.status_code == 200, "Voice analyze failed"

        # 4. Text Analyze
        res = await client.post("/api/v1/text/analyze", json={"session_id": "test_sess_01"})
        print(f"\nPOST /api/v1/text/analyze -> {res.status_code}")
        print("Response:", res.json())
        assert res.status_code == 200, "Text analyze failed"

        # 5. Fusion Synthesize
        res = await client.post("/api/v1/fusion/synthesize", json={
            "session_id": "test_sess_01",
            "face_score": 88.0,
            "face_confidence": 92.0,
            "voice_score": 66.0,
            "voice_confidence": 81.0,
            "text_score": 91.0,
            "text_confidence": 89.0
        })
        print(f"\nPOST /api/v1/fusion/synthesize -> {res.status_code}")
        print("Response:", res.json())
        assert res.status_code == 200, "Fusion synthesize failed"

        # 6. PDF Report Export
        res = await client.post("/api/v1/reports/export", json={"session_id": "test_sess_01"})
        print(f"\nPOST /api/v1/reports/export -> {res.status_code}")
        report_data = res.json()
        print("Response:", report_data)
        assert res.status_code == 200, "Report export failed"

        # 7. Download PDF Report
        download_url = report_data["download_url"]
        res = await client.get(download_url)
        print(f"\nGET {download_url} -> {res.status_code}, content size: {len(res.content)} bytes")
        assert res.status_code == 200 and len(res.content) > 0, "Report download failed"

    print("\n--- Testing WebSocket Stream ---")
    async with websockets.connect(WS_URL) as ws:
        for i in range(3):
            msg = await ws.recv()
            data = json.loads(msg)
            print(f"WS Telemetry Frame {i+1} received (tick {data.get('tick')}): truth_likelihood={data['fusion']['truth_likelihood_pct']}%")
    
    print("\nALL TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    asyncio.run(test_backend())
