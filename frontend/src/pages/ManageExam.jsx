import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ManageExam() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [qForm, setQForm] = useState({
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
  });

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const [examRes, qRes] = await Promise.all([
        api.get(`/exams/${id}`),
        api.get(`/questions/exam/${id}`),
      ]);
      setExam(examRes.data.exam);
      setQuestions(qRes.data.questions);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exam.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        exam: id,
        questionText: qForm.questionText,
        questionType: qForm.questionType,
        correctAnswer: qForm.correctAnswer,
        marks: Number(qForm.marks),
        options: qForm.questionType === 'short-answer' ? [] : qForm.options.filter((o) => o.trim() !== ''),
      };
      await api.post('/questions', payload);
      setQForm({ questionText: '', questionType: 'mcq', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add question.');
    }
  };

  const handleDeleteQuestion = async (qid) => {
    if (!confirm('Remove this question?')) return;
    try {
      await api.delete(`/questions/${qid}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!exam) return <div className="container"><p>Exam not found.</p></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>{exam.title}</h2>
          <p>{exam.subject} · {exam.duration} min · {exam.totalMarks} marks · <span className={`status-badge status-${exam.status}`}>{exam.status}</span></p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost">Back to dashboard</Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="page-header">
        <h3 style={{ margin: 0 }}>Questions ({questions.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add question'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleAddQuestion}>
            <div className="form-group">
              <label>Question text</label>
              <textarea
                required
                rows={2}
                value={qForm.questionText}
                onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                placeholder="e.g. What is the time complexity of binary search?"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Question type</label>
                <select
                  value={qForm.questionType}
                  onChange={(e) => setQForm({ ...qForm, questionType: e.target.value })}
                >
                  <option value="mcq">Multiple choice</option>
                  <option value="true-false">True / False</option>
                  <option value="short-answer">Short answer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Marks</label>
                <input
                  type="number"
                  min={1}
                  value={qForm.marks}
                  onChange={(e) => setQForm({ ...qForm, marks: e.target.value })}
                />
              </div>
            </div>

            {qForm.questionType === 'mcq' && (
              <div className="form-group">
                <label>Options</label>
                {qForm.options.map((opt, i) => (
                  <input
                    key={i}
                    style={{ marginBottom: 8 }}
                    value={opt}
                    placeholder={`Option ${i + 1}`}
                    onChange={(e) => {
                      const newOptions = [...qForm.options];
                      newOptions[i] = e.target.value;
                      setQForm({ ...qForm, options: newOptions });
                    }}
                  />
                ))}
              </div>
            )}

            {qForm.questionType === 'true-false' && (
              <div className="form-group">
                <label>Correct answer</label>
                <select
                  value={qForm.correctAnswer}
                  onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            )}

            {qForm.questionType !== 'true-false' && (
              <div className="form-group">
                <label>Correct answer {qForm.questionType === 'mcq' && '(must match one option exactly)'}</label>
                <input
                  required
                  value={qForm.correctAnswer}
                  onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                  placeholder="Exact correct answer"
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary">Save question</button>
          </form>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="empty-state">No questions yet. Add your first question above.</div>
      ) : (
        <div>
          {questions.map((q, i) => (
            <div className="question-item" key={q._id}>
              <div className="question-item-header">
                <span>Q{i + 1} · {q.questionType} · {q.marks} mark(s)</span>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q._id)}>
                  Delete
                </button>
              </div>
              <p style={{ color: 'var(--text)', marginBottom: 8 }}>{q.questionText}</p>
              {q.options?.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {q.options.map((opt, oi) => (
                    <li key={oi} style={{ color: opt === q.correctAnswer ? 'var(--success)' : undefined }}>
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
