import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, authAPI } from '../../services/api';
import { Code2, Eye, EyeOff, UserPlus } from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    userName: '', email: '', password: '', fullName: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const oauthBase = API_BASE.replace(/\/$/, '');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register(form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Registration failed.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <div className="auth-logo"><Code2 size={24} /></div>
          <h1>Create your account</h1>
          <p>Join CodeSync and start collaborating</p>
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
              placeholder="John Doe"
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
              placeholder="e.g. johndoe"
              value={form.userName}
              onChange={handleChange}
              required
            />
            <span className="form-hint">2–20 letters only (no numbers or spaces)</span>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="Min 8 chars, upper, lower, number, special"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : <UserPlus size={16} />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
        </div>

        <div className="auth-divider" style={{ margin: '24px 0' }}>or sign up with</div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            type="button" 
            className="btn btn-secondary w-full" 
            onClick={() => window.location.href = `${oauthBase}/oauth2/authorization/github`}
          >
             GitHub
          </button>
          <button 
            type="button" 
            className="btn btn-secondary w-full"
            onClick={() => window.location.href = `${oauthBase}/oauth2/authorization/google`}
          >
           Google
          </button>
        </div>
      </div>
    </div>
  );
}
