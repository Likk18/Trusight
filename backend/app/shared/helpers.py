"""Math utilities and formatting helpers for TruSight."""
import math
import random
import uuid
from datetime import datetime, timezone
from typing import Optional


def clamp(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


def weighted_average(scores: dict[str, float], weights: dict[str, float]) -> float:
    """Compute a weighted average given score and weight dicts with matching keys."""
    total_weight = sum(weights.values())
    if total_weight == 0:
        return 0.0
    weighted_sum = sum(scores[k] * weights[k] for k in scores if k in weights)
    return clamp(weighted_sum / total_weight)


def sigmoid(x: float) -> float:
    """Standard sigmoid function."""
    return 1.0 / (1.0 + math.exp(-x))


def generate_session_id() -> str:
    """Generate a short unique session identifier."""
    return uuid.uuid4().hex[:8]


def now_utc() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format a datetime as ISO 8601 string."""
    if dt is None:
        dt = now_utc()
    return dt.isoformat()


def simulate_variance(base: float, variance: float = 5.0) -> float:
    """Add controlled Gaussian noise to a base value for simulation."""
    return clamp(base + random.gauss(0, variance))


def score_to_verdict(score: float) -> str:
    """Map a 0–100 truth likelihood score to a human-readable verdict."""
    if score >= 85:
        return "HIGHLY TRUTHFUL"
    elif score >= 70:
        return "LIKELY TRUTHFUL"
    elif score >= 50:
        return "UNCERTAIN"
    elif score >= 30:
        return "LIKELY DECEPTIVE"
    else:
        return "HIGHLY DECEPTIVE"


def latency_ms() -> int:
    """Simulate processing latency in milliseconds."""
    return int(random.gauss(120, 15))
