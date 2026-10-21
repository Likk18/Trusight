"""Speech-to-text transcription service using Whisper.

Loads Whisper model once on demand and executes audio decoding in worker
threads to prevent blocking the async FastAPI event loop.
"""
import asyncio
import os
import tempfile
import whisper
from app.shared.logger import get_logger

logger = get_logger(__name__)

_whisper_model = None


def get_whisper_model():
    """Lazy load Whisper base model once."""
    global _whisper_model
    if _whisper_model is None:
        logger.info("Loading Whisper base model...")
        _whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully.")
    return _whisper_model


def speech_to_text(audio_path: str) -> str:
    """Transcribe an audio file from local path."""
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = get_whisper_model()
    result = model.transcribe(audio_path, fp16=False)
    return result.get("text", "").strip()


def transcribe_audio_bytes(audio_bytes: bytes, extension: str = ".webm") -> str:
    """Write audio bytes to a temporary file and transcribe with Whisper."""
    if not audio_bytes:
        return ""

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        transcript = speech_to_text(temp_path)
        return transcript
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError as err:
                logger.warning(f"Failed to remove temp audio file {temp_path}: {err}")


async def transcribe_audio_bytes_async(audio_bytes: bytes, extension: str = ".webm") -> str:
    """Asynchronously transcribe audio bytes using thread pool worker."""
    return await asyncio.to_thread(transcribe_audio_bytes, audio_bytes, extension)
