from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime


# ==================================================
# USER
# ==================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )


# ==================================================
# PATIENT
# ==================================================

class Patient(Base):

    __tablename__ = "patients"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    name = Column(
        String,
        nullable=False
    )

    age = Column(
        Integer,
        nullable=False
    )

    gender = Column(
        String,
        nullable=True
    )

    phone = Column(
        String,
        nullable=True
    )

    diagnosis = Column(
        String,
        nullable=True
    )

    pain_score = Column(
        Integer,
        nullable=True
    )

    notes = Column(
        String,
        nullable=True
    )


# ==================================================
# IFT TREATMENT SESSION
# ==================================================

class Session(Base):

    __tablename__ = "sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        String,
        nullable=False,
        index=True
    )

    date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ----------------------------------------------
    # Patient condition
    # ----------------------------------------------

    condition = Column(
        String,
        nullable=True
    )

    severity = Column(
        String,
        nullable=True
    )

    # ----------------------------------------------
    # Pain scores
    # ----------------------------------------------

    pain_before = Column(
        Integer,
        nullable=True
    )

    pain_after = Column(
        Integer,
        nullable=True
    )

    # ----------------------------------------------
    # IFT Parameters
    # ----------------------------------------------

    carrier_frequency = Column(
        Integer,
        nullable=True
    )

    beat_frequency = Column(
        Integer,
        nullable=True
    )

    intensity = Column(
        Integer,
        nullable=True
    )

    duration = Column(
        Integer,
        nullable=True
    )

    # ----------------------------------------------
    # Therapist notes
    # ----------------------------------------------

    notes = Column(
        String,
        nullable=True
    )

    # ----------------------------------------------
    # Uploaded medical report
    # ----------------------------------------------

    report_filename = Column(
        String,
        nullable=True
    )

    report_path = Column(
        String,
        nullable=True
    )