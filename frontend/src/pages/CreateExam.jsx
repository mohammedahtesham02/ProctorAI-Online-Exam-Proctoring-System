import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateExam() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    startTime: '',
    endTime: '',
    tabSwitchLimit: 3,
    webcamRequired: true,
    fullscreenRequired: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
  if (!studentSearch.trim()) {
    setStudentResults([]);
    return;
  }
  const timeout = setTimeout(async () => {
    try {
      const { data } = await api.get(`/users/students?search=${encodeURIComponent(studentSearch)}`);
      setStudentResults(data.students);
    } catch {
      setStudentResults([]);
    }
  }, 400);
  return () => clearTimeout(timeout);
}, [studentSearch]);

const addStudent = (student) => {
  if (!selectedStudents.find((s) => s._id === student._id)) {
    setSelectedStudents([...selectedStudents, student]);
  }
  setStudentSearch('');
  setStudentResults([]);
};

const removeStudent = (id) => {
  setSelectedStudents(selectedStudents.filter((s) => s._id !== id));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/exams', {
        title: form.title,
        subject: form.subject,
        description: form.description,
        duration: Number(form.duration),
        startTime: form.startTime,
        endTime: form.endTime,
        allowedStudents: selectedStudents.map((s) => s._id),
        status: 'scheduled',
        proctoringSettings: {
          webcamRequired: form.webcamRequired,
          fullscreenRequired: form.fullscreenRequired,
          tabSwitchLimit: Number(form.tabSwitchLimit),
          faceDetectionRequired: true,
          autoSubmitOnViolationLimit: true,
        },
      });
      navigate(`/exams/${data.exam._id}/manage`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create exam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h2>Create exam</h2>
          <p>Set up the exam details and proctoring rules.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Exam title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Data Structures Midterm"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. CS301"
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                required
                min={5}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes for students"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start time</label>
              <input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End time</label>
              <input
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tab-switch limit before auto-submit</label>
            <input
              type="number"
              min={1}
              value={form.tabSwitchLimit}
              onChange={(e) => setForm({ ...form, tabSwitchLimit: e.target.value })}
            />
          </div>

          <div className="form-row" style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={form.webcamRequired}
                onChange={(e) => setForm({ ...form, webcamRequired: e.target.checked })}
              />
              Require webcam
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={form.fullscreenRequired}
                onChange={(e) => setForm({ ...form, fullscreenRequired: e.target.checked })}
              />
              Require fullscreen
            </label>
          </div>
          <div className="form-group">
  <label>Allowed students (search by USN or name)</label>
  <input
    value={studentSearch}
    onChange={(e) => setStudentSearch(e.target.value)}
    placeholder="e.g. 1CS21CS045 or student name"
  />
  {studentResults.length > 0 && (
    <div style={{ border: '1px solid #444', borderRadius: 6, marginTop: 4 }}>
      {studentResults.map((s) => (
        <div
          key={s._id}
          onClick={() => addStudent(s)}
          style={{ padding: 8, cursor: 'pointer' }}
        >
          {s.name} — {s.studentId || 'no USN'} ({s.email})
        </div>
      ))}
    </div>
  )}
  {selectedStudents.length > 0 && (
    <div style={{ marginTop: 10 }}>
      {selectedStudents.map((s) => (
        <span
          key={s._id}
          style={{
            display: 'inline-block',
            margin: '4px 6px 0 0',
            padding: '4px 10px',
            borderRadius: 12,
            background: '#333',
          }}
        >
          {s.name} ({s.studentId || 'no USN'})
          <button
            type="button"
            onClick={() => removeStudent(s._id)}
            style={{ marginLeft: 6, cursor: 'pointer' }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )}
  <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 6 }}>
    Leave empty to allow no students (you must add at least one).
  </p>
</div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create exam — next, add questions'}
          </button>
        </form>
      </div>
    </div>
  );
}
