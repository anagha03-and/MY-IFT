import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* =========================================================
   STORAGE
========================================================= */

const USERS_KEY = "smartIFT_users";
const LOGIN_KEY = "smartIFT_loggedInUser";

const EMPTY_PATIENT = {
  name: "",
  age: "",
  gender: "",
  phone: "",
  diagnosis: "",
  painScore: "",
  notes: "",
};

const EMPTY_PARAMETERS = {
  carrierFrequency: "4000",
  beatFrequency: "100",
  intensity: "10",
  duration: "15",
  notes: "",
};

/* =========================================================
   HELPERS
========================================================= */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);

  if (!parts.length) return "U";

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function generatePatientId() {
  return `P-${Date.now().toString().slice(-10)}`;
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [loggedInUser, setLoggedInUser] = useState(
    localStorage.getItem(LOGIN_KEY) || ""
  );

  const [page, setPage] = useState("dashboard");

  const [usersData, setUsersData] = useState(getUsers());

  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT);

  const [patients, setPatients] = useState([]);

  const [sessions, setSessions] = useState([]);

  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [treatmentParameters, setTreatmentParameters] =
    useState(EMPTY_PARAMETERS);

  const [aiRecommendation, setAiRecommendation] = useState(null);

  const [xrayFile, setXrayFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);

  const [xrayPreview, setXrayPreview] = useState("");
  const [reportPreview, setReportPreview] = useState("");

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  const [sessionStatus, setSessionStatus] = useState("idle");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [afterPainScore, setAfterPainScore] = useState("");

  const [machineSent, setMachineSent] = useState(false);

  /* =========================================================
     LOAD USER DATA
  ========================================================= */

  useEffect(() => {
    if (!loggedInUser) return;

    const users = getUsers();

    if (!users[loggedInUser]) {
      users[loggedInUser] = {
        patients: [],
        sessions: [],
      };

      saveUsers(users);
    }

    setUsersData(users);
    setPatients(users[loggedInUser].patients || []);
    setSessions(users[loggedInUser].sessions || []);
  }, [loggedInUser]);

  /* =========================================================
     SAVE USER DATA
  ========================================================= */

  const updateUserData = (newPatients, newSessions) => {
    if (!loggedInUser) return;

    const users = getUsers();

    users[loggedInUser] = {
      patients: newPatients,
      sessions: newSessions,
    };

    saveUsers(users);

    setUsersData(users);
    setPatients(newPatients);
    setSessions(newSessions);
  };

  /* =========================================================
     SELECTED PATIENT
  ========================================================= */

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => patient.id === selectedPatientId
      ) || null,
    [patients, selectedPatientId]
  );

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = (username, password) => {
    if (!username.trim() || !password.trim()) {
      alert("Please enter username and password.");
      return;
    }

    const cleanUsername = username.trim();

    const users = getUsers();

    if (!users[cleanUsername]) {
      users[cleanUsername] = {
        patients: [],
        sessions: [],
      };

      saveUsers(users);
    }

    localStorage.setItem(LOGIN_KEY, cleanUsername);

    setLoggedInUser(cleanUsername);
    setUsersData(users);
    setPatients(users[cleanUsername].patients || []);
    setSessions(users[cleanUsername].sessions || []);
    setPage("dashboard");
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem(LOGIN_KEY);

    setLoggedInUser("");
    setPage("dashboard");
    setShowProfileMenu(false);
    setShowSettings(false);
  };

  /* =========================================================
     ADD PATIENT
  ========================================================= */

  const handleAddPatient = (e) => {
    e.preventDefault();

    if (!patientForm.name.trim()) {
      alert("Please enter the patient's name.");
      return;
    }

    if (!patientForm.age) {
      alert("Please enter the patient's age.");
      return;
    }

    const newPatient = {
      ...patientForm,
      id: generatePatientId(),
      createdAt: new Date().toISOString(),
    };

    const updatedPatients = [...patients, newPatient];

    updateUserData(updatedPatients, sessions);

    setPatientForm(EMPTY_PATIENT);

    alert("Patient added successfully.");
  };

  /* =========================================================
     DELETE PATIENT
  ========================================================= */

  const handleDeletePatient = (patientId) => {
    const patient = patients.find(
      (p) => p.id === patientId
    );

    if (!patient) return;

    const confirmed = window.confirm(
      `Remove ${patient.name} from the patient list?\n\nExisting session history will also be removed.`
    );

    if (!confirmed) return;

    const updatedPatients = patients.filter(
      (p) => p.id !== patientId
    );

    const updatedSessions = sessions.filter(
      (session) => session.patientId !== patientId
    );

    updateUserData(updatedPatients, updatedSessions);

    if (selectedPatientId === patientId) {
      setSelectedPatientId("");
    }
  };

  /* =========================================================
     FILE UPLOAD
  ========================================================= */

  const handleXrayUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setXrayFile(file);

    if (file.type.startsWith("image/")) {
      setXrayPreview(URL.createObjectURL(file));
    } else {
      setXrayPreview("");
    }
  };

  const handleReportUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setReportFile(file);

    if (file.type.startsWith("image/")) {
      setReportPreview(URL.createObjectURL(file));
    } else {
      setReportPreview("");
    }
  };

  /* =========================================================
     AI RECOMMENDATION
  ========================================================= */

  const generateAIRecommendation = () => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    const pain = Number(
      selectedPatient.painScore || 0
    );

    let recommendation;

    if (pain >= 7) {
      recommendation = {
        carrierFrequency: "4000",
        beatFrequency: "100",
        intensity: "10",
        duration: "15",
        reason:
          "Recommendation generated using the patient's recorded pain score.",
      };
    } else if (pain >= 4) {
      recommendation = {
        carrierFrequency: "4000",
        beatFrequency: "90",
        intensity: "8",
        duration: "15",
        reason:
          "Recommendation generated using the patient's recorded pain score.",
      };
    } else {
      recommendation = {
        carrierFrequency: "4000",
        beatFrequency: "80",
        intensity: "6",
        duration: "10",
        reason:
          "Recommendation generated using the patient's recorded pain score.",
      };
    }

    setAiRecommendation(recommendation);

    setTreatmentParameters({
      carrierFrequency:
        recommendation.carrierFrequency,

      beatFrequency:
        recommendation.beatFrequency,

      intensity:
        recommendation.intensity,

      duration:
        recommendation.duration,

      notes: "",
    });
  };

  /* =========================================================
     APPLY AI RECOMMENDATION
  ========================================================= */

  const applyAIRecommendation = () => {
    if (!aiRecommendation) return;

    setTreatmentParameters({
      carrierFrequency:
        aiRecommendation.carrierFrequency,

      beatFrequency:
        aiRecommendation.beatFrequency,

      intensity:
        aiRecommendation.intensity,

      duration:
        aiRecommendation.duration,

      notes: "",
    });
  };

  /* =========================================================
     SEND PARAMETERS
  ========================================================= */

  const sendParametersToMachine = () => {
    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }

    if (
      !treatmentParameters.carrierFrequency ||
      !treatmentParameters.beatFrequency ||
      !treatmentParameters.intensity ||
      !treatmentParameters.duration
    ) {
      alert("Please complete all treatment parameters.");
      return;
    }

    setMachineSent(true);

    alert(
      "Treatment parameters prepared for the machine.\n\nESP32/backend communication can be connected later."
    );
  };

  /* =========================================================
     START SESSION
  ========================================================= */

  const startIFTSession = () => {
    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }

    if (
      !treatmentParameters.carrierFrequency ||
      !treatmentParameters.beatFrequency ||
      !treatmentParameters.intensity ||
      !treatmentParameters.duration
    ) {
      alert(
        "Please complete the treatment parameters."
      );
      return;
    }

    if (!machineSent) {
      const proceed = window.confirm(
        "Parameters have not been sent to the machine yet.\n\nContinue to the safety screening?"
      );

      if (!proceed) return;
    }

    setShowSafetyWarning(true);
  };

  /* =========================================================
     CONFIRM SAFETY
  ========================================================= */

  const confirmSafetyAndStart = () => {
    setShowSafetyWarning(false);

    setSessionSeconds(0);
    setAfterPainScore("");

    setSessionStatus("running");
  };

  /* =========================================================
     SESSION TIMER
  ========================================================= */

  useEffect(() => {
    if (sessionStatus !== "running") return;

    const timer = setInterval(() => {
      setSessionSeconds((current) => {
        const durationSeconds =
          Number(treatmentParameters.duration || 0) *
          60;

        if (
          durationSeconds > 0 &&
          current + 1 >= durationSeconds
        ) {
          setSessionStatus("completed");

          return durationSeconds;
        }

        return current + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    sessionStatus,
    treatmentParameters.duration,
  ]);

  /* =========================================================
     PAUSE
  ========================================================= */

  const pauseSession = () => {
    if (sessionStatus === "running") {
      setSessionStatus("paused");
    }
  };

  /* =========================================================
     CONTINUE
  ========================================================= */

  const continueSession = () => {
    if (sessionStatus === "paused") {
      setSessionStatus("running");
    }
  };

  /* =========================================================
     STOP
  ========================================================= */

  const stopSession = () => {
    const confirmed = window.confirm(
      "Stop the current IFT session?"
    );

    if (!confirmed) return;

    setSessionStatus("stopped");
  };

  /* =========================================================
     SAVE COMPLETED SESSION
  ========================================================= */

  const saveCompletedSession = () => {
    if (!selectedPatient) return;

    if (
      afterPainScore === "" ||
      Number(afterPainScore) < 0 ||
      Number(afterPainScore) > 10
    ) {
      alert(
        "Please enter a valid post-treatment pain score from 0 to 10."
      );
      return;
    }

    const newSession = {
      id: `S-${Date.now()}`,

      patientId: selectedPatient.id,

      patientName: selectedPatient.name,

      date: new Date().toISOString(),

      painBefore: Number(
        selectedPatient.painScore || 0
      ),

      painAfter: Number(afterPainScore),

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

      xrayUploaded:
        Boolean(xrayFile),

      reportUploaded:
        Boolean(reportFile),

      status: "Completed",
    };

    const updatedSessions = [
      ...sessions,
      newSession,
    ];

    const updatedPatients = patients.map(
      (patient) =>
        patient.id === selectedPatient.id
          ? {
              ...patient,
              painScore: afterPainScore,
            }
          : patient
    );

    updateUserData(
      updatedPatients,
      updatedSessions
    );

    setSessionStatus("idle");
    setSessionSeconds(0);
    setAfterPainScore("");
    setMachineSent(false);

    setAiRecommendation(null);

    setXrayFile(null);
    setReportFile(null);

    setXrayPreview("");
    setReportPreview("");

    setPage("history");

    alert("IFT session saved successfully.");
  };

  /* =========================================================
     NEW SESSION RESET
  ========================================================= */

  const resetNewSession = () => {
    setSelectedPatientId("");

    setTreatmentParameters(
      EMPTY_PARAMETERS
    );

    setAiRecommendation(null);

    setXrayFile(null);
    setReportFile(null);

    setXrayPreview("");
    setReportPreview("");

    setMachineSent(false);

    setSessionStatus("idle");

    setSessionSeconds(0);

    setAfterPainScore("");
  };

  /* =========================================================
     DASHBOARD COUNTS
  ========================================================= */

  const completedSessions =
    sessions.filter(
      (session) =>
        session.status === "Completed"
    );

  const latestSession = sessions.length
    ? [...sessions].sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )[0]
    : null;

  /* =========================================================
     LOGIN
  ========================================================= */

  if (!loggedInUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
      />
    );
  }

  /* =========================================================
     MAIN APPLICATION
  ========================================================= */

  return (
    <div className="dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="dashboard-header">

        <div className="header-brand">

          <div className="header-logo">
            ⚡
          </div>

          <div>
            <h1>MY IFT</h1>

            <p>
              Intelligent Interferential Therapy Platform
            </p>
          </div>

        </div>

        <div className="header-right">

          <div className="system-status">
            <span className="status-dot"></span>
            System Ready
          </div>

          <button
            className="username-button"
            onClick={() =>
              setShowProfileMenu(
                (current) => !current
              )
            }
          >

            <span className="header-avatar">
              {getInitials(loggedInUser)}
            </span>

            <span>
              {loggedInUser}
            </span>

            <span className="dropdown-arrow">
              ▾
            </span>

          </button>

        </div>

      </header>

      {/* =====================================================
          PROFILE DROPDOWN
      ===================================================== */}

      {showProfileMenu && (
        <div className="profile-menu">

          <div className="profile-menu-top">

            <div className="profile-large-avatar">
              {getInitials(loggedInUser)}
            </div>

            <div>
              <strong>
                {loggedInUser}
              </strong>

              <span>
                Therapist / Operator
              </span>
            </div>

          </div>

          <div className="profile-divider"></div>

          <div className="profile-last-session">

            <div className="profile-section-label">
              Previous Session
            </div>

            {latestSession ? (
              <>

                <strong>
                  {latestSession.patientName}
                </strong>

                <span>
                  {formatDate(
                    latestSession.date
                  )}
                </span>

                <span>
                  Pain:{" "}
                  {latestSession.painBefore}/10
                  {" → "}
                  {latestSession.painAfter}/10
                </span>

                <span>
                  {latestSession.duration} min
                  {" • "}
                  {latestSession.intensity} mA
                </span>

              </>
            ) : (
              <span>
                No previous session available.
              </span>
            )}

          </div>

          <button
            className="profile-menu-button"
            onClick={() => {
              setShowSettings(true);
              setShowProfileMenu(false);
            }}
          >
            ⚙ Settings
          </button>

          <button
            className="profile-menu-button logout-menu-button"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            ⚡
          </div>

          <div>
            <strong>
              MY IFT
            </strong>

            <span>
              Clinical Workspace
            </span>
          </div>

        </div>

        <nav>

          <button
            className={
              page === "dashboard"
                ? "sidebar-button active"
                : "sidebar-button"
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              page === "patients"
                ? "sidebar-button active"
                : "sidebar-button"
            }
            onClick={() =>
              setPage("patients")
            }
          >
            <span>♙</span>
            Manage Patients
          </button>

          <button
            className={
              page === "new-session"
                ? "sidebar-button active"
                : "sidebar-button"
            }
            onClick={() =>
              setPage("new-session")
            }
          >
            <span>＋</span>
            New Session
          </button>

          <button
            className={
              page === "history"
                ? "sidebar-button active"
                : "sidebar-button"
            }
            onClick={() =>
              setPage("history")
            }
          >
            <span>▤</span>
            History
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-divider"></div>

          <button
            className="sidebar-button"
            onClick={() =>
              setShowSettings(true)
            }
          >
            <span>⚙</span>
            Settings
          </button>

          <button
            className="sidebar-button sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">

        {page === "dashboard" && (
          <DashboardPage
            loggedInUser={loggedInUser}
            patients={patients}
            sessions={sessions}
            completedSessions={
              completedSessions
            }
            setPage={setPage}
          />
        )}

        {page === "patients" && (
          <PatientsPage
            patients={patients}
            patientForm={patientForm}
            setPatientForm={
              setPatientForm
            }
            onAddPatient={
              handleAddPatient
            }
            onDeletePatient={
              handleDeletePatient
            }
          />
        )}

        {page === "new-session" && (
          <NewSessionPage
            patients={patients}
            selectedPatient={
              selectedPatient
            }
            selectedPatientId={
              selectedPatientId
            }
            setSelectedPatientId={
              setSelectedPatientId
            }

            xrayFile={xrayFile}
            reportFile={reportFile}

            xrayPreview={
              xrayPreview
            }

            reportPreview={
              reportPreview
            }

            handleXrayUpload={
              handleXrayUpload
            }

            handleReportUpload={
              handleReportUpload
            }

            aiRecommendation={
              aiRecommendation
            }

            generateAIRecommendation={
              generateAIRecommendation
            }

            applyAIRecommendation={
              applyAIRecommendation
            }

            treatmentParameters={
              treatmentParameters
            }

            setTreatmentParameters={
              setTreatmentParameters
            }

            machineSent={
              machineSent
            }

            sendParametersToMachine={
              sendParametersToMachine
            }

            sessionStatus={
              sessionStatus
            }

            sessionSeconds={
              sessionSeconds
            }

            startIFTSession={
              startIFTSession
            }

            pauseSession={
              pauseSession
            }

            continueSession={
              continueSession
            }

            stopSession={
              stopSession
            }

            afterPainScore={
              afterPainScore
            }

            setAfterPainScore={
              setAfterPainScore
            }

            saveCompletedSession={
              saveCompletedSession
            }

            resetNewSession={
              resetNewSession
            }
          />
        )}

        {page === "history" && (
          <HistoryPage
            patients={patients}
            sessions={sessions}
          />
        )}

      </main>

      {/* =====================================================
          SAFETY POPUP
      ===================================================== */}

      {showSafetyWarning && (
        <SafetyPopup
          onCancel={() =>
            setShowSafetyWarning(false)
          }
          onConfirm={
            confirmSafetyAndStart
          }
        />
      )}

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      {showSettings && (
        <SettingsModal
          username={loggedInUser}
          onClose={() =>
            setShowSettings(false)
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   LOGIN SCREEN
========================================================= */

function LoginScreen({ onLogin }) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const submit = (e) => {
    e.preventDefault();

    onLogin(
      username,
      password
    );
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="logo-circle">
          ⚡
        </div>

        <h1>
          MY IFT
        </h1>

        <p className="subtitle">
          Intelligent Interferential Therapy Platform
        </p>

        <form onSubmit={submit}>

          <label>
            Username
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            placeholder="Enter username"
          />

          <label>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Enter password"
          />

          <button type="submit">
            Sign In
          </button>

        </form>

        <p className="login-note">
          Frontend demonstration workspace
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardPage({
  loggedInUser,
  patients,
  sessions,
  completedSessions,
  setPage,
}) {
  return (
    <div className="page-wrapper">

      <div className="page-heading">

        <div>

          <h2>
            Good afternoon,{" "}
            {loggedInUser}
          </h2>

          <p>
            Manage patients, configure treatment
            sessions and review treatment history.
          </p>

        </div>

        <div className="page-badge">
          Treatment Workspace
        </div>

      </div>

      {/* STATS */}

      <div className="stats-grid">

        <StatCard
          title="Patients"
          value={patients.length}
          description="Registered patients"
          icon="♙"
        />

        <StatCard
          title="Sessions"
          value={sessions.length}
          description="Total treatment sessions"
          icon="▤"
        />

        <StatCard
          title="Completed"
          value={
            completedSessions.length
          }
          description="Completed sessions"
          icon="✓"
        />

        <StatCard
          title="AI Ready"
          value="READY"
          description="Recommendation module"
          icon="✦"
        />

      </div>

      {/* ACTION CARDS */}

      <div className="dashboard-actions">

        <ActionCard
          icon="♙"
          title="Patient Management"
          description="Add new patients or remove existing patient records."
          button="Manage Patients"
          onClick={() =>
            setPage("patients")
          }
        />

        <ActionCard
          icon="＋"
          title="New Treatment"
          description="Select a patient, review files and configure IFT parameters."
          button="Start New Session"
          onClick={() =>
            setPage("new-session")
          }
        />

        <ActionCard
          icon="▥"
          title="Session History"
          description="Review every patient's previous treatment sessions and pain trends."
          button="View History"
          onClick={() =>
            setPage("history")
          }
        />

        <ActionCard
          icon="✦"
          title="AI Recommendation"
          description="Generate treatment parameter suggestions from available patient information."
          button="Open Treatment"
          onClick={() =>
            setPage("new-session")
          }
        />

      </div>

      {/* SYSTEM OVERVIEW */}

      <section className="dashboard-panel">

        <div className="panel-heading">

          <div>

            <h3>
              System Overview
            </h3>

            <p>
              Current workspace information
            </p>

          </div>

        </div>

        <div className="overview-grid">

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
              {sessions.length}
            </strong>

            <span>
              Total Sessions
            </span>
          </div>

          <div>

            <strong>
              {patients.length
                ? Math.round(
                    patients.reduce(
                      (
                        sum,
                        patient
                      ) =>
                        sum +
                        Number(
                          patient.painScore ||
                            0
                        ),
                      0
                    ) /
                      patients.length
                  )
                : 0}
            </strong>

            <span>
              Average Pain Score
            </span>

          </div>

          <div>

            <strong>
              Online
            </strong>

            <span>
              Machine Status
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <span className="stat-title">
          {title}
        </span>

        <strong className="stat-value">
          {value}
        </strong>

        <span className="stat-description">
          {description}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  icon,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div className="action-card">

      <div className="action-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <button
        className="primary-button"
        onClick={onClick}
      >
        {button}
      </button>

    </div>
  );
}

/* =========================================================
   MANAGE PATIENTS PAGE
========================================================= */

function PatientsPage({
  patients,
  patientForm,
  setPatientForm,
  onAddPatient,
  onDeletePatient,
}) {
  return (
    <div className="page-wrapper">

      {/* PAGE HEADER */}

      <div className="page-heading">

        <div>

          <h2>
            Manage Patients
          </h2>

          <p>
            Add new patients or remove existing
            patient records.
          </p>

        </div>

        <div className="page-badge">
          Patient Management
        </div>

      </div>

      {/* =====================================================
          ADD PATIENT
      ===================================================== */}

      <section className="content-panel patients-add-panel">

        <div className="panel-heading">

          <div>

            <h3>
              Add Patient
            </h3>

            <p>
              Create a new patient record.
            </p>

          </div>

          <div className="panel-number">
            +
          </div>

        </div>

        <form
          className="patient-form-new"
          onSubmit={onAddPatient}
        >

          {/* NAME */}

          <div className="form-group">

            <label>
              Patient Name
            </label>

            <input
              value={patientForm.name}
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  name: e.target.value,
                })
              }
              placeholder="Enter patient name"
            />

          </div>

          {/* AGE */}

          <div className="form-group">

            <label>
              Age
            </label>

            <input
              type="number"
              min="0"
              value={patientForm.age}
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  age: e.target.value,
                })
              }
              placeholder="Age"
            />

          </div>

          {/* GENDER */}

          <div className="form-group">

            <label>
              Gender
            </label>

            <select
              value={patientForm.gender}
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  gender: e.target.value,
                })
              }
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

          {/* PHONE */}

          <div className="form-group">

            <label>
              Phone
            </label>

            <input
              value={patientForm.phone}
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  phone: e.target.value,
                })
              }
              placeholder="Phone number"
            />

          </div>

          {/* DIAGNOSIS */}

          <div className="form-group">

            <label>
              Diagnosis
            </label>

            <input
              value={
                patientForm.diagnosis
              }
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  diagnosis:
                    e.target.value,
                })
              }
              placeholder="Diagnosis / condition"
            />

          </div>

          {/* PAIN SCORE */}

          <div className="form-group">

            <label>
              Initial Pain Score (0–10)
            </label>

            <input
              type="number"
              min="0"
              max="10"
              value={
                patientForm.painScore
              }
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  painScore:
                    e.target.value,
                })
              }
              placeholder="0–10"
            />

          </div>

          {/* NOTES */}

          <div className="form-group form-full">

            <label>
              Notes
            </label>

            <textarea
              value={
                patientForm.notes
              }
              onChange={(e) =>
                setPatientForm({
                  ...patientForm,
                  notes:
                    e.target.value,
                })
              }
              placeholder="Additional patient notes"
            />

          </div>

          {/* BUTTON */}

          <div className="form-actions-new">

            <button
              type="submit"
              className="primary-button"
            >
              + Add Patient
            </button>

          </div>

        </form>

      </section>

      {/* =====================================================
          PATIENTS LIST — BELOW ADD PATIENT
      ===================================================== */}

      <section className="content-panel patients-list-panel">

        <div className="panel-heading">

          <div>

            <h3>
              Patients
            </h3>

            <p>
              {patients.length} patient
              {patients.length === 1
                ? ""
                : "s"}{" "}
              registered
            </p>

          </div>

          <div className="patients-count-badge">
            {patients.length}
          </div>

        </div>

        {patients.length === 0 ? (

          <div className="empty-state-new">

            <div className="empty-state-icon">
              ♙
            </div>

            <h3>
              No patients yet
            </h3>

            <p>
              Add a patient using the form above.
            </p>

          </div>

        ) : (

          <div className="patient-list-new">

            {patients.map(
              (patient) => (

                <div
                  className="patient-row"
                  key={patient.id}
                >

                  {/* AVATAR */}

                  <div className="patient-row-avatar">
                    {getInitials(
                      patient.name
                    )}
                  </div>

                  {/* INFO */}

                  <div className="patient-row-info">

                    <div className="patient-row-title">

                      <strong>
                        {patient.name}
                      </strong>

                      <span>
                        {patient.id}
                      </span>

                    </div>

                    <p>

                      {patient.age} years

                      {patient.gender
                        ? ` • ${patient.gender}`
                        : ""}

                      {patient.diagnosis
                        ? ` • ${patient.diagnosis}`
                        : ""}

                    </p>

                    <small>

                      Pain score:{" "}

                      {patient.painScore !== ""
                        ? `${patient.painScore}/10`
                        : "Not recorded"}

                    </small>

                  </div>

                  {/* REMOVE */}

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      onDeletePatient(
                        patient.id
                      )
                    }
                  >
                    Remove
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}

/* =========================================================
   NEW SESSION PAGE
========================================================= */

function NewSessionPage({
  patients,
  selectedPatient,
  selectedPatientId,
  setSelectedPatientId,

  xrayFile,
  reportFile,

  xrayPreview,
  reportPreview,

  handleXrayUpload,
  handleReportUpload,

  aiRecommendation,
  generateAIRecommendation,
  applyAIRecommendation,

  treatmentParameters,
  setTreatmentParameters,

  machineSent,
  sendParametersToMachine,

  sessionStatus,
  sessionSeconds,

  startIFTSession,
  pauseSession,
  continueSession,
  stopSession,

  afterPainScore,
  setAfterPainScore,

  saveCompletedSession,

  resetNewSession,
}) {
  return (
    <div className="page-wrapper">

      <div className="page-heading">

        <div>

          <h2>
            New Treatment Session
          </h2>

          <p>
            Select a patient, review supporting
            files and configure IFT treatment
            parameters.
          </p>

        </div>

        <div className="page-badge">
          Treatment Workspace
        </div>

      </div>

      {/* =====================================================
          FIVE STEP WORKFLOW
      ===================================================== */}

      <div className="treatment-workflow">

        {/* ===================================================
            STEP 1
        =================================================== */}

        <section className="workflow-card">

          <WorkflowHeader
            number="1"
            title="Select Patient"
            description="Choose the patient for this treatment."
          />

          <select
            className="workflow-select"
            value={selectedPatientId}
            onChange={(e) =>
              setSelectedPatientId(
                e.target.value
              )
            }
          >

            <option value="">
              Select patient
            </option>

            {patients.map(
              (patient) => (
                <option
                  value={patient.id}
                  key={patient.id}
                >
                  {patient.name} —{" "}
                  {patient.id}
                </option>
              )
            )}

          </select>

          {selectedPatient ? (

            <div className="selected-patient-card">

              <div className="selected-patient-avatar">
                {getInitials(
                  selectedPatient.name
                )}
              </div>

              <div>

                <strong>
                  {selectedPatient.name}
                </strong>

                <span>
                  {selectedPatient.age} years

                  {selectedPatient.gender
                    ? ` • ${selectedPatient.gender}`
                    : ""}
                </span>

              </div>

              <div className="pain-badge">
                Pain{" "}
                {selectedPatient.painScore ||
                  0}
                /10
              </div>

            </div>

          ) : (

            <div className="workflow-empty">
              Select a patient to continue.
            </div>

          )}

        </section>

        {/* ===================================================
            STEP 2
        =================================================== */}

        <section className="workflow-card">

          <WorkflowHeader
            number="2"
            title="Reports & Imaging"
            description="Upload supporting patient files."
          />

          <div className="upload-stack">

            <label className="upload-box-small">

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleXrayUpload
                }
              />

              <div className="upload-small-icon">
                ◉
              </div>

              <div>

                <strong>
                  X-ray Image
                </strong>

                <span>
                  {xrayFile
                    ? xrayFile.name
                    : "Click to upload"}
                </span>

              </div>

              {xrayPreview && (
                <img
                  src={xrayPreview}
                  alt="X-ray preview"
                  className="mini-preview"
                />
              )}

            </label>

            <label className="upload-box-small">

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={
                  handleReportUpload
                }
              />

              <div className="upload-small-icon">
                ▤
              </div>

              <div>

                <strong>
                  Medical Report
                </strong>

                <span>
                  {reportFile
                    ? reportFile.name
                    : "Click to upload"}
                </span>

              </div>

              {reportPreview && (
                <img
                  src={reportPreview}
                  alt="Report preview"
                  className="mini-preview"
                />
              )}

            </label>

          </div>

          <div className="upload-help">
            Files are used as supporting
            information for the treatment workflow.
          </div>

        </section>

        {/* ===================================================
            STEP 3
        =================================================== */}

        <section className="workflow-card">

          <WorkflowHeader
            number="3"
            title="AI Recommendation"
            description="Generate suggested parameters."
          />

          <button
            className="ai-generate-button"
            onClick={
              generateAIRecommendation
            }
            disabled={!selectedPatient}
          >
            ✦ Generate AI Recommendation
          </button>

          {!aiRecommendation ? (

            <div className="ai-empty">

              <span>
                ✦
              </span>

              <div>

                <strong>
                  No recommendation generated
                </strong>

                <p>
                  Select a patient and generate
                  a recommendation.
                </p>

              </div>

            </div>

          ) : (

            <div className="ai-result-new">

              <div className="ai-result-title">

                <span>
                  ✦
                </span>

                <strong>
                  Suggested Parameters
                </strong>

              </div>

              <div className="ai-values">

                <div>

                  <span>
                    Carrier
                  </span>

                  <strong>
                    {
                      aiRecommendation.carrierFrequency
                    }{" "}
                    Hz
                  </strong>

                </div>

                <div>

                  <span>
                    Beat
                  </span>

                  <strong>
                    {
                      aiRecommendation.beatFrequency
                    }{" "}
                    Hz
                  </strong>

                </div>

                <div>

                  <span>
                    Current
                  </span>

                  <strong>
                    {
                      aiRecommendation.intensity
                    }{" "}
                    mA
                  </strong>

                </div>

                <div>

                  <span>
                    Duration
                  </span>

                  <strong>
                    {
                      aiRecommendation.duration
                    }{" "}
                    min
                  </strong>

                </div>

              </div>

              <p className="ai-disclaimer">
                {
                  aiRecommendation.reason
                }
              </p>

              <button
                className="secondary-button full-button"
                onClick={
                  applyAIRecommendation
                }
              >
                Apply Recommendation
              </button>

            </div>

          )}

        </section>

        {/* ===================================================
            STEP 4
        =================================================== */}

        <section className="workflow-card">

          <WorkflowHeader
            number="4"
            title="Treatment Parameters"
            description="Review or manually adjust parameters."
          />

          <div className="parameter-fields">

            <div className="parameter-field">

              <label>
                Carrier Frequency
              </label>

              <input
                type="number"
                value={
                  treatmentParameters.carrierFrequency
                }
                onChange={(e) =>
                  setTreatmentParameters({
                    ...treatmentParameters,
                    carrierFrequency:
                      e.target.value,
                  })
                }
              />

              <span>
                Hz
              </span>

            </div>

            <div className="parameter-field">

              <label>
                Beat Frequency
              </label>

              <input
                type="number"
                value={
                  treatmentParameters.beatFrequency
                }
                onChange={(e) =>
                  setTreatmentParameters({
                    ...treatmentParameters,
                    beatFrequency:
                      e.target.value,
                  })
                }
              />

              <span>
                Hz
              </span>

            </div>

            <div className="parameter-field">

              <label>
                Current / Intensity (mA)
              </label>

              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  treatmentParameters.intensity
                }
                onChange={(e) =>
                  setTreatmentParameters({
                    ...treatmentParameters,
                    intensity:
                      e.target.value,
                  })
                }
                placeholder="Enter current"
              />

              <span>
                mA
              </span>

            </div>

            <div className="parameter-field">

              <label>
                Duration
              </label>

              <input
                type="number"
                min="0.1"
                step="0.1"
                value={
                  treatmentParameters.duration
                }
                onChange={(e) =>
                  setTreatmentParameters({
                    ...treatmentParameters,
                    duration:
                      e.target.value,
                  })
                }
              />

              <span>
                min
              </span>

            </div>

          </div>

          <div className="parameter-field-full">

            <label>
              Treatment Notes
            </label>

            <textarea
              value={
                treatmentParameters.notes
              }
              onChange={(e) =>
                setTreatmentParameters({
                  ...treatmentParameters,
                  notes: e.target.value,
                })
              }
              placeholder="Enter treatment notes..."
            />

          </div>

          <button
            className={
              machineSent
                ? "machine-button sent"
                : "machine-button"
            }
            onClick={
              sendParametersToMachine
            }
          >

            {machineSent
              ? "✓ Parameters Ready"
              : "↗ Send Parameters to Machine"}

          </button>

        </section>

        {/* ===================================================
            STEP 5
        =================================================== */}

        <section className="workflow-card session-workflow-card">

          <WorkflowHeader
            number="5"
            title="IFT Session"
            description="Start and control the treatment session."
          />

          <div className="session-area">

            {sessionStatus === "idle" && (
              <>

                <div className="session-icon">
                  ⚡
                </div>

                <strong>
                  Ready to Start
                </strong>

                <p>
                  Confirm the safety screening and
                  begin the IFT treatment.
                </p>

                <button
                  className="start-session-button"
                  onClick={
                    startIFTSession
                  }
                >
                  Start IFT Session
                </button>

              </>
            )}

            {(sessionStatus ===
              "running" ||
              sessionStatus ===
                "paused") && (
              <>

                <div
                  className={
                    sessionStatus ===
                    "paused"
                      ? "session-status paused"
                      : "session-status running"
                  }
                >
                  {sessionStatus ===
                  "running"
                    ? "● Treatment Running"
                    : "Ⅱ Treatment Paused"}
                </div>

                <div className="session-timer-small">
                  {formatDuration(
                    sessionSeconds
                  )}
                </div>

                <div className="session-controls">

                  <button
                    className="secondary-button"
                    onClick={
                      pauseSession
                    }
                    disabled={
                      sessionStatus !==
                      "running"
                    }
                  >
                    Pause
                  </button>

                  <button
                    className="primary-button"
                    onClick={
                      continueSession
                    }
                    disabled={
                      sessionStatus !==
                      "paused"
                    }
                  >
                    Continue
                  </button>

                  <button
                    className="danger-button"
                    onClick={
                      stopSession
                    }
                  >
                    Stop
                  </button>

                </div>

              </>
            )}

            {sessionStatus ===
              "completed" && (
              <>

                <div className="session-icon completed">
                  ✓
                </div>

                <strong>
                  Session Completed
                </strong>

                <p>
                  Treatment duration has been completed.
                </p>

                <div className="after-pain-box-new">

                  <label>
                    Post-Treatment Pain Score (0–10)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={
                      afterPainScore
                    }
                    onChange={(e) =>
                      setAfterPainScore(
                        e.target.value
                      )
                    }
                    placeholder="Enter pain score"
                  />

                  <button
                    className="primary-button"
                    onClick={
                      saveCompletedSession
                    }
                  >
                    Save Session
                  </button>

                </div>

              </>
            )}

            {sessionStatus ===
              "stopped" && (
              <>

                <div className="session-icon stopped">
                  !
                </div>

                <strong>
                  Session Stopped
                </strong>

                <p>
                  The treatment session was stopped.
                </p>

                <button
                  className="secondary-button"
                  onClick={
                    resetNewSession
                  }
                >
                  Reset Session
                </button>

              </>
            )}

          </div>

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   WORKFLOW HEADER
========================================================= */

function WorkflowHeader({
  number,
  title,
  description,
}) {
  return (
    <div className="workflow-header">

      <div className="workflow-number">
        {number}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   HISTORY PAGE
========================================================= */

function HistoryPage({
  patients,
  sessions,
}) {
  return (
    <div className="page-wrapper">

      <div className="page-heading">

        <div>

          <h2>
            Session History
          </h2>

          <p>
            Review all previous IFT sessions and
            pain trends for every patient.
          </p>

        </div>

        <div className="page-badge">
          Clinical History
        </div>

      </div>

      {patients.length === 0 ? (

        <div className="content-panel">

          <div className="empty-state-new">

            <div>
              ▤
            </div>

            <h3>
              No patient history available
            </h3>

            <p>
              Add patients and complete treatment
              sessions to see history here.
            </p>

          </div>

        </div>

      ) : (

        <div className="history-patient-list">

          {patients.map(
            (patient) => {

              const patientSessions =
                sessions
                  .filter(
                    (session) =>
                      session.patientId ===
                      patient.id
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.date) -
                      new Date(b.date)
                  );

              return (
                <PatientHistoryCard
                  key={patient.id}
                  patient={patient}
                  sessions={
                    patientSessions
                  }
                />
              );
            }
          )}

        </div>

      )}

    </div>
  );
}

/* =========================================================
   PATIENT HISTORY CARD
========================================================= */

function PatientHistoryCard({
  patient,
  sessions,
}) {
  return (
    <section className="history-patient-card">

      <div className="history-patient-header">

        <div className="history-patient-main">

          <div className="history-avatar">
            {getInitials(
              patient.name
            )}
          </div>

          <div>

            <h3>
              {patient.name}
            </h3>

            <p>

              {patient.id}
              {" • "}
              {patient.age} years

              {patient.gender
                ? ` • ${patient.gender}`
                : ""}

            </p>

            {patient.diagnosis && (
              <span>
                {patient.diagnosis}
              </span>
            )}

          </div>

        </div>

        <div className="history-count">

          <strong>
            {sessions.length}
          </strong>

          <span>
            Sessions
          </span>

        </div>

      </div>

      {sessions.length === 0 ? (

        <div className="history-no-sessions">
          No previous sessions for this patient.
        </div>

      ) : (

        <>

          {/* GRAPH */}

          <div className="history-graph-section">

            <div className="history-section-title">

              <div>

                <h4>
                  Pain Score Trend
                </h4>

                <p>
                  Before and after treatment
                </p>

              </div>

              <div className="graph-legend">

                <span>
                  <i></i>
                  Before
                </span>

                <span>
                  <i></i>
                  After
                </span>

              </div>

            </div>

            <PainGraph
              sessions={sessions}
            />

          </div>

          {/* TABLE */}

          <div className="session-history-section">

            <div className="history-section-title">

              <div>

                <h4>
                  Previous Sessions
                </h4>

                <p>
                  Complete treatment history
                </p>

              </div>

            </div>

            <div className="history-table-wrapper">

              <table className="history-table-new">

                <thead>

                  <tr>

                    <th>
                      Session
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Pain Before
                    </th>

                    <th>
                      Pain After
                    </th>

                    <th>
                      Carrier
                    </th>

                    <th>
                      Beat
                    </th>

                    <th>
                      Current
                    </th>

                    <th>
                      Duration
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {sessions.map(
                    (
                      session,
                      index
                    ) => (

                      <tr
                        key={
                          session.id
                        }
                      >

                        <td>

                          <strong>
                            Session{" "}
                            {index + 1}
                          </strong>

                        </td>

                        <td>

                          {formatDate(
                            session.date
                          )}

                          <small>
                            {formatTime(
                              session.date
                            )}
                          </small>

                        </td>

                        <td>

                          <span className="pain-value before">
                            {
                              session.painBefore
                            }
                            /10
                          </span>

                        </td>

                        <td>

                          <span className="pain-value after">
                            {
                              session.painAfter
                            }
                            /10
                          </span>

                        </td>

                        <td>
                          {
                            session.carrierFrequency
                          }{" "}
                          Hz
                        </td>

                        <td>
                          {
                            session.beatFrequency
                          }{" "}
                          Hz
                        </td>

                        <td>
                          {
                            session.intensity
                          }{" "}
                          mA
                        </td>

                        <td>
                          {
                            session.duration
                          }{" "}
                          min
                        </td>

                        <td>

                          <span className="completed-badge">
                            ✓ Completed
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

    </section>
  );
}

/* =========================================================
   PAIN GRAPH
========================================================= */

function PainGraph({
  sessions,
}) {
  const width = 700;
  const height = 240;

  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const graphWidth =
    width -
    paddingLeft -
    paddingRight;

  const graphHeight =
    height -
    paddingTop -
    paddingBottom;

  const xStep =
    sessions.length > 1
      ? graphWidth /
        (sessions.length - 1)
      : graphWidth;

  const getX = (index) =>
    sessions.length === 1
      ? paddingLeft +
        graphWidth / 2
      : paddingLeft +
        index * xStep;

  const getY = (score) =>
    paddingTop +
    graphHeight -
    (Number(score || 0) / 10) *
      graphHeight;

  const beforePoints =
    sessions
      .map(
        (
          session,
          index
        ) =>
          `${getX(index)},${getY(
            session.painBefore
          )}`
      )
      .join(" ");

  const afterPoints =
    sessions
      .map(
        (
          session,
          index
        ) =>
          `${getX(index)},${getY(
            session.painAfter
          )}`
      )
      .join(" ");

  return (
    <div className="pain-graph">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >

        {/* GRID */}

        {[0, 2, 4, 6, 8, 10].map(
          (value) => (

            <g key={value}>

              <line
                x1={paddingLeft}
                x2={
                  width -
                  paddingRight
                }
                y1={getY(value)}
                y2={getY(value)}
                className="graph-grid-line"
              />

              <text
                x={
                  paddingLeft - 10
                }
                y={
                  getY(value) + 4
                }
                textAnchor="end"
                className="graph-label"
              >
                {value}
              </text>

            </g>

          )
        )}

        {/* BEFORE */}

        {sessions.length > 1 && (
          <polyline
            points={beforePoints}
            fill="none"
            className="graph-line-before"
          />
        )}

        {/* AFTER */}

        {sessions.length > 1 && (
          <polyline
            points={afterPoints}
            fill="none"
            className="graph-line-after"
          />
        )}

        {/* BEFORE POINTS */}

        {sessions.map(
          (
            session,
            index
          ) => (

            <circle
              key={`before-${session.id}`}
              cx={getX(index)}
              cy={getY(
                session.painBefore
              )}
              r="4"
              className="graph-point-before"
            />

          )
        )}

        {/* AFTER POINTS */}

        {sessions.map(
          (
            session,
            index
          ) => (

            <circle
              key={`after-${session.id}`}
              cx={getX(index)}
              cy={getY(
                session.painAfter
              )}
              r="4"
              className="graph-point-after"
            />

          )
        )}

        {/* X LABELS */}

        {sessions.map(
          (
            session,
            index
          ) => (

            <text
              key={`label-${session.id}`}
              x={getX(index)}
              y={
                height - 15
              }
              textAnchor="middle"
              className="graph-label"
            >
              S{index + 1}
            </text>

          )
        )}

      </svg>

    </div>
  );
}

/* =========================================================
   SAFETY POPUP
========================================================= */

function SafetyPopup({
  onCancel,
  onConfirm,
}) {
  return (
    <div className="warning-overlay">

      <div className="warning-popup">

        <div className="warning-header">

          <div className="warning-icon">
            !
          </div>

          <div>

            <h2>
              Safety Screening
            </h2>

            <p>
              Consult a qualified clinician before treatment.
            </p>

          </div>

          <button
            className="warning-close"
            onClick={onCancel}
          >
            ×
          </button>

        </div>

        <div className="warning-content">

          <p className="warning-intro">
            Before starting IFT treatment, confirm
            that the patient has been appropriately
            screened.
          </p>

          <ul>

            <li>
              Do not use over or near implanted
              electronic devices unless cleared by
              an appropriate clinician.
            </li>

            <li>
              Do not apply electrodes over areas
              where treatment is contraindicated.
            </li>

            <li>
              Use additional caution where sensation
              or circulation may be impaired.
            </li>

            <li>
              Follow the prescribed clinical protocol
              and device operating instructions.
            </li>

            <li>
              Stop treatment if the patient experiences
              unusual pain, discomfort or other
              concerning symptoms.
            </li>

          </ul>

          <div className="warning-danger">

            <strong>
              Important:
            </strong>{" "}

            This application provides a
            treatment-workflow interface and should
            not replace professional clinical
            assessment or the device manufacturer's
            instructions.

          </div>

          <div className="warning-note">

            <strong>
              Safety screening — consult a qualified clinician
            </strong>

            <p>
              Confirm the treatment is appropriate
              for this patient before proceeding.
            </p>

          </div>

        </div>

        <div className="warning-actions">

          <button
            className="secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={onConfirm}
          >
            Confirm & Start Session
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsModal({
  username,
  onClose,
}) {
  return (
    <div className="warning-overlay">

      <div className="settings-modal">

        <div className="settings-header">

          <div>

            <h2>
              Settings
            </h2>

            <p>
              Workspace settings
            </p>

          </div>

          <button
            className="warning-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="settings-content">

          <div className="settings-row">

            <div>

              <strong>
                Account
              </strong>

              <span>
                Currently signed in as{" "}
                {username}
              </span>

            </div>

          </div>

          <div className="settings-row">

            <div>

              <strong>
                System Status
              </strong>

              <span>
                Frontend workspace ready
              </span>

            </div>

            <span className="settings-status">
              Ready
            </span>

          </div>

          <div className="settings-row">

            <div>

              <strong>
                Data Storage
              </strong>

              <span>
                Session data is currently
                stored locally in this browser.
              </span>

            </div>

          </div>

          <div className="settings-info">

            Backend and ESP32 communication can
            be connected to these existing controls
            later without changing the treatment
            workflow.

          </div>

        </div>

        <div className="settings-footer">

          <button
            className="primary-button"
            onClick={onClose}
          >
            Done
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default App;