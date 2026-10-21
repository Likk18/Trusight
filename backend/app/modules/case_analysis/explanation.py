"""Evidence-grounded explanation service using local Ollama (llama3.2:3b).

Features:
- Local-only execution via Ollama (no external cloud APIs required).
- Strict JSON structure validation and bounded timeouts.
- Fallback heuristic explanation if Ollama is offline or times out.
- Safety invariant: If DeBERTa flags Contradiction without explicit factual conflicts,
  enforces safe uncertainty explanation rather than claiming deception.
"""
import asyncio
import json
import requests
from app.modules.case_analysis.pipeline import find_conflicts
from app.shared.logger import get_logger

logger = get_logger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"
OLLAMA_MODEL = "llama3.2:3b"


def check_ollama_status() -> dict:
    """Check whether local Ollama service is running and if the model is loaded."""
    try:
        resp = requests.get(OLLAMA_TAGS_URL, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            models = [m.get("name") for m in data.get("models", [])]
            has_model = any(OLLAMA_MODEL in m for m in models)
            return {
                "available": True,
                "has_model": has_model,
                "models": models,
            }
        return {"available": False, "has_model": False, "models": []}
    except Exception:
        return {"available": False, "has_model": False, "models": []}


def prepare_evidence_text(evidence_list: list[dict] | str) -> tuple[str, list[dict]]:
    """Format evidence list into a standardized string with page references."""
    if not evidence_list:
        return "No evidence was retrieved.", []

    if isinstance(evidence_list, dict):
        evidence_list = [evidence_list]

    if isinstance(evidence_list, str):
        return evidence_list, []

    formatted_items = []
    text_blocks = []
    for i, item in enumerate(evidence_list):
        page = item.get("page", 1)
        text = item.get("text", "")
        formatted_items.append({
            "page": page,
            "text": text,
            "distance": item.get("distance"),
        })
        text_blocks.append(f"[Evidence {i + 1} | Page {page}]\n{text}")

    return "\n\n".join(text_blocks), formatted_items


def generate_explanation(
    evidence_list: list[dict] | str,
    interview: str,
    result: dict,
) -> dict:
    """
    Generate an evidence-grounded explanation for the NLI verdict using Ollama or fallback.
    """
    verdict = result.get("verdict", "Neutral")
    confidence = result.get("confidence", 0.0)
    evidence_text, evidence_items = prepare_evidence_text(evidence_list)

    # Pre-calculate rule-based conflicts to validate against hallucinations
    rule_conflicts = find_conflicts(interview, evidence_items)

    prompt = f"""
You are an evidence-grounded explanation assistant for an interview analysis tool.

A separate Natural Language Inference (NLI) model has already classified an interview
statement against evidence retrieved from a case report.

The NLI model produced:
VERDICT: {verdict}
CONFIDENCE: {confidence}%

You MUST NOT perform a new classification.
Your task is ONLY to explain the supplied classification using the interview statement and retrieved evidence.

INTERVIEW STATEMENT:
{interview}

RETRIEVED EVIDENCE:
{evidence_text}

STRICT RULES:
1. Use ONLY information explicitly present in the interview and retrieved evidence.
2. Never invent facts, people, events, locations, dates, times, objects, quantities or details.
3. Never claim that the person is lying or that the classification proves deception.
4. NEVER change the supplied verdict.
5. If the supplied verdict is Contradiction but there is no explicit factual conflict, then:
   summary MUST be: "No explicit factual conflict can be identified from the retrieved evidence."
   AND conflicting_elements MUST be [].
6. For Entailment, explain what information in the evidence supports the statement.
7. For Neutral, explain that the evidence neither proves nor refutes the statement.
8. Evidence page numbers MUST come directly from the supplied evidence.
9. Return ONLY valid JSON with this exact schema:
{{
    "summary": "...",
    "interview_statement": "...",
    "evidence_statement": "...",
    "conflicting_elements": [
        {{
            "type": "time/date/location/person/action/object/quantity/detail",
            "interview": "...",
            "evidence": "...",
            "page": 1
        }}
    ]
}}
"""

    status = check_ollama_status()
    if not status["available"]:
        # Graceful degradation without fabricating explanations
        summary = (
            "The interview statement is consistent with the evidence report."
            if verdict == "Entailment"
            else "The interview statement contradicts explicit evidence details."
            if verdict == "Contradiction" and rule_conflicts
            else "No explicit factual conflict can be identified from the retrieved evidence."
            if verdict == "Contradiction"
            else "The interview statement is related to the evidence but does not clearly support or contradict it."
        )

        return {
            "summary": summary,
            "interview_statement": interview,
            "evidence_statement": evidence_text,
            "conflicting_elements": rule_conflicts if verdict == "Contradiction" else [],
            "verdict": verdict,
            "confidence": confidence,
            "conflict_validated": bool(rule_conflicts),
            "ollama_available": False,
            "error": "Ollama service unavailable; used deterministic heuristic verification.",
        }

    try:
        response = requests.post(
            OLLAMA_CHAT_URL,
            headers={"Content-Type": "application/json"},
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a strict evidence-grounded explanation assistant. Never invent facts or conflicts. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.0},
            },
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        llm_output = data.get("message", {}).get("content", "").strip()

        # Clean markdown code fences if present
        if llm_output.startswith("```json"):
            llm_output = llm_output[7:]
        elif llm_output.startswith("```"):
            llm_output = llm_output[3:]
        if llm_output.endswith("```"):
            llm_output = llm_output[:-3]
        llm_output = llm_output.strip()

        explanation = json.loads(llm_output)

        if not isinstance(explanation, dict):
            explanation = {"summary": str(llm_output)}

    except Exception as err:
        logger.warning(f"Ollama call failed ({err}), falling back to heuristic explanation.")
        summary = (
            "The interview statement is consistent with the evidence report."
            if verdict == "Entailment"
            else "The interview statement contradicts explicit evidence details."
            if verdict == "Contradiction" and rule_conflicts
            else "No explicit factual conflict can be identified from the retrieved evidence."
            if verdict == "Contradiction"
            else "The statement neither confirms nor conflicts directly with the case report."
        )
        explanation = {
            "summary": summary,
            "interview_statement": interview,
            "evidence_statement": evidence_text,
            "conflicting_elements": rule_conflicts if verdict == "Contradiction" else [],
            "error": str(err),
            "ollama_available": False,
        }

    # Normalize fields
    explanation.setdefault("interview_statement", interview)
    explanation.setdefault("evidence_statement", evidence_text)
    if not isinstance(explanation.get("conflicting_elements"), list):
        explanation["conflicting_elements"] = []

    # Merge verified rule conflicts if Ollama missed them or returned empty on a clear mismatch
    if rule_conflicts and not explanation["conflicting_elements"] and verdict == "Contradiction":
        explanation["conflicting_elements"] = rule_conflicts

    # Crucial safety enforcement: If Contradiction has NO conflicting elements, enforce uncertainty explanation
    if verdict == "Contradiction" and not explanation["conflicting_elements"]:
        explanation["summary"] = (
            "No explicit factual conflict can be identified from the retrieved evidence."
        )

    explanation["verdict"] = verdict
    explanation["confidence"] = confidence
    explanation["conflict_validated"] = bool(explanation["conflicting_elements"])
    explanation.setdefault("ollama_available", True)

    return explanation


async def generate_explanation_async(
    evidence_list: list[dict] | str,
    interview: str,
    result: dict,
) -> dict:
    """Asynchronously execute explanation generation in thread pool worker."""
    return await asyncio.to_thread(generate_explanation, evidence_list, interview, result)
