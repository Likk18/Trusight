"""
predictor.py

Wraps the trained deception classifier: loads it once at service startup,
validates the input, and converts raw probability output into the API's
(verdict, score, confidence) contract.

Supports two model types:
1. Legacy: sklearn RandomForestClassifier on 42 acoustic features
2. Upgraded: sklearn Pipeline (Scaler → SelectKBest → Ensemble) on 814-dim
   multimodal features (Acoustic + Wav2Vec2 Deep Audio + Verbal Text features)
"""

from __future__ import annotations

import logging
import os
from typing import Tuple

import joblib
import numpy as np

logger = logging.getLogger("voice_service.predictor")

DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "deception_model.pkl")

DECEPTION_THRESHOLD = 0.5

# 814-dim multimodal: 42 acoustic + 768 Wav2Vec2 + 4 verbal
MULTIMODAL_FEATURE_DIM = 814
# 42-dim legacy acoustic-only
LEGACY_FEATURE_DIM = 42


class ModelNotLoadedError(RuntimeError):
    """Raised when a prediction is requested but no model file could be loaded."""


class Predictor:
    """
    Thin wrapper around a scikit-learn model persisted with joblib.
    Supports both the legacy 42-feature RandomForest and the new 814-feature
    multimodal pipeline that includes Wav2Vec2 deep embeddings.
    """

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.is_multimodal = False
        self._load()

    def _load(self) -> None:
        if not os.path.exists(self.model_path):
            logger.warning(
                "No trained model found at %s. Run train_model.py or "
                "train_optimized_multimodal_model.py to generate one.",
                self.model_path,
            )
            self.model = None
            return
        try:
            self.model = joblib.load(self.model_path)
            # Detect if it's the new multimodal pipeline or legacy RF
            # A sklearn Pipeline has a 'steps' attribute
            self.is_multimodal = hasattr(self.model, "steps")
            mode = "Multimodal Pipeline (Wav2Vec2 + Ensemble)" if self.is_multimodal else "Legacy RandomForest (Acoustic Only)"
            logger.info("Loaded deception model from %s [%s]", self.model_path, mode)
        except Exception as e:
            logger.exception("Failed to load model at %s: %s", self.model_path, e)
            self.model = None

    def is_ready(self) -> bool:
        return self.model is not None

    def reload(self) -> None:
        """Re-read the model file from disk (useful after retraining)."""
        self._load()

    def predict_raw(self, feature_vector: np.ndarray) -> Tuple[str, float, float]:
        """Run inference given a pre-computed feature vector (any dimension)."""
        if self.model is None:
            raise ModelNotLoadedError(
                "Deception model is not loaded. Run train_model.py or "
                "train_optimized_multimodal_model.py to create "
                "app/models/deception_model.pkl, then POST /reload-model."
            )
        x = feature_vector.reshape(1, -1)
        proba = self.model.predict_proba(x)[0]
        deception_score = float(proba[1]) if len(proba) > 1 else float(proba[0])
        verdict = "Deceptive" if deception_score >= DECEPTION_THRESHOLD else "Truthful"
        confidence = float(max(proba))
        return verdict, deception_score, confidence

    def predict(self, feature_vector: np.ndarray) -> Tuple[str, float, float]:
        """
        Run inference on a single flattened feature vector.

        Returns:
            verdict: "Truthful" | "Deceptive"
            score: probability of deception, in [0, 1]
            confidence: model's confidence in the chosen verdict, in [0, 1]
        """
        return self.predict_raw(feature_vector)
