from pydantic import BaseModel
from typing import Optional


# =========================
# PATIENT
# =========================

class PatientCreate(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: Optional[str] = None
    phone: Optional[str] = None
    diagnosis: Optional[str] = None
    pain_score: Optional[int] = None
    notes: Optional[str] = None


# =========================
# SESSION
# =========================

class SessionCreate(BaseModel):
    patient_id: str

    condition: Optional[str] = None
    severity: Optional[str] = None

    pain_before: Optional[int] = None
    pain_after: Optional[int] = None

    carrier_frequency: Optional[int] = None
    beat_frequency: Optional[int] = None

    intensity: Optional[int] = None
    duration: Optional[int] = None

    notes: Optional[str] = None

    report_filename: Optional[str] = None
    report_path: Optional[str] = None