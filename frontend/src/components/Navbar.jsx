import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,8,8,0.94)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #C62828, #8E0000)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
            boxShadow: '0 0 12px rgba(198,40,40,0.4)',
          }}>🥩</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.3px', lineHeight: 1 }}>FENELONS</div>
            <div style={{ fontSize: '0.65rem', color: '#C62828', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Butchers · Careers</div>
          </div>
        </Link>

      </div>
    </nav>
  );
}
