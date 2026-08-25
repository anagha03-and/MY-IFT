import { useEffect, useState } from "react";
import "./App.css";

const EMPTY_PATIENT_FORM = {
  name: "",
  age: "",
  gender: "",
  phone: "",
  diagnosis: "",
  painScore: "",
  notes: "",
};

const EMPTY_PARAMETERS = {
  carrierFrequency: "",
  beatFrequency: "",
  intensity: "",
  duration: "",
  notes: "",
};

function App() {
  /* =====================================================
     USER / LOGIN
  ===================================================== */

  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("smartIFT_loggedIn") === "true";
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem("smartIFT_username") || "";
  });

  const [page, setPage] = useState("dashboard");

  /* =====================================================
     ALL USERS' DATA

     Structure:
     {
       username1: {
         patients: [],
         sessions: []
       },
       username2: {
         patients: [],
         sessions: []
       }
     }
  ===================================================== */

  const [usersData, setUsersData] = useState(() => {
    try {
      const saved = localStorage.getItem("smartIFT_users");

      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  /* =====================================================
     CURRENT USER DATA
  ===================================================== */

  const currentUserData = usersData[username] || {
    patients: [],
    sessions: [],
  };

  const patients = currentUserData.patients || [];
  const sessionHistory = currentUserData.sessions || [];

  /* =====================================================
     SELECTED PATIENT
  ===================================================== */

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  /* =====================================================
     PATIENT FORM
  ===================================================== */

  const [patientForm, setPatientForm] = useState(
    EMPTY_PATIENT_FORM
  );

  /* =====================================================
     PROFILE
  ===================================================== */

  const [showProfile, setShowProfile] = useState(false);

  /* =====================================================
     TREATMENT PARAMETERS

     These are kept separately so that typing in them
     never changes patient pain score or old sessions.
  ===================================================== */

  const [treatmentParameters, setTreatmentParameters] =
    useState(EMPTY_PARAMETERS);

  /* =====================================================
     AI
  ===================================================== */

  const [aiRecommendation, setAiRecommendation] =
    useState(null);

  const [recommendationMode, setRecommendationMode] =
    useState("manual");

  /* =====================================================
     MACHINE
  ===================================================== */

  const [machineSent, setMachineSent] = useState(false);

  /* =====================================================
     SESSION
  ===================================================== */

  const [sessionStatus, setSessionStatus] =
    useState("not-started");

  const [sessionSeconds, setSessionSeconds] =
    useState(0);

  const [afterPainScore, setAfterPainScore] =
    useState("");

  /* =====================================================
     SAFETY POPUP
  ===================================================== */

  const [showSafetyWarning, setShowSafetyWarning] =
    useState(false);

  /* =====================================================
     SAVE ALL USERS DATA
  ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "smartIFT_users",
      JSON.stringify(usersData)
    );
  }, [usersData]);

  /* =====================================================
     SAVE LOGIN
  ===================================================== */

  useEffect(() => {
    if (loggedIn && username) {
      localStorage.setItem(
        "smartIFT_loggedIn",
        "true"
      );

      localStorage.setItem(
        "smartIFT_username",
        username
      );
    }
  }, [loggedIn, username]);

  /* =====================================================
     TIMER
  ===================================================== */

  useEffect(() => {
    if (sessionStatus !== "running") {
      return;
    }

    const timer = setInterval(() => {
      setSessionSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStatus]);

  /* =====================================================
     AUTOMATIC SESSION COMPLETION
  ===================================================== */

  useEffect(() => {
    if (
      sessionStatus === "running" &&
      treatmentParameters.duration !== "" &&
      Number(treatmentParameters.duration) > 0
    ) {
      const durationSeconds =
        Number(treatmentParameters.duration) * 60;

      if (sessionSeconds >= durationSeconds) {
        setSessionStatus("completed");
      }
    }
  }, [
    sessionSeconds,
    sessionStatus,
    treatmentParameters.duration,
  ]);

  /* =====================================================
     TIME FORMAT
  ===================================================== */

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  /* =====================================================
     UPDATE CURRENT USER DATA

     This function is the main fix.

     Every patient/session is saved inside the current
     username's account.
  ===================================================== */

  const updateCurrentUserData = (newData) => {
    setUsersData((previous) => ({
      ...previous,

      [username]: {
        patients:
          newData.patients !== undefined
            ? newData.patients
            : previous[username]?.patients || [],

        sessions:
          newData.sessions !== undefined
            ? newData.sessions
            : previous[username]?.sessions || [],
      },
    }));
  };

  /* =====================================================
     PATIENT FORM CHANGE
  ===================================================== */

  const handlePatientChange = (e) => {
    const { name, value } = e.target;

    setPatientForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     ADD PATIENT
  ===================================================== */

  const addPatient = (e) => {
    e.preventDefault();

    if (!username) {
      alert("Please login first.");
      return;
    }

    const newPatient = {
      id: `P${String(patients.length + 1).padStart(
        3,
        "0"
      )}`,

      username,

      name: patientForm.name,
      age: patientForm.age,
      gender: patientForm.gender,
      phone: patientForm.phone,
      diagnosis: patientForm.diagnosis,

      /* Preserve exactly what the user entered */
      painScore: patientForm.painScore,

      notes: patientForm.notes,

      createdAt: new Date().toLocaleString(),
    };

    updateCurrentUserData({
      patients: [...patients, newPatient],
    });

    setPatientForm(EMPTY_PATIENT_FORM);

    setPage("patients");
  };

  /* =====================================================
     OPEN PATIENT / NEW SESSION
  ===================================================== */

  const openTreatment = (patient) => {
    setSelectedPatient(patient);

    /*
      IMPORTANT:
      Every new session starts with EMPTY treatment
      parameters.

      Nothing from the previous session is copied.
    */

    setTreatmentParameters({
      carrierFrequency: "",
      beatFrequency: "",
      intensity: "",
      duration: "",
      notes: "",
    });

    setAiRecommendation(null);

    setRecommendationMode("manual");

    setMachineSent(false);

    setSessionStatus("not-started");

    setSessionSeconds(0);

    setAfterPainScore("");

    setPage("treatment");
  };

  /* =====================================================
     TREATMENT PARAMETER CHANGE
  ===================================================== */

  const handleTreatmentChange = (e) => {
    const { name, value } = e.target;

    setTreatmentParameters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     AI RECOMMENDATION DEMO

     Later this function will call your ML backend.
  ===================================================== */

  const generateAIRecommendation = () => {
    if (!selectedPatient) {
      return;
    }

    /*
      Do NOT change the patient's pain score here.

      We only READ it.
    */

    const pain = Number(selectedPatient.painScore);

    let recommendation;

    if (pain >= 7) {
      recommendation = {
        carrierFrequency: "4000",
        beatFrequency: "80",
        intensity: "15",
        duration: "15",
      };
    } else if (pain >= 4) {
      recommendation = {
        carrierFrequency: "4000",
        beatFrequency: "100",
        intensity: "12",
        duration: "15",
      };
    } else {
      recommendation = {
        carrierFrequency: "4000",
        beatFrequency: "120",
        intensity: "10",
        duration: "10",
      };
    }

    setAiRecommendation(recommendation);
  };

  /* =====================================================
     APPLY AI RECOMMENDATION
  ===================================================== */

  const applyAIRecommendation = () => {
    if (!aiRecommendation) {
      return;
    }

    setTreatmentParameters((previous) => ({
      ...previous,

      carrierFrequency:
        aiRecommendation.carrierFrequency,

      beatFrequency:
        aiRecommendation.beatFrequency,

      intensity:
        aiRecommendation.intensity,

      duration:
        aiRecommendation.duration,
    }));

    setRecommendationMode("ai");
  };

  /* =====================================================
     SEND TO MACHINE
  ===================================================== */

  const sendToMachine = () => {
    if (
      !treatmentParameters.carrierFrequency ||
      !treatmentParameters.beatFrequency ||
      !treatmentParameters.intensity ||
      !treatmentParameters.duration
    ) {
      alert(
        "Please enter all treatment parameters first."
      );

      return;
    }

    setMachineSent(true);

    alert(
      "Treatment parameters are ready to be sent to the IFT machine.\n\nESP32/backend integration will be connected later."
    );
  };

  /* =====================================================
     START SESSION
  ===================================================== */

  const startSession = () => {
    if (!machineSent) {
      alert(
        "Please click 'Send to Machine' before starting the session."
      );

      return;
    }

    if (
      !treatmentParameters.carrierFrequency ||
      !treatmentParameters.beatFrequency ||
      !treatmentParameters.intensity ||
      !treatmentParameters.duration
    ) {
      alert(
        "Please enter all treatment parameters."
      );

      return;
    }

    setShowSafetyWarning(true);
  };

  /* =====================================================
     CONFIRM SAFETY
  ===================================================== */

  const confirmSafetyAndStart = () => {
    setShowSafetyWarning(false);

    setSessionSeconds(0);

    setSessionStatus("running");
  };

  /* =====================================================
     PAUSE
  ===================================================== */

  const pauseSession = () => {
    setSessionStatus("paused");
  };

  /* =====================================================
     CONTINUE
  ===================================================== */

  const continueSession = () => {
    setSessionStatus("running");
  };

  /* =====================================================
     STOP
  ===================================================== */

  const stopSession = () => {
    setSessionStatus("stopped");
  };

  /* =====================================================
     SAVE COMPLETED SESSION

     IMPORTANT:
     This APPENDS a new session.

     It NEVER replaces previous sessions.
  ===================================================== */

  const saveSession = () => {
    if (!selectedPatient) {
      return;
    }

    if (afterPainScore === "") {
      alert(
        "Please enter the patient's after-treatment pain score."
      );

      return;
    }

    const newSession = {
      id: `S${String(sessionHistory.length + 1).padStart(
        3,
        "0"
      )}`,

      username,

      patientId: selectedPatient.id,

      patientName: selectedPatient.name,

      date: new Date().toLocaleString(),

      beforePainScore:
        selectedPatient.painScore,

      afterPainScore,

      carrierFrequency:
        treatmentParameters.carrierFrequency,

      beatFrequency:
        treatmentParameters.beatFrequency,

      intensity:
        treatmentParameters.intensity,

      duration:
        treatmentParameters.duration,

      notes:
        treatmentParameters.notes,

      recommendationMode,

      status: sessionStatus,

      sessionTime:
        formatTime(sessionSeconds),
    };

    /* ================================================
       ADD NEW SESSION TO EXISTING HISTORY
    ================================================= */

    const updatedSessions = [
      ...sessionHistory,
      newSession,
    ];

    /* ================================================
       UPDATE PATIENT'S CURRENT PAIN SCORE

       Only the patient's current pain score changes.
       Previous sessions remain untouched.
    ================================================= */

    const updatedPatients = patients.map(
      (patient) => {
        if (patient.id !== selectedPatient.id) {
          return patient;
        }

        return {
          ...patient,

          painScore: afterPainScore,
        };
      }
    );

    /* ================================================
       SAVE BOTH PATIENT + SESSION DATA
    ================================================= */

    updateCurrentUserData({
      patients: updatedPatients,

      sessions: updatedSessions,
    });

    /* Update screen state too */

    setSelectedPatient((previous) => ({
      ...previous,

      painScore: afterPainScore,
    }));

    alert(
      "Session saved successfully.\n\nThe complete session has been added to this user's history."
    );

    setPage("patients");
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {
    setLoggedIn(false);

    setUsername("");

    setSelectedPatient(null);

    setPage("dashboard");

    localStorage.removeItem(
      "smartIFT_loggedIn"
    );

    localStorage.removeItem(
      "smartIFT_username"
    );
  };

  /* =====================================================
     LOGIN PAGE
  ===================================================== */

  if (!loggedIn) {
    return (
      <div className="login-page">

        <div className="login-card">

          <div className="logo-circle">
            ⚡
          </div>

          <h1>Smart IFT</h1>

          <p className="subtitle">
            Intelligent Interferential Therapy
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              const enteredUsername =
                e.target.username.value.trim();

              if (!enteredUsername) {
                return;
              }

              /*
                Create account data if this is a new
                username.

                Existing username data is NOT deleted.
              */

              setUsersData((previous) => ({
                ...previous,

                [enteredUsername]:
                  previous[enteredUsername] || {
                    patients: [],
                    sessions: [],
                  },
              }));

              setUsername(enteredUsername);

              localStorage.setItem(
                "smartIFT_username",
                enteredUsername
              );

              localStorage.setItem(
                "smartIFT_loggedIn",
                "true"
              );

              setLoggedIn(true);

              setPage("dashboard");
            }}
          >

            <label>
              Username
            </label>

            <input
              name="username"
              type="text"
              placeholder="Enter username"
              required
            />

            <label>
              Password
            </label>

            <input
              name="password"
              type="password"
              placeholder="Enter password"
              required
            />

            <button type="submit">
              Login
            </button>

          </form>

          <p className="login-note">
            AI-powered physiotherapy management system
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     PROFILE PAGE
  ===================================================== */

  if (page === "profile") {
    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>

            <h1>
              Smart IFT
            </h1>

            <p>
              User Profile
            </p>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </header>

        <section className="welcome-section">

          <button
            className="back-button"
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>

          <h2>
            User Profile
          </h2>

          <p>
            Your Smart IFT account.
          </p>

        </section>

        <section className="patients-section">

          <div className="patient-card">

            <div className="patient-avatar">
              👤
            </div>

            <div className="patient-details">

              <div className="patient-title">

                <h3>
                  {username}
                </h3>

              </div>

              <p>
                <strong>
                  Username:
                </strong>{" "}
                {username}
              </p>

              <p>
                <strong>
                  Number of Patients:
                </strong>{" "}
                {patients.length}
              </p>

              <p>
                <strong>
                  Total Sessions:
                </strong>{" "}
                {sessionHistory.length}
              </p>

              <p>
                <strong>
                  Previous Session Pain Score:
                </strong>{" "}

                {sessionHistory.length > 0
                  ? `${sessionHistory[sessionHistory.length - 1].afterPainScore}/10`
                  : "No sessions yet"}
              </p>

            </div>

          </div>

        </section>

      </div>
    );
  }

  /* =====================================================
     TREATMENT PAGE
  ===================================================== */

  if (
    page === "treatment" &&
    selectedPatient
  ) {
    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>

            <h1>
              Smart IFT
            </h1>

            <p>
              Treatment Session
            </p>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </header>

        <section className="welcome-section">

          <button
            className="back-button"
            onClick={() =>
              setPage("patients")
            }
          >
            ← Back to Patients
          </button>

          <h2>
            Treatment Session
          </h2>

          <p>
            Configure treatment for{" "}
            <strong>
              {selectedPatient.name}
            </strong>
          </p>

        </section>

        {/* PATIENT INFORMATION */}

        <section className="patients-section">

          <div className="section-header">

            <div>

              <h2>
                Patient Information
              </h2>

              <p>
                Patient details are stored under the
                logged-in username.
              </p>

            </div>

          </div>

          <div className="patient-card">

            <div className="patient-avatar">
              👤
            </div>

            <div className="patient-details">

              <div className="patient-title">

                <h3>
                  {selectedPatient.name}
                </h3>

                <span className="patient-id">
                  {selectedPatient.id}
                </span>

              </div>

              <div className="patient-info">

                <span>
                  Age: {selectedPatient.age}
                </span>

                <span>
                  Gender: {selectedPatient.gender}
                </span>

                <span>
                  Phone: {selectedPatient.phone}
                </span>

              </div>

              <p>
                <strong>
                  Diagnosis:
                </strong>{" "}
                {selectedPatient.diagnosis}
              </p>

              <p>
                <strong>
                  Current Pain Score:
                </strong>{" "}
                {selectedPatient.painScore}/10
              </p>

            </div>

          </div>

        </section>

        {/* AI */}

        <section className="form-section">

          <div className="form-title">

            <div>

              <h2>
                🤖 AI Treatment Recommendation
              </h2>

              <p>
                Generate treatment parameters using
                the ML model.
              </p>

            </div>

            <div className="form-icon">
              🤖
            </div>

          </div>

          <button
            className="primary-button"
            onClick={
              generateAIRecommendation
            }
          >
            Generate AI Recommendation
          </button>

          {aiRecommendation && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "10px",
                border:
                  "1px solid #dbe3ef",
              }}
            >

              <h3>
                AI Suggested Parameters
              </h3>

              <p>
                Carrier Frequency:{" "}
                <strong>
                  {
                    aiRecommendation.carrierFrequency
                  }{" "}
                  Hz
                </strong>
              </p>

              <p>
                Beat Frequency:{" "}
                <strong>
                  {
                    aiRecommendation.beatFrequency
                  }{" "}
                  Hz
                </strong>
              </p>

              <p>
                Intensity:{" "}
                <strong>
                  {
                    aiRecommendation.intensity
                  }{" "}
                  mA
                </strong>
              </p>

              <p>
                Duration:{" "}
                <strong>
                  {
                    aiRecommendation.duration
                  }{" "}
                  minutes
                </strong>
              </p>

              <button
                className="primary-button"
                onClick={
                  applyAIRecommendation
                }
              >
                Use AI Recommendation
              </button>

            </div>
          )}

        </section>

        {/* TREATMENT PARAMETERS */}

        <section className="form-section">

          <div className="form-title">

            <div>

              <h2>
                Treatment Parameters
              </h2>

              <p>
                Enter manually or use the AI recommendation.
              </p>

            </div>

            <div className="form-icon">
              ⚡
            </div>

          </div>

          <div className="patient-form">

            <div className="form-group">

              <label>
                Carrier Frequency (Hz)
              </label>

              <input
                type="number"
                name="carrierFrequency"
                value={
                  treatmentParameters.carrierFrequency
                }
                onChange={
                  handleTreatmentChange
                }
                placeholder="Example: 4000"
                min="1"
              />

            </div>

            <div className="form-group">

              <label>
                Beat Frequency (Hz)
              </label>

              <input
                type="number"
                name="beatFrequency"
                value={
                  treatmentParameters.beatFrequency
                }
                onChange={
                  handleTreatmentChange
                }
                placeholder="Example: 100"
                min="1"
              />

            </div>

            <div className="form-group">

              <label>
                Current / Intensity (mA)
              </label>

              <input
                type="number"
                name="intensity"
                value={
                  treatmentParameters.intensity
                }
                onChange={
                  handleTreatmentChange
                }
                placeholder="Enter intensity"
                min="0"
                step="0.1"
              />

            </div>

            <div className="form-group">

              <label>
                Treatment Duration (minutes)
              </label>

              <input
                type="number"
                name="duration"
                value={
                  treatmentParameters.duration
                }
                onChange={
                  handleTreatmentChange
                }
                placeholder="Example: 15"
                min="1"
              />

            </div>

            <div className="form-group full-width">

              <label>
                Therapist Notes
              </label>

              <textarea
                name="notes"
                value={
                  treatmentParameters.notes
                }
                onChange={
                  handleTreatmentChange
                }
                placeholder="Enter treatment observations..."
                rows="4"
              />

            </div>

          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f8fafc",
              borderRadius: "10px",
            }}
          >

            <strong>
              Parameter Source:
            </strong>{" "}

            {recommendationMode === "ai"
              ? "AI Recommendation"
              : "Manual Entry"}

          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >

            <button
              className="primary-button"
              onClick={sendToMachine}
            >
              ⚡ Send to Machine
            </button>

            {machineSent && (
              <span
                style={{
                  fontWeight: "600",
                  color: "#16a34a",
                }}
              >
                ✓ Parameters ready for ESP32
              </span>
            )}

          </div>

        </section>

        {/* SESSION CONTROL */}

        <section className="patients-section">

          <div className="section-header">

            <div>

              <h2>
                Session Control
              </h2>

              <p>
                Control the treatment session.
              </p>

            </div>

          </div>

          <div
            style={{
              textAlign: "center",
              padding: "20px",
            }}
          >

            <h2>

              {sessionStatus === "running"
                ? "🟢 Session Running"
                : sessionStatus === "paused"
                ? "🟡 Session Paused"
                : sessionStatus === "completed"
                ? "✅ Session Completed"
                : sessionStatus === "stopped"
                ? "🔴 Session Stopped"
                : "⚪ Session Not Started"}

            </h2>

            <h1>
              {formatTime(sessionSeconds)}
            </h1>

            {sessionStatus ===
              "not-started" && (
              <button
                className="primary-button"
                onClick={startSession}
              >
                ▶ Start Session
              </button>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "20px",
              }}
            >

              <button
                className="secondary-button"
                onClick={pauseSession}
                disabled={
                  sessionStatus !==
                  "running"
                }
              >
                ⏸ Pause
              </button>

              <button
                className="primary-button"
                onClick={continueSession}
                disabled={
                  sessionStatus !==
                  "paused"
                }
              >
                ▶ Continue
              </button>

              <button
                className="logout-button"
                onClick={stopSession}
                disabled={
                  sessionStatus !==
                    "running" &&
                  sessionStatus !==
                    "paused"
                }
              >
                ⏹ Stop
              </button>

            </div>

          </div>

        </section>

        {/* AFTER TREATMENT */}

        {(sessionStatus === "completed" ||
          sessionStatus === "stopped") && (

          <section className="form-section">

            <div className="form-title">

              <div>

                <h2>
                  After Treatment Assessment
                </h2>

                <p>
                  Ask the patient for their pain
                  score after treatment.
                </p>

              </div>

              <div className="form-icon">
                📊
              </div>

            </div>

            <div className="form-group">

              <label>
                After Treatment Pain Score (0–10)
              </label>

              <input
                type="number"
                value={afterPainScore}
                onChange={(e) =>
                  setAfterPainScore(
                    e.target.value
                  )
                }
                placeholder="Enter score given by patient"
                min="0"
                max="10"
              />

            </div>

            <div className="form-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setPage("patients")
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={saveSession}
              >
                💾 Save Session
              </button>

            </div>

          </section>

        )}

        {/* SAFETY POPUP */}

        {showSafetyWarning && (

          <div
            style={{
              position: "fixed",
              inset: "0",
              background:
                "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: "9999",
            }}
          >

            <div
              style={{
                background: "white",
                width: "100%",
                maxWidth: "650px",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "16px",
                padding: "30px",
                boxShadow:
                  "0 15px 50px rgba(0,0,0,0.25)",
              }}
            >

              <h2>
                ⚠️ Safety Screening
              </h2>

              <p>
                <strong>
                  Consult a qualified clinician before
                  starting treatment.
                </strong>
              </p>

              <p>
                Confirm that none of the following apply:
              </p>

              <ul
                style={{
                  lineHeight: "1.8",
                }}
              >

                <li>
                  No pacemaker/ICD or other implanted
                  electronic device
                </li>

                <li>
                  Not pregnant, or treatment location
                  has been medically cleared
                </li>

                <li>
                  No cancer/tumor at the treatment area
                </li>

                <li>
                  No open wound, infection, or severe
                  skin irritation at electrode sites
                </li>

                <li>
                  Normal sensation at the treatment area
                </li>

                <li>
                  No unexplained bleeding
                </li>

                <li>
                  Treatment area has been medically/
                  clinically cleared after recent
                  surgery or injury
                </li>

                <li>
                  Electrodes will not be placed across
                  the chest or front of the neck
                </li>

              </ul>

              <div
                style={{
                  padding: "15px",
                  background: "#fff7ed",
                  borderRadius: "10px",
                  marginBottom: "20px",
                }}
              >

                <strong>
                  If any answer is YES → do not start
                  automatically; refer to a qualified
                  physiotherapist/doctor for assessment.
                </strong>

              </div>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                This application provides safety
                screening support and does not determine
                whether a patient is medically fit for
                IFT treatment.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowSafetyWarning(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={
                    confirmSafetyAndStart
                  }
                >
                  ✓ Safety Checked — Start Session
                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    );
  }

  /* =====================================================
     SESSION HISTORY
  ===================================================== */

  if (page === "history") {
    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>

            <h1>
              Smart IFT
            </h1>

            <p>
              Session History
            </p>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </header>

        <section className="welcome-section">

          <button
            className="back-button"
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>

          <h2>
            Complete Session History
          </h2>

          <p>
            All sessions saved under username{" "}
            <strong>
              {username}
            </strong>
          </p>

        </section>

        <section className="patients-section">

          {sessionHistory.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📊
              </div>

              <h3>
                No Sessions Yet
              </h3>

              <p>
                Completed sessions will appear here.
              </p>

            </div>

          ) : (

            <div className="patient-list">

              {sessionHistory.map(
                (session) => (

                  <div
                    className="patient-card"
                    key={session.id}
                  >

                    <div className="patient-avatar">
                      📊
                    </div>

                    <div className="patient-details">

                      <div className="patient-title">

                        <h3>
                          {session.patientName}
                        </h3>

                        <span className="patient-id">
                          {session.id}
                        </span>

                      </div>

                      <p>
                        <strong>
                          Date:
                        </strong>{" "}
                        {session.date}
                      </p>

                      <p>
                        <strong>
                          Before Treatment:
                        </strong>{" "}
                        {session.beforePainScore}/10
                      </p>

                      <p>
                        <strong>
                          After Treatment:
                        </strong>{" "}
                        {session.afterPainScore}/10
                      </p>

                      <p>
                        <strong>
                          Carrier Frequency:
                        </strong>{" "}
                        {session.carrierFrequency} Hz
                      </p>

                      <p>
                        <strong>
                          Beat Frequency:
                        </strong>{" "}
                        {session.beatFrequency} Hz
                      </p>

                      <p>
                        <strong>
                          Intensity:
                        </strong>{" "}
                        {session.intensity} mA
                      </p>

                      <p>
                        <strong>
                          Duration:
                        </strong>{" "}
                        {session.duration} minutes
                      </p>

                      <p>
                        <strong>
                          Source:
                        </strong>{" "}
                        {session.recommendationMode ===
                        "ai"
                          ? "AI Recommendation"
                          : "Manual Entry"}
                      </p>

                      <p>
                        <strong>
                          Session Status:
                        </strong>{" "}
                        {session.status}
                      </p>

                      {session.notes && (
                        <p>
                          <strong>
                            Notes:
                          </strong>{" "}
                          {session.notes}
                        </p>
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>
    );
  }

  /* =====================================================
     PATIENTS
  ===================================================== */

  if (page === "patients") {
    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>

            <h1>
              Smart IFT
            </h1>

            <p>
              Patients
            </p>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </header>

        <section className="welcome-section">

          <button
            className="back-button"
            onClick={() =>
              setPage("dashboard")
            }
          >
            ← Back to Dashboard
          </button>

          <h2>
            Patients
          </h2>

          <p>
            Manage your patients and their treatment
            sessions.
          </p>

        </section>

        <section className="patients-section">

          <div className="section-header">

            <div>

              <h2>
                Patient List
              </h2>

              <p>
                {patients.length} patient
                {patients.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                setPage("add-patient")
              }
            >
              + Add Patient
            </button>

          </div>

          {patients.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                👤
              </div>

              <h3>
                No Patients Yet
              </h3>

              <p>
                Add your first patient.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setPage("add-patient")
                }
              >
                + Add Patient
              </button>

            </div>

          ) : (

            <div className="patient-list">

              {patients.map(
                (patient) => (

                  <div
                    className="patient-card"
                    key={patient.id}
                    onClick={() =>
                      openTreatment(patient)
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div className="patient-avatar">
                      👤
                    </div>

                    <div className="patient-details">

                      <div className="patient-title">

                        <h3>
                          {patient.name}
                        </h3>

                        <span className="patient-id">
                          {patient.id}
                        </span>

                      </div>

                      <div className="patient-info">

                        <span>
                          Age: {patient.age}
                        </span>

                        <span>
                          Gender: {patient.gender}
                        </span>

                        <span>
                          Phone: {patient.phone}
                        </span>

                      </div>

                      <p>
                        <strong>
                          Diagnosis:
                        </strong>{" "}
                        {patient.diagnosis}
                      </p>

                      <p>
                        <strong>
                          Current Pain Score:
                        </strong>{" "}
                        {patient.painScore}/10
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>
    );
  }

  /* =====================================================
     ADD PATIENT
  ===================================================== */

  if (page === "add-patient") {
    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>

            <h1>
              Smart IFT
            </h1>

            <p>
              Add Patient
            </p>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </header>

        <section className="welcome-section">

          <button
            className="back-button"
            onClick={() =>
              setPage("patients")
            }
          >
            ← Back to Patients
          </button>

          <h2>
            Add New Patient
          </h2>

          <p>
            Enter the patient's details.
          </p>

        </section>

        <section className="form-section">

          <div className="form-title">

            <div>

              <h2>
                Patient Information
              </h2>

              <p>
                All information will be saved under
                username: <strong>{username}</strong>
              </p>

            </div>

            <div className="form-icon">
              👤
            </div>

          </div>

          <form
            className="patient-form"
            onSubmit={addPatient}
          >

            <div className="form-group">

              <label>
                Patient Name
              </label>

              <input
                type="text"
                name="name"
                value={patientForm.name}
                onChange={
                  handlePatientChange
                }
                placeholder="Enter patient name"
                required
              />

            </div>

            <div className="form-group">

              <label>
                Age
              </label>

              <input
                type="number"
                name="age"
                value={patientForm.age}
                onChange={
                  handlePatientChange
                }
                placeholder="Enter age"
                required
              />

            </div>

            <div className="form-group">

              <label>
                Gender
              </label>

              <select
                name="gender"
                value={
                  patientForm.gender
                }
                onChange={
                  handlePatientChange
                }
                required
              >

                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={
                  patientForm.phone
                }
                onChange={
                  handlePatientChange
                }
                placeholder="Enter phone number"
                required
              />

            </div>

            <div className="form-group">

              <label>
                Diagnosis
              </label>

              <input
                type="text"
                name="diagnosis"
                value={
                  patientForm.diagnosis
                }
                onChange={
                  handlePatientChange
                }
                placeholder="Enter diagnosis"
                required
              />

            </div>

            <div className="form-group">

              <label>
                Current Pain Score (0–10)
              </label>

              <input
                type="number"
                name="painScore"
                value={
                  patientForm.painScore
                }
                onChange={
                  handlePatientChange
                }
                placeholder="Enter score"
                min="0"
                max="10"
                required
              />

            </div>

            <div className="form-group full-width">

              <label>
                Notes
              </label>

              <textarea
                name="notes"
                value={
                  patientForm.notes
                }
                onChange={
                  handlePatientChange
                }
                placeholder="Additional notes..."
                rows="4"
              />

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setPage("patients")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                Save Patient
              </button>

            </div>

          </form>

        </section>

      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="dashboard">

      <header className="dashboard-header">

        <div>

          <h1>
            Smart IFT
          </h1>

          <p>
            Intelligent Interferential Therapy
          </p>

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >

          <button
            className="secondary-button"
            onClick={() =>
              setPage("profile")
            }
          >
            👤 {username}
          </button>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      <section className="welcome-section">

        <h2>
          Smart IFT Dashboard
        </h2>

        <p>
          Welcome,{" "}
          <strong>
            {username}
          </strong>
          . Manage your patients and treatment sessions.
        </p>

      </section>

      <section className="dashboard-grid">

        <div className="dashboard-card">

          <div className="card-icon">
            👤
          </div>

          <h3>
            Patients
          </h3>

          <p>
            Manage patient information and treatment records.
          </p>

          <button
            onClick={() =>
              setPage("patients")
            }
          >
            View Patients
          </button>

        </div>

        <div className="dashboard-card">

          <div className="card-icon">
            ⚡
          </div>

          <h3>
            New Treatment
          </h3>

          <p>
            Select a patient and start a new treatment.
          </p>

          <button
            onClick={() =>
              setPage("patients")
            }
          >
            Start Treatment
          </button>

        </div>

        <div className="dashboard-card">

          <div className="card-icon">
            📊
          </div>

          <h3>
            Session History
          </h3>

          <p>
            View every previous treatment session.
          </p>

          <button
            onClick={() =>
              setPage("history")
            }
          >
            View History
          </button>

        </div>

        <div className="dashboard-card">

          <div className="card-icon">
            🤖
          </div>

          <h3>
            AI Recommendation
          </h3>

          <p>
            Generate intelligent treatment recommendations.
          </p>

          <button
            onClick={() =>
              setPage("patients")
            }
          >
            Open AI Assistant
          </button>

        </div>

      </section>

      <section className="quick-info">

        <h2>
          System Overview
        </h2>

        <div className="info-grid">

          <div>

            <strong>
              {patients.length}
            </strong>

            <span>
              Active Patients
            </span>

          </div>

          <div>

            <strong>
              {sessionHistory.length}
            </strong>

            <span>
              Total Sessions
            </span>

          </div>

          <div>

            <strong>
              {
                sessionHistory.filter(
                  (session) =>
                    session.status ===
                    "completed"
                ).length
              }
            </strong>

            <span>
              Completed Sessions
            </span>

          </div>

          <div>

            <strong>
              AI
            </strong>

            <span>
              Recommendation Engine
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}

export default App;