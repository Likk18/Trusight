"""FastAPI routes and WebSocket handlers for Case Analysis and Evidence Verification."""
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from app.modules.case_analysis.schemas import (
    CaseUploadResponse,
    StatementAnalysisResult,
    AnalyzeStatementRequest,
)
from app.modules.case_analysis.service import (
    create_case_from_pdf,
    analyze_statement,
    process_audio_chunk,
    get_case,
    list_cases,
    get_latest_analysis,
)
from app.modules.case_analysis.explanation import check_ollama_status
from app.shared.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/case", tags=["Case Analysis & Evidence"])


@router.post("/upload", response_model=CaseUploadResponse)
async def upload_case_pdf(pdf: UploadFile = File(...)):
    """Upload a case report PDF, extract text, chunk with page numbers, and build FAISS index."""
    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="A valid PDF file is required.")

    try:
        content = await pdf.read()
        res = await create_case_from_pdf(content, pdf.filename)
        return CaseUploadResponse(**res)
    except Exception as e:
        logger.error(f"Error processing case PDF {pdf.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def get_cases_list():
    """List all currently loaded cases."""
    return {"cases": list_cases()}


@router.get("/ollama/status")
async def get_ollama_status():
    """Check connectivity and model availability for the local Ollama instance."""
    return check_ollama_status()


@router.get("/{case_id}")
async def get_case_details(case_id: str):
    """Retrieve metadata and index status for a loaded case."""
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    latest = get_latest_analysis(case_id)
    return {
        "case_id": case_id,
        "filename": case.get("filename"),
        "pages": case.get("pages"),
        "chunks": len(case.get("chunks", [])),
        "created_at": case.get("created_at"),
        "latest_analysis": latest,
    }


@router.post("/{case_id}/analyze-statement", response_model=StatementAnalysisResult)
async def analyze_text_statement(case_id: str, payload: AnalyzeStatementRequest):
    """Verify an interview statement directly against the case's evidence."""
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    try:
        res = await analyze_statement(case_id, payload.statement)
        return StatementAnalysisResult(**res)
    except Exception as e:
        logger.error(f"Error analyzing statement for case {case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{case_id}/analyze-audio", response_model=StatementAnalysisResult)
async def analyze_audio_file(case_id: str, audio: UploadFile = File(...)):
    """Transcribe an audio recording chunk and verify against case evidence."""
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    try:
        content = await audio.read()
        ext = f".{audio.filename.split('.')[-1]}" if "." in (audio.filename or "") else ".webm"
        res = await process_audio_chunk(case_id, content, extension=ext)
        if res.get("status") == "no_speech":
            raise HTTPException(status_code=400, detail="No speech detected in audio file.")
        return StatementAnalysisResult(**res)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio for case {case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{case_id}")
async def case_audio_websocket(websocket: WebSocket, case_id: str):
    """
    Live interview audio streaming WebSocket for a loaded case.
    Receives binary audio segments (WebM/Opus or WAV/MP3), transcribes with Whisper,
    retrieves evidence, performs DeBERTa NLI, and returns Ollama explanations.
    """
    await websocket.accept()
    logger.info(f"Audio WebSocket client connected for case {case_id}")

    case = get_case(case_id)
    if not case:
        await websocket.send_json({
            "status": "error",
            "message": f"Case ID '{case_id}' not found. Please upload a case report PDF first.",
        })
        await websocket.close()
        return

    await websocket.send_json({
        "status": "connected",
        "case_id": case_id,
        "filename": case.get("filename"),
    })

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            if not audio_bytes:
                continue

            logger.info(f"Received audio segment ({len(audio_bytes)} bytes) for case {case_id}")

            try:
                result = await process_audio_chunk(case_id, audio_bytes, extension=".webm")
                if result.get("status") == "no_speech":
                    await websocket.send_json({
                        "status": "no_speech",
                        "case_id": case_id,
                        "message": "No speech detected in this audio segment.",
                    })
                    continue

                await websocket.send_json(result)
            except Exception as proc_err:
                logger.error(f"Error in audio processing pipeline: {proc_err}", exc_info=True)
                await websocket.send_json({
                    "status": "error",
                    "stage": "processing",
                    "message": str(proc_err),
                })

    except WebSocketDisconnect:
        logger.info(f"Audio WebSocket client disconnected from case {case_id}")
    except Exception as ws_err:
        logger.error(f"WebSocket error for case {case_id}: {ws_err}")
