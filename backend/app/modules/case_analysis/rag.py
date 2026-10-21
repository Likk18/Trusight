"""Case-report PDF extraction, page-aware chunking, embeddings, and FAISS indexing."""
from __future__ import annotations
import asyncio
import os
from typing import Any

os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import numpy as np
import pymupdf  # PyMuPDF
from sentence_transformers import SentenceTransformer
from app.shared.logger import get_logger

logger = get_logger(__name__)

try:
    import faiss
    HAS_FAISS = True
except (ImportError, ModuleNotFoundError):
    faiss = None
    HAS_FAISS = False


class NumpyFlatL2Index:
    """High-performance vectorized NumPy exact L2 fallback when FAISS is unavailable."""

    def __init__(self, dimension: int):
        self.dimension = dimension
        self.vectors: np.ndarray | None = None

    def add(self, embeddings: np.ndarray) -> None:
        arr = np.asarray(embeddings, dtype=np.float32)
        if self.vectors is None or len(self.vectors) == 0:
            self.vectors = arr
        else:
            self.vectors = np.vstack([self.vectors, arr])

    def search(self, query: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
        if self.vectors is None or len(self.vectors) == 0:
            return np.empty((len(query), 0), dtype=np.float32), np.full((len(query), 0), -1, dtype=np.int64)

        query = np.asarray(query, dtype=np.float32)
        # Vectorized Euclidean squared distance: ||v - q||^2
        diff = self.vectors[np.newaxis, :, :] - query[:, np.newaxis, :]
        all_dists = np.sum(diff ** 2, axis=-1)

        actual_k = min(k, self.vectors.shape[0])
        sorted_indices = np.argsort(all_dists, axis=1)[:, :actual_k]
        sorted_distances = np.take_along_axis(all_dists, sorted_indices, axis=1)

        # Pad with -1 and inf if requested k > number of indexed vectors (standard FAISS behavior)
        if actual_k < k:
            pad_width = ((0, 0), (0, k - actual_k))
            sorted_distances = np.pad(sorted_distances, pad_width, constant_values=float("inf"))
            sorted_indices = np.pad(sorted_indices, pad_width, constant_values=-1)

        return sorted_distances.astype(np.float32), sorted_indices.astype(np.int64)

_embedding_model = None


def get_embedding_model() -> SentenceTransformer:
    """Lazy-load the SentenceTransformer all-MiniLM-L6-v2 model once."""
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading sentence-transformers embedding model (all-MiniLM-L6-v2)...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded successfully.")
    return _embedding_model


def extract_pdf(pdf_path: str) -> list[dict]:
    """
    Extract text page-by-page from a PDF file.
    Returns: list of {"page": int, "text": str}
    """
    doc = pymupdf.open(pdf_path)
    pages = []
    try:
        for page_number, page in enumerate(doc, start=1):
            text = page.get_text().strip()
            if text:
                pages.append({"page": page_number, "text": text})
    finally:
        doc.close()

    return pages


def chunk_text(pages: list[dict], chunk_size: int = 200, overlap: int = 40) -> list[dict]:
    """
    Chunk page text using a sliding word window while preserving source page numbers.
    Returns: list of {"text": str, "page": int}
    """
    chunks = []
    for page_data in pages:
        page_number = page_data["page"]
        words = page_data["text"].split()
        start = 0

        while start < len(words):
            end = start + chunk_size
            chunk_words = words[start:end]
            if chunk_words:
                chunks.append({
                    "text": " ".join(chunk_words),
                    "page": page_number,
                })
            start += chunk_size - overlap

    return chunks


def build_index(chunks: list[dict]) -> tuple[Any, np.ndarray]:
    """
    Encode chunk text into dense vectors and construct a FAISS L2 index (or NumPy fallback).
    """
    if not chunks:
        raise ValueError("No text chunks provided to build index.")

    model = get_embedding_model()
    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    embeddings = embeddings.astype("float32")

    dimension = embeddings.shape[1]
    if HAS_FAISS and faiss is not None:
        index = faiss.IndexFlatL2(dimension)
    else:
        logger.info("Using vectorized NumPy L2 index fallback (FAISS not installed).")
        index = NumpyFlatL2Index(dimension)

    index.add(embeddings)
    return index, embeddings


def retrieve(
    query: str,
    chunks: list[dict],
    index: Any,
    k: int = 3,
) -> list[dict]:
    """
    Retrieve top-k most relevant evidence chunks from the vector index for a given query.
    Returns: list of {"text": str, "page": int, "distance": float}
    """
    if not query or not chunks or index is None:
        return []

    k = min(k, len(chunks))
    model = get_embedding_model()

    query_embedding = model.encode(
        [query],
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype("float32")

    distances, indices = index.search(query_embedding, k)

    results = []
    for distance, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        results.append({
            "text": chunks[idx]["text"],
            "page": chunks[idx]["page"],
            "distance": round(float(distance), 4),
        })

    return results


async def retrieve_async(
    query: str,
    chunks: list[dict],
    index: Any,
    k: int = 3,
) -> list[dict]:
    """Asynchronously retrieve evidence chunks offloaded to thread pool."""
    return await asyncio.to_thread(retrieve, query, chunks, index, k)


async def build_index_async(chunks: list[dict]) -> tuple[Any, np.ndarray]:
    """Asynchronously build index offloaded to thread pool."""
    return await asyncio.to_thread(build_index, chunks)

