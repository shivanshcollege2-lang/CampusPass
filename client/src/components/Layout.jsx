import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const homeRoute = user
    ? user.role === 'student'
      ? '/student'
      : user.role === 'admin'
      ? '/admin'
      : user.role === 'teacher'
      ? '/teacher'
      : '/security'
    : '/';

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to={homeRoute}>
          <span className="brand-mark">CP</span> CampusPass
        </Link>
        <div className="topbar-right">
          {user ? (
            <>
              <span className="user-pill">{user.name} · {user.role.toUpperCase()}</span>
              <button className="ghost-btn" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
            </>
          ) : (
            <>
              <Link className="ghost-btn link-btn" to="/login">Login</Link>
              <Link className="primary-btn link-btn" to="/register">Get Started</Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
