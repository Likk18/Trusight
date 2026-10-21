"""DeBERTa Natural Language Inference (NLI) classification service."""
import asyncio
import os
from pathlib import Path

os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.shared.logger import get_logger

logger = get_logger(__name__)

# Label mapping verified against model training config
LABELS = {
    0: "Entailment",
    1: "Neutral",
    2: "Contradiction",
}

_tokenizer = None
_model = None
_device = None


def get_model_path() -> str:
    """Resolve the directory containing the DeBERTa NLI model artifacts."""
    candidates = [
        Path("models/deberta_nli"),
        Path(__file__).parent.parent.parent.parent / "models" / "deberta_nli",
        Path("saved_model"),
        Path("e:/final/saved_model"),
    ]
    for p in candidates:
        if (p / "model.safetensors").exists() or (p / "pytorch_model.bin").exists() or (p / "config.json").exists():
            return str(p.resolve())
    # Default fallback
    return "models/deberta_nli"


def get_inference_resources():
    """Lazy load tokenizer and model onto available hardware."""
    global _tokenizer, _model, _device
    if _model is None:
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model_path = get_model_path()
        logger.info(f"Loading DeBERTa NLI model from '{model_path}' on device {_device}...")

        _tokenizer = AutoTokenizer.from_pretrained(model_path)
        _model = AutoModelForSequenceClassification.from_pretrained(model_path)
        _model.to(_device)
        _model.eval()
        logger.info("DeBERTa NLI model loaded successfully.")

    return _tokenizer, _model, _device


def predict_one(evidence: str, interview: str) -> dict:
    """Predict NLI relationship between a single evidence chunk and interview statement."""
    if not evidence or not interview:
        return {"verdict": "Neutral", "confidence": 0.0}

    tokenizer, model, device = get_inference_resources()

    inputs = tokenizer(
        evidence,
        interview,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = torch.softmax(outputs.logits, dim=1)
    prediction_idx = torch.argmax(probabilities, dim=1).item()
    confidence = probabilities[0][prediction_idx].item()

    return {
        "verdict": LABELS.get(prediction_idx, "Neutral"),
        "confidence": round(confidence * 100.0, 2),
    }


def predict(retrieved_chunks: list[dict], interview: str) -> dict:
    """
    Predict NLI relationship against top retrieved evidence chunks.
    Prioritizes contradiction if present; else selects highest confidence chunk.
    """
    if not interview or not interview.strip():
        return {
            "verdict": "No Statement",
            "confidence": 0.0,
            "evidence_results": [],
        }

    if not retrieved_chunks:
        return {
            "verdict": "No Evidence",
            "confidence": 0.0,
            "evidence_results": [],
        }

    results = []
    for chunk in retrieved_chunks:
        evidence_text = chunk.get("text", "")
        if not evidence_text:
            continue

        res = predict_one(evidence_text, interview)
        results.append({
            "evidence": evidence_text,
            "page": chunk.get("page", 1),
            "distance": round(float(chunk.get("distance", 0.0)), 4),
            "verdict": res["verdict"],
            "confidence": res["confidence"],
        })

    if not results:
        return {
            "verdict": "No Evidence",
            "confidence": 0.0,
            "evidence_results": [],
        }

    contradictions = [r for r in results if r["verdict"] == "Contradiction"]
    if contradictions:
        strongest = max(contradictions, key=lambda x: x["confidence"])
    else:
        strongest = max(results, key=lambda x: x["confidence"])

    return {
        "verdict": strongest["verdict"],
        "confidence": strongest["confidence"],
        "evidence_results": results,
    }


async def predict_async(retrieved_chunks: list[dict], interview: str) -> dict:
    """Asynchronously execute NLI inference in thread pool worker."""
    return await asyncio.to_thread(predict, retrieved_chunks, interview)
