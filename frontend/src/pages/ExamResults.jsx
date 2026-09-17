import { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ExamResults() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [violations, setViolations] = useState([]);
  const [genLoading, setGenLoading] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const [examRes, subRes] = await Promise.all([
        api.get(`/exams/${id}`),
        api.get(`/submissions/exam/${id}`),
      ]);
      setExam(examRes.data.exam);
      setSubmissions(subRes.data.submissions);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load results.');
    } finally {
      setLoading(false);
    }
  };

  const toggleViolations = async (submissionId) => {
    if (expanded === submissionId) {
      setExpanded(null);
      return;
    }
    try {
      const { data } = await api.get(`/violations/submission/${submissionId}`);
      setViolations(data.violations);
      setExpanded(submissionId);
    } catch {
      alert('Could not load violations.');
    }
  };

  const handleGenerateReport = async (submissionId) => {
    setGenLoading(submissionId);
    try {
      const { data } = await api.post(`/reports/generate/${submissionId}`);
      await api.post(`/reports/${data.report._id}/email`, {});
      alert('Report generated and emailed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Report generation failed. Check SMTP config in backend .env.');
    } finally {
      setGenLoading(null);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  const flaggedStatus = (pct) => (pct >= 50 ? 'disqualified' : pct >= 20 ? 'flagged' : 'clean');

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>{exam?.title} — Results</h2>
          <p>{submissions.length} submission(s)</p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost">Back to dashboard</Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{submissions.length}</div>
          <div className="stat-label">Total submissions</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">
            {submissions.filter((s) => flaggedStatus(s.cheatingPercentage) === 'clean').length}
          </div>
          <div className="stat-label">Clean</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">
            {submissions.filter((s) => flaggedStatus(s.cheatingPercentage) !== 'clean').length}
          </div>
          <div className="stat-label">Flagged</div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">No submissions yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Score</th>
              <th>Status</th>
              <th>Violations</th>
              <th>Cheating %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <Fragment key={s._id}>
                <tr>
                  <td>{s.student?.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({s.student?.studentId})</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{s.score} / {exam?.totalMarks}</td>
                  <td><span className={`status-badge status-${s.status === 'auto-submitted' ? 'flagged' : 'clean'}`}>{s.status}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleViolations(s._id)}>
                      {s.violationCount} {expanded === s._id ? '▲' : '▼'}
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge status-${flaggedStatus(s.cheatingPercentage)}`}>
                      {s.cheatingPercentage}%
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleGenerateReport(s._id)}
                      disabled={genLoading === s._id}
                    >
                      {genLoading === s._id ? 'Sending...' : 'Email report'}
                    </button>
                  </td>
                </tr>
                {expanded === s._id && (
                  <tr>
                    <td colSpan={6} style={{ background: 'var(--surface-2)' }}>
                      {violations.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No violations logged.</span>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {violations.map((v) => (
                            <div key={v._id} style={{ padding: '4px 0', color: 'var(--text-muted)' }}>
                              {new Date(v.timestamp).toLocaleTimeString()} — {v.violationType} ({v.severity})
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
