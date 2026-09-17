import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data.exams);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter((ex) => ex._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Your exams</h2>
          <p>Create, schedule, and review results for your exams.</p>
        </div>
        <Link to="/exams/create" className="btn btn-primary">
          + Create exam
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading exams...</p>
      ) : exams.length === 0 ? (
        <div className="empty-state">No exams yet. Create your first one to get started.</div>
      ) : (
        <div className="card-list">
          {exams.map((exam) => (
            <div className="exam-card" key={exam._id}>
              <div className="exam-card-info">
                <h3>{exam.title}</h3>
                <span className={`status-badge status-${exam.status}`}>{exam.status}</span>
                <div className="exam-meta">
                  <span>{exam.subject}</span>
                  <span>{exam.duration} min</span>
                  <span>{exam.totalMarks} marks</span>
                  <span>{new Date(exam.startTime).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/exams/${exam._id}/manage`} className="btn btn-ghost btn-sm">
                  Manage
                </Link>
                <Link to={`/exams/${exam._id}/results`} className="btn btn-ghost btn-sm">
                  Results
                </Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exam._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
