import { useEffect, useState } from 'react';
import api from '../services/api';

export default function TeacherDashboard() {
  const [filters, setFilters] = useState({
    date: new Date().toISOString().slice(0, 10),
    course: '',
    branch: '',
    section: ''
  });
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  const load = async e => {
    e?.preventDefault();
    try {
      setError('');
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/passes/teacher/attendance?${params}`);
      setStudents(data.students);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load gate attendance.');
    }
  };

  useEffect(() => { load(); }, []);

  const presentCount = students.filter(s => s.gate_status === 'Present at Gate').length;

  return (
    <div className="section-width dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">FACULTY & CLASS ATTENDANCE AUDIT</div>
          <h1>Campus Gate Attendance vs. Bunk Check</h1>
          <p className="muted">Verify whether a student scanned their QR pass at the college main gate on a specific date.</p>
        </div>
        <div className="status-card">
          <span>Entered Gate</span>
          <b>{presentCount} / {students.length}</b>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: '20px' }}>
        <form onSubmit={load} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <label>Date
            <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          </label>
          <label>Course
            <input placeholder="e.g. B.Tech" value={filters.course} onChange={e => setFilters({ ...filters, course: e.target.value })} />
          </label>
          <label>Branch
            <input placeholder="e.g. CSE" value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })} />
          </label>
          <label>Class / Section
            <input placeholder="e.g. A" value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })} />
          </label>
          <button className="primary-btn" type="submit">Filter Class</button>
        </form>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="panel">
        <div className="panel-head"><h2>Student Gate Entry Status ({filters.date})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Course / Branch / Sec</th>
                <th>Main Gate Entry Status</th>
                <th>Gate Scan Time</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id}>
                  <td>
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : '—'}
                  </td>
                  <td><strong>{s.roll_no || '—'}</strong></td>
                  <td><b>{s.name}</b><small>{s.email}</small></td>
                  <td>{s.course || '—'} · {s.branch || '—'} ({s.section || '—'})</td>
                  <td>
                    <span className={`status ${s.gate_status === 'Present at Gate' ? 'status-approved' : 'status-rejected'}`}>
                      {s.gate_status}
                    </span>
                  </td>
                  <td>{s.gate_entry_time ? new Date(s.gate_entry_time).toLocaleTimeString() : 'Did Not Enter Campus'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
