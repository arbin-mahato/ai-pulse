from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..auth import current_membership
from ..utils import average_score, maturity_level

router = APIRouter(prefix="/reports", tags=["reports"])

NEXT_STEPS = {
    "support": ["Use AI to draft first replies, then edit", "Summarise long ticket threads before escalating", "Never paste customer details into public chatbots"],
    "engineering": ["Use a code assistant for tests and refactors", "Review every AI suggestion before merging", "Keep secrets and customer data out of prompts"],
    "sales": ["Draft outreach emails with AI and personalise them", "Summarise call notes into CRM updates", "Check AI-written claims before sending"],
    "manager": ["Agree an AI usage policy with your team", "Pick one workflow per quarter to improve with AI", "Track time saved, not tool licences"],
}

def latest_completed_assessment(db: Session, membership_id: int):
    return (db.query(models.Assessment).filter_by(membership_id=membership_id, status="completed")
            .order_by(models.Assessment.submitted_at.desc(), models.Assessment.id.desc()).first())


@router.get("/me")
def my_report(m: models.Membership = Depends(current_membership), db: Session = Depends(get_db)):
    assessment = latest_completed_assessment(db, m.id)
    rows = assessment.responses if assessment else []
    avg = average_score(rows)
    flags = sorted({flag for row in rows for flag in (row.flags or [])})
    return {"name": m.user.name, "organization": m.org.name, "answered": len(rows),
            "completed_at": assessment.submitted_at.isoformat() if assessment else None,
            "average_score": round(avg, 2) if avg is not None else None,
            "level": maturity_level(avg), "risks": flags,
            "next_steps": NEXT_STEPS.get(m.job_role, NEXT_STEPS["manager"])}


@router.delete("/me", status_code=204)
def delete_my_diagnostic(m: models.Membership = Depends(current_membership), db: Session = Depends(get_db)):
    """Hard-delete diagnostic content for the employee in their selected organization."""
    db.query(models.Response).filter_by(membership_id=m.id).delete(synchronize_session=False)
    db.query(models.Assessment).filter_by(membership_id=m.id).delete(synchronize_session=False)
    db.commit()
