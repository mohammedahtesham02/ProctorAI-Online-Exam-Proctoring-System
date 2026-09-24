import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MyExams() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/submissions/my');
        setSubmissions(data.submissions);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your exam history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="container"><p>Loading your exam history...</p></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h2>My exams</h2>
        <p>Your past exam attempts, scores, and cheating percentage.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {submissions.length === 0 ? (
        <p>You haven't attempted any exams yet.</p>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 6px' }}>Exam</th>
                <th style={{ padding: '8px 6px' }}>Subject</th>
                <th style={{ padding: '8px 6px' }}>Score</th>
                <th style={{ padding: '8px 6px' }}>Cheating %</th>
                <th style={{ padding: '8px 6px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 6px' }}>{s.exam?.title || '—'}</td>
                  <td style={{ padding: '8px 6px' }}>{s.exam?.subject || '—'}</td>
                  <td style={{ padding: '8px 6px' }}>
                    {s.status === 'in-progress' ? '—' : `${s.score} / ${s.exam?.totalMarks ?? '—'}`}
                  </td>
                  <td style={{ padding: '8px 6px' }}>{s.cheatingPercentage}%</td>
                  <td style={{ padding: '8px 6px' }}>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}