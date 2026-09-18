"""
Utility functions for image/video decoding and encoding in the Face module.
"""
import base64
import io
import tempfile
import cv2
import numpy as np
from typing import Optional


def decode_base64_to_cv2(base64_str: str) -> Optional[np.ndarray]:
    """Decode a base64 image data URI or raw base64 string to a BGR OpenCV ndarray."""
    if not base64_str:
        return None
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception:
        return None


def encode_cv2_to_base64(frame_bgr: np.ndarray, quality: int = 80) -> str:
    """Encode an OpenCV BGR frame to a base64 JPEG data URI."""
    if frame_bgr is None:
        return ""
    try:
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        success, buffer = cv2.imencode(".jpg", frame_bgr, encode_params)
        if not success:
            return ""
        b64_str = base64.b64encode(buffer).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"
    except Exception:
        return ""


def read_uploaded_image_or_video(content: bytes, filename: str) -> Optional[np.ndarray]:
    """Extract a representative BGR frame from an uploaded image or video."""
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    if ext in ["jpg", "jpeg", "png", "webp", "bmp"]:
        nparr = np.frombuffer(content, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif ext in ["mp4", "avi", "mov", "mkv", "webm"]:
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            cap = cv2.VideoCapture(tmp_path)
            ret, frame = cap.read()
            cap.release()
            return frame if ret else None
        except Exception:
            return None
    return None
