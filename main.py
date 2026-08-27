from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, Patient, Session as SessionModel
from schemas import PatientCreate, SessionCreate

import os
import shutil


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Smart IFT Backend",
    description="Backend API for Smart IFT AI-based physiotherapy system",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

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


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# ROOT / HEALTH
# =========================================================

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


# =========================================================
# PATIENT APIs
# =========================================================

@app.post("/patients")
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):

    # Check whether patient ID already exists
    existing_patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient.patient_id
        )
        .first()
    )

    if existing_patient:

        raise HTTPException(
            status_code=400,
            detail="Patient ID already exists"
        )


    # Create new patient
    new_patient = Patient(

        patient_id=patient.patient_id,

        name=patient.name,

        age=patient.age,

        gender=patient.gender,

        phone=patient.phone,

        diagnosis=patient.diagnosis,

        pain_score=patient.pain_score,

        notes=patient.notes
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

            "gender": new_patient.gender,

            "phone": new_patient.phone,

            "diagnosis": new_patient.diagnosis,

            "pain_score": new_patient.pain_score,

            "notes": new_patient.notes
        }
    }


# ---------------------------------------------------------
# GET ALL PATIENTS
# ---------------------------------------------------------

@app.get("/patients")
def get_patients(
    db: Session = Depends(get_db)
):

    patients = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .all()
    )


    return {

        "patients": [

            {

                "id": patient.id,

                "patient_id": patient.patient_id,

                "name": patient.name,

                "age": patient.age,

                "gender": patient.gender,

                "phone": patient.phone,

                "diagnosis": patient.diagnosis,

                "pain_score": patient.pain_score,

                "notes": patient.notes

            }

            for patient in patients

        ]

    }


# ---------------------------------------------------------
# GET SINGLE PATIENT
# ---------------------------------------------------------

@app.get("/patients/{patient_id}")
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id
        )
        .first()
    )


    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )


    return {

        "patient": {

            "id": patient.id,

            "patient_id": patient.patient_id,

            "name": patient.name,

            "age": patient.age,

            "gender": patient.gender,

            "phone": patient.phone,

            "diagnosis": patient.diagnosis,

            "pain_score": patient.pain_score,

            "notes": patient.notes

        }

    }


# =========================================================
# SESSION APIs
# =========================================================

@app.post("/sessions")
def create_session(
    session: SessionCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check whether patient exists
    # -----------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == session.patient_id
        )
        .first()
    )


    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )


    # -----------------------------------------------------
    # Create new IFT session
    # -----------------------------------------------------

    new_session = SessionModel(

        patient_id=session.patient_id,

        condition=session.condition,

        severity=session.severity,

        pain_before=session.pain_before,

        pain_after=session.pain_after,

        carrier_frequency=session.carrier_frequency,

        beat_frequency=session.beat_frequency,

        intensity=session.intensity,

        duration=session.duration,

        notes=session.notes,

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

            "date": new_session.date,

            "condition": new_session.condition,

            "severity": new_session.severity,

            "pain_before": new_session.pain_before,

            "pain_after": new_session.pain_after,

            "carrier_frequency": new_session.carrier_frequency,

            "beat_frequency": new_session.beat_frequency,

            "intensity": new_session.intensity,

            "duration": new_session.duration,

            "notes": new_session.notes,

            "report_filename": new_session.report_filename,

            "report_path": new_session.report_path

        }

    }


# ---------------------------------------------------------
# GET ALL SESSIONS
# ---------------------------------------------------------

@app.get("/sessions")
def get_all_sessions(
    db: Session = Depends(get_db)
):

    sessions = (
        db.query(SessionModel)
        .order_by(SessionModel.id.desc())
        .all()
    )


    return {

        "sessions": [

            {

                "id": session.id,

                "patient_id": session.patient_id,

                "date": session.date,

                "condition": session.condition,

                "severity": session.severity,

                "pain_before": session.pain_before,

                "pain_after": session.pain_after,

                "carrier_frequency": session.carrier_frequency,

                "beat_frequency": session.beat_frequency,

                "intensity": session.intensity,

                "duration": session.duration,

                "notes": session.notes,

                "report_filename": session.report_filename,

                "report_path": session.report_path

            }

            for session in sessions

        ]

    }


# ---------------------------------------------------------
# GET SESSIONS FOR A PARTICULAR PATIENT
# ---------------------------------------------------------

@app.get("/sessions/{patient_id}")
def get_sessions(
    patient_id: str,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id
        )
        .first()
    )


    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )


    sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.patient_id == patient_id
        )
        .order_by(SessionModel.id.asc())
        .all()
    )


    return {

        "patient_id": patient_id,

        "sessions": [

            {

                "id": session.id,

                "patient_id": session.patient_id,

                "date": session.date,

                "condition": session.condition,

                "severity": session.severity,

                "pain_before": session.pain_before,

                "pain_after": session.pain_after,

                "carrier_frequency": session.carrier_frequency,

                "beat_frequency": session.beat_frequency,

                "intensity": session.intensity,

                "duration": session.duration,

                "notes": session.notes,

                "report_filename": session.report_filename,

                "report_path": session.report_path

            }

            for session in sessions

        ]

    }


# =========================================================
# REPORT UPLOAD
# =========================================================

@app.post("/upload-report")
async def upload_report(
    patient_id: str,
    file: UploadFile = File(...)
):

    # -----------------------------------------------------
    # Check patient ID
    # -----------------------------------------------------

    db = SessionLocal()

    try:

        patient = (
            db.query(Patient)
            .filter(
                Patient.patient_id == patient_id
            )
            .first()
        )

    finally:

        db.close()


    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )


    # -----------------------------------------------------
    # Allowed file types
    # -----------------------------------------------------

    allowed_extensions = [

        ".jpg",

        ".jpeg",

        ".png",

        ".pdf"

    ]


    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    file_extension = os.path.splitext(
        file.filename
    )[1].lower()


    if file_extension not in allowed_extensions:

        raise HTTPException(

            status_code=400,

            detail="Only JPG, JPEG, PNG and PDF files are allowed"

        )


    # -----------------------------------------------------
    # Create upload folder
    # -----------------------------------------------------

    upload_folder = "upload"


    os.makedirs(
        upload_folder,
        exist_ok=True
    )


    # -----------------------------------------------------
    # Make filename safe
    # -----------------------------------------------------

    safe_filename = os.path.basename(
        file.filename
    )


    file_path = os.path.join(

        upload_folder,

        f"{patient_id}_{safe_filename}"

    )


    # -----------------------------------------------------
    # Save file
    # -----------------------------------------------------

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=f"Could not save report: {str(e)}"

        )


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message": "Report uploaded successfully",

        "patient_id": patient_id,

        "filename": safe_filename,

        "path": file_path

    }