from __future__ import annotations

import re
from difflib import SequenceMatcher

from .models import DuplicateMatchOut, DuplicateScanIn, ProjectOut

STOPWORDS = {
    "a",
    "an",
    "and",
    "for",
    "from",
    "in",
    "into",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
    "using",
    "via",
    "new",
    "system",
    "project",
    "initiative",
    "request",
}


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _ratio(a: str, b: str) -> float:
    if not a.strip() or not b.strip():
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def score_against(draft: DuplicateScanIn, existing: ProjectOut) -> tuple[int, list[str]]:
    title_sim = _ratio(draft.request_title, existing.request_title)
    blob_a = " ".join(
        [draft.request_title, draft.problem_statement, draft.solution_summary]
    )
    blob_b = " ".join(
        [existing.request_title, existing.problem_statement, existing.solution_summary]
    )
    token_sim = _jaccard(_tokens(blob_a), _tokens(blob_b))
    type_match = (
        1.0
        if draft.solution_type
        and draft.solution_type.lower() == existing.solution_type.lower()
        else 0.0
    )
    dept_match = (
        1.0
        if draft.business_dept
        and draft.business_dept.lower() == existing.business_dept.lower()
        else 0.0
    )

    raw = title_sim * 0.36 + token_sim * 0.42 + type_match * 0.12 + dept_match * 0.10
    score = int(round(raw * 100))

    reasons: list[str] = []
    if title_sim >= 0.55:
        reasons.append(f"Title similarity {int(title_sim * 100)}%")
    shared = _tokens(blob_a) & _tokens(blob_b)
    if shared:
        sample = ", ".join(sorted(shared)[:5])
        reasons.append(f"Shared terms: {sample}")
    if type_match:
        reasons.append(f"Same solution type: {existing.solution_type}")
    if dept_match:
        reasons.append(f"Same department: {existing.business_dept}")
    if not reasons and score >= 40:
        reasons.append("Partial description overlap")

    return score, reasons


def scan_duplicates(
    draft: DuplicateScanIn, catalog: list[ProjectOut]
) -> list[DuplicateMatchOut]:
    matches: list[DuplicateMatchOut] = []
    for project in catalog:
        if draft.exclude_id and project.id == draft.exclude_id:
            continue
        score, reasons = score_against(draft, project)
        if score < 22:
            continue
        band = "likely" if score >= 40 else "possible"
        matches.append(
            DuplicateMatchOut(project=project, score=score, band=band, reasons=reasons)
        )
    matches.sort(key=lambda m: m.score, reverse=True)
    return matches[:8]


def cluster_duplicates(catalog: list[ProjectOut]) -> list[tuple[int, list[ProjectOut]]]:
    used: set[str] = set()
    clusters: list[tuple[int, list[ProjectOut]]] = []
    by_id = {p.id: p for p in catalog}

    for project in catalog:
        if project.id in used:
            continue
        members = [project]
        best = 0
        for other in catalog:
            if other.id == project.id or other.id in used:
                continue
            draft = DuplicateScanIn(
                request_title=project.request_title,
                problem_statement=project.problem_statement,
                solution_summary=project.solution_summary,
                business_dept=project.business_dept,
                solution_type=project.solution_type,
            )
            score, _ = score_against(draft, other)
            if score >= 42:
                members.append(other)
                best = max(best, score)
        if len(members) > 1:
            for member in members:
                used.add(member.id)
            clusters.append((best, [by_id[m.id] for m in members]))

    clusters.sort(key=lambda c: c[0], reverse=True)
    return clusters
