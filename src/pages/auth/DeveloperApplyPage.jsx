import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Code2, Upload, Send, CheckCircle } from 'lucide-react';
import '../auth/AuthPages.css';
import './DeveloperApplyPage.css';

export default function DeveloperApplyPage() {
  const [form, setForm] = useState({ name: '', email: '', companyName: '' });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getErrorMessage = (err) => {
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return 'Submission failed. Please try again.';
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) { setError('Resume PDF is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('companyName', form.companyName);
      fd.append('resume', resume);
      await authAPI.applyAsDeveloper(fd);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="bg-orb bg-orb-1" />
        <div className="auth-container animate-scale-in" style={{ textAlign: 'center' }}>
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h2>Application Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
            Your developer application has been received. Our team will review it and send
            an email to <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong> if approved.
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 28, display: 'inline-flex' }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="auth-container apply-container animate-scale-in">
        <div className="auth-header">
          <div className="auth-logo"><Code2 size={24} /></div>
          <h1>Apply as a Developer</h1>
          <p>Submit your details for admin review and approval</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-error animate-fade-in">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              className="form-input"
              type="text"
              name="companyName"
              placeholder="Where do you work?"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resume (PDF only)</label>
            <label className="file-upload-label">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="file-upload-area">
                <Upload size={24} />
                {resume ? (
                  <span className="file-name">{resume.name}</span>
                ) : (
                  <span>Click to upload your resume (PDF)</span>
                )}
              </div>
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : <Send size={16} />}
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
