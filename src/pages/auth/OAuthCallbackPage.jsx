import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Code2, Loader2 } from 'lucide-react';
import './AuthPages.css';

export default function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const processOAuthToken = async () => {
            if (!token) {
                setError('Authentication token missing from provider.');
                setTimeout(() => navigate('/login'), 2500);
                return;
            }

            try {
                // Instantly inject JWT into storage so following APIs resolve seamlessly
                localStorage.setItem('token', token);

                const payload = JSON.parse(atob(token.split('.')[1]));
                const resolvedUsername = payload.sub;
                
                // We need explicit Integer User ID for standard backend scopes
                const userRes = await authAPI.getUserIdByUsername(resolvedUsername);
                
                const userData = {
                  userId: userRes.data,
                  username: resolvedUsername,
                  userName: resolvedUsername,
                  role: payload.role || 'USER',
                };

                login(token, userData);
                navigate('/dashboard');

            } catch (err) {
                console.error("OAuth flow parsing error:", err);
                setError('Failed to configure your developer session.');
                setTimeout(() => navigate('/login'), 2500);
            }
        };

        processOAuthToken();
    }, [token, navigate, login]);

    return (
        <div className="auth-page">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="auth-container animate-scale-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <div className="auth-logo" style={{ margin: '0 auto 20px' }}>
                    <Code2 size={24} />
                </div>
                {error ? (
                    <div style={{ color: 'var(--accent-red)' }}>
                        <h2 style={{ marginBottom: 12 }}>Authentication Error</h2>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div>
                        <Loader2 size={36} className="spinner" style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
                        <h2 style={{ marginBottom: 12 }}>Securing Connection</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Authenticating your session with CodeSync...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
