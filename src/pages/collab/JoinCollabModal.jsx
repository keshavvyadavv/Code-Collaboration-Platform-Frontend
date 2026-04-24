import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Play, Key } from 'lucide-react';
import { collabAPI } from '../../services/api';

export default function JoinCollabModal({ isOpen, onClose, projectId, fileId, fileName, ownerId }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('start'); // 'start' | 'join'
  
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartSession = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await collabAPI.create({
        projectId: parseInt(projectId),
        fileId: fileId,
        ownerId: ownerId,
        language: fileName?.split('.').pop()?.toLowerCase() || 'txt',
      });
      const newSessionId = res.data.sessionId || res.data.data?.sessionId;
      // Navigate to collab edit route
      navigate(`/collab?session=${newSessionId}&file=${fileId}&name=${encodeURIComponent(fileName)}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start collaboration session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinSessionId.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      // First fetch session to confirm it exists and get fileId + fileName
      const sessionRes = await collabAPI.getSessionById(joinSessionId.trim());
      const sessionData = sessionRes.data.data || sessionRes.data;
      
      const fileIdTemp = sessionData.fileId || fileId;
      const fileNameTemp = sessionData.fileName || fileName || 'untitled';

      // Navigate directly - CollabEditorPage will handle the join via mount effect
      navigate(`/collab?session=${joinSessionId.trim()}&file=${fileIdTemp}&name=${encodeURIComponent(fileNameTemp)}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join session or session not found');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 9999
    }}>
      <div className="modal-content" style={{
        background: 'var(--surface-color)', padding: 24, borderRadius: 12,
        width: '400px', maxWidth: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem' }}>
            <Users size={20} className="text-primary" /> Collaboration
          </h3>
          <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
          <button 
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: activeTab === 'start' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'start' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: activeTab === 'start' ? '600' : 'normal'
            }}
            onClick={() => setActiveTab('start')}
          >
            Start New
          </button>
          <button 
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: activeTab === 'join' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'join' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: activeTab === 'join' ? '600' : 'normal'
            }}
            onClick={() => setActiveTab('join')}
          >
            Join Existing
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {activeTab === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
              Start a new real-time collaboration session for <strong>{fileName}</strong>. Other developers can join using the session ID.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={handleStartSession} 
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isLoading ? 'Starting...' : <><Play size={16} /> Start Session</>}
            </button>
          </div>
        )}

        {activeTab === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
              Enter a Session ID to join an active collaboration session.
            </p>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem' }}>Session ID</label>
              <div style={{ position: 'relative' }}>
                <Key size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: 32, width: '100%' }}
                  placeholder="Paste session ID here..."
                  value={joinSessionId}
                  onChange={(e) => setJoinSessionId(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleJoinSession} 
              disabled={isLoading || !joinSessionId.trim()}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isLoading ? 'Joining...' : 'Join Session'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
