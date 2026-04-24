import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, authAPI } from '../../services/api';
import { Code2, Eye, EyeOff, LogIn } from 'lucide-react';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ userName: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
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
      const res = await authAPI.login(form);
      const token = res.data;
      
      if (typeof token === 'string' && !token.includes('.')) {
         throw new Error(token);
      }
      
      // Explicitly pre-load token so immediate following requests don't fail as 401
      localStorage.setItem('token', token);

      // Decode token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const resolvedUsername = payload.sub || form.userName;
      
      // Fetch integer userId explicitly
      const userRes = await authAPI.getUserIdByUsername(resolvedUsername);
      
      const userData = {
        userId: userRes.data,
        username: resolvedUsername,
        userName: form.userName,
        role: payload.role || 'USER',
      };
      login(token, userData);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Invalid credentials. Please try again.';
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
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <Code2 size={24} />
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your CodeSync account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {justRegistered && (
            <div className="alert alert-success animate-fade-in">
              🎉 Registration complete! Sign in to access your dashboard.
            </div>
          )}
          {error && <div className="alert alert-error animate-fade-in">{error}</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              name="userName"
              placeholder="Enter your username"
              value={form.userName}
              onChange={handleChange}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
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

          <div className="auth-options">
            <Link to="/forgot-password" className="auth-link text-sm">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : <LogIn size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="auth-link">Create one</Link></p>
          <p style={{ marginTop: 8 }}>
            Want to be a developer? <Link to="/apply" className="auth-link">Apply here</Link>
          </p>
        </div>

        <div className="auth-divider" style={{ margin: '24px 0' }}>or continue with</div>

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
