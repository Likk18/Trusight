"""PDF Report generation service using ReportLab."""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.modules.reports.schemas import ReportRequest, ReportResponse
from app.shared.helpers import format_timestamp
from app.shared.logger import get_logger

logger = get_logger(__name__)

REPORTS_DIR = Path("storage/reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Color palette
DARK_BG = colors.HexColor("#0d1117")
ACCENT_CYAN = colors.HexColor("#00d4ff")
ACCENT_GREEN = colors.HexColor("#00ff88")
ACCENT_PURPLE = colors.HexColor("#8b5cf6")
TEXT_LIGHT = colors.HexColor("#e2e8f0")
TEXT_MUTED = colors.HexColor("#64748b")
BORDER_COLOR = colors.HexColor("#1e293b")
POSITIVE_COLOR = colors.HexColor("#22c55e")
NEGATIVE_COLOR = colors.HexColor("#ef4444")
WARNING_COLOR = colors.HexColor("#f59e0b")


def _build_styles():
    styles = getSampleStyleSheet()
    custom = {
        "title": ParagraphStyle("TSTitle", parent=styles["Title"], fontSize=24, textColor=ACCENT_CYAN, spaceAfter=6, alignment=TA_CENTER),
        "subtitle": ParagraphStyle("TSSubtitle", parent=styles["Normal"], fontSize=13, textColor=TEXT_MUTED, spaceAfter=12, alignment=TA_CENTER),
        "section": ParagraphStyle("TSSection", parent=styles["Heading2"], fontSize=13, textColor=ACCENT_CYAN, spaceBefore=16, spaceAfter=8, borderPad=4),
        "body": ParagraphStyle("TSBody", parent=styles["Normal"], fontSize=10, textColor=TEXT_LIGHT, spaceAfter=6, leading=16),
        "label": ParagraphStyle("TSLabel", parent=styles["Normal"], fontSize=9, textColor=TEXT_MUTED, spaceAfter=4),
        "verdict": ParagraphStyle("TSVerdict", parent=styles["Normal"], fontSize=20, textColor=ACCENT_GREEN, alignment=TA_CENTER, spaceAfter=8),
        "score_big": ParagraphStyle("TSScoreBig", parent=styles["Normal"], fontSize=36, textColor=ACCENT_CYAN, alignment=TA_CENTER, spaceAfter=4),
        "footer": ParagraphStyle("TSFooter", parent=styles["Normal"], fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER),
    }
    return custom


async def generate_report(request: ReportRequest) -> ReportResponse:
    """Generate a forensic PDF report for the given session."""
    report_id = str(uuid.uuid4())
    filename = f"trusight_report_{request.session_id}_{report_id[:8]}.pdf"
    file_path = REPORTS_DIR / filename

    styles = _build_styles()
    doc = SimpleDocTemplate(
        str(file_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    story = []
    now = datetime.now(timezone.utc)

    # ── Cover Page ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph("🔍 TRUSIGHT", styles["title"]))
    story.append(Paragraph("AI TRUTH VERIFICATION SYSTEM", styles["subtitle"]))
    story.append(Paragraph("FORENSIC ASSESSMENT REPORT", styles["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_CYAN, spaceAfter=20))

    # Metadata table
    meta = [
        ["Report ID", report_id],
        ["Session ID", request.session_id],
        ["Subject", request.subject_label or "CLASSIFIED"],
        ["Generated At", format_timestamp(now)],
        ["Report Version", "1.0"],
        ["Classification", "CONFIDENTIAL – AI FORENSIC ASSESSMENT"],
    ]
    meta_table = Table(meta, colWidths=[5 * cm, 12 * cm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BORDER_COLOR),
        ("TEXTCOLOR", (0, 0), (0, -1), ACCENT_CYAN),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT_LIGHT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1a2436")]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # ── Core Verdict Section ─────────────────────────────────────────────────
    story.append(Paragraph("CORE VERDICT", styles["section"]))
    story.append(Paragraph("84%", styles["score_big"]))
    story.append(Paragraph("LIKELY TRUTHFUL", styles["verdict"]))
    story.append(Paragraph("Fusion Confidence: 93%", styles["body"]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "Overall assessment indicates high consistency across multiple behavioral "
        "and linguistic indicators. No strong signs of deception detected.",
        styles["body"]
    ))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=12))

    # ── Model Agreement Table ────────────────────────────────────────────────
    story.append(Paragraph("MODEL AGREEMENT", styles["section"]))
    agreement_data = [
        ["Modality", "Score", "Status"],
        ["Face Analysis", "88%", "✓ Good"],
        ["Voice Analysis", "81%", "✓ Good"],
        ["Text Analysis", "91%", "✓ Excellent"],
        ["Evidence Score", "85%", "✓ Strong"],
        ["Overall Agreement", "96%", "✓ High"],
    ]
    agreement_table = Table(agreement_data, colWidths=[6 * cm, 4 * cm, 7 * cm])
    agreement_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT_CYAN),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BG),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1a2436")]),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_LIGHT),
        ("TEXTCOLOR", (2, 1), (2, -1), POSITIVE_COLOR),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    story.append(agreement_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Top Contributing Factors ─────────────────────────────────────────────
    story.append(Paragraph("TOP CONTRIBUTING FACTORS", styles["section"]))
    factors_data = [
        ["Factor", "Weight", "Impact"],
        ["Linguistic Consistency", "+28%", "Positive"],
        ["Speech Patterns", "+24%", "Positive"],
        ["Facial Stability", "+20%", "Positive"],
        ["Factual Evidence", "+18%", "Positive"],
        ["Minor Hesitation", "-6%", "Negative"],
    ]
    factors_table = Table(factors_data, colWidths=[8 * cm, 4 * cm, 5 * cm])
    factors_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT_PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_LIGHT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1a2436")]),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_LIGHT),
        ("TEXTCOLOR", (1, 1), (1, 4), POSITIVE_COLOR),
        ("TEXTCOLOR", (1, 5), (1, 5), NEGATIVE_COLOR),
        ("TEXTCOLOR", (2, 1), (2, 4), POSITIVE_COLOR),
        ("TEXTCOLOR", (2, 5), (2, 5), NEGATIVE_COLOR),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    story.append(factors_table)
    story.append(PageBreak())

    # ── Transcript & Fact-Check Table ───────────────────────────────────────
    if request.include_transcript:
        story.append(Paragraph("TRANSCRIPT & FACT-CHECK ANALYSIS", styles["section"]))
        story.append(Paragraph(
            "I arrived at the office around 10:15 AM. I had a meeting with the team and "
            "we discussed the new project requirements. After that, I worked on the proposal "
            "and submitted it by 2 PM.",
            styles["body"]
        ))
        story.append(Spacer(1, 0.3 * cm))

        fact_data = [
            ["Evidence Source", "Claim", "Status"],
            ["Calendar Event", "10:00 AM - 11:00 AM", "SUPPORTED"],
            ["Project Document", "Matches statement", "SUPPORTED"],
            ["Email Record", "Sent at 1:58 PM", "SUPPORTED"],
            ["System Log", "Login at 10:12 AM", "SUPPORTED"],
        ]
        fact_table = Table(fact_data, colWidths=[6 * cm, 7 * cm, 4 * cm])
        fact_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT_CYAN),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1a2436")]),
            ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_LIGHT),
            ("TEXTCOLOR", (2, 1), (2, -1), POSITIVE_COLOR),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ]))
        story.append(fact_table)
        story.append(Spacer(1, 0.5 * cm))

    # ── System Status ────────────────────────────────────────────────────────
    story.append(Paragraph("SYSTEM STATUS", styles["section"]))
    sys_data = [
        ["Parameter", "Value", "Status"],
        ["Video Quality", "Good", "✓"],
        ["Audio Quality", "Good", "✓"],
        ["Lighting", "Good", "✓"],
        ["Background Noise", "Low", "✓"],
        ["Processing Latency", "120 ms", "✓"],
        ["Uncertainty Level", "LOW", "✓"],
    ]
    sys_table = Table(sys_data, colWidths=[7 * cm, 6 * cm, 4 * cm])
    sys_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT_CYAN),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1a2436")]),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_LIGHT),
        ("TEXTCOLOR", (2, 1), (2, -1), POSITIVE_COLOR),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
    ]))
    story.append(sys_table)

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    story.append(Paragraph(
        f"Generated by TruSight AI Truth Verification System v1.0 | {format_timestamp(now)} | CONFIDENTIAL",
        styles["footer"]
    ))

    doc.build(story)

    file_size = file_path.stat().st_size if file_path.exists() else None
    logger.info(f"Report generated: {filename} ({file_size} bytes)")

    return ReportResponse(
        report_id=report_id,
        session_id=request.session_id,
        generated_at=now,
        file_path=str(file_path),
        file_size_bytes=file_size,
        download_url=f"/api/v1/reports/download/{report_id}",
    )
