import json
import os
from typing import Any

_RESOURCES_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "learning_resources.json"
)

QUESTION_TOPIC_MAP = {
    "common-data": "data_safety",
    "common-review": "output_verification",
    "common-policy": "policy_governance",
    "common-freq": "developer_productivity",
    "eng-review": "output_verification",
    "eng-assistant": "developer_productivity",
    "eng-arch": "developer_productivity",
    "sup-drafts": "prompt_engineering",
    "sup-escalation": "data_safety",
    "sales-outreach": "prompt_engineering",
    "sales-crm": "data_safety",
    "mgr-policy": "policy_governance",
    "mgr-adoption": "policy_governance",
}

FLAG_TOPIC_MAP = {
    "customer_data_shared": "data_safety",
    "confidential_data_shared": "data_safety",
    "unreviewed_output": "output_verification",
    "policy_unaware": "policy_governance",
}


def load_resources() -> list[dict[str, Any]]:
    with open(_RESOURCES_PATH, encoding="utf-8") as f:
        return json.load(f)


def get_recommendations(
    job_role: str,
    seniority: str,
    responses: list[Any],
    risk_flags: list[str],
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Deterministically selects tailored learning and workplace practice packs

    based on employee responses, active risk flags, and job role.
    """
    if not responses:
        return []

    all_resources = load_resources()
    role_resources = [
        r
        for r in all_resources
        if "all" in r.get("roles", []) or job_role in r.get("roles", [])
    ]

    needed_topics: dict[str, str] = {}

    # Priority 1: Triggered risk flags (critical safety/governance concerns)
    for flag in sorted(set(risk_flags)):
        topic = FLAG_TOPIC_MAP.get(flag)
        if topic and topic not in needed_topics:
            if flag in ("customer_data_shared", "confidential_data_shared"):
                needed_topics[topic] = (
                    "Selected because your diagnostic flagged a potential data privacy or confidentiality risk."
                )
            elif flag == "unreviewed_output":
                needed_topics[topic] = (
                    "Selected because your answers indicate unverified reliance on AI-generated outputs."
                )
            elif flag == "policy_unaware":
                needed_topics[topic] = (
                    "Selected because your answers suggest unfamiliarity with company AI usage policies."
                )

    # Priority 2: Questions with lower scores (score <= 3)
    for resp in responses:
        qid = getattr(resp, "question_id", None) or (
            resp.get("question_id") if isinstance(resp, dict) else None
        )
        score = getattr(resp, "score", None) or (
            resp.get("score") if isinstance(resp, dict) else None
        )
        if qid and score is not None and score <= 3:
            topic = QUESTION_TOPIC_MAP.get(qid)
            if topic and topic not in needed_topics:
                needed_topics[topic] = (
                    f"Selected to strengthen your workflow in {topic.replace('_', ' ')} based on your diagnostic answers."
                )

    # If no flags or low scores, provide role-appropriate capability builder
    if not needed_topics:
        if job_role == "engineering":
            needed_topics["developer_productivity"] = (
                "Selected to advance your AI-assisted engineering and automated verification practices."
            )
        elif job_role == "manager":
            needed_topics["policy_governance"] = (
                "Selected to help you lead team AI governance and safe workflow adoption."
            )
        else:
            needed_topics["prompt_engineering"] = (
                "Selected to help you craft structured, high-accuracy AI prompts for your daily tasks."
            )

    recommendations: list[dict[str, Any]] = []
    used_ids: set[str] = set()

    for topic, reason in needed_topics.items():
        candidates = [
            r
            for r in role_resources
            if r["topic"] == topic and r["id"] not in used_ids
        ]
        if candidates:
            # Sort by difficulty matching seniority if applicable
            chosen = candidates[0]
            used_ids.add(chosen["id"])
            recommendations.append(
                {
                    "id": chosen["id"],
                    "title": chosen["title"],
                    "provider": chosen["provider"],
                    "url": chosen["url"],
                    "topic": chosen["topic"],
                    "format": chosen.get("format", "guide"),
                    "duration_minutes": chosen.get("duration_minutes", 10),
                    "why": reason,
                    "practice": chosen["practice"],
                    "success_measure": chosen["success_measure"],
                }
            )
        if len(recommendations) >= limit:
            break

    # If still below limit, fill with general role-relevant resources
    if len(recommendations) < limit:
        for r in role_resources:
            if r["id"] not in used_ids:
                used_ids.add(r["id"])
                recommendations.append(
                    {
                        "id": r["id"],
                        "title": r["title"],
                        "provider": r["provider"],
                        "url": r["url"],
                        "topic": r["topic"],
                        "format": r.get("format", "guide"),
                        "duration_minutes": r.get("duration_minutes", 10),
                        "why": f"Recommended practice pack for {job_role.capitalize()} professionals.",
                        "practice": r["practice"],
                        "success_measure": r["success_measure"],
                    }
                )
            if len(recommendations) >= limit:
                break

    return recommendations
