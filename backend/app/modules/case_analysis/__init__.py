"""Case Evidence Analysis Module for TruSight.

Provides PDF case-report extraction, page-aware chunking, FAISS retrieval,
DeBERTa-based Natural Language Inference (NLI), and Ollama-based explanation generation.
"""
from app.modules.case_analysis.router import router

__all__ = ["router"]
