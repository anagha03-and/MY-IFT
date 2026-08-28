const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


// =====================================================
// PATIENT APIs
// =====================================================

export async function createPatient(patient) {
  const response = await fetch(`${API_URL}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patient),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to create patient"
    );
  }

  return data.patient;
}


export async function getPatients() {
  const response = await fetch(
    `${API_URL}/patients`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load patients"
    );
  }

  return data.patients;
}


export async function getPatient(patientId) {
  const response = await fetch(
    `${API_URL}/patients/${encodeURIComponent(patientId)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load patient"
    );
  }

  return data.patient;
}


// =====================================================
// SESSION APIs
// =====================================================

export async function createSession(session) {
  const response = await fetch(
    `${API_URL}/sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to create session"
    );
  }

  return data.session;
}


export async function getSessions(patientId) {
  const response = await fetch(
    `${API_URL}/sessions/${encodeURIComponent(patientId)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load sessions"
    );
  }

  return data.sessions;
}


export async function getAllSessions() {
  const response = await fetch(
    `${API_URL}/sessions`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load sessions"
    );
  }

  return data.sessions;
}


// =====================================================
// REPORT UPLOAD
// =====================================================

export async function uploadReport(
  patientId,
  file
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/upload-report?patient_id=${encodeURIComponent(
      patientId
    )}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to upload report"
    );
  }

  return data;
}