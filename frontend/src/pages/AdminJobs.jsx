import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import { Plus, Trash2, MapPin, Clock, Edit2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const INITIAL_FORM = {
  title: '', department: '', location: 'Chennai, India',
  type: 'Full-Time', experience: '', salary: '',
  description: '', requirements: '', responsibilities: '',
};

const DEPARTMENTS = ['Kitchen', 'Operations', 'Service', 'Marketing', 'Delivery', 'Finance', 'HR', 'Technology', 'Other'];
const JOB_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Internship'];

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(job || INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.department || !form.location || !form.type) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const url = job ? `/api/admin/jobs/${job.id}` : '/api/admin/jobs';
      const method = job ? 'put' : 'post';
      const { data } = await axios[method](url, form);
      onSave(data, !!job);
    } catch {
      setError('Failed to save job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{job ? 'Edit Job' : 'Post New Job'}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="alert alert-error"><X size={13} />{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Job Title *</label>
            <input className="input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Head Chef" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Department *</label>
              <select className="input" name="department" value={form.department} onChange={handleChange} required>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Job Type *</label>
              <select className="input" name="type" value={form.type} onChange={handleChange} required>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Location *</label>
              <input className="input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Chennai, India" required />
            </div>
            <div className="form-group">
              <label className="label">Experience</label>
              <input className="input" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 2-4 Years" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Salary Range</label>
            <input className="input" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹30,000 - ₹45,000/month" />
          </div>

          <div className="form-group">
            <label className="label">Job Description *</label>
            <textarea className="input" name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the role, what Fenelons does, and why this is a great opportunity…" required />
          </div>

          <div className="form-group">
            <label className="label">Responsibilities</label>
            <textarea className="input" name="responsibilities" value={form.responsibilities} onChange={handleChange}
              placeholder="• List key responsibilities&#10;• One per line with bullet points" />
          </div>

          <div className="form-group">
            <label className="label">Requirements</label>
            <textarea className="input" name="requirements" value={form.requirements} onChange={handleChange}
              placeholder="• Required qualifications&#10;• Skills and experience&#10;• Certifications needed" />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : job ? 'Save Changes' : '🔴 Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    axios.get('/api/admin/jobs')
      .then(r => setJobs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (job, isEdit) => {
    if (isEdit) {
      setJobs(j => j.map(x => x.id === job.id ? job : x));
      showToast('Job updated successfully!');
    } else {
      setJobs(j => [job, ...j]);
      showToast('Job posted successfully!');
    }
    setShowModal(false);
    setEditJob(null);
  };

  const handleToggle = async (job) => {
    try {
      const { data } = await axios.put(`/api/admin/jobs/${job.id}`, { ...job, active: !job.active });
      setJobs(j => j.map(x => x.id === data.id ? data : x));
      showToast(data.active ? 'Job activated!' : 'Job deactivated.');
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/jobs/${id}`);
      setJobs(j => j.filter(x => x.id !== id));
      showToast('Job deleted.');
    } catch {}
  };

  const filtered = jobs.filter(j =>
    !search || j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 500,
            background: '#1a1a1a', border: '1px solid rgba(198,40,40,0.4)',
            borderRadius: 10, padding: '12px 20px',
            color: '#EF5350', fontWeight: 600, fontSize: '0.88rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease',
          }}>
            ✓ {toast}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Job Postings</h1>
            <p className="page-subtitle">{jobs.length} total · {jobs.filter(j => j.active).length} active</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditJob(null); setShowModal(true); }}>
            <Plus size={17} /> Post New Job
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <input className="input" style={{ maxWidth: 300 }} placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📭</div>
            <h3>No jobs found</h3>
            <p>Post your first job to start collecting applications.</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Post a Job
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(job => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{job.title}</div>
                      {job.salary && <div style={{ fontSize: '0.75rem', color: '#C62828', marginTop: 2 }}>{job.salary}</div>}
                    </td>
                    <td style={{ color: '#888' }}>{job.department}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#777', fontSize: '0.85rem' }}>
                        <MapPin size={12} color="#C62828" /> {job.location}
                      </span>
                    </td>
                    <td><span className={`badge badge-${(job.type || '').toLowerCase().replace(' ', '-')}`}>{job.type}</span></td>
                    <td style={{ color: '#777', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} color="#555" /> {job.experience || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleToggle(job)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                        {job.active
                          ? <><ToggleRight size={22} color="#43A047" /><span className="badge badge-active">Active</span></>
                          : <><ToggleLeft size={22} color="#555" /><span className="badge badge-inactive">Inactive</span></>
                        }
                      </button>
                    </td>
                    <td style={{ color: '#666', fontSize: '0.8rem' }}>
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditJob(job); setShowModal(true); }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(job.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <JobModal
            job={editJob}
            onClose={() => { setShowModal(false); setEditJob(null); }}
            onSave={handleSave}
          />
        )}
      </main>
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
