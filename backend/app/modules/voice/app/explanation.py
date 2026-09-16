"""
explanation.py

Turns extracted VoiceFeatures into a short list of human-readable
observations. This is a deterministic, rule-based layer (not part of the
ML model itself) so the reasoning behind a verdict is always inspectable,
independent of what the Random Forest actually weighted internally.

Thresholds below are heuristic prototype defaults based on commonly cited
ranges in vocal-analysis literature for adult conversational speech. They
are intentionally conservative and should be recalibrated against real
labeled data before any production use.
"""

from __future__ import annotations

from typing import List

from .model import VoiceFeatures

# --- Heuristic thresholds (prototype defaults) ---
PITCH_STD_HIGH = 35.0          # Hz; above this = notably variable pitch
PITCH_STD_LOW = 12.0           # Hz; below this = unusually flat/monotone
PAUSE_RATIO_HIGH = 0.30        # fraction of duration spent in silence
PAUSE_RATIO_LOW = 0.05
TEMPO_SLOW = 1.2               # onsets/sec
TEMPO_FAST = 3.5
JITTER_HIGH = 0.02             # local jitter ratio
SHIMMER_HIGH = 0.08            # local shimmer ratio
RMS_STD_HIGH = 0.05            # energy instability


def generate_explanations(features: VoiceFeatures, score: float) -> List[str]:
    """
    Build a 2-5 item list of plain-language observations from the extracted
    features. Order is roughly most-to-least diagnostic.
    """
    notes: List[str] = []

    # Pitch variability
    if features.pitch_std >= PITCH_STD_HIGH:
        notes.append("High pitch variability detected.")
    elif features.pitch_std <= PITCH_STD_LOW and features.pitch_std > 0:
        notes.append("Unusually flat, monotone pitch detected.")
    else:
        notes.append("Stable pitch variation.")

    # Pauses / hesitation
    if features.pause_ratio >= PAUSE_RATIO_HIGH:
        notes.append("Frequent hesitation pauses detected.")
    elif features.pause_ratio <= PAUSE_RATIO_LOW:
        notes.append("Few hesitation pauses.")
    else:
        notes.append("Moderate amount of pausing.")

    # Tempo
    if features.speech_tempo <= TEMPO_SLOW:
        notes.append("Speech tempo slower than expected.")
    elif features.speech_tempo >= TEMPO_FAST:
        notes.append("Speech tempo faster than expected.")
    else:
        notes.append("Normal speech tempo.")

    # Voice quality: jitter
    if features.jitter_local >= JITTER_HIGH:
        notes.append("Voice instability observed (elevated jitter).")

    # Voice quality: shimmer
    if features.shimmer_local >= SHIMMER_HIGH:
        notes.append("Amplitude instability observed (elevated shimmer).")

    # Energy consistency
    if features.rms_energy_std >= RMS_STD_HIGH:
        notes.append("Inconsistent vocal energy across the recording.")

    # Trim to the 2-5 item contract, keeping the most relevant items first.
    if len(notes) > 5:
        notes = notes[:5]
    if len(notes) < 2:
        notes.append(
            "Overall acoustic profile within typical conversational range."
        )

    return notes
