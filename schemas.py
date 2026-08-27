from pydantic import BaseModel


class PatientCreate(BaseModel):

    patient_id: str
    name: str
    age: int
    gender: str | None = None


class SessionCreate(BaseModel):

    patient_id: str
    condition: str | None = None
    severity: str | None = None

    pain_before: int | None = None
    pain_after: int | None = None

    frequency: int | None = None
    intensity: int | None = None
    duration: int | None = None
    report_filename: str | None = None
    report_path: str | None = None