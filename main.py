from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, Patient, Session as SessionModel
from schemas import PatientCreate, SessionCreate

import os
import shutil


# Create FastAPI application
app = FastAPI(title="Smart IFT Backend")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Database connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# ROOT
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "Smart IFT Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# -----------------------------
# PATIENTS
# -----------------------------

@app.post("/patients")
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):

    existing_patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient.patient_id)
        .first()
    )

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient ID already exists"
        )

    new_patient = Patient(
        patient_id=patient.patient_id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "message": "Patient created successfully",
        "patient": {
            "id": new_patient.id,
            "patient_id": new_patient.patient_id,
            "name": new_patient.name,
            "age": new_patient.age,
            "gender": new_patient.gender
        }
    }


@app.get("/patients")
def get_patients(
    db: Session = Depends(get_db)
):

    patients = db.query(Patient).all()

    return {
        "patients": [
            {
                "id": patient.id,
                "patient_id": patient.patient_id,
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender
            }
            for patient in patients
        ]
    }


# -----------------------------
# SESSIONS
# -----------------------------

@app.post("/sessions")
def create_session(
    session: SessionCreate,
    db: Session = Depends(get_db)
):

    new_session = SessionModel(
        patient_id=session.patient_id,
        condition=session.condition,
        severity=session.severity,
        pain_before=session.pain_before,
        pain_after=session.pain_after,
        frequency=session.frequency,
        intensity=session.intensity,
        duration=session.duration,
        report_filename=session.report_filename,
        report_path=session.report_path
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "message": "IFT session created successfully",
        "session": {
            "id": new_session.id,
            "patient_id": new_session.patient_id,
            "condition": new_session.condition,
            "severity": new_session.severity,
            "pain_before": new_session.pain_before,
            "pain_after": new_session.pain_after,
            "frequency": new_session.frequency,
            "intensity": new_session.intensity,
            "duration": new_session.duration,
            "report_filename": new_session.report_filename,
            "report_path": new_session.report_path,
            "date": new_session.date
        }
    }


@app.get("/sessions")
def get_all_sessions(
    db: Session = Depends(get_db)
):

    sessions = db.query(SessionModel).all()

    return {
        "sessions": [
            {
                "id": session.id,
                "patient_id": session.patient_id,
                "condition": session.condition,
                "severity": session.severity,
                "pain_before": session.pain_before,
                "pain_after": session.pain_after,
                "frequency": session.frequency,
                "intensity": session.intensity,
                "duration": session.duration,
                "report_filename": session.report_filename,
                "report_path": session.report_path,
                "date": session.date
            }
            for session in sessions
        ]
    }


@app.get("/sessions/{patient_id}")
def get_sessions(
    patient_id: str,
    db: Session = Depends(get_db)
):

    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.patient_id == patient_id)
        .all()
    )

    return {
        "patient_id": patient_id,
        "sessions": [
            {
                "id": session.id,
                "condition": session.condition,
                "severity": session.severity,
                "pain_before": session.pain_before,
                "pain_after": session.pain_after,
                "frequency": session.frequency,
                "intensity": session.intensity,
                "duration": session.duration,
                "report_filename": session.report_filename,
                "report_path": session.report_path,
                "date": session.date
            }
            for session in sessions
        ]
    }


# -----------------------------
# REPORT UPLOAD
# -----------------------------

@app.post("/upload-report")
async def upload_report(
    patient_id: str,
    file: UploadFile = File(...)
):

    allowed_extensions = [
        ".jpg",
        ".jpeg",
        ".png"
    ]

    file_extension = os.path.splitext(
        file.filename
    )[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG files are allowed"
        )

    upload_folder = "upload"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    safe_filename = os.path.basename(
        file.filename
    )

    file_path = os.path.join(
        upload_folder,
        f"{patient_id}_{safe_filename}"
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    return {
        "message": "Report uploaded successfully",
        "patient_id": patient_id,
        "filename": safe_filename,
        "path": file_path
    }