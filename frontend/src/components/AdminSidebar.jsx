import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Briefcase, FileText, LogOut, ChevronRight, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/jobs', icon: Briefcase, label: 'Job Postings' },
  { to: '/admin/applications', icon: FileText, label: 'Applications' },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const sidebarContent = (
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 260, height: '100vh',
      background: '#0d0d0d',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      zIndex: 300,
      transform: mobileOpen ? 'translateX(0)' : undefined,
      transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Logo + close */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, background: 'linear-gradient(135deg, #C62828, #8E0000)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', boxShadow: '0 0 16px rgba(198,40,40,0.35)', flexShrink: 0,
          }}>🥩</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.3px' }}>FENELONS</div>
            <div style={{ fontSize: '0.68rem', color: '#C62828', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none', background: 'none', border: 'none',
            color: '#666', cursor: 'pointer', padding: 4,
          }}
          className="sidebar-close-btn"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 8px', marginBottom: 8 }}>
          Navigation
        </div>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 12px', borderRadius: 9, marginBottom: 4,
              fontWeight: 500, fontSize: '0.9rem',
              color: active ? '#fff' : '#777',
              background: active ? 'rgba(198,40,40,0.14)' : 'transparent',
              border: `1px solid ${active ? 'rgba(198,40,40,0.3)' : 'transparent'}`,
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ccc'; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#777'; }}}
            >
              <Icon size={18} color={active ? '#EF5350' : undefined} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={14} color="#C62828" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '10px 12px', marginBottom: 8, borderRadius: 9, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 2 }}>Logged in as</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ccc' }}>admin</div>
        </div>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 9,
          background: 'transparent', border: '1px solid rgba(198,40,40,0.2)',
          color: '#C62828', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem',
          fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(198,40,40,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-hamburger"
        style={{
          display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 250,
          background: 'rgba(198,40,40,0.12)', border: '1px solid rgba(198,40,40,0.3)',
          borderRadius: 8, color: '#EF5350', cursor: 'pointer', padding: '8px 10px',
          alignItems: 'center', gap: 6,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 290, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {sidebarContent}

      <style>{`
        @media (max-width: 900px) {
          .sidebar-hamburger { display: flex !important; }
          aside { transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'}; }
        }
      `}</style>
    </>
  );
}
