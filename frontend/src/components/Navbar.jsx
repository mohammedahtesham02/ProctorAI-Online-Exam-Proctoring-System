import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-dot" />
        ProctorAI
      </Link>
      {user && (
        <div className="navbar-right">
          {user.role === 'student' && (
            <Link to="/my-exams" className="btn btn-ghost">
              My Exams
            </Link>
          )}
          <span className="navbar-user">
            {user.name} <span className="role-badge">{user.role}</span>
          </span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}