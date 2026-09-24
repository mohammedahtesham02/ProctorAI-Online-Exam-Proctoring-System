import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/CreateExam';
import ManageExam from './pages/ManageExam';
import ExamResults from './pages/ExamResults';
import MyExams from './pages/MyExams';
import TakeExam from './pages/TakeExam';

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
        path="/my-exams"
        element={
        <ProtectedRoute allowedRoles={['student']}>
        <MyExams />
        </ProtectedRoute>
        }
        />
        <Route
          path="/exams/create"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <CreateExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:id/manage"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <ManageExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:id/results"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <ExamResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:id/take"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <TakeExam />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
