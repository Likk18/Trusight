"""
utils.py

Shared audio I/O and preprocessing utilities for the Voice Analysis module.

Responsibilities:
- Safely load uploaded audio bytes into a normalized, mono, float32 waveform.
- Provide basic validation helpers (format, duration, silence checks).
- Centralize sampling-rate handling so every other module works with a
  consistent (audio, sample_rate) contract.
"""

from __future__ import annotations

import io
import os
import tempfile
import uuid
import logging
from dataclasses import dataclass
from typing import Tuple

import numpy as np
import soundfile as sf
import librosa

logger = logging.getLogger("voice_service.utils")

# Target sample rate used throughout the pipeline. Librosa and Parselmouth
# both work fine at 16kHz for speech, and it keeps feature extraction fast.
TARGET_SR = 16000

# Formats we accept via soundfile/librosa. Anything else is rejected early
# with a clear error rather than failing deep inside feature extraction.
SUPPORTED_EXTENSIONS = {".wav", ".flac", ".ogg", ".mp3", ".m4a", ".aac", ".mpeg", ".mpg", ".webm"}

# Reasonable bounds so a corrupt or absurd file doesn't hang the service.
MIN_DURATION_SECONDS = 0.5
MAX_DURATION_SECONDS = 300.0


class AudioValidationError(ValueError):
    """Raised when an uploaded file fails validation before feature extraction."""


class AudioProcessingError(RuntimeError):
    """Raised when a file passes validation but decoding/processing fails."""


@dataclass
class LoadedAudio:
    """Container for a fully preprocessed audio signal."""
    samples: np.ndarray  # float32, mono, normalized, shape (n_samples,)
    sample_rate: int
    duration_seconds: float
    source_filename: str
    raw_rms: float = 0.0
    raw_peak: float = 0.0


