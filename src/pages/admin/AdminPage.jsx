import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Shield, Check, X, Inbox, Mail } from 'lucide-react';
import './AdminPage.css';

export default function AdminPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores email of being processed
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchApps = async () => {
    try {
      const res = await adminAPI.getPendingApplications();
      setApplications(res.data);
    } catch (err) {
      setError('Failed to fetch applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleApprove = async (email) => {
    setActionLoading(email);
    setError('');
    setSuccess('');
    try {
      await adminAPI.approveApplication(email);
      setSuccess(`Application for ${email} approved. Email sent!`);
      setApplications((prev) => prev.filter((app) => app.email !== email));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || `Failed to approve ${email}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (email) => {
    setActionLoading(email);
    setError('');
    setSuccess('');
    try {
      await adminAPI.rejectApplication(email);
      setSuccess(`Application for ${email} rejected.`);
      setApplications((prev) => prev.filter((app) => app.email !== email));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || `Failed to reject ${email}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-page page container animate-fade-in">
      <div className="admin-header">
        <h1 style={{ color: 'var(--accent-red)' }}><Shield /> Admin Dashboard</h1>
        <p>Review pending developer applications</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>{success}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-lg"></span></div>
      ) : applications.length === 0 ? (
        <div className="empty-state card">
          <Inbox size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
          <h3>No Pending Applications</h3>
          <p>There are currently no developer applications to review.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Company</th>
                <th>Applied At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id || app.email}>
                  <td>
                    <div className="cell-user">
                      <div className="cell-avatar">{app.name[0].toUpperCase()}</div>
                      {app.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} className="text-muted" /> {app.email}
                    </div>
                  </td>
                  <td>{app.companyName}</td>
                  <td>
                    <span className="cell-date">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-success"
                        disabled={actionLoading === app.email}
                        onClick={() => handleApprove(app.email)}
                      >
                        {actionLoading === app.email ? <span className="spinner" /> : <Check size={14} />} Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={actionLoading === app.email}
                        onClick={() => handleReject(app.email)}
                      >
                        {actionLoading === app.email ? <span className="spinner" /> : <X size={14} />} Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
