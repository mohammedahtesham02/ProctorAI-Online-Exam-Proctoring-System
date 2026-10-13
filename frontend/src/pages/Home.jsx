import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container" style={{ maxWidth: 720, textAlign: 'center', paddingTop: 60 }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 12 }}>ProctorAI</h1>
      <p style={{ fontSize: '1.1rem', opacity: 0.85, marginBottom: 32 }}>
        AI-assisted online examination and proctoring system. Teachers create and schedule
        exams; students take them under real-time, automated monitoring — all running
        securely in the browser.
      </p>

      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 48 }}>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
        <Link to="/register" className="btn btn-ghost">Create an account</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, textAlign: 'left' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem' }}>Live Proctoring</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Tab-switch, fullscreen, and webcam-based face detection monitored in real time.
          </p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem' }}>Auto-Grading</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            MCQ answers are graded instantly, with results shown right after submission.
          </p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem' }}>Violation Scoring</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Every exam attempt gets a cheating-percentage score, flagged for teacher review.
          </p>
        </div>
      </div>
    </div>
  );
}