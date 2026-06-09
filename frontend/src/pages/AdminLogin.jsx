import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, ShieldAlert, Clock } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'fenelons_login_attempts';

function getAttemptData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function saveAttemptData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function AdminLogin() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptData, setAttemptData] = useState(getAttemptData);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard');
  }, [isAuthenticated, navigate]);

  const isLocked = attemptData.lockedUntil && Date.now() < attemptData.lockedUntil;

  const tick = useCallback(() => {
    if (attemptData.lockedUntil) {
      const remaining = Math.ceil((attemptData.lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        const reset = { count: 0, lockedUntil: null };
        saveAttemptData(reset);
        setAttemptData(reset);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }
  }, [attemptData.lockedUntil]);

  useEffect(() => {
    if (!isLocked) return;
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isLocked, tick]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const recordFailure = () => {
    const current = getAttemptData();
    const newCount = current.count + 1;
    const newData = newCount >= MAX_ATTEMPTS
      ? { count: newCount, lockedUntil: Date.now() + LOCKOUT_MS }
      : { count: newCount, lockedUntil: null };
    saveAttemptData(newData);
    setAttemptData(newData);
    return newData;
  };

  const recordSuccess = () => {
    const reset = { count: 0, lockedUntil: null };
    saveAttemptData(reset);
    setAttemptData(reset);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (isLocked) return;
    if (!form.username || !form.password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/admin/login', form);
      if (data.success) {
        recordSuccess();
        login(data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const newData = recordFailure();
      if (newData.lockedUntil) {
        setError('');
      } else {
        const remaining = MAX_ATTEMPTS - newData.count;
        setError(
          err.response?.data?.message
            ? `${err.response.data.message} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`
            : `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(198,40,40,0.1) 0%, transparent 65%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #C62828, #8E0000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 16px',
            boxShadow: '0 0 32px rgba(198,40,40,0.4)',
          }}>🥩</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Fenelons Butchers</h1>
          <p style={{ color: '#555', fontSize: '0.88rem' }}>Secure Admin Portal</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} color="#C62828" /> Sign in to Admin
          </h2>
          <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: 28 }}>
            Manage jobs, applications, and analytics.
          </p>

          {/* Lockout */}
          {isLocked ? (
            <div style={{
              background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.3)',
              borderRadius: 10, padding: '20px', textAlign: 'center',
            }}>
              <ShieldAlert size={32} color="#EF5350" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: '#EF5350', marginBottom: 6 }}>Account Temporarily Locked</div>
              <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: 16 }}>
                Too many failed attempts. Please try again in:
              </div>
              <div style={{
                fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Clock size={20} color="#C62828" />
                {formatCountdown(countdown)}
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                  <ShieldAlert size={14} /> {error}
                </div>
              )}

              {attemptData.count > 0 && !error && (
                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  <Lock size={14} /> {MAX_ATTEMPTS - attemptData.count} attempt{MAX_ATTEMPTS - attemptData.count !== 1 ? 's' : ''} remaining before lockout.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#444', pointerEvents: 'none' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 38 }}
                      placeholder="Enter username"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 28 }}>
                  <label className="label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#444', pointerEvents: 'none' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 38, paddingRight: 44 }}
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2,
                    }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
                  disabled={loading}
                >
                  {loading ? 'Verifying…' : 'Sign In Securely'}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/"
            style={{ color: '#444', fontSize: '0.83rem' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C62828'}
            onMouseLeave={e => e.currentTarget.style.color = '#444'}
          >← Back to Careers Site</a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, color: '#333', fontSize: '0.75rem' }}>
          <Lock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Secured · Fenelons Butchers Admin
        </div>
      </div>
    </div>
  );
}
