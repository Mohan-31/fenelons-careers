import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Upload, CheckCircle, FileText, X } from 'lucide-react';

export default function Apply() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', coverLetter: '',
  });
  const [resume, setResume] = useState(null);

  useEffect(() => {
    axios.get(`/api/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }
    setError('');
    setResume(file);
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { setError('Please fill in all required fields.'); return; }
    if (!resume) { setError('Please upload your resume.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('resume', resume);
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('coverLetter', form.coverLetter);
      fd.append('jobId', id);
      fd.append('jobTitle', job?.title || '');

      await axios.post('/api/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!job) return (
    <div className="page-container" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <h2>Job not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Back to Jobs</Link>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520, padding: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(67,160,71,0.15)', border: '2px solid rgba(67,160,71,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <CheckCircle size={36} color="#66BB6A" />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 16 }}>Application Submitted!</h2>
        <p style={{ color: '#888', lineHeight: 1.75, marginBottom: 14 }}>
          Thank you, <strong style={{ color: '#ccc' }}>{form.name}</strong>! Your application for <strong style={{ color: '#EF5350' }}>{job.title}</strong> has been received.
        </p>
        <p style={{ color: '#888', lineHeight: 1.75, marginBottom: 14 }}>
          If your profile is a match, we will be in touch within <strong style={{ color: '#ccc' }}>2-3 working days</strong> via email.
        </p>
        <p style={{ color: '#666', lineHeight: 1.75, fontSize: '0.9rem', marginBottom: 36 }}>
          If you don't hear back within 3 days, please don't be discouraged. It simply means we have moved forward with another candidate on this occasion. We truly appreciate your interest in Fenelons and encourage you to apply again for any future openings!
        </p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="page-container" style={{ maxWidth: 680 }}>
        <Link to={`/job/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: '0.88rem', marginBottom: 32 }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF5350'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <ChevronLeft size={16} /> Back to job detail
        </Link>

        {/* Job summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(198,40,40,0.08), transparent)',
          border: '1px solid rgba(198,40,40,0.2)',
          borderRadius: 12, padding: '20px 24px',
          marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: '1.5rem' }}>💼</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Applying for: <span style={{ color: '#EF5350' }}>{job.title}</span></div>
            <div style={{ color: '#666', fontSize: '0.83rem' }}>{job.department} · {job.location} · {job.type}</div>
          </div>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6 }}>Your Application</h1>
          <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: 32 }}>Fields marked with * are required.</p>

          {error && (
            <div className="alert alert-error">
              <X size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Full Name *</label>
                <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label className="label">Phone Number *</label>
                <input className="input" name="phone" value={form.phone} onChange={handleChange} placeholder="+353 87 123 4567" required />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Email Address *</label>
              <input className="input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
            </div>

            <div className="form-group">
              <label className="label">Cover Letter <span style={{ color: '#444', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(Optional)</span></label>
              <textarea className="input" name="coverLetter" value={form.coverLetter} onChange={handleChange}
                placeholder="Tell us why you're excited about this role and what makes you a great fit for Fenelons…"
                style={{ minHeight: 130 }}
              />
            </div>

            {/* Resume Upload */}
            <div className="form-group">
              <label className="label">Resume / CV *</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

              {resume ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 10,
                  background: 'rgba(67,160,71,0.08)',
                  border: '1px solid rgba(67,160,71,0.3)',
                }}>
                  <FileText size={22} color="#66BB6A" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ccc' }}>{resume.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#555' }}>{(resume.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button type="button" onClick={() => setResume(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragging ? '#C62828' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10,
                    padding: '40px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragging ? 'rgba(198,40,40,0.06)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(198,40,40,0.4)'; e.currentTarget.style.background = 'rgba(198,40,40,0.04)'; }}
                  onMouseLeave={e => { if (!dragging) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}}
                >
                  <Upload size={28} color="#C62828" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#ccc' }}>Drop your resume here</div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>or <span style={{ color: '#EF5350' }}>browse files</span> · PDF, DOC, DOCX · Max 5MB</div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
