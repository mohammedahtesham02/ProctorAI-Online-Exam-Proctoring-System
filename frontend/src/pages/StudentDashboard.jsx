import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/exams')
      .then(({ data }) => setExams(data.exams))
      .catch((err) => setError(err.response?.data?.message || 'Could not load exams.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Available exams</h2>
          <p>Exams scheduled for you. Make sure your webcam is working before you start.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading exams...</p>
      ) : exams.length === 0 ? (
        <div className="empty-state">No exams assigned to you right now.</div>
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
                  <span>Starts {new Date(exam.startTime).toLocaleString()}</span>
                </div>
              </div>
              <Link to={`/exams/${exam._id}/take`} className="btn btn-primary btn-sm">
                Start exam
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
