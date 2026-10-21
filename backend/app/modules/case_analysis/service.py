"""Case analysis orchestration service."""
import asyncio
import os
import tempfile
import uuid
from datetime import datetime, timezone
from app.modules.case_analysis.rag import extract_pdf, chunk_text, build_index_async, retrieve_async
from app.modules.case_analysis.predict import predict_async
from app.modules.case_analysis.explanation import generate_explanation_async
from app.modules.case_analysis.speech import transcribe_audio_bytes_async
from app.shared.logger import get_logger

logger = get_logger(__name__)

# Active cases index: { case_id: { "chunks": [...], "index": faiss_index, "filename": str, "pages": int, "created_at": str } }
_cases: dict[str, dict] = {}
# Most recent analysis per case: { case_id: latest_result }
_latest_case_results: dict[str, dict] = {}


def get_case(case_id: str) -> dict | None:
    """Retrieve in-memory case data by case_id."""
    return _cases.get(case_id)


def list_cases() -> list[dict]:
    """List active cases summary."""
    return [
        {
            "case_id": cid,
            "filename": c.get("filename", "Unknown"),
            "pages": c.get("pages", 0),
            "chunks": len(c.get("chunks", [])),
            "created_at": c.get("created_at"),
        }
        for cid, c in _cases.items()
    ]


def get_latest_analysis(case_id: str) -> dict | None:
    """Retrieve the latest statement verification result for the given case."""
    return _latest_case_results.get(case_id)


async def create_case_from_pdf(file_bytes: bytes, filename: str) -> dict:
    """
    Save uploaded PDF bytes to temp file, extract text, chunk with page numbers,
    build FAISS index asynchronously, and register case.
    """
    if not file_bytes:
        raise ValueError("Uploaded PDF file is empty.")

    case_id = str(uuid.uuid4())
    temp_pdf_path = os.path.join(tempfile.gettempdir(), f"trusight_case_{case_id}.pdf")

    try:
        # Write PDF
        with open(temp_pdf_path, "wb") as f:
            f.write(file_bytes)

        # Extract text page-by-page
        pages = await asyncio.to_thread(extract_pdf, temp_pdf_path)
        if not pages:
            raise ValueError("No readable text could be extracted from the PDF.")

        # Chunk with source page attribution
        chunks = chunk_text(pages, chunk_size=200, overlap=40)
        if not chunks:
            raise ValueError("No evidence chunks could be generated from the PDF text.")

        # Build FAISS index
        index, _ = await build_index_async(chunks)

        created_at = datetime.now(timezone.utc).isoformat()
        _cases[case_id] = {
            "case_id": case_id,
            "filename": filename,
            "pages": len(pages),
            "chunks": chunks,
            "index": index,
            "created_at": created_at,
        }

        logger.info(f"Registered Case {case_id} ({filename}): {len(pages)} pages, {len(chunks)} chunks.")

        return {
            "status": "success",
            "case_id": case_id,
            "filename": filename,
            "pages": len(pages),
            "chunks": len(chunks),
            "message": "Case report loaded and indexed successfully.",
        }

    finally:
        if os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
            except OSError as err:
                logger.warning(f"Failed to remove temp PDF {temp_pdf_path}: {err}")


async def analyze_statement(case_id: str, statement_text: str) -> dict:
    """
    Execute full evidence retrieval, DeBERTa NLI classification,
    and Ollama explanation generation for a statement.
    """
    case = get_case(case_id)
    if not case:
        raise KeyError(f"Case '{case_id}' not found.")

    statement = statement_text.strip()
    if not statement:
        return {
            "status": "success",
            "case_id": case_id,
            "transcript": "",
            "verdict": "No Statement",
            "confidence": 0.0,
            "evidence": [],
            "explanation": {
                "summary": "No speech or statement detected.",
                "interview_statement": "",
                "evidence_statement": "",
                "conflicting_elements": [],
                "verdict": "No Statement",
                "confidence": 0.0,
                "conflict_validated": False,
            },
            "conflict_validated": False,
        }

    chunks = case["chunks"]
    index = case["index"]

    # 1. Retrieve evidence
    evidence = await retrieve_async(statement, chunks, index, k=3)

    # 2. DeBERTa NLI Classification
    nli_result = await predict_async(evidence, statement)

    # 3. Ollama Evidence-Grounded Explanation
    explanation = await generate_explanation_async(evidence, statement, nli_result)

    result_payload = {
        "status": "success",
        "case_id": case_id,
        "transcript": statement,
        "verdict": nli_result["verdict"],
        "confidence": nli_result["confidence"],
        "evidence": evidence,
        "explanation": explanation,
        "conflict_validated": explanation.get("conflict_validated", False),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    _latest_case_results[case_id] = result_payload
    return result_payload


async def process_audio_chunk(case_id: str, audio_bytes: bytes, extension: str = ".webm") -> dict:
    """
    Transcribe raw audio chunk with Whisper and run statement verification against case evidence.
    """
    transcript = await transcribe_audio_bytes_async(audio_bytes, extension=extension)
    if not transcript:
        return {
            "status": "no_speech",
            "case_id": case_id,
            "transcript": "",
            "message": "No speech detected in audio segment.",
        }

    return await analyze_statement(case_id, transcript)
