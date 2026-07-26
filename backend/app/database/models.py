"""SQLAlchemy ORM models for TruSight database tables."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Session(Base):
    """Represents a live analysis session."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    subject_label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    logs: Mapped[list["AnalysisLog"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class AnalysisLog(Base):
    """Stores individual analysis snapshots throughout a session."""

    __tablename__ = "analysis_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # Scores
    face_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    text_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    fusion_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    fusion_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Verdict
    verdict: Mapped[str | None] = mapped_column(String(50), nullable=True)
    uncertainty_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    processing_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Raw JSON snapshots
    face_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    voice_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    text_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    fusion_payload: Mapped[str | None] = mapped_column(Text, nullable=True)

    session: Mapped["Session"] = relationship(back_populates="logs")


class Report(Base):
    """Tracks generated PDF forensic reports."""

    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    report_version: Mapped[str] = mapped_column(String(10), default="1.0")

    session: Mapped["Session"] = relationship(back_populates="reports")
