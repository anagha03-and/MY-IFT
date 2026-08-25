import { useState } from "react";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    condition: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addPatient = (e) => {
    e.preventDefault();

    const newPatient = {
      id: Date.now(),
      ...formData,
    };

    setPatients([...patients, newPatient]);

    setFormData({
      name: "",
      age: "",
      gender: "",
      phone: "",
      condition: "",
    });

    setShowForm(false);
  };

  return (
    <div className="patients-page">

      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>Manage patient information and treatment records</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          + Add Patient
        </button>
      </div>

      {showForm && (
        <div className="patient-form-card">

          <h2>Add New Patient</h2>

          <form onSubmit={addPatient}>

            <div className="form-grid">

              <div>
                <label>Patient Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div>
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  required
                />
              </div>

              <div>
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="full-width">
                <label>Medical Condition</label>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  placeholder="Example: Lower back pain"
                  required
                />
              </div>

            </div>

            <div className="form-buttons">
              <button type="submit" className="primary-button">
                Save Patient
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      )}

      <div className="patients-card">

        <h2>Patient List</h2>

        {patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No patients added yet</h3>
            <p>
              Click "Add Patient" to create your first patient record.
            </p>
          </div>
        ) : (
          <div className="patient-list">

            {patients.map((patient) => (
              <div className="patient-row" key={patient.id}>

                <div className="patient-avatar">
                  {patient.name.charAt(0).toUpperCase()}
                </div>

                <div className="patient-details">
                  <h3>{patient.name}</h3>
                  <p>
                    {patient.age} years • {patient.gender}
                  </p>
                </div>

                <div className="patient-condition">
                  <strong>Condition</strong>
                  <span>{patient.condition}</span>
                </div>

                <div className="patient-phone">
                  {patient.phone || "No phone"}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default Patients;