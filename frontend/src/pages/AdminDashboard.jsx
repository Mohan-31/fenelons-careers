import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import { Users, Briefcase, TrendingUp, Clock, FileText } from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{
      background: '#111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '22px 24px',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(198,40,40,0.3)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#555' }}>{sub}</div>}
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#ccc', fontSize: '0.83rem' },
  cursor: { stroke: 'rgba(198,40,40,0.3)' },
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const attempt = (tries) =>
      axios.get('/api/admin/analytics', { headers })
        .then(r => setAnalytics(r.data))
        .catch(() => {
          if (tries > 1) return new Promise(res => setTimeout(res, 1500)).then(() => attempt(tries - 1));
        })
        .finally(() => setLoading(false));
    attempt(3);
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.72rem', color: '#C62828', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
            Welcome back
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Dashboard</h1>
          <p style={{ color: '#555', fontSize: '0.88rem', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : !analytics ? (
          <div className="alert alert-error">Failed to load analytics. Make sure the backend is running.</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <StatCard label="Total Applications" value={analytics.totalApplications} sub="All time" icon={Users} color="#C62828" />
              <StatCard label="This Week" value={analytics.weeklyApplications} sub="New applications" icon={TrendingUp} color="#EF5350" />
              <StatCard label="Active Jobs" value={analytics.activeJobs} sub={`of ${analytics.totalJobs} total`} icon={Briefcase} color="#FB8C00" />
              <StatCard label="Pending Review" value={analytics.statusBreakdown?.pending || 0} sub="Awaiting action" icon={Clock} color="#1E88E5" />
            </div>

            {/* Charts row */}
            <div className="admin-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Trend chart */}
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                  Application Trend
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 20 }}>Last 7 Days</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={analytics.applicationTrend}>
                    <defs>
                      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C62828" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C62828" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Area type="monotone" dataKey="count" stroke="#C62828" strokeWidth={2.5} fill="url(#redGrad)" name="Applications" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* By Job chart */}
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                  By Position
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 20 }}>Applications Split</div>
                {analytics.applicationsByJob.length === 0 ? (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.85rem' }}>
                    No applications yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.applicationsByJob} layout="vertical" margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip {...chartTooltipStyle} />
                      <Bar dataKey="count" fill="#C62828" radius={[0, 4, 4, 0]} name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status breakdown + Recent */}
            <div className="admin-status-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
              {/* Status cards */}
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 20 }}>
                  Status Breakdown
                </div>
                {[
                  { label: 'Pending', key: 'pending', color: '#FB8C00' },
                  { label: 'Reviewed', key: 'reviewed', color: '#1E88E5' },
                  { label: 'Shortlisted', key: 'shortlisted', color: '#EF5350' },
                  { label: 'Rejected', key: 'rejected', color: '#555' },
                ].map(({ label, key, color }) => {
                  const count = analytics.statusBreakdown?.[key] || 0;
                  const total = analytics.totalApplications || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={key} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.83rem' }}>
                        <span style={{ color: '#888' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: 5, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent applications */}
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Recent Applications
                  </div>
                  <a href="/admin/applications" style={{ fontSize: '0.8rem', color: '#C62828', fontWeight: 600 }}>View All →</a>
                </div>

                {analytics.recentApplications?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
                    <FileText size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '0.85rem' }}>No applications yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analytics.recentApplications?.map(app => (
                      <div key={app.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #C62828, #8E0000)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                          color: 'white',
                        }}>
                          {app.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobTitle}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className={`badge badge-${app.status || 'pending'}`}>{app.status || 'pending'}</span>
                          <div style={{ fontSize: '0.72rem', color: '#444', marginTop: 4 }}>
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
