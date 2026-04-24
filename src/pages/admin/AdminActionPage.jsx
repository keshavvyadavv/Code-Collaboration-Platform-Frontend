import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import './AdminPage.css'; // Let's reuse existing CSS 

export default function AdminActionPage() {
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
    const [message, setMessage] = useState(`Processing ${action} action for ${email}...`);

    useEffect(() => {
        const processAction = async () => {
            if (!action || !email) {
                setStatus('error');
                setMessage('Invalid action or email parameters.');
                return;
            }

            try {
                if (action === 'approve') {
                    await adminAPI.approveApplication(email);
                    setMessage(`Successfully approved application for ${email}. Email sent.`);
                } else if (action === 'reject') {
                    await adminAPI.rejectApplication(email);
                    setMessage(`Successfully rejected application for ${email}.`);
                } else {
                    throw new Error('Unknown action type.');
                }
                setStatus('success');
                // Redirect back to admin dashboard after a brief delay
                setTimeout(() => navigate('/admin'), 2000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || err.response?.data || `Error performing ${action} on ${email}`);
            }
        };

        processAction();
    }, [action, email, navigate]);

    return (
        <div className="admin-page page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, width: '100%' }}>
                {status === 'processing' && (
                    <div style={{ color: 'var(--accent-primary)' }}>
                        <Loader2 size={48} className="spinner" style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ marginBottom: 12 }}>Processing Action</h2>
                    </div>
                )}
                {status === 'success' && (
                    <div style={{ color: 'var(--accent-green)' }}>
                        <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ marginBottom: 12 }}>Success</h2>
                    </div>
                )}
                {status === 'error' && (
                    <div style={{ color: 'var(--accent-red)' }}>
                        <XCircle size={48} style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ marginBottom: 12 }}>Action Failed</h2>
                    </div>
                )}
                
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
                
                {status !== 'processing' && (
                    <Link to="/admin" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                        Return to Dashboard
                    </Link>
                )}
            </div>
        </div>
    );
}
