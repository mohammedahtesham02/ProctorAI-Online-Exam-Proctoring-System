import { useAuth } from '../context/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'student') return <StudentDashboard />;
  // teacher and admin share the same management view
  return <TeacherDashboard />;
}
