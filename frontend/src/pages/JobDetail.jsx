import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Clock, Briefcase, ChevronLeft, ChevronRight, Euro, CalendarDays, GraduationCap } from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!job) return (
    <div className="page-container" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
      <h2>Job not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Back to Jobs</Link>
    </div>
  );

  const formatText = (text) => text?.split('\n').map((line, i) => (
    <span key={i} style={{ display: 'block', marginBottom: line.trim() ? 4 : 0 }}>{line}</span>
  ));

  const Section = ({ title, children, icon }) => (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 32, marginBottom: 20 }}>
      <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#C62828', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="page-container">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: '0.88rem', marginBottom: 32, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF5350'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <ChevronLeft size={16} /> Back to all roles
        </Link>

        <div className="job-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          {/* Main content */}
          <div>
            {/* Header */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(198,40,40,0.2), rgba(142,0,0,0.3))',
                  border: '1px solid rgba(198,40,40,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>🥩</div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{job.title}</h1>
              </div>
              <div className="job-meta-list" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                  { icon: <Briefcase size={13} />, val: job.department },
                  { icon: <MapPin size={13} />, val: job.location },
                  { icon: <Clock size={13} />, val: job.experience },
                ].filter(x => x.val).map(({ icon, val }) => (
                  <span key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#666', fontSize: '0.84rem' }}>
                    <span style={{ color: '#C62828' }}>{icon}</span> {val}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className={`badge badge-${(job.type || 'part-time').toLowerCase().replace(' ', '-')}`}>{job.type}</span>
                {job.salary && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(198,40,40,0.1)', color: '#EF5350', padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(198,40,40,0.2)' }}>
                    <Euro size={11} /> {job.salary}
                  </span>
                )}
              </div>
            </div>

            {job.description && (
              <Section title="About the Role">
                <p style={{ color: '#aaa', lineHeight: 1.85, fontSize: '0.93rem' }}>{job.description}</p>
              </Section>
            )}

            {job.workingHours && (
              <Section title="Working Hours" icon={<CalendarDays size={14} />}>
                <div style={{ color: '#aaa', lineHeight: 1.9, fontSize: '0.93rem' }}>{formatText(job.workingHours)}</div>
              </Section>
            )}

            {job.responsibilities && (
              <Section title="Responsibilities">
                <div style={{ color: '#aaa', lineHeight: 1.9, fontSize: '0.93rem' }}>{formatText(job.responsibilities)}</div>
              </Section>
            )}

            {job.requirements && (
              <Section title="Requirements">
                <div style={{ color: '#aaa', lineHeight: 1.9, fontSize: '0.93rem' }}>{formatText(job.requirements)}</div>
              </Section>
            )}

            {job.trainingInfo && (
              <Section title="Training & Selection Process" icon={<GraduationCap size={14} />}>
                <p style={{ color: '#aaa', lineHeight: 1.85, fontSize: '0.93rem' }}>{job.trainingInfo}</p>
              </Section>
            )}
          </div>

          {/* Apply sidebar */}
          <div className="job-apply-card" style={{ position: 'sticky', top: 88 }}>
            <div style={{
              background: 'linear-gradient(160deg, #150000, #1a0a0a)',
              border: '1px solid rgba(198,40,40,0.3)',
              borderRadius: 16, padding: 28,
              boxShadow: '0 0 40px rgba(198,40,40,0.08)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🥩</div>
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Ready to Apply?</h3>
                <p style={{ color: '#666', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  Submit your application and our team will be in touch shortly.
                </p>
              </div>
              <Link to={`/apply/${job.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                Apply Now <ChevronRight size={16} />
              </Link>
              <Link to="/" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                View All Roles
              </Link>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, fontWeight: 600 }}>Quick Info</div>
                {[
                  { label: 'Type', val: job.type },
                  { label: 'Department', val: job.department },
                  { label: 'Location', val: job.location },
                  { label: 'Pay', val: job.salary },
                ].filter(x => x.val).map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.83rem' }}>
                    <span style={{ color: '#555' }}>{label}</span>
                    <span style={{ color: '#ccc', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 4 }}>Posted</div>
              <div style={{ fontSize: '0.88rem', color: '#888' }}>
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
