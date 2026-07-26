"""Reports API router — PDF forensic report generation and download."""
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.modules.reports.schemas import ReportRequest, ReportResponse
from app.modules.reports import service

router = APIRouter(prefix="/reports", tags=["Reports"])

# In-memory report registry (replace with DB in production)
_report_registry: dict[str, str] = {}


@router.post("/export", response_model=ReportResponse, summary="Generate forensic PDF report")
async def export_report(request: ReportRequest) -> ReportResponse:
    """Generate and store a forensic PDF report for the given session."""
    response = await service.generate_report(request)
    _report_registry[response.report_id] = response.file_path
    return response


@router.get("/download/{report_id}", summary="Download a generated PDF report")
async def download_report(report_id: str) -> FileResponse:
    """Stream a previously generated PDF report for download."""
    file_path = _report_registry.get(report_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found or expired")
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=os.path.basename(file_path),
    )
