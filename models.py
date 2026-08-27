from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime


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

    condition = Column(
        String,
        nullable=True
    )

    severity = Column(
        String,
        nullable=True
    )

    pain_before = Column(
        Integer,
        nullable=True
    )

    pain_after = Column(
        Integer,
        nullable=True
    )

    frequency = Column(
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
    report_filename = Column(
        String,
        nullable=True
    )

    report_path = Column(
        String,
        nullable=True
    )