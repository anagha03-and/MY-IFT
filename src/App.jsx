import { useEffect, useState } from "react";
import "./App.css";
import {
  createPatient,
  getPatients,
  createSession,
  getSessions,
} from "./api";
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
     LOGIN
  ===================================================== */

  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("smartIFT_loggedIn") === "true";
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem("smartIFT_username") || "";
  });

  const [page, setPage] = useState("dashboard");

  const [showUserMenu, setShowUserMenu] = useState(false);

  /* =====================================================
     USERS DATA
  ===================================================== */

  const [usersData, setUsersData] = useState(() => {
    try {
      const saved = localStorage.getItem("smartIFT_users");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentUserData = usersData[username] || {
    patients: [],
    sessions: [],
  };

  const patients = currentUserData.patients || [];
  const sessionHistory = currentUserData.sessions || [];

  /* =====================================================
     SELECTED PATIENT
  ===================================================== */

  const [selectedPatient, setSelectedPatient] = useState(null);

  /* =====================================================
     PATIENT FORM
  ===================================================== */

  const [patientForm, setPatientForm] =
    useState(EMPTY_PATIENT_FORM);

  /* =====================================================
     TREATMENT
  ===================================================== */

  const [treatmentParameters, setTreatmentParameters] =
    useState(EMPTY_PARAMETERS);

  const [aiRecommendation, setAiRecommendation] =
    useState(null);

  const [recommendationMode, setRecommendationMode] =
    useState("manual");

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
     POPUPS
  ===================================================== */

  const [showSafetyWarning, setShowSafetyWarning] =
    useState(false);

  const [showAfterTreatmentPopup, setShowAfterTreatmentPopup] =
    useState(false);

  /* =====================================================
     SAVE USERS DATA
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
      localStorage.setItem("smartIFT_loggedIn", "true");
      localStorage.setItem("smartIFT_username", username);
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
     AUTOMATIC COMPLETION
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
        setShowAfterTreatmentPopup(true);
      }
    }
  }, [
    sessionSeconds,
    sessionStatus,
    treatmentParameters.duration,
  ]);
  
/* =====================================================
   LOAD PATIENT SESSIONS FROM BACKEND
===================================================== */

useEffect(() => {
  const loadPatientSessions = async () => {
    if (!selectedPatient?.id) {
      return;
    }

    try {
      const backendSessions = await getSessions(
        selectedPatient.id
      );

      console.log(
        "Sessions loaded from backend:",
        backendSessions
      );

      const formattedSessions =
        backendSessions.map((session, index) => ({
          id: `S${String(session.id).padStart(3, "0")}`,

          sessionNumber: index + 1,

          username,

          patientId: session.patient_id,

          patientName: selectedPatient.name,

          date: session.date,

          beforePainScore: session.pain_before,

          afterPainScore: session.pain_after,

          carrierFrequency:
            session.carrier_frequency,

          beatFrequency:
            session.beat_frequency,

          intensity: session.intensity,

          duration: session.duration,

          notes: session.notes || "",

          recommendationMode: "Backend",

          status: "completed",

          sessionTime: "",
        }));

      /*
       * Keep sessions belonging to other patients.
       * Replace only this patient's sessions.
       */

      const otherPatientSessions =
        sessionHistory.filter(
          (session) =>
            session.patientId !== selectedPatient.id
        );

      updateCurrentUserData({
        sessions: [
          ...otherPatientSessions,
          ...formattedSessions,
        ],
      });

      console.log(
        "Sessions updated in frontend:",
        formattedSessions
      );

    } catch (error) {
      console.error(
        "Could not load sessions:",
        error
      );
    }
  };

  loadPatientSessions();

}, [selectedPatient?.id]);
```



  /* =====================================================
     YOUR NEXT EXISTING CODE
  ===================================================== */
    /* =====================================================
     LOAD PATIENTS FROM BACKEND
  ===================================================== */

  ```js
/* =====================================================
   LOAD PATIENTS FROM BACKEND
===================================================== */

useEffect(() => {
  const loadPatients = async () => {
    if (!loggedIn || !username) {
      return;
    }

    try {
      const backendPatients = await getPatients();

      console.log(
        "Patients loaded from backend:",
        backendPatients
      );

      const formattedPatients = backendPatients.map(
        (patient) => {
          const existingPatient = patients.find(
            (p) => p.id === patient.patient_id
          );

          return {
            id: patient.patient_id,
            username: username,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,

            // Keep existing frontend information
            phone:
              existingPatient?.phone || "",
            diagnosis:
              existingPatient?.diagnosis || "",
            painScore:
              existingPatient?.painScore ?? "",
            notes:
              existingPatient?.notes || "",
          };
        }
      );

      updateCurrentUserData({
        patients: formattedPatients,
      });

    } catch (error) {
      console.error(
        "Error loading patients from backend:",
        error
      );
    }
  };

  loadPatients();
}, [loggedIn, username]);

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
     UPDATE USER DATA
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
     PATIENT FORM
  ===================================================== */

  const handlePatientChange = (e) => {
    const { name, value } = e.target;

    setPatientForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
    const addPatient = async (e) => {
  e.preventDefault();

  if (!username) {
    alert("Please login first.");
    return;
  }

  try {
    const newPatient = {
      patient_id: `P${String(patients.length + 1).padStart(3, "0")}`,
      name: patientForm.name,
      age: Number(patientForm.age),
      gender: patientForm.gender,
      phone: patientForm.phone,
      diagnosis: patientForm.diagnosis,
      pain_score:
        patientForm.painScore === ""
          ? null
          : Number(patientForm.painScore),
      notes: patientForm.notes,
    };

    // Send patient to FastAPI backend
    const savedPatient = await createPatient(newPatient);

    console.log(
      "Patient saved to backend:",
      savedPatient
    );

    // Keep frontend state updated
    const frontendPatient = {
      id: savedPatient.patient_id,
      username,
      name: savedPatient.name,
      age: savedPatient.age,
      gender: savedPatient.gender,
      phone: savedPatient.phone,
      diagnosis: savedPatient.diagnosis,
      painScore: savedPatient.pain_score,
      notes: savedPatient.notes,
      createdAt: new Date().toLocaleString(),
    };

    updateCurrentUserData({
      patients: [...patients, frontendPatient],
    });

    setPatientForm(EMPTY_PATIENT_FORM);

    setPage("patients");

    alert("Patient added successfully!");

  } catch (error) {
    console.error(
      "Error creating patient:",
      error
    );

    alert(
      `Could not save patient: ${error.message}`
    );
  }
};

  /* =====================================================
     OPEN TREATMENT
  ===================================================== */

  const openTreatment = (patient) => {
    setSelectedPatient(patient);

    setTreatmentParameters({
      ...EMPTY_PARAMETERS,
    });

    setAiRecommendation(null);
    setRecommendationMode("manual");
    setMachineSent(false);
    setSessionStatus("not-started");
    setSessionSeconds(0);
    setAfterPainScore("");
    setShowAfterTreatmentPopup(false);

    setPage("treatment");
  };

  /* =====================================================
     TREATMENT CHANGE
  ===================================================== */

  const handleTreatmentChange = (e) => {
    const { name, value } = e.target;

    setTreatmentParameters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     AI RECOMMENDATION
  ===================================================== */

  const generateAIRecommendation = () => {
    if (!selectedPatient) return;

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
     APPLY AI
  ===================================================== */

  const applyAIRecommendation = () => {
    if (!aiRecommendation) return;

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
      alert("Please enter all treatment parameters first.");
      return;
    }

    setMachineSent(true);

    alert(
      "Treatment parameters are ready to be sent to the IFT machine.\n\nESP32/backend integration can be connected later."
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
      alert("Please enter all treatment parameters.");
      return;
    }

    setShowSafetyWarning(true);
  };

  /* =====================================================
     SAFETY CONFIRM
  ===================================================== */

  const confirmSafetyAndStart = () => {
    setShowSafetyWarning(false);
    setSessionSeconds(0);
    setAfterPainScore("");
    setShowAfterTreatmentPopup(false);
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
    setShowAfterTreatmentPopup(true);
  };
/* =====================================================
   ADD PATIENT
===================================================== */

const addPatient = async (e) => {
  e.preventDefault();

  if (!username) {
    alert("Please login first.");
    return;
  }

  try {
    const newPatient = {
      patient_id: `P${Date.now()}`,
      name: patientForm.name,
      age: Number(patientForm.age),
      gender: patientForm.gender,
    };

    const savedPatient = await createPatient(newPatient);

    console.log("Patient saved to backend:", savedPatient);

    const frontendPatient = {
      id: savedPatient.patient_id,
      username: username,
      name: savedPatient.name,
      age: savedPatient.age,
      gender: savedPatient.gender,
      phone: patientForm.phone,
      diagnosis: patientForm.diagnosis,
      painScore: patientForm.painScore,
      notes: patientForm.notes,
      createdAt: new Date().toLocaleString(),
    };

    updateCurrentUserData({
      patients: [...patients, frontendPatient],
    });

    setPatientForm(EMPTY_PATIENT_FORM);
    setPage("patients");

    alert("Patient added successfully!");

  } catch (error) {
    console.error("Error creating patient:", error);
    alert(`Could not save patient: ${error.message}`);
  }
};
  /* =====================================================
     SAVE SESSION
  ===================================================== */

  const saveSession = async () => {
    if (!selectedPatient) return;

    if (afterPainScore === "") {
      alert(
        "Please enter the patient's after-treatment pain score."
      );
      return;
    }

    const patientSessions = sessionHistory.filter(
      (session) =>
        session.patientId === selectedPatient.id
    );

    const sessionNumber = patientSessions.length + 1;
    const backendSession = {
  patient_id: selectedPatient.id,

  condition:
    selectedPatient.diagnosis || "",

  severity: "",

  pain_before:
    selectedPatient.painScore === ""
      ? null
      : Number(selectedPatient.painScore),

  pain_after:
    afterPainScore === ""
      ? null
      : Number(afterPainScore),

  carrier_frequency:
    treatmentParameters.carrierFrequency === ""
      ? null
      : Number(treatmentParameters.carrierFrequency),

  beat_frequency:
    treatmentParameters.beatFrequency === ""
      ? null
      : Number(treatmentParameters.beatFrequency),

  intensity:
    treatmentParameters.intensity === ""
      ? null
      : Number(treatmentParameters.intensity),

  duration:
    treatmentParameters.duration === ""
      ? null
      : Number(treatmentParameters.duration),

  notes:
    treatmentParameters.notes || "",

  report_filename: null,

  report_path: null,
};

const savedBackendSession =
  await createSession(backendSession);

console.log(
  "Session saved to backend:",
  savedBackendSession
);
    const newSession = {
      id: `S${String(sessionHistory.length + 1).padStart(
        3,
        "0"
      )}`,

      sessionNumber,

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

    const updatedSessions = [
      ...sessionHistory,
      newSession,
    ];

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

    updateCurrentUserData({
      patients: updatedPatients,
      sessions: updatedSessions,
    });

    setSelectedPatient((previous) => ({
      ...previous,
      painScore: afterPainScore,
    }));

    setShowAfterTreatmentPopup(false);
    setAfterPainScore("");

    alert(
      `Session ${sessionNumber} saved successfully.`
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
    setShowUserMenu(false);

    localStorage.removeItem("smartIFT_loggedIn");
    localStorage.removeItem("smartIFT_username");
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

          <h1>MY IFT</h1>

          <p className="subtitle">
            Intelligent Interferential Therapy
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              const enteredUsername =
                e.target.username.value.trim();

              if (!enteredUsername) return;

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

            <label>Username</label>

            <input
              name="username"
              type="text"
              placeholder="Enter username"
              required
            />

            <label>Password</label>

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
     PROFILE
  ===================================================== */

  if (page === "profile") {
    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>
            <h1>MY IFT</h1>
            <p>User Profile</p>
          </div>

          <div
            style={{
              position: "relative",
            }}
          >
            <button
              className="secondary-button"
              onClick={() =>
                setShowUserMenu(
                  (previous) => !previous
                )
              }
            >
              👤 {username} ▾
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px",
                  minWidth: "180px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >

                <button
                  className="secondary-button"
                  style={{
                    width: "100%",
                    marginBottom: "6px",
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setPage("profile");
                  }}
                >
                  👤 Profile
                </button>

                <button
                  className="logout-button"
                  style={{
                    width: "100%",
                  }}
                  onClick={logout}
                >
                  🚪 Logout
                </button>

              </div>
            )}
          </div>

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

          <h2>User Profile</h2>

          <p>
            Your MY IFT account.
          </p>

        </section>

        <section className="patients-section">

          <div className="patient-card">

            <div className="patient-avatar">
              👤
            </div>

            <div className="patient-details">

              <h3>{username}</h3>

              <p>
                <strong>Username:</strong>{" "}
                {username}
              </p>

              <p>
                <strong>Number of Patients:</strong>{" "}
                {patients.length}
              </p>

              <p>
                <strong>Total Sessions:</strong>{" "}
                {sessionHistory.length}
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
            <h1>MY IFT</h1>
            <p>Treatment Session</p>
          </div>

          <div
            style={{
              position: "relative",
            }}
          >

            <button
              className="secondary-button"
              onClick={() =>
                setShowUserMenu(
                  (previous) => !previous
                )
              }
            >
              👤 {username} ▾
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px",
                  minWidth: "180px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >

                <button
                  className="secondary-button"
                  style={{
                    width: "100%",
                    marginBottom: "6px",
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setPage("profile");
                  }}
                >
                  👤 Profile
                </button>

                <button
                  className="logout-button"
                  style={{
                    width: "100%",
                  }}
                  onClick={logout}
                >
                  🚪 Logout
                </button>

              </div>
            )}

          </div>

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

          <h2>Treatment Session</h2>

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
              <h2>Patient Information</h2>

              <p>
                Patient details for this treatment.
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
                <strong>Diagnosis:</strong>{" "}
                {selectedPatient.diagnosis}
              </p>

              <p>
                <strong>Current Pain Score:</strong>{" "}
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
                the recommendation engine.
              </p>
            </div>

            <div className="form-icon">
              🤖
            </div>

          </div>

          <button
            className="primary-button"
            onClick={generateAIRecommendation}
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
                border: "1px solid #dbe3ef",
              }}
            >

              <h3>
                AI Suggested Parameters
              </h3>

              <p>
                Carrier Frequency:{" "}
                <strong>
                  {aiRecommendation.carrierFrequency} Hz
                </strong>
              </p>

              <p>
                Beat Frequency:{" "}
                <strong>
                  {aiRecommendation.beatFrequency} Hz
                </strong>
              </p>

              <p>
                Intensity:{" "}
                <strong>
                  {aiRecommendation.intensity} mA
                </strong>
              </p>

              <p>
                Duration:{" "}
                <strong>
                  {aiRecommendation.duration} minutes
                </strong>
              </p>

              <button
                className="primary-button"
                onClick={applyAIRecommendation}
              >
                Use AI Recommendation
              </button>

            </div>
          )}

        </section>

        {/* PARAMETERS */}

        <section className="form-section">

          <div className="form-title">

            <div>
              <h2>Treatment Parameters</h2>

              <p>
                Enter manually or use AI recommendation.
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
                onChange={handleTreatmentChange}
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
                onChange={handleTreatmentChange}
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
                onChange={handleTreatmentChange}
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
                onChange={handleTreatmentChange}
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
                onChange={handleTreatmentChange}
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
              <h2>Session Control</h2>

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

            {sessionStatus === "not-started" && (
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
                  sessionStatus !== "running"
                }
              >
                ⏸ Pause
              </button>

              <button
                className="primary-button"
                onClick={continueSession}
                disabled={
                  sessionStatus !== "paused"
                }
              >
                ▶ Continue
              </button>

              <button
                className="logout-button"
                onClick={stopSession}
                disabled={
                  sessionStatus !== "running" &&
                  sessionStatus !== "paused"
                }
              >
                ⏹ Stop
              </button>

            </div>

          </div>

        </section>

        {/* =================================================
            AFTER TREATMENT POPUP
        ================================================= */}

        {showAfterTreatmentPopup && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 10000,
            }}
          >

            <div
              style={{
                width: "100%",
                maxWidth: "520px",
                background: "#ffffff",
                borderRadius: "20px",
                padding: "30px",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >

              <div
                style={{
                  textAlign: "center",
                  fontSize: "48px",
                  marginBottom: "10px",
                }}
              >
                📊
              </div>

              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "8px",
                }}
              >
                After Treatment Assessment
              </h2>

              <p
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  marginBottom: "25px",
                }}
              >
                Treatment session has ended for{" "}
                <strong>
                  {selectedPatient.name}
                </strong>
              </p>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "18px",
                  marginBottom: "20px",
                }}
              >

                <p>
                  <strong>
                    Before Treatment Pain:
                  </strong>{" "}
                  {selectedPatient.painScore}/10
                </p>

                <p>
                  <strong>
                    Session Duration:
                  </strong>{" "}
                  {formatTime(sessionSeconds)}
                </p>

                <p>
                  <strong>
                    Session Status:
                  </strong>{" "}
                  {sessionStatus}
                </p>

              </div>

              <div className="form-group">

                <label
                  style={{
                    fontWeight: "700",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  After Treatment Pain Score (0–10)
                </label>

                <input
                  type="number"
                  value={afterPainScore}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (
                      value === "" ||
                      (Number(value) >= 0 &&
                        Number(value) <= 10)
                    ) {
                      setAfterPainScore(value);
                    }
                  }}
                  placeholder="Enter patient's pain score"
                  min="0"
                  max="10"
                  step="1"
                  autoFocus
                  style={{
                    width: "100%",
                    fontSize: "20px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                />

              </div>

              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  background: "#eff6ff",
                  borderRadius: "10px",
                  color: "#1e40af",
                }}
              >
                💡 Enter the pain score reported by the
                patient immediately after treatment.
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "25px",
                  flexWrap: "wrap",
                }}
              >

                <button
                  className="secondary-button"
                  onClick={() => {
                    setShowAfterTreatmentPopup(false);
                  }}
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

            </div>
          </div>
        )}

        {/* =================================================
            SAFETY POPUP
        ================================================= */}

        {showSafetyWarning && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 9999,
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
                  physiotherapist/doctor.
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
                  onClick={confirmSafetyAndStart}
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
     HISTORY PAGE
     CONNECTED SESSION GRAPH
  ===================================================== */

  if (page === "history") {

    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>
            <h1>MY IFT</h1>
            <p>Session History</p>
          </div>

          <div
            style={{
              position: "relative",
            }}
          >

            <button
              className="secondary-button"
              onClick={() =>
                setShowUserMenu(
                  (previous) => !previous
                )
              }
            >
              👤 {username} ▾
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px",
                  minWidth: "180px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >

                <button
                  className="secondary-button"
                  style={{
                    width: "100%",
                    marginBottom: "6px",
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setPage("profile");
                  }}
                >
                  👤 Profile
                </button>

                <button
                  className="logout-button"
                  style={{
                    width: "100%",
                  }}
                  onClick={logout}
                >
                  🚪 Logout
                </button>

              </div>
            )}

          </div>

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
            All treatment sessions for{" "}
            <strong>{username}</strong>
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

            patients.map((patient) => {

              const patientSessions =
                sessionHistory
                  .filter(
                    (session) =>
                      session.patientId === patient.id
                  )
                  .sort(
                    (a, b) =>
                      a.sessionNumber -
                      b.sessionNumber
                  );

              if (patientSessions.length === 0) {
                return null;
              }

              const beforeValues =
                patientSessions.map((session) =>
                  Number(session.beforePainScore)
                );

              const afterValues =
                patientSessions.map((session) =>
                  Number(session.afterPainScore)
                );

              const allValues = [
                ...beforeValues,
                ...afterValues,
              ];

              const maxPain = Math.max(
                10,
                ...allValues
              );

              const chartWidth = 800;
              const chartHeight = 320;

              const left = 65;
              const right = 30;
              const top = 35;
              const bottom = 60;

              const graphWidth =
                chartWidth - left - right;

              const graphHeight =
                chartHeight - top - bottom;

              const getX = (index) => {
                if (patientSessions.length === 1) {
                  return left + graphWidth / 2;
                }

                return (
                  left +
                  (index /
                    (patientSessions.length - 1)) *
                    graphWidth
                );
              };

              const getY = (value) => {
                return (
                  top +
                  graphHeight -
                  (value / maxPain) *
                    graphHeight
                );
              };

              const beforePoints =
                beforeValues
                  .map(
                    (value, index) =>
                      `${getX(index)},${getY(value)}`
                  )
                  .join(" ");

              const afterPoints =
                afterValues
                  .map(
                    (value, index) =>
                      `${getX(index)},${getY(value)}`
                  )
                  .join(" ");

              return (
                <div
                  key={patient.id}
                  style={{
                    marginBottom: "50px",
                  }}
                >

                  {/* PATIENT HEADER */}

                  <div
                    className="patient-card"
                    style={{
                      marginBottom: "20px",
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
                          Diagnosis: {patient.diagnosis}
                        </span>

                      </div>

                      <p>
                        <strong>
                          Total Sessions:
                        </strong>{" "}
                        {patientSessions.length}
                      </p>

                    </div>

                  </div>

                  {/* CONNECTED GRAPH */}

                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "20px",
                      marginBottom: "25px",
                      border: "1px solid #e2e8f0",
                      boxShadow:
                        "0 5px 20px rgba(15,23,42,0.06)",
                    }}
                  >

                    <h3>
                      📈 Pain Score Progress
                    </h3>

                    <p
                      style={{
                        color: "#64748b",
                      }}
                    >
                      Connected pain-score trend across
                      Session 1, Session 2, Session 3 and
                      future sessions.
                    </p>

                    <div
                      style={{
                        width: "100%",
                        overflowX: "auto",
                      }}
                    >

                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        width="100%"
                        height="320"
                        style={{
                          minWidth:
                            patientSessions.length >
                            5
                              ? "700px"
                              : "500px",
                        }}
                      >

                        {/* GRID */}

                        {[0, 2, 4, 6, 8, 10].map(
                          (value) => {

                            const y =
                              getY(value);

                            return (
                              <g key={value}>

                                <line
                                  x1={left}
                                  y1={y}
                                  x2={
                                    chartWidth -
                                    right
                                  }
                                  y2={y}
                                  stroke="#e2e8f0"
                                  strokeWidth="1"
                                />

                                <text
                                  x={left - 15}
                                  y={y + 5}
                                  textAnchor="end"
                                  fontSize="12"
                                  fill="#64748b"
                                >
                                  {value}
                                </text>

                              </g>
                            );
                          }
                        )}

                        {/* Y AXIS */}

                        <line
                          x1={left}
                          y1={top}
                          x2={left}
                          y2={
                            chartHeight -
                            bottom
                          }
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />

                        {/* X AXIS */}

                        <line
                          x1={left}
                          y1={
                            chartHeight -
                            bottom
                          }
                          x2={
                            chartWidth -
                            right
                          }
                          y2={
                            chartHeight -
                            bottom
                          }
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />

                        {/* BEFORE LINE */}

                        <polyline
                          points={beforePoints}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* AFTER LINE */}

                        <polyline
                          points={afterPoints}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* POINTS */}

                        {patientSessions.map(
                          (session, index) => {

                            const x =
                              getX(index);

                            const beforeY =
                              getY(
                                Number(
                                  session.beforePainScore
                                )
                              );

                            const afterY =
                              getY(
                                Number(
                                  session.afterPainScore
                                )
                              );

                            return (
                              <g
                                key={
                                  session.id
                                }
                              >

                                <circle
                                  cx={x}
                                  cy={beforeY}
                                  r="6"
                                  fill="#2563eb"
                                />

                                <text
                                  x={x}
                                  y={
                                    beforeY -
                                    12
                                  }
                                  textAnchor="middle"
                                  fontSize="12"
                                  fontWeight="700"
                                  fill="#2563eb"
                                >
                                  {
                                    session.beforePainScore
                                  }
                                </text>

                                <circle
                                  cx={x}
                                  cy={afterY}
                                  r="6"
                                  fill="#16a34a"
                                />

                                <text
                                  x={x}
                                  y={
                                    afterY +
                                    20
                                  }
                                  textAnchor="middle"
                                  fontSize="12"
                                  fontWeight="700"
                                  fill="#16a34a"
                                >
                                  {
                                    session.afterPainScore
                                  }
                                </text>

                                <text
                                  x={x}
                                  y={
                                    chartHeight -
                                    25
                                  }
                                  textAnchor="middle"
                                  fontSize="13"
                                  fontWeight="700"
                                  fill="#334155"
                                >
                                  Session{" "}
                                  {
                                    session.sessionNumber
                                  }
                                </text>

                              </g>
                            );
                          }
                        )}

                      </svg>

                    </div>

                    {/* LEGEND */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "30px",
                        flexWrap: "wrap",
                        marginTop: "10px",
                      }}
                    >

                      <span>

                        <span
                          style={{
                            display:
                              "inline-block",
                            width: "14px",
                            height: "14px",
                            borderRadius:
                              "50%",
                            background:
                              "#2563eb",
                            marginRight:
                              "7px",
                          }}
                        />

                        Before Treatment

                      </span>

                      <span>

                        <span
                          style={{
                            display:
                              "inline-block",
                            width: "14px",
                            height: "14px",
                            borderRadius:
                              "50%",
                            background:
                              "#16a34a",
                            marginRight:
                              "7px",
                          }}
                        />

                        After Treatment

                      </span>

                    </div>

                  </div>

                  {/* SESSION CARDS */}

                  {patientSessions.map(
                    (session) => (

                      <div
                        className="patient-card"
                        key={session.id}
                        style={{
                          marginBottom: "15px",
                          borderLeft:
                            "4px solid #2563eb",
                        }}
                      >

                        <div className="patient-avatar">
                          📊
                        </div>

                        <div className="patient-details">

                          <div className="patient-title">

                            <h3>
                              Session{" "}
                              {
                                session.sessionNumber
                              }
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
                              Session Time:
                            </strong>{" "}
                            {session.sessionTime}
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
                              Status:
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
              );
            })

          )}

        </section>

      </div>
    );
  }

  /* =====================================================
     PATIENTS PAGE
  ===================================================== */

  if (page === "patients") {

    return (
      <div className="dashboard">

        <header className="dashboard-header">

          <div>
            <h1>MY IFT</h1>
            <p>Patients</p>
          </div>

          <div
            style={{
              position: "relative",
            }}
          >

            <button
              className="secondary-button"
              onClick={() =>
                setShowUserMenu(
                  (previous) => !previous
                )
              }
            >
              👤 {username} ▾
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px",
                  minWidth: "180px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >

                <button
                  className="secondary-button"
                  style={{
                    width: "100%",
                    marginBottom: "6px",
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setPage("profile");
                  }}
                >
                  👤 Profile
                </button>

                <button
                  className="logout-button"
                  style={{
                    width: "100%",
                  }}
                  onClick={logout}
                >
                  🚪 Logout
                </button>

              </div>
            )}

          </div>

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

          <h2>Patients</h2>

          <p>
            Manage your patients and treatment sessions.
          </p>

        </section>

        <section className="patients-section">

          <div className="section-header">

            <div>
              <h2>Patient List</h2>

              <p>
                {patients.length} patient
                {patients.length !== 1 ? "s" : ""}
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
            <h1>MY IFT</h1>
            <p>Add Patient</p>
          </div>

          <div
            style={{
              position: "relative",
            }}
          >

            <button
              className="secondary-button"
              onClick={() =>
                setShowUserMenu(
                  (previous) => !previous
                )
              }
            >
              👤 {username} ▾
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px",
                  minWidth: "180px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >

                <button
                  className="secondary-button"
                  style={{
                    width: "100%",
                    marginBottom: "6px",
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setPage("profile");
                  }}
                >
                  👤 Profile
                </button>

                <button
                  className="logout-button"
                  style={{
                    width: "100%",
                  }}
                  onClick={logout}
                >
                  🚪 Logout
                </button>

              </div>
            )}

          </div>

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

          <h2>Add New Patient</h2>

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
                onChange={handlePatientChange}
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
                onChange={handlePatientChange}
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
                value={patientForm.gender}
                onChange={handlePatientChange}
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
                value={patientForm.phone}
                onChange={handlePatientChange}
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
                value={patientForm.diagnosis}
                onChange={handlePatientChange}
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
                value={patientForm.painScore}
                onChange={handlePatientChange}
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
                value={patientForm.notes}
                onChange={handlePatientChange}
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
            MY IFT
          </h1>

          <p>
            Intelligent Interferential Therapy
          </p>

        </div>

        <div
          style={{
            position: "relative",
          }}
        >

          <button
            className="secondary-button"
            onClick={() =>
              setShowUserMenu(
                (previous) => !previous
              )
            }
          >
            👤 {username} ▾
          </button>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "8px",
                minWidth: "180px",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.15)",
                zIndex: 1000,
              }}
            >

              <button
                className="secondary-button"
                style={{
                  width: "100%",
                  marginBottom: "6px",
                }}
                onClick={() => {
                  setShowUserMenu(false);
                  setPage("profile");
                }}
              >
                👤 Profile
              </button>

              <button
                className="logout-button"
                style={{
                  width: "100%",
                }}
                onClick={logout}
              >
                🚪 Logout
              </button>

            </div>
          )}

        </div>

      </header>

      <section className="welcome-section">

        <h2>
          MY IFT Dashboard
        </h2>

        <p>
          Welcome,{" "}
          <strong>{username}</strong>.
          Manage your patients and treatment sessions.
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
            View every previous treatment session and
            pain-score progress.
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