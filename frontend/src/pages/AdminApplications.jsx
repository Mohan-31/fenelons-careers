import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import { Download, Trash2, Filter, FileText, Search, X, ExternalLink } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'rejected'];

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#ccc',
        padding: '5px 10px',
        borderRadius: 6,
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        outline: 'none',
      }}
    >
      {STATUS_OPTIONS.map(s => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}

function AppDetailModal({ app, onClose, onStatusChange }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Application Details</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 20px', background: 'rgba(198,40,40,0.06)', borderRadius: 10, marginBottom: 24, border: '1px solid rgba(198,40,40,0.15)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #C62828, #8E0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', color: 'white' }}>
            {app.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{app.name}</div>
            <div style={{ color: '#C62828', fontSize: '0.85rem' }}>{app.jobTitle}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Email', val: app.email },
            { label: 'Phone', val: app.phone },
            { label: 'Applied For', val: app.jobTitle },
            { label: 'Applied On', val: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.88rem', color: '#ccc' }}>{val || 'N/A'}</div>
            </div>
          ))}
        </div>

        {app.coverLetter && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: 10 }}>Cover Letter</div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '14px 16px', color: '#999', fontSize: '0.88rem', lineHeight: 1.7 }}>
              {app.coverLetter}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.82rem', color: '#666' }}>Status:</span>
            <StatusSelect value={app.status || 'pending'} onChange={status => onStatusChange(app.id, status)} />
          </div>
          {app.resumeFile && (
            <a
              href={`/uploads/${app.resumeFile}`}
              download={app.resumeOriginalName || 'resume'}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Download Resume
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    axios.get('/api/admin/applications')
      .then(r => setApplications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await axios.put(`/api/admin/applications/${id}/status`, { status });
      setApplications(a => a.map(x => x.id === id ? { ...x, status } : x));
      if (selectedApp?.id === id) setSelectedApp(a => ({ ...a, status }));
      showToast(`Status updated to "${status}"`);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/applications/${id}`);
      setApplications(a => a.filter(x => x.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
      showToast('Application deleted.');
    } catch {}
  };

  const jobs = [...new Set(applications.map(a => a.jobTitle).filter(Boolean))];

  const filtered = applications.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchJob = !filterJob || a.jobTitle === filterJob;
    return matchSearch && matchStatus && matchJob;
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 500, background: '#1a1a1a', border: '1px solid rgba(198,40,40,0.4)', borderRadius: 10, padding: '12px 20px', color: '#EF5350', fontWeight: 600, fontSize: '0.88rem', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease' }}>
            ✓ {toast}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Applications</h1>
            <p className="page-subtitle">{applications.length} total · {filtered.length} shown</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#444', pointerEvents: 'none' }} />
            <input className="input" style={{ paddingLeft: 34, width: 220 }} placeholder="Search by name/email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="input" style={{ width: 200 }} value={filterJob} onChange={e => setFilterJob(e.target.value)}>
            <option value="">All Positions</option>
            {jobs.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          {(search || filterStatus || filterJob) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterJob(''); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📥</div>
            <h3>{applications.length === 0 ? 'No applications yet' : 'No results found'}</h3>
            <p>{applications.length === 0 ? 'Applications will appear here as candidates apply.' : 'Try adjusting your filters.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position Applied</th>
                  <th>Contact</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app.id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => setSelectedApp(app)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #C62828, #8E0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>
                          {app.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.name}</div>
                        </div>
                      </div>
                    </td>
                    <td onClick={() => setSelectedApp(app)}>
                      <div style={{ fontWeight: 500, fontSize: '0.87rem' }}>{app.jobTitle || 'N/A'}</div>
                    </td>
                    <td onClick={() => setSelectedApp(app)}>
                      <div style={{ fontSize: '0.83rem', color: '#888' }}>{app.email}</div>
                      <div style={{ fontSize: '0.78rem', color: '#555' }}>{app.phone}</div>
                    </td>
                    <td style={{ color: '#666', fontSize: '0.83rem' }}>
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td>
                      <StatusSelect value={app.status || 'pending'} onChange={status => handleStatusChange(app.id, status)} />
                    </td>
                    <td>
                      {app.resumeFile ? (
                        <a href={`/uploads/${app.resumeFile}`} download={app.resumeOriginalName} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#EF5350', fontSize: '0.82rem', fontWeight: 600 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <Download size={13} /> {app.resumeOriginalName?.substring(0, 18) || 'Resume'}
                        </a>
                      ) : (
                        <span style={{ color: '#444', fontSize: '0.82rem' }}>No file</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedApp(app)} title="View details">
                          <ExternalLink size={13} />
                        </button>
                        <button className="btn btn-danger" onClick={e => { e.stopPropagation(); handleDelete(app.id); }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedApp && (
          <AppDetailModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
