"""Factual conflict detection and heuristic validation utilities.

Validates whether an NLI Contradiction verdict corresponds to an explicit
factual conflict (e.g. mismatched times, numbers, dates) or represents an
unrelated/divergent statement without verified contradiction.
"""
import re


def find_conflicts(interview: str, evidence_items: list[dict] | str) -> list[dict]:
    """
    Extract explicit factual conflicts (time, numbers, dates) between interview
    statement and retrieved evidence text.
    """
    if isinstance(evidence_items, list):
        evidence_text = " ".join(item.get("text", "") for item in evidence_items)
        first_page = evidence_items[0].get("page", 1) if evidence_items else 1
    else:
        evidence_text = str(evidence_items)
        first_page = 1

    conflicts = []

    # 1. TIME CONFLICTS (e.g. 8 PM vs 9 PM, 10:15 am vs 11:00 am)
    time_regex = r"\b\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm)\b"
    interview_times = re.findall(time_regex, interview)
    evidence_times = re.findall(time_regex, evidence_text)

    if interview_times and evidence_times:
        it_clean = interview_times[0].replace(" ", "").lower()
        et_clean = evidence_times[0].replace(" ", "").lower()
        if it_clean != et_clean:
            conflicts.append({
                "type": "time",
                "interview": interview_times[0],
                "evidence": evidence_times[0],
                "page": first_page,
            })

    # 2. NUMERIC CONFLICTS (quantities, amounts, numbers >= 2 digits or distinct)
    num_regex = r"\b\d+\b"
    interview_nums = set(re.findall(num_regex, interview))
    evidence_nums = set(re.findall(num_regex, evidence_text))

    # Check for direct numeric mismatches in nearby contexts
    if interview_nums and evidence_nums:
        shared = interview_nums.intersection(evidence_nums)
        if not shared and (len(interview_nums) == 1 and len(evidence_nums) == 1):
            i_val = next(iter(interview_nums))
            e_val = next(iter(evidence_nums))
            conflicts.append({
                "type": "quantity",
                "interview": i_val,
                "evidence": e_val,
                "page": first_page,
            })

    return conflicts
