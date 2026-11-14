import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const googleError = new URLSearchParams(location.search).get('error') === 'google';

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      nav(
        user.role === 'student'
          ? '/student'
          : user.role === 'admin'
          ? '/admin'
          : user.role === 'teacher'
          ? '/teacher'
          : '/security'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="eyebrow">CAMPUSPASS SECURE SIGN IN</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in with your Google account or CampusPass credentials.</p>

        {(error || googleError) && (
          <div className="error-box">
            {error || 'Google authentication failed. Check GOOGLE_CLIENT_ID and SECRET in server/.env.'}
          </div>
        )}

        <button
          type="button"
          className="secondary-btn full"
          onClick={handleGoogleLogin}
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 600 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
            <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.8z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ textAlign: 'center', margin: '12px 0', opacity: 0.6, fontSize: '0.85rem' }}>OR SIGN IN WITH EMAIL</div>

        <form onSubmit={submit}>
          <label>Email
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@campus.edu"
            />
          </label>
          <label>Password
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </label>
          <button className="primary-btn full" type="submit">Sign In</button>
        </form>

        <p className="auth-switch">New to CampusPass? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
