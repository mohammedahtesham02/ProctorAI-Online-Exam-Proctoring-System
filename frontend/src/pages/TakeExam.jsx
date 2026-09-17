import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import * as faceapi from 'face-api.js';

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);

  const violationCountRef = useRef(0);
  const submissionIdRef = useRef(null);
  const submittedRef = useRef(false);

  // Load exam, questions, and create/resume submission
  useEffect(() => {
    const load = async () => {
      try {
        const examRes = await api.get(`/exams/${id}`);
        const qRes = await api.get(`/questions/exam/${id}`);
        setExam(examRes.data.exam);
        setQuestions(qRes.data.questions);
        setTimeLeft(examRes.data.exam.duration * 60);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load exam.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const beginExam = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      const { data } = await api.post('/submissions/start', { examId: id });
      setSubmission(data.submission);
      submissionIdRef.current = data.submission._id;
      setStarted(true);

      // request webcam
      if (exam?.proctoringSettings?.webcamRequired && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
          showToast('Webcam access denied — this will be flagged.');
        }
      }

      // request fullscreen
      if (exam?.proctoringSettings?.fullscreenRequired && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start exam.');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const logViolation = useCallback(
    async (violationType, severity = 'medium') => {
      if (!submissionIdRef.current || submittedRef.current) return;
      try {
        const { data } = await api.post('/violations', {
          examId: id,
          submissionId: submissionIdRef.current,
          violationType,
          severity,
        });
        violationCountRef.current = data.violationCount;
        showToast(`Violation detected: ${violationType.replace(/-/g, ' ')} (${data.violationCount})`);

       if (data.autoSubmitted) {
         submittedRef.current = true;
         try {
             const { data: subData } = await api.get(`/submissions/${submissionIdRef.current}`);
             setResult(subData.submission);
        } catch {
    // ignore fetch errors, still mark as submitted
     }
     setSubmitted(true);
     showToast('Violation limit reached — exam auto-submitted.');
}
      } catch {
        // fail silently on logging errors, don't block the student
      }
    },
    [id]
  );

  // Tab-switch / window-blur detection
  useEffect(() => {
    if (!started) return;

    const handleVisibility = () => {
      if (document.hidden) logViolation('tab-switch', 'medium');
    };
    const handleBlur = () => logViolation('window-blur', 'low');
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) logViolation('fullscreen-exit', 'high');
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation('right-click', 'low');
    };
    const handleCopy = (e) => {
      e.preventDefault();
      logViolation('copy-paste-attempt', 'low');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [started, logViolation]);

// Face detection
useEffect(() => {
  if (!started || submitted) return;
  const interval = setInterval(async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) return;
    try {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );
      if (detections.length === 0) {
        logViolation('no-face-detected', 'high');
      } else if (detections.length > 1) {
        logViolation('multiple-faces-detected', 'high');
      }
    } catch (e) {
      // ignore detection errors, don't block the exam
    }
  }, 5000);
  return () => clearInterval(interval);
}, [started, submitted, logViolation]);



  // Countdown timer + auto-submit at zero
  useEffect(() => {
    if (!started || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [started, timeLeft, submitted]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // autosave
    api.put(`/submissions/${submissionIdRef.current}/answer`, {
      questionId,
      answerGiven: value,
    }).catch(() => {});
  };

  const handleSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      await api.put(`/submissions/${submissionIdRef.current}/submit`);
      const { data } = await api.get(`/submissions/${submissionIdRef.current}`);
      setResult(data.submission);
      setSubmitted(true);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed.');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="container"><p>Loading exam...</p></div>;
  if (error && !started) return <div className="container"><div className="error-banner">{error}</div></div>;

  if (submitted) {
    return (
  <div className="container-narrow">
    <div className="auth-card">
      <h2>Exam submitted</h2>
      {!result ? (
        <p>Loading your results...</p>
      ) : (
        <>
          <p style={{ fontSize: '1.3rem', margin: '12px 0' }}>
            Score: <strong>{result.score}</strong> / {result.exam?.totalMarks ?? '—'}
          </p>
          {result.status === 'auto-submitted' && (
            <p style={{ color: '#e06666' }}>
              ⚠ This exam was auto-submitted due to violations.
            </p>
          )}
          <div style={{ margin: '14px 0', fontSize: '0.9rem', opacity: 0.85 }}>
            <div>Violations detected: {result.violationCount}</div>
            <div>Cheating percentage: {result.cheatingPercentage}%</div>
            {result.flaggedForReview && (
              <div style={{ color: '#e06666' }}>Flagged for teacher review</div>
            )}
          </div>
        </>
      )}
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </button>
    </div>
  </div>
);
  }

  if (!started) {
    return (
      <div className="container-narrow">
        <div className="auth-card">
          <h2>{exam?.title}</h2>
          <p>{exam?.description || 'No additional instructions provided.'}</p>
          <div style={{ margin: '18px 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>Duration: {exam?.duration} minutes</div>
            <div>Questions: {questions.length}</div>
            <div>Total marks: {exam?.totalMarks}</div>
            {exam?.proctoringSettings?.webcamRequired && <div>⚠ Webcam monitoring required</div>}
            {exam?.proctoringSettings?.fullscreenRequired && <div>⚠ Fullscreen mode required</div>}
            <div>⚠ Tab switches allowed before auto-submit: {exam?.proctoringSettings?.tabSwitchLimit}</div>
          </div>
          <button className="btn btn-primary btn-block" onClick={beginExam}>
            Begin exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-taking-shell">
      {exam?.proctoringSettings?.webcamRequired && (
        <div className="proctor-monitor">
          <video ref={videoRef} autoPlay muted playsInline />
          <div className="proctor-monitor-label">
            <span className="rec-dot" /> monitoring
          </div>
        </div>
      )}

      <div className="page-header" style={{ alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{exam?.title}</h2>
        <div className="exam-timer">{formatTime(timeLeft)}</div>
      </div>

      {questions.map((q, i) => (
        <div className="question-block" key={q._id}>
          <div className="question-number">Question {i + 1} · {q.marks} mark(s)</div>
          <p style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: 14 }}>{q.questionText}</p>

          {q.questionType === 'short-answer' ? (
            <textarea
              rows={3}
              value={answers[q._id] || ''}
              onChange={(e) => handleAnswerChange(q._id, e.target.value)}
              placeholder="Type your answer..."
            />
          ) : q.questionType === 'true-false' ? (
            ['True', 'False'].map((opt) => (
              <label
                key={opt}
                className={`option-row ${answers[q._id] === opt ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={q._id}
                  checked={answers[q._id] === opt}
                  onChange={() => handleAnswerChange(q._id, opt)}
                />
                {opt}
              </label>
            ))
          ) : (
            q.options?.map((opt, oi) => (
              <label
                key={oi}
                className={`option-row ${answers[q._id] === opt ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={q._id}
                  checked={answers[q._id] === opt}
                  onChange={() => handleAnswerChange(q._id, opt)}
                />
                {opt}
              </label>
            ))
          )}
        </div>
      ))}

      <button className="btn btn-primary btn-block" onClick={handleSubmit}>
        Submit exam
      </button>

      {toast && <div className="violation-toast">{toast}</div>}
    </div>
  );
}
