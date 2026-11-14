import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    course: 'B.Tech',
    branch: 'CSE',
    section: 'A',
    phone: '',
    photoUrl: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const nav = useNavigate();

  const handlePhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      nav('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register.');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="eyebrow">CAMPUSPASS STUDENT ID REGISTRATION</div>
        <h1>Create Student Account</h1>
        <p className="muted">Upload a clear face photo for Security Gate verification and automatic attendance.</p>
        {error && <div className="error-box">{error}</div>}

        <button
          type="button"
          className="secondary-btn full"
          onClick={() => (window.location.href = 'http://localhost:5000/api/auth/google')}
          style={{ marginBottom: '14px', fontWeight: 600 }}
        >
          G · Continue with Google
        </button>

        <form onSubmit={submit}>
          <label>Full Name
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Shivansh Mittal" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Roll Number
              <input required value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })} placeholder="230101045" />
            </label>
            <label>Phone Number
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <label>Course
              <input required value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="B.Tech" />
            </label>
            <label>Branch
              <input required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="CSE" />
            </label>
            <label>Section / Class
              <input required value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="A" />
            </label>
          </div>
          <label>Campus Email
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@campus.edu" />
          </label>
          <label>Password
            <input type="password" minLength="6" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </label>
          <label>Student Face Photo (Required for Gate Security Check)
            <input type="file" accept="image/*" required onChange={handlePhoto} />
          </label>
          {form.photoUrl && (
            <img src={form.photoUrl} alt="Preview" style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px', border: '2px solid #6366f1' }} />
          )}
          <button className="primary-btn full" type="submit">Create Student Account</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
