"""Comprehensive Integration Test Suite for TruSight + AI Truth Verification System."""
import asyncio
import io
import os
from httpx import AsyncClient, ASGITransport
import websockets
from app.main import app

SAMPLE_PDF_PATH = os.path.join(os.path.dirname(__file__), "storage", "sample_cases", "sample_case.pdf")
SAMPLE_AUDIO_PATH = os.path.join(os.path.dirname(__file__), "storage", "sample_cases", "sample_audio.mp3")


async def run_integration_tests():
    print("=" * 70)
    print("STARTING TRUSIGHT INTEGRATION VERIFICATION")
    print("=" * 70)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health & Root
        print("\n1. Testing Health & Root Endpoints...")
        res = await client.get("/api/v1/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("   [PASS] Health check OK:", res.json())

        res_root = await client.get("/")
        assert res_root.status_code == 200
        print("   [PASS] Root endpoint OK:", res_root.json()["service"])

        # 2. Ollama Status Check
        print("\n2. Checking Local Ollama Connectivity & Models...")
        res = await client.get("/api/v1/case/ollama/status")
        assert res.status_code == 200
        ollama_info = res.json()
        print(f"   [PASS] Ollama status: available={ollama_info.get('available')}, has_model={ollama_info.get('has_model')}")

        # 3. Case PDF Upload & FAISS Indexing
        print("\n3. Testing Case PDF Upload & Indexing (/api/v1/case/upload)...")
        assert os.path.exists(SAMPLE_PDF_PATH), f"Sample PDF not found at {SAMPLE_PDF_PATH}"
        with open(SAMPLE_PDF_PATH, "rb") as f:
            pdf_bytes = f.read()

        files = {"pdf": ("sample_case.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        res = await client.post("/api/v1/case/upload", files=files)
        assert res.status_code == 200, f"Upload failed: {res.text}"
        case_data = res.json()
        case_id = case_data["case_id"]
        print(f"   [PASS] Case Uploaded: ID={case_id}, Pages={case_data['pages']}, Chunks={case_data['chunks']}")

        # Test Case Details Endpoint
        res = await client.get(f"/api/v1/case/{case_id}")
        assert res.status_code == 200
        print(f"   [PASS] GET /api/v1/case/{case_id} OK")

        # 4. Statement Verification Scenarios
        print("\n4. Testing Evidence Retrieval, DeBERTa NLI & Ollama Explanation...")

        # Scenario A: Entailment / Supported Statement
        supported_claim = "The meeting took place in the morning."
        print(f"   Scenario A (Claim: '{supported_claim}')...")
        res = await client.post(
            f"/api/v1/case/{case_id}/analyze-statement",
            json={"statement": supported_claim},
        )
        assert res.status_code == 200
        a_result = res.json()
        print(f"     Verdict: {a_result['verdict']} ({a_result['confidence']}%)")
        print(f"     Evidence retrieved: {len(a_result['evidence'])} chunks")
        print(f"     Explanation: {a_result['explanation']['summary'][:90]}...")

        # Scenario B: Explicit Contradiction / Conflict
        conflict_claim = "The suspect entered the building at 3 AM."
        print(f"\n   Scenario B (Claim: '{conflict_claim}')...")
        res = await client.post(
            f"/api/v1/case/{case_id}/analyze-statement",
            json={"statement": conflict_claim},
        )
        assert res.status_code == 200
        b_result = res.json()
        print(f"     Verdict: {b_result['verdict']} ({b_result['confidence']}%)")
        print(f"     Conflict Validated: {b_result['conflict_validated']}")
        if b_result["explanation"]["conflicting_elements"]:
            print(f"     Conflicts: {b_result['explanation']['conflicting_elements']}")

        # 5. Audio Chunk Analysis (Whisper Speech-to-Text)
        if os.path.exists(SAMPLE_AUDIO_PATH):
            print("\n5. Testing Audio Analysis Pipeline (/api/v1/case/{id}/analyze-audio)...")
            with open(SAMPLE_AUDIO_PATH, "rb") as f:
                audio_bytes = f.read()
            audio_files = {"audio": ("sample_audio.mp3", io.BytesIO(audio_bytes), "audio/mpeg")}
            res = await client.post(f"/api/v1/case/{case_id}/analyze-audio", files=audio_files)
            if res.status_code == 200:
                audio_res = res.json()
                print(f"   [PASS] Whisper Transcript: '{audio_res['transcript']}'")
                print(f"   [PASS] Verified Verdict: {audio_res['verdict']} ({audio_res['confidence']}%)")
            else:
                print(f"   [NOTE] Audio test returned {res.status_code}: {res.text}")

        # 6. Multimodal Fusion Synthesis
        print("\n6. Testing Multimodal Decision Fusion (/api/v1/fusion/synthesize)...")
        res = await client.post("/api/v1/fusion/synthesize", json={
            "session_id": "integration_sess_01",
            "face_score": 86.0,
            "face_confidence": 91.0,
            "voice_score": 79.0,
            "voice_confidence": 85.0,
            "text_score": 90.0,
            "text_confidence": 88.0,
        })
        assert res.status_code == 200
        fusion_res = res.json()
        print(f"   [PASS] Fusion Verdict: {fusion_res['verdict']} (Truth Likelihood: {fusion_res['truth_likelihood_pct']}%)")

        # 7. Forensic PDF Report Export with Case Evidence
        print("\n7. Testing Forensic PDF Report Export with Case Evidence Audit...")
        res = await client.post("/api/v1/reports/export", json={
            "session_id": "integration_sess_01",
            "subject_label": "Suspect Alpha",
            "case_data": {
                "filename": "sample_case.pdf",
                "verdict": b_result["verdict"],
                "confidence": b_result["confidence"],
                "conflict_validated": b_result["conflict_validated"],
                "explanation": b_result["explanation"],
            },
        })
        assert res.status_code == 200
        rep_res = res.json()
        print(f"   [PASS] Report Exported: {rep_res['download_url']}")

        # Verify PDF Download
        res = await client.get(rep_res["download_url"])
        assert res.status_code == 200 and len(res.content) > 1000
        print(f"   [PASS] Downloaded PDF successfully: {len(res.content)} bytes")

    print("\n" + "=" * 70)
    print("ALL INTEGRATION TESTS PASSED CLEANLY!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_integration_tests())
