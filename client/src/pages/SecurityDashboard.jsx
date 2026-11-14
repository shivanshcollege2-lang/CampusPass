import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function SecurityDashboard() {
  const [code, setCode] = useState('');
  const [action, setAction] = useState('entry');
  const [result, setResult] = useState(null);
  const [records, setRecords] = useState([]);
  const scannerRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.get('/passes/security/records');
      setRecords(r.data.records);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 8, qrbox: { width: 220, height: 220 } }, false);
    scanner.render(decodedText => {
      setCode(decodedText);
      setResult(null);
    }, () => {});
    scannerRef.current = scanner;
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  const verify = async e => {
    e?.preventDefault();
    setResult(null);
    try {
      const r = await api.post('/passes/security/verify', { passCode: code, action });
      setResult({ ok: true, text: r.data.message, pass: r.data.pass });
      setCode('');
      load();
    } catch (err) {
      setResult({
        ok: false,
        proxyAlert: err.response?.data?.proxyAlert,
        text: err.response?.data?.message || 'Verification failed.',
        pass: err.response?.data?.pass || null
      });
    }
  };

  return (
    <div className="section-width dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">GATE SECURITY & ANTI-PROXY DESK</div>
          <h1>QR Scan & Face Verification</h1>
          <p className="muted">Verify student photo against campus database. Duplicate QR scans are automatically blocked.</p>
        </div>
        <div className="status-card"><span>Gate Scans</span><b>{records.length}</b></div>
      </div>

      <div className="two-col">
        <section className="panel verify-panel">
          <div className="panel-head"><h2>Live QR Scanner</h2><span className="tag">ANTI-PROXY</span></div>
          <div id="qr-reader"></div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Verify Pass & Match Face</h2></div>
          <form onSubmit={verify}>
            <label>Pass Code or Scanned QR Payload
              <input required value={code} onChange={e => setCode(e.target.value)} placeholder="CP-XXXXXXXX" />
            </label>
            <label>Gate Direction
              <select value={action} onChange={e => setAction(e.target.value)}>
                <option value="entry">College Entry (Marks Attendance)</option>
                <option value="exit">College Exit</option>
              </select>
            </label>
            <button className="primary-btn full" type="submit">Verify & Check Database Photo</button>
          </form>

          {result && (
            <div className={result.ok ? 'success-box' : 'error-box'} style={{ marginTop: '16px', padding: '16px' }}>
              <b style={{ fontSize: '1.05rem', display: 'block', marginBottom: '6px' }}>
                {result.ok ? '✅ ACCESS GRANTED' : result.proxyAlert ? '🚨 ANTI-PROXY BLOCKED' : '❌ ACCESS DENIED'}
              </b>
              <span>{result.text}</span>

              {result.pass && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '14px', padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px' }}>
                  {result.pass.photoUrl ? (
                    <img src={result.pass.photoUrl} alt="Student Face" style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '10px', border: '3px solid #22c55e' }} />
                  ) : (
                    <div style={{ width: '110px', height: '110px', background: '#334155', borderRadius: '10px', display: 'grid', placeItems: 'center', textAlign: 'center', fontSize: '0.8rem' }}>No Photo on File</div>
                  )}
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <div><strong>Name:</strong> {result.pass.studentName}</div>
                    <div><strong>Roll No:</strong> {result.pass.rollNo}</div>
                    <div><strong>Class:</strong> {result.pass.course} · {result.pass.branch} (Sec {result.pass.section})</div>
                    <div><strong>Phone:</strong> {result.pass.phone}</div>
                    <div><strong>Pass:</strong> {result.pass.passCode} ({result.pass.passType})</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="panel records">
        <div className="panel-head"><h2>Verified Gate Access Logs</h2><button className="small-btn" onClick={load}>Refresh</button></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Pass Code</th><th>Student</th><th>Roll No</th><th>Course / Branch</th><th>Action</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {records.slice(0, 25).map(r => (
                <tr key={r.id}>
                  <td>{r.pass_code}</td>
                  <td>{r.student_name}</td>
                  <td>{r.roll_no || '—'}</td>
                  <td>{r.course || '—'} / {r.branch || '—'} ({r.section || '—'})</td>
                  <td><span className="status status-approved">{r.action.toUpperCase()}</span></td>
                  <td>{new Date(r.verified_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
