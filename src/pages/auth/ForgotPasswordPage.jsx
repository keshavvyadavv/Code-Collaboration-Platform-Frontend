import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Code2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      // Always show generic message to prevent email enumeration
      const status = err.response?.status;
      if (status === 404) {
        setError('No account found with that email address.');
      } else {
        setError(err.response?.data?.message || err.response?.data || 'Something went wrong. Please try again.');
      }
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
          <h1>Reset Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: 8 }}>Check your inbox</h3>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              A password reset link has been sent to <strong>{email}</strong>.
              The link is valid for <strong>15 minutes</strong>.
            </p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Didn't receive it? Check your spam folder or{' '}
              <button
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => { setSent(false); setEmail(''); }}
              >
                try again
              </button>.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/login" className="btn btn-secondary w-full">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error animate-fade-in">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <input
                  id="forgot-email"
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !email.trim()}
            >
              {loading ? <span className="spinner" /> : <Mail size={16} />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
