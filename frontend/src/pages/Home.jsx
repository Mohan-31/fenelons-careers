import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Clock, ChevronRight, Briefcase, Users, Trophy, Star, Award } from 'lucide-react';

function JobCard({ job }) {
  const typeBadge = job.type?.toLowerCase().replace(' ', '-') || 'part-time';
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '28px',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxWidth: 680,
        margin: '0 auto',
        width: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(198,40,40,0.5)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(198,40,40,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(198,40,40,0.2), rgba(142,0,0,0.3))',
          border: '1px solid rgba(198,40,40,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0,
        }}>🥩</div>
        <span className={`badge badge-${typeBadge}`}>{job.type}</span>
      </div>
      <div>
        <h3 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 8, lineHeight: 1.3 }}>{job.title}</h3>
        <p style={{ fontSize: '0.88rem', color: '#777', lineHeight: 1.7 }}>
          {job.description?.substring(0, 160)}...
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#666' }}>
          <MapPin size={13} color="#C62828" /> {job.location}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#666' }}>
          <Briefcase size={13} color="#C62828" /> {job.department}
        </span>
        {job.experience && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#666' }}>
            <Clock size={13} color="#C62828" /> {job.experience}
          </span>
        )}
      </div>
      {job.salary && (
        <div style={{ color: '#EF5350', fontWeight: 600, fontSize: '0.9rem' }}>{job.salary}</div>
      )}
      <Link
        to={`/job/${job.id}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 18px',
          background: 'rgba(198,40,40,0.08)',
          border: '1px solid rgba(198,40,40,0.2)',
          borderRadius: 8,
          color: '#EF5350',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.2s',
          marginTop: 'auto',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(198,40,40,0.18)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(198,40,40,0.08)'; }}
      >
        View &amp; Apply <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [aboutLoaded, setAboutLoaded] = useState(false);

  useEffect(() => {
    axios.get('/api/jobs')
      .then(r => setJobs(r.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes floatImg { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .hero-img-wrap { opacity: 0; }
        .hero-img-wrap.loaded { animation: fadeUp 0.9s ease forwards, floatImg 5s ease-in-out 1s infinite; }
        .about-img { opacity: 0; }
        .about-img.loaded { animation: fadeUp 0.9s ease forwards; }

        /* ── Hero grid: 3-area (text-top | image | text-bottom) ── */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 56px;
        }
        .hero-text-before { grid-column: 1; grid-row: 1; align-self: end; padding-bottom: 32px; }
        .hero-img-col     { grid-column: 2; grid-row: 1 / 3; display: flex; align-items: center; justify-content: center; }
        .hero-text-after  { grid-column: 1; grid-row: 2; align-self: start; }

        @media (max-width: 900px) {
          .hero-section-wrap { padding: 44px 20px !important; min-height: 0 !important; }
          .hero-grid { grid-template-columns: 1fr !important; column-gap: 0 !important; }
          .hero-text-before { grid-column: 1 !important; grid-row: 1 !important; padding-bottom: 0 !important; align-self: auto !important; }
          .hero-img-col     { grid-column: 1 !important; grid-row: 2 !important; margin: 28px 0 !important; justify-content: flex-start !important; align-self: auto !important; }
          .hero-text-after  { grid-column: 1 !important; grid-row: 3 !important; align-self: auto !important; }
          .hero-stats       { justify-content: flex-start !important; gap: 20px !important; }
          .about-grid       { grid-template-columns: 1fr !important; }
          .section-pad      { padding: 52px 0 !important; }
        }
        @media (max-width: 480px) {
          .hero-section-wrap { padding: 36px 16px !important; }
          .section-pad { padding: 40px 0 !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        background: '#080808',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 40%, rgba(198,40,40,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="page-container hero-section-wrap" style={{ position: 'relative', zIndex: 1, padding: '72px 24px', width: '100%' }}>
          <div className="hero-grid">

            {/* Left col – top: badge + heading + description */}
            <div className="hero-text-before">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.3)',
                borderRadius: 20, padding: '6px 16px', marginBottom: 24,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF5350', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF5350', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Now Hiring
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 20 }}>
                Join the{' '}
                <span style={{ background: 'linear-gradient(135deg, #EF5350, #C62828)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Fenelons
                </span>{' '}Family
              </h1>

              <p style={{ fontSize: '1rem', color: '#999', lineHeight: 1.8, maxWidth: 480 }}>
                One of Dublin's most trusted butcher shops, proudly serving the community from Stillorgan Village Centre for over 70 years. Recognised as{' '}
                <strong style={{ color: '#EF5350' }}>Ireland's Best Butcher Shop</strong>{' '}
                at the Associated Craft Butchers of Ireland Star Shop Awards.
              </p>
            </div>

            {/* Right col: image (spans both rows on desktop, middle row on mobile) */}
            <div className="hero-img-col">
              <div
                className={`hero-img-wrap${heroLoaded ? ' loaded' : ''}`}
                style={{ maxWidth: 500, width: '100%' }}
              >
                <img
                  src="/hero-image.png"
                  alt="Fenelons Butchers team"
                  onLoad={() => setHeroLoaded(true)}
                  style={{ width: '100%', borderRadius: 18, display: 'block' }}
                />
              </div>
            </div>

            {/* Left col – bottom: CTA + stats */}
            <div className="hero-text-after">
              <a href="#jobs" className="btn btn-primary btn-lg" style={{ marginBottom: 32 }}>
                Open Roles <ChevronRight size={18} />
              </a>

              <div className="hero-stats" style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
                {[
                  { icon: <Trophy size={17} />, label: '70+ Years Legacy' },
                  { icon: <Users size={17} />, label: '10+ Team Members' },
                  { icon: <Star size={17} />, label: '4.4★ Rated' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: '0.88rem', fontWeight: 500 }}>
                    <span style={{ color: '#C62828' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Open Positions ── */}
      <section id="jobs" className="section-pad" style={{ padding: '72px 0', background: '#080808' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C62828', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
              Open Positions
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {loading ? 'Loading...' : `${jobs.length} Role${jobs.length !== 1 ? 's' : ''} Available`}
            </h2>
            <p style={{ color: '#666', marginTop: 12, fontSize: '0.93rem' }}>
              Join our team at Stillorgan Village Centre, Dublin
            </p>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔍</div>
              <h3>No openings right now</h3>
              <p>Check back soon for new opportunities.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="section-pad" style={{ padding: '72px 0', background: '#0a0a0a' }}>
        <div className="page-container">
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C62828', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
              Our Story
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              About Fenelons Butchers
            </h2>
          </div>

          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'start' }}>
            <div>
              <img
                src="/about-us.png"
                alt="About Fenelons Butchers"
                className={`about-img${aboutLoaded ? ' loaded' : ''}`}
                onLoad={() => setAboutLoaded(true)}
                style={{
                  width: '100%', borderRadius: 18,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  display: 'block',
                }}
              />
            </div>

            <div>
              <p style={{ color: '#999', lineHeight: 1.85, fontSize: '0.97rem', marginBottom: 24 }}>
                Fenelons Butchers is one of Dublin's most trusted and customer-loved butcher shops, proudly serving the community from Stillorgan Village Centre. Renowned for exceptional quality, expert craftsmanship, and outstanding customer service, our experienced team offers premium Irish meats, specialty cuts, and fresh produce sourced from trusted local suppliers whenever possible.
              </p>
              <p style={{ color: '#999', lineHeight: 1.85, fontSize: '0.97rem', marginBottom: 32 }}>
                Recognised as{' '}
                <strong style={{ color: '#EF5350' }}>Ireland's Best Butcher Shop</strong>{' '}
                at the Associated Craft Butchers of Ireland Star Shop Awards, Fenelons has built a reputation for excellence, quality, and tradition, making it a destination of choice for customers across Dublin.
              </p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: 'rgba(198,40,40,0.08)',
                border: '1px solid rgba(198,40,40,0.25)',
                borderRadius: 12, padding: '14px 20px',
              }}>
                <Award size={22} color="#EF5350" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#EF5350' }}>Ireland's Best Butcher Shop</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>Associated Craft Butchers of Ireland Star Shop Awards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Find Us ── */}
      <section className="section-pad" style={{ padding: '72px 0', background: '#0a0a0a' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C62828', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
              Visit Us
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>
              Find Fenelons Butchers
            </h2>
            <p style={{ color: '#666', fontSize: '0.93rem' }}>
              Stillorgan Village Centre, Stillorgan, Co. Dublin, Ireland
            </p>
          </div>

          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(198,40,40,0.2)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            height: 420,
          }}>
            <iframe
              title="Fenelons Butchers Location"
              src="https://maps.google.com/maps?q=Fenelons+Butchers+Stillorgan+Village+Centre+Dublin+Ireland&output=embed&z=16"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', filter: 'grayscale(0.2) contrast(1.05)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Address', val: 'Stillorgan Village Centre, Stillorgan, Co. Dublin' },
              { label: 'Hours', val: 'Mon-Sat 8:00 AM - 6:00 PM' },
            ].map(({ label, val }) => (
              <div key={label} style={{
                background: '#111', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '14px 20px', minWidth: 220,
              }}>
                <div style={{ fontSize: '0.72rem', color: '#C62828', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.88rem', color: '#bbb' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
