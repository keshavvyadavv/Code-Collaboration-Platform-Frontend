import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Code2, UserCheck, Eye, EyeOff } from 'lucide-react';
import './AuthPages.css';

export default function ApprovedDeveloperPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const { login } = useAuth();

  const [form, setForm] = useState({ userName: '', fullName: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailParam) {
      setError('Invalid registration link. Email parameter is missing.');
      return;
    }
    setLoading(true);
    setError('');

    const payload = { ...form, email: emailParam };

    try {
      // Step 1: Register the developer account
      await authAPI.registerApprovedDeveloper(emailParam, payload);
      setSuccess('Account created! Signing you in...');

      // Step 2: Auto-login so user lands directly on dashboard
      try {
        const loginRes = await authAPI.login({ userName: form.userName, password: form.password });
        const token = loginRes.data;

        if (typeof token === 'string' && token.includes('.')) {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const userRes = await authAPI.getUserIdByUsername(decoded.sub || form.userName);
          const userData = {
            userId: userRes.data,
            username: decoded.sub || form.userName,
            userName: form.userName,
            role: decoded.role || 'DEVELOPER',
          };
          login(token, userData);
          navigate('/dashboard');
          return;
        }
      } catch {
        // Auto-login failed — send to login page with a registered flag
      }

      // Fallback: redirect to login page
      navigate('/login?registered=1');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to complete registration.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!emailParam) {
    return (
      <div className="auth-page">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <h2>Invalid Link</h2>
          <p className="text-muted">Please use the registration link sent to your email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <div className="auth-logo"><UserCheck size={28} /></div>
          <h1>Complete Profile</h1>
          <p>Setup your approved developer account for <strong>{emailParam}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-error animate-fade-in">{error}</div>}
          {success && <div className="alert alert-success animate-fade-in">{success}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="fullName"
              placeholder="Your Full Name"
              value={form.fullName}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              name="userName"
              placeholder="Desired username (no spaces)"
              value={form.userName}
              onChange={handleChange}
              required
            />
            <span className="form-hint">2–20 letters only (no spaces)</span>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="Choose a strong password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : <Code2 size={16} />}
            {loading ? 'Setting up...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
