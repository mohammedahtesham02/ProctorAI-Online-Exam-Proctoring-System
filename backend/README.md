# Database Design — AI-Based Online Exam Proctoring System

MongoDB / Mongoose schema for the MERN version of the project.

## Setup

```bash
npm install express mongoose bcryptjs jsonwebtoken dotenv cors nodemailer
```

1. Copy `.env.example` to `.env` and fill in your values (MongoDB URI, JWT secret, SMTP credentials for email reports).
2. Run the server:
```bash
node server.js
```
You should see `Server running on port 5000` and `MongoDB Connected: ...`.

Use a MongoDB Atlas connection string in `MONGO_URI` for a hosted database, or `mongodb://localhost:27017/exam_proctoring` if running MongoDB locally.

## API Routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user (student/teacher/admin) |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private | Get logged-in user |
| POST | `/api/exams` | Teacher/Admin | Create exam |
| GET | `/api/exams` | Private | List exams (role-filtered) |
| GET | `/api/exams/:id` | Private | Get exam + questions |
| PUT | `/api/exams/:id` | Teacher/Admin | Update exam |
| DELETE | `/api/exams/:id` | Teacher/Admin | Delete exam |
| POST | `/api/questions` | Teacher/Admin | Add question to exam |
| GET | `/api/questions/exam/:examId` | Private | Get questions (answers hidden for students) |
| POST | `/api/submissions/start` | Student | Begin an exam attempt |
| PUT | `/api/submissions/:id/answer` | Student | Autosave an answer |
| PUT | `/api/submissions/:id/submit` | Student | Final submit, auto-scored |
| GET | `/api/submissions/exam/:examId` | Teacher/Admin | All submissions for an exam |
| POST | `/api/violations` | Student | Log a proctoring violation (real-time) |
| GET | `/api/violations/exam/:examId` | Teacher/Admin | All violations for an exam |
| POST | `/api/reports/generate/:submissionId` | Teacher/Admin | Generate summary report |
| POST | `/api/reports/:id/email` | Teacher/Admin | Email the report |

All private routes require header: `Authorization: Bearer <token>` (token returned from login/register).

### Connecting your React frontend
In your React app, after login store the JWT (e.g. in state or a context), then attach it to every API call:
```js
fetch('http://localhost:5000/api/exams', {
  headers: { Authorization: `Bearer ${token}` }
});
```
For the live proctoring logic (tab-switch/fullscreen detection you already built), call `POST /api/violations` each time a violation event fires — the backend automatically updates the cheating percentage and auto-submits if the exam's configured limit is hit.

## Collections & Relationships

```
User (admin / teacher / student)
  |
  |-- creates -->  Exam
                     |-- has many -->  Question
                     |-- has many -->  Submission  (one per student per exam)
                                          |-- has many -->  ViolationLog
                                          |-- generates -->  Report
```

### 1. User
Stores all three roles (admin, teacher, student) in one collection, differentiated by `role`. Passwords are hashed automatically via a pre-save hook (bcrypt). Students get a unique `studentId`.

### 2. Exam
Created by a teacher/admin. Holds scheduling info (`startTime`, `endTime`, `duration`) and a `proctoringSettings` sub-object controlling webcam requirement, tab-switch limit, fullscreen requirement, etc. — this is what your frontend proctoring logic (violation detection, auto-submit) should read from.

### 3. Question
Linked to an `Exam` via `exam` ref. Supports MCQ, true/false, and short-answer types.

### 4. Submission
One document per student per exam (enforced by a unique compound index on `exam + student`). Tracks answers, score, and a **denormalized** `violationCount` / `cheatingPercentage` for fast dashboard reads — the detailed event-by-event log lives separately in `ViolationLog`.

### 5. ViolationLog
Every proctoring event (tab switch, fullscreen exit, no-face-detected, multiple-faces-detected, etc.) is logged here as its own document with a timestamp and severity. This is what your live camera/violation detection code should write to in real time. Indexed on `submission` and on `exam + student` for fast querying.

**Suggested cheating % calculation** (run after exam submission, or periodically):
```js
const weights = { low: 5, medium: 10, high: 20 };
const logs = await ViolationLog.find({ submission: submissionId });
const raw = logs.reduce((sum, log) => sum + weights[log.severity], 0);
const cheatingPercentage = Math.min(100, raw);
```

### 6. Report
Generated per submission, summarizing score + violation stats. Tracks whether/when an email report was sent and to whom — matches your existing "email reporting" feature.

## Example: creating an exam with questions

```js
const exam = await Exam.create({
  title: 'Data Structures Midterm',
  subject: 'CS301',
  createdBy: teacherId,
  duration: 60,
  startTime: new Date('2026-08-25T10:00:00'),
  endTime: new Date('2026-08-25T11:00:00'),
  proctoringSettings: { tabSwitchLimit: 3 },
});

const q1 = await Question.create({
  exam: exam._id,
  questionText: 'What is the time complexity of binary search?',
  options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
  correctAnswer: 'O(log n)',
  marks: 2,
});

exam.questions.push(q1._id);
await exam.save();
```

## Example: logging a violation in real time

```js
await ViolationLog.create({
  exam: examId,
  student: studentId,
  submission: submissionId,
  violationType: 'tab-switch',
  severity: 'medium',
});

await Submission.findByIdAndUpdate(submissionId, { $inc: { violationCount: 1 } });
```

## Files in this package

```
proctoring-db/
├── config/
│   └── db.js          # MongoDB connection
├── models/
│   ├── User.js
│   ├── Exam.js
│   ├── Question.js
│   ├── Submission.js
│   ├── ViolationLog.js
│   ├── Report.js
│   └── index.js        # exports all models together
└── README.md
```
