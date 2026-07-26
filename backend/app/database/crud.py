"""Generic and entity-specific CRUD operations for TruSight."""
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database.models import Session as SessionModel, AnalysisLog, Report
from app.shared.helpers import generate_session_id, now_utc
from app.shared.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------

async def create_session(db: AsyncSession, subject_label: str | None = None) -> SessionModel:
    """Create and persist a new analysis session."""
    session = SessionModel(
        session_code=generate_session_id(),
        subject_label=subject_label,
    )
    db.add(session)
    await db.flush()
    logger.info(f"Session created: {session.session_code}")
    return session


async def get_session(db: AsyncSession, session_id: str) -> SessionModel | None:
    """Fetch a session by its UUID."""
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    return result.scalar_one_or_none()


async def get_session_by_code(db: AsyncSession, code: str) -> SessionModel | None:
    """Fetch a session by its short code."""
    result = await db.execute(select(SessionModel).where(SessionModel.session_code == code))
    return result.scalar_one_or_none()


async def end_session(db: AsyncSession, session_id: str) -> None:
    """Mark a session as ended."""
    await db.execute(
        update(SessionModel)
        .where(SessionModel.id == session_id)
        .values(is_active=False, ended_at=now_utc())
    )


# ---------------------------------------------------------------------------
# AnalysisLog CRUD
# ---------------------------------------------------------------------------

async def create_analysis_log(
    db: AsyncSession,
    session_id: str,
    face_score: float | None = None,
    voice_score: float | None = None,
    text_score: float | None = None,
    fusion_score: float | None = None,
    fusion_confidence: float | None = None,
    verdict: str | None = None,
    uncertainty_level: str | None = None,
    processing_latency_ms: int | None = None,
    face_payload: dict | None = None,
    voice_payload: dict | None = None,
    text_payload: dict | None = None,
    fusion_payload: dict | None = None,
) -> AnalysisLog:
    """Persist an analysis snapshot for the given session."""
    log = AnalysisLog(
        session_id=session_id,
        face_score=face_score,
        voice_score=voice_score,
        text_score=text_score,
        fusion_score=fusion_score,
        fusion_confidence=fusion_confidence,
        verdict=verdict,
        uncertainty_level=uncertainty_level,
        processing_latency_ms=processing_latency_ms,
        face_payload=json.dumps(face_payload) if face_payload else None,
        voice_payload=json.dumps(voice_payload) if voice_payload else None,
        text_payload=json.dumps(text_payload) if text_payload else None,
        fusion_payload=json.dumps(fusion_payload) if fusion_payload else None,
    )
    db.add(log)
    await db.flush()
    return log


async def get_session_logs(db: AsyncSession, session_id: str) -> list[AnalysisLog]:
    """Return all analysis logs for a session, ordered chronologically."""
    result = await db.execute(
        select(AnalysisLog)
        .where(AnalysisLog.session_id == session_id)
        .order_by(AnalysisLog.logged_at)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Report CRUD
# ---------------------------------------------------------------------------

async def create_report(
    db: AsyncSession, session_id: str, file_path: str, file_size_bytes: int | None = None
) -> Report:
    """Persist a reference to a generated PDF report."""
    report = Report(
        session_id=session_id,
        file_path=file_path,
        file_size_bytes=file_size_bytes,
    )
    db.add(report)
    await db.flush()
    return report
