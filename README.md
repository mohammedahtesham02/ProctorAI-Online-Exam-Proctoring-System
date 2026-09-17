# AI-Based Online Exam Proctoring System — Full Stack (MERN)

A complete exam proctoring system: React frontend, Express/Node backend, MongoDB database.

## What's included

```
exam-proctoring-system/
├── backend/          Express API + MongoDB models (Mongoose)
├── frontend/          React app (Vite) — login, dashboards, exam builder, live proctoring
└── README.md          (this file)
```

**Features:**
- Role-based accounts: Admin, Teacher, Student
- Teachers create exams and add MCQ / True-False / Short-answer questions
- Students take exams with live webcam preview, fullscreen enforcement, timer, and autosave
- Real-time violation detection: tab switching, window blur, fullscreen exit, right-click, copy attempts
- Automatic cheating-percentage scoring and auto-submit when a violation limit is crossed
- Teacher results dashboard with per-student violation logs
- Email report generation (via SMTP/Nodemailer)

---

## Prerequisites

- **Node.js** v18+ (check with `node -v`)
- **MongoDB** — either:
  - A free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), or
  - MongoDB installed locally ([mongodb.com/try/download/community](https://www.mongodb.com/try/download/community))

---

## Step 1 — Set up the backend

```bash
cd backend
npm install
```

Copy the environment template and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/exam_proctoring
PORT=5000
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```
- If using MongoDB Atlas, paste your connection string as `MONGO_URI` instead.
- `JWT_SECRET` can be any random long string — e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one.
- SMTP settings are only needed for the "email report" feature — the rest of the app works without them. For Gmail, you need an **App Password** (enable 2FA, then create one at https://myaccount.google.com/apppasswords).

Start the backend:
```bash
npm start
```
You should see:
```
Server running on port 5000
MongoDB Connected: ...
```
Leave this terminal running.

---

## Step 2 — Set up the frontend

Open a **new terminal**:
```bash
cd frontend
npm install
```

Copy the environment template:
```bash
cp .env.example .env
```
The default `VITE_API_URL=http://localhost:5000/api` already matches the backend — no changes needed unless you deploy the backend elsewhere.

Start the frontend:
```bash
npm run dev
```
Open the URL it prints — usually **http://localhost:5173**

---

## Step 3 — Try it out

1. Go to `/register` and create a **teacher** account.
2. Create a second account as a **student** (use a different browser or incognito tab, since only one login is active per browser).
3. As the teacher: click **Create exam**, fill in the schedule and proctoring rules, save, then **Add questions**.
4. As the student: the exam will show up on the dashboard once its start/end time is valid. Click **Start exam** — allow webcam access when prompted, and try switching tabs or exiting fullscreen to see violations logged live.
5. Submit the exam, then switch back to the teacher account and open **Results** on that exam to see the score, violation count, and cheating percentage. "Email report" sends a summary if SMTP is configured.

> Note: in the current version, exams are visible to any logged-in student for simplicity (the `allowedStudents` field exists in the schema for restricting access — wire it up in `examController.js` if your project needs per-student assignment).

---

## Project structure reference

**Backend** (`backend/`):
```
config/db.js              MongoDB connection
models/                   Mongoose schemas: User, Exam, Question, Submission, ViolationLog, Report
middleware/auth.js        JWT verification + role-based access control
controllers/              Business logic for each resource
routes/                   Express route definitions
server.js                 App entry point
```

**Frontend** (`frontend/`):
```
src/api/axios.js          Configured HTTP client (attaches JWT automatically)
src/context/AuthContext.jsx   Login state, shared across the app
src/components/           Navbar, route guard
src/pages/                Login, Register, Dashboard, CreateExam, ManageExam, TakeExam, ExamResults
```

---

## Troubleshooting

- **"MongoDB Connected" never appears / connection error** → check `MONGO_URI` in `backend/.env`, and that MongoDB is actually running (`mongod` if local) or your Atlas IP allowlist includes your machine.
- **Frontend loads but API calls fail (network error)** → make sure the backend terminal is still running on port 5000, and `VITE_API_URL` in `frontend/.env` matches.
- **Webcam doesn't show** → browsers block camera access on non-HTTPS origins except `localhost`, so this works fine locally but will need HTTPS if you deploy.
- **Email report fails** → this only affects the "Email report" button; everything else works without SMTP configured. Double check the Gmail App Password if using Gmail.
- **CORS errors** → the backend already has `cors()` enabled for all origins; if you changed ports, restart both servers after editing `.env`.
