import { Link } from 'react-router-dom';

const cards = [
  ['01', 'Students', 'Request entry or exit passes, track approval status, and present QR-based digital passes at access points.'],
  ['02', 'Administrators', 'Review requests, approve or reject submissions, and maintain a centralized view of pass activity.'],
  ['03', 'Security', 'Verify pass codes or QR payloads and record campus entry and exit events with an auditable trail.']
];

export default function Home() {
  return <div className="home">
    <section className="hero section-width">
      <div>
        <div className="eyebrow">CAMPUS ACCESS, DIGITIZED</div>
        <h1>One workflow for every <span>campus pass.</span></h1>
        <p>AccessFlow brings student requests, administrative approvals and security verification into a single role-based platform.</p>
        <div className="hero-actions"><Link className="primary-btn link-btn" to="/register">Create Student Account</Link><Link className="secondary-btn link-btn" to="/login">Sign In</Link></div>
        <div className="hero-note">Prototype · JWT authentication · MySQL persistence · QR verification</div>
      </div>
      <div className="hero-card">
        <div className="mini-top"><span className="live-dot"/> Access Control Center <span>●</span></div>
        <div className="hero-stat"><span>Requests today</span><b>24</b></div>
        <div className="hero-stat"><span>Pending approvals</span><b>06</b></div>
        <div className="hero-stat"><span>Verified accesses</span><b>118</b></div>
        <div className="mock-pass"><div className="mock-chip">PASS</div><div><strong>STUDENT EXIT PASS</strong><small>Validated workflow</small></div><div className="mock-qr">▦</div></div>
      </div>
    </section>
    <section className="section-width feature-section">
      <div className="section-heading"><div className="eyebrow">ROLE-BASED BY DESIGN</div><h2>Every user sees the workflow they own.</h2></div>
      <div className="feature-grid">{cards.map(([n,t,d]) => <div className="feature-card" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div>
    </section>
    <section className="section-width process-section">
      <div className="section-heading"><div className="eyebrow">PASS LIFECYCLE</div><h2>Request → Approve → Verify → Record.</h2></div>
      <div className="process"><span>Request</span><i>→</i><span>Review</span><i>→</i><span>Issue QR Pass</span><i>→</i><span>Verify</span><i>→</i><span>Access Record</span></div>
    </section>
  </div>;
}
