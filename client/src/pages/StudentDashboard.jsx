import { useEffect, useState } from 'react';
import api from '../services/api';

export default function StudentDashboard() {
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    passType: 'Entry',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    purpose: 'College Attendance / Gate Access',
    destination: 'Main Campus Gate'
  });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setError('');
      const [r1, r2] = await Promise.all([api.get('/passes/my'), api.get('/passes/profile')]);
      setRequests(r1.data.requests);
      setProfile(r2.data.profile);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load dashboard.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePhotoUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await api.put('/passes/profile', { photoUrl: reader.result });
      load();
    };
    reader.readAsDataURL(file);
  };

  const saveAcademicInfo = async e => {
    e.preventDefault();
    await api.put('/passes/profile', {
      rollNo: profile.roll_no,
      course: profile.course,
      branch: profile.branch,
      section: profile.section
    });
    setMessage('Student ID details saved.');
    load();
  };

  const submit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await api.post('/passes', form);
      setMessage(data.message);
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to generate pass.');
    }
  };

  return (
    <div className="section-width dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">STUDENT DIGITAL ID & PASS PORTAL</div>
          <h1>CampusPass Center</h1>
          <p className="muted">All passes generate a single-use anti-proxy QR code immediately.</p>
        </div>
        <div className="status-card">
          <span>Active Passes</span>
          <b>{requests.filter(r => r.status === 'approved').length}</b>
        </div>
      </div>

      {profile && (
        <section className="panel" style={{ marginBottom: '20px' }}>
          <div className="panel-head">
            <h2>Student Gate Verification Profile</h2>
            <span className="tag">{profile.photo_url ? 'PHOTO VERIFIED' : 'UPLOAD PHOTO'}</span>
          </div>
          <form onSubmit={saveAcademicInfo} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Student" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #22c55e' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#1e293b', display: 'grid', placeItems: 'center', fontSize: '0.75rem', textAlign: 'center' }}>No Photo</div>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ marginTop: '6px', maxWidth: '180px', fontSize: '0.75rem' }} />
            </div>
            <input placeholder="Roll No" value={profile.roll_no || ''} onChange={e => setProfile({ ...profile, roll_no: e.target.value })} style={{ maxWidth: '140px' }} />
            <input placeholder="Course (B.Tech)" value={profile.course || ''} onChange={e => setProfile({ ...profile, course: e.target.value })} style={{ maxWidth: '130px' }} />
            <input placeholder="Branch (CSE)" value={profile.branch || ''} onChange={e => setProfile({ ...profile, branch: e.target.value })} style={{ maxWidth: '120px' }} />
            <input placeholder="Section (A)" value={profile.section || ''} onChange={e => setProfile({ ...profile, section: e.target.value })} style={{ maxWidth: '100px' }} />
            <button className="small-btn" type="submit">Save ID Info</button>
          </form>
        </section>
      )}

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>Generate Instant QR Pass</h2>
            <span className="tag">AUTO-APPROVED</span>
          </div>
          <form onSubmit={submit} className="grid-form">
            <label>Pass Type
              <select value={form.passType} onChange={e => setForm({ ...form, passType: e.target.value })}>
                <option value="Entry">Entry (Marks Gate Attendance)</option>
                <option value="Exit">Exit</option>
              </select>
            </label>
            <label>Date
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </label>
            <label>Time
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </label>
            <label>Gate / Destination
              <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
            </label>
            <label className="full-span">Purpose
              <input required value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
            </label>
            <button className="primary-btn full-span" type="submit">Generate Single-Use QR Pass</button>
          </form>
          {message && <div className="info-box">{message}</div>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>My QR Passes</h2>
            <button className="small-btn" onClick={load}>Refresh</button>
          </div>
          {error && <div className="error-box">{error}</div>}
          {!requests.length ? (
            <div className="empty"><b>No passes yet</b><p>Generate your instant Entry or Exit QR pass.</p></div>
          ) : (
            <div className="request-list">
              {requests.map(r => (
                <div className="request-row" key={r.id}>
                  <div>
                    <b>{r.pass_type} Pass · {String(r.request_date).slice(0, 10)} ({String(r.request_time).slice(0, 5)})</b>
                    <small>{r.destination} · {r.purpose}</small>
                    {r.qr_image && (
                      <div className="pass-qr">
                        <img src={r.qr_image} alt="QR pass" />
                        <div>
                          <small>Single-Use Pass Code</small>
                          <strong>{r.pass_code}</strong>
                          <small style={{ display: 'block', color: r.status === 'verified' ? '#f87171' : '#4ade80' }}>
                            {r.status === 'verified' ? 'USED (Cannot be reused)' : 'ACTIVE (Ready for Gate Scan)'}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`status status-${r.status}`}>{r.status === 'verified' ? 'USED' : r.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
