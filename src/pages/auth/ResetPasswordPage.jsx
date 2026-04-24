import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Code2, Eye, EyeOff, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '' };
    if (password.length < 6) return { label: 'Too short', color: 'var(--accent-red, #f87171)' };
    if (password.length < 8) return { label: 'Weak', color: 'var(--accent-orange, #fb923c)' };
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { label: 'Strong', color: 'var(--accent-green)' };
    return { label: 'Fair', color: 'var(--accent-yellow, #fbbf24)' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Reset failed.';
      const msgStr = typeof msg === 'object' ? JSON.stringify(msg) : msg;
      
      if (msgStr.toLowerCase().includes('expired')) {
        setError('This reset link has expired. Please request a new one.');
      } else if (msgStr.toLowerCase().includes('invalid') || msgStr.toLowerCase().includes('already been used')) {
        setError('This reset link is invalid or has already been used. Please request a new one.');
      } else {
        setError(msgStr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Invalid/missing token
  if (tokenError) {
    return (
      <div className="auth-page">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="auth-container animate-scale-in" style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ color: 'var(--accent-orange, #fb923c)', margin: '0 auto 16px' }} />
          <h2>Invalid Link</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>{tokenError}</p>
          <Link to="/forgot-password" className="btn btn-primary w-full">Request New Reset Link</Link>
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
          <div className="auth-logo"><Code2 size={24} /></div>
          <h1>Set New Password</h1>
          <p>Choose a strong password for your account</p>
        </div>

        {success ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: 8 }}>Password Updated!</h3>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Link to="/login" className="btn btn-primary w-full">
              <KeyRound size={16} /> Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-error animate-fade-in">
                {error}{' '}
                {(error.includes('expired') || error.includes('invalid')) && (
                  <Link to="/forgot-password" className="auth-link" style={{ marginLeft: 4 }}>
                    Request new link
                  </Link>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-with-icon">
                <input
                  id="new-password"
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  autoFocus
                  minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <span className="form-hint" style={{ color: strength.color }}>
                  Strength: {strength.label}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <input
                  id="confirm-password"
                  className="form-input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="form-hint" style={{ color: 'var(--accent-red, #f87171)' }}>
                  Passwords don't match
                </span>
              )}
            </div>

            <button
              id="reset-password-btn"
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || password !== confirmPassword || password.length < 8}
            >
              {loading ? <span className="spinner" /> : <KeyRound size={16} />}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
