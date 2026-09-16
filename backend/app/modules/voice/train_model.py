"""
train_model.py

Trains the Random Forest classifier used by app/predictor.py.

USAGE
-----
Two modes:

1. Train on real labeled audio (recommended before any real use):

    python train_model.py --data-dir path/to/dataset

   The data directory must contain two subfolders:
       path/to/dataset/truthful/*.wav
       path/to/dataset/deceptive/*.wav

   Public datasets with deception-labeled speech you can adapt include the
   Columbia-SRI-Colorado (CSC) deceptive speech corpus and the
   Real-Life Trial dataset (Perez-Rosas et al., 2015). Both require
   separate access requests from their maintainers — see README.md.

2. No dataset available (prototype / smoke-test mode):

    python train_model.py

   This generates a small synthetic feature dataset (NOT real speech) with
   two separable Gaussian-ish clusters standing in for "truthful" and
   "deceptive" acoustic profiles, purely so the API has a loadable model to
   demonstrate the full request/response pipeline end-to-end. A model
   trained this way MUST NOT be used to draw any real conclusions — it only
   proves the plumbing works. Replace it with a model trained on real,
   labeled data before any actual evaluation.

Either way, the trained model is written to app/models/deception_model.pkl.
"""

from __future__ import annotations

import argparse
import glob
import logging
import os
import sys

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.feature_extractor import FeatureExtractor, FEATURE_ORDER  # noqa: E402
from app.utils import load_audio_from_bytes  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("train_model")

MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "app", "models", "deception_model.pkl")
N_FEATURES = len(FEATURE_ORDER)


def extract_features_from_dir(data_dir: str) -> tuple[np.ndarray, np.ndarray]:
    """Walk truthful/ and deceptive/ subfolders and extract features from each wav."""
    extractor = FeatureExtractor()
    X, y = [], []

    for label_name, label_value in [("truthful", 0), ("deceptive", 1)]:
        folder = os.path.join(data_dir, label_name)
        files = sorted(glob.glob(os.path.join(folder, "*.wav")))
        if not files:
            logger.warning("No .wav files found in %s", folder)
        for path in files:
            try:
                with open(path, "rb") as f:
                    raw = f.read()
                audio = load_audio_from_bytes(raw, os.path.basename(path))
                _, vector = extractor.extract(audio)
                X.append(vector)
                y.append(label_value)
            except Exception as e:
                logger.warning("Skipping %s: %s", path, e)

    if not X:
        raise RuntimeError(
            f"No usable audio found under {data_dir}. Expected {data_dir}/truthful/*.wav "
            f"and {data_dir}/deceptive/*.wav"
        )

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)


def synthetic_dataset(n_per_class: int = 200, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate a synthetic, feature-space-only dataset for smoke-testing the
    pipeline when no real labeled audio is available. This is NOT derived
    from real speech and encodes only loosely plausible separations
    (e.g. deceptive class centered on slightly higher pitch variability,
    jitter, shimmer, and pause ratio) based on commonly cited — but far
    from settled — findings in the vocal-deception literature.
    """
    rng = np.random.default_rng(seed)

    def make_class(mean_overrides: dict) -> np.ndarray:
        base_means = {
            "pitch_mean": 170.0, "pitch_std": 18.0, "pitch_min": 90.0, "pitch_max": 260.0,
            "jitter_local": 0.010, "shimmer_local": 0.035,
            "speech_tempo": 2.2, "pause_ratio": 0.12, "pause_count": 3.0, "silence_duration": 1.0,
            "rms_energy_mean": 0.08, "rms_energy_std": 0.02,
            "zero_crossing_rate": 0.07, "spectral_centroid": 1800.0,
            "spectral_bandwidth": 1500.0, "spectral_rolloff": 3300.0,
        }
        base_means.update(mean_overrides)
        mfcc_means = {f"mfcc_mean_{i}": 0.0 for i in range(13)}
        mfcc_stds = {f"mfcc_std_{i}": 5.0 for i in range(13)}
        base_means.update(mfcc_means)
        base_means.update(mfcc_stds)

        rows = []
        for _ in range(n_per_class):
            row = [
                base_means[name] * (1 + rng.normal(0, 0.08))
                if base_means[name] != 0
                else rng.normal(0, 1.0)
                for name in FEATURE_ORDER
            ]
            rows.append(row)
        return np.array(rows, dtype=np.float32)

    truthful = make_class({})
    deceptive = make_class({
        "pitch_std": 30.0,
        "jitter_local": 0.020,
        "shimmer_local": 0.070,
        "pause_ratio": 0.28,
        "pause_count": 6.0,
        "speech_tempo": 1.4,
        "rms_energy_std": 0.05,
    })

    X = np.vstack([truthful, deceptive])
    y = np.array([0] * n_per_class + [1] * n_per_class, dtype=np.int64)
    return X, y


def train(X: np.ndarray, y: np.ndarray) -> RandomForestClassifier:
    # 1. Report accuracy using a 20% validation split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf_eval = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf_eval.fit(X_train, y_train)

    y_pred = clf_eval.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.info("Validation (held-out) accuracy: %.3f", acc)
    logger.info("\n%s", classification_report(y_test, y_pred, target_names=["Truthful", "Deceptive"]))

    # 2. Train the final classifier on 100% of the available dataset
    logger.info("Training final production classifier on 100% of the dataset...")
    final_clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    final_clf.fit(X, y)
    
    train_acc = accuracy_score(y, final_clf.predict(X))
    logger.info("Training accuracy on full dataset: %.3f", train_acc)
    
    return final_clf


def main():
    parser = argparse.ArgumentParser(description="Train the TRUSIGHT voice deception classifier.")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="Directory containing truthful/ and deceptive/ subfolders of .wav files. "
        "If omitted, a synthetic prototype dataset is used instead.",
    )
    args = parser.parse_args()

    if args.data_dir:
        logger.info("Extracting features from real audio in %s ...", args.data_dir)
        X, y = extract_features_from_dir(args.data_dir)
    else:
        logger.warning(
            "No --data-dir provided. Training on a SYNTHETIC placeholder dataset. "
            "This model is for pipeline smoke-testing ONLY and must not be used "
            "to draw real conclusions. See train_model.py docstring for public "
            "dataset options."
        )
        X, y = synthetic_dataset()

    logger.info("Dataset shape: X=%s, y=%s", X.shape, y.shape)

    clf = train(X, y)

    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_OUTPUT_PATH)
    logger.info("Model saved to %s", MODEL_OUTPUT_PATH)


if __name__ == "__main__":
    main()