def validate_filename(filename: str) -> None:
    """Raise AudioValidationError if the filename/extension is unsupported."""
    if not filename or "." not in filename:
        raise AudioValidationError(
            "Uploaded file has no discernible extension. "
            f"Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )
    ext = os.path.splitext(filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise AudioValidationError(
            f"Unsupported audio format '{ext}'. "
            f"Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )


def _to_mono(samples: np.ndarray) -> np.ndarray:
    """Collapse a (n_samples, n_channels) or (n_channels, n_samples) array to mono."""
    if samples.ndim == 1:
        return samples
    # soundfile returns shape (n_samples, n_channels)
    return np.mean(samples, axis=1)


def _normalize(samples: np.ndarray) -> np.ndarray:
    """Peak-normalize to [-1, 1] while avoiding division by zero on silence."""
    peak = np.max(np.abs(samples)) if samples.size else 0.0
    if peak < 1e-8:
        return samples.astype(np.float32)
    return (samples / peak).astype(np.float32)


# Extensions that require librosa/ffmpeg rather than soundfile for decoding.
_LIBROSA_ONLY_EXTENSIONS = {".webm", ".mp3", ".m4a", ".aac", ".mpeg", ".mpg"}


def load_audio_from_bytes(file_bytes: bytes, filename: str) -> LoadedAudio:
    """
    Decode raw uploaded bytes into a validated, preprocessed mono waveform
    at TARGET_SR.

    Supports all SUPPORTED_EXTENSIONS including .webm (MediaRecorder/Opus output
    from browser getUserMedia), which requires ffmpeg to be on the system PATH.

    Raises:
        AudioValidationError: for bad filenames, empty files, or out-of-range duration.
        AudioProcessingError: for files that fail to decode despite a valid extension.
    """
    validate_filename(filename)

    if not file_bytes:
        raise AudioValidationError("Uploaded audio file is empty.")

    ext = os.path.splitext(filename)[1].lower()

    samples: np.ndarray
    sr: int

    if ext in _LIBROSA_ONLY_EXTENSIONS:
        # These formats require ffmpeg (via librosa/audioread). soundfile cannot
        # decode Opus/WebM natively, and audioread requires a file path on disk.
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
        try:
            with os.fdopen(tmp_fd, "wb") as f:
                f.write(file_bytes)
            samples, sr = librosa.load(tmp_path, sr=None, mono=True)
        except Exception as librosa_error:
            logger.error("Failed to decode audio '%s' via librosa: %s", filename, librosa_error)
            raise AudioProcessingError(
                f"Could not decode '{ext}' audio. "
                "Ensure ffmpeg is installed and on the system PATH."
            ) from librosa_error
        finally:
            safe_remove(tmp_path)
    else:
        # First attempt: soundfile (fast in-memory, handles wav/flac/ogg natively).
        try:
            with io.BytesIO(file_bytes) as buf:
                samples, sr = sf.read(buf, always_2d=False, dtype="float32")
        except Exception as sf_error:
            # Fallback: write to temp file and use librosa/audioread/ffmpeg
            tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
            try:
                with os.fdopen(tmp_fd, "wb") as f:
                    f.write(file_bytes)
                samples, sr = librosa.load(tmp_path, sr=None, mono=False)
                samples = samples.T if samples.ndim > 1 else samples
            except Exception as librosa_error:
                logger.error(
                    "Failed to decode audio '%s': %s / %s",
                    filename, sf_error, librosa_error,
                )
                raise AudioProcessingError(
                    "Could not decode the uploaded audio file. It may be corrupted "
                    "or use an unsupported codec."
                ) from librosa_error
            finally:
                safe_remove(tmp_path)

    samples = _to_mono(np.asarray(samples))

    # Capture raw unnormalized energy levels before peak-normalizing.
    # Essential for distinguishing actual human speech from amplified room noise/hiss.
    raw_rms = float(np.sqrt(np.mean(samples ** 2))) if samples.size else 0.0
    raw_peak = float(np.max(np.abs(samples))) if samples.size else 0.0

    if sr != TARGET_SR:
        samples = librosa.resample(samples.astype(np.float32), orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR

    samples = _normalize(samples)

    duration = len(samples) / float(sr) if sr else 0.0
    if duration < MIN_DURATION_SECONDS:
        raise AudioValidationError(
            f"Audio too short ({duration:.2f}s). Minimum required: {MIN_DURATION_SECONDS}s."
        )
    if duration > MAX_DURATION_SECONDS:
        raise AudioValidationError(
            f"Audio too long ({duration:.2f}s). Maximum allowed: {MAX_DURATION_SECONDS}s."
        )

    # Reject effectively-silent recordings; feature extraction would be meaningless.
    if np.max(np.abs(samples)) < 1e-5:
        raise AudioValidationError("Audio appears to be silent; no signal detected.")

    return LoadedAudio(
        samples=samples,
        sample_rate=sr,
        duration_seconds=duration,
        source_filename=filename,
        raw_rms=raw_rms,
        raw_peak=raw_peak,
    )


def check_voice_presence(audio: LoadedAudio, features=None) -> Tuple[bool, str]:
    """
    Evaluate whether the audio contains genuine human vocal activity or
    is merely ambient room silence / background noise (e.g. laptop fan, mic hiss).

    Uses a combination of:
    - Raw unamplified RMS / peak floor checks
    - Praat pitch tracking & sustained voiced frame counting
    - Harmonics-to-Noise Ratio (HNR) to distinguish periodic vocal cords from noise

    Returns:
        (has_speech: bool, reason: str)
    """
    if audio.raw_peak < 1e-4:
        return False, "Digital silence (near zero peak amplitude)."

    # Extremely faint unamplified background floor
    if audio.raw_rms < 0.003 and audio.raw_peak < 0.012:
        return False, f"Signal level is within ambient silence floor (raw RMS: {audio.raw_rms:.5f}, peak: {audio.raw_peak:.4f})."

    # Acoustic harmonicity and voicing verification via Praat
    try:
        import parselmouth
        from parselmouth.praat import call as praat_call

        sound = parselmouth.Sound(audio.samples, sampling_frequency=audio.sample_rate)

        # 1. Pitch & Voicing Frames
        pitch = sound.to_pitch(pitch_floor=75.0, pitch_ceiling=500.0)
        f0 = pitch.selected_array["frequency"]
        voiced = f0[f0 > 0]
        voiced_frames = len(voiced)
        voiced_ratio = voiced_frames / len(f0) if len(f0) > 0 else 0.0

        # Minimum required phonation: at least ~25 frames (~0.25s) or 3.5% of recording
        min_voiced_frames = max(20, int(audio.duration_seconds * 1.5))
        if voiced_frames < min_voiced_frames:
            return False, f"Insufficient vocal phonation ({voiced_frames} voiced frames in {audio.duration_seconds:.1f}s)."

        if voiced_ratio < 0.035:
            return False, f"Voicing ratio too low ({voiced_ratio * 100:.1f}%), consistent with sporadic noise."

        # 2. Harmonics-to-Noise Ratio (HNR)
        try:
            harmonicity = sound.to_harmonicity()
            hnr_mean = float(praat_call(harmonicity, "Get mean", 0, 0))
            # Human speech typically has HNR > 10 dB. Ambient fan/noise has HNR < 3.5 dB.
            if hnr_mean < 3.5:
                return False, f"Harmonics-to-noise ratio too low ({hnr_mean:.1f} dB, expected > 8 dB for speech)."
        except Exception:
            pass

    except Exception as e:
        logger.warning("VAD pitch/harmonicity check failed, falling back to basic checks: %s", e)
        if audio.raw_rms < 0.008 and getattr(features, "pause_ratio", 0.0) >= 0.85:
            return False, f"Excessive pause ({getattr(features, 'pause_ratio', 0.0)*100:.0f}%) with low energy."

    return True, "Human voice activity detected."


def save_upload_temp(file_bytes: bytes, filename: str, upload_dir: str) -> str:
    """
    Persist an uploaded file to disk under a random name, preserving the
    original extension. Returns the full path. Used because Parselmouth's
    Sound object is most reliably constructed from a file path.
    """
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(filename)[1].lower() or ".wav"
    temp_name = f"{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(upload_dir, temp_name)
    with open(temp_path, "wb") as f:
        f.write(file_bytes)
    return temp_path


def write_wav(samples: np.ndarray, sample_rate: int, path: str) -> None:
    """Write a mono float32 signal to disk as 16-bit PCM WAV."""
    sf.write(path, samples, sample_rate, subtype="PCM_16")


def safe_remove(path: str) -> None:
    """Best-effort temp file cleanup that never raises."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError as e:
        logger.warning("Could not remove temp file %s: %s", path, e)
