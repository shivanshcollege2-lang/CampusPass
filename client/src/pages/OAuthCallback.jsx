import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const loc = useLocation();
  const nav = useNavigate();
  const { setSession } = useAuth();

  useEffect(() => {
    const p = new URLSearchParams(loc.search);
    const token = p.get('token');
    const role = p.get('role');
    if (token && role) {
      const user = {
        id: `google-${p.get('email')}`,
        name: p.get('name') || 'Google User',
        email: p.get('email') || '',
        role
      };
      setSession(token, user);
      nav(role === 'admin' ? '/admin' : role === 'security' ? '/security' : '/student', { replace: true });
    } else {
      nav('/login?error=google', { replace: true });
    }
  }, [loc.search, nav, setSession]);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="eyebrow">AUTHENTICATING</div>
        <h1>Completing Google sign in…</h1>
        <p className="muted">Please wait while CampusPass verifies your Google account.</p>
      </div>
    </div>
  );
}
