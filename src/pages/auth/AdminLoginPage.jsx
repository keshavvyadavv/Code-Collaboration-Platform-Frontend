import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import './AuthPages.css';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.login(form);
      const token = res.data.token;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userData = {
        userId: payload.sub,
        username: payload.sub,
        role: payload.role || res.data.role,
      };
      
      login(token, userData);
      navigate(redirectTarget);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-orb bg-orb-1" style={{ background: '#ff5c5c' }} />
      <div className="auth-container animate-scale-in" style={{ borderTop: '4px solid var(--accent-red)' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'var(--accent-red)' }}>
            <Shield size={24} />
          </div>
          <h1>Admin Access</h1>
          <p>Login to manage CodeSync platform</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-error animate-fade-in">{error}</div>}

          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <input
              className="form-input"
              type="text"
              name="username"
              placeholder="e.g. admin"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <div className="input-with-icon">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn w-full" disabled={loading} style={{ background: 'var(--accent-red)', color: 'white', border: 'none' }}>
            {loading ? <span className="spinner" /> : <LogIn size={16} />}
            {loading ? 'Authenticating...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
