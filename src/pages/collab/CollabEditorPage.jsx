import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fileAPI, collabAPI } from '../../services/api';
import Editor from '@monaco-editor/react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Users, Lock, Unlock, Save, Terminal, Loader2,
  LogOut, UserCheck, AlertTriangle, CheckCircle, Wifi, WifiOff
} from 'lucide-react';
import './CollabEditorPage.css';

const LANGUAGE_MAP = {
  'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
  'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'go': 'go',
};
const getMonacoLanguage = (name) => LANGUAGE_MAP[name?.split('.').pop()?.toLowerCase()] || 'plaintext';

const COLLAB_WS_BASE = import.meta.env.VITE_COLLAB_WS_BASE || 'http://localhost:8084';
const PARTICIPANT_COLORS = ['#6c63ff', '#22d3a0', '#f97316', '#3b82f6', '#ec4899', '#a78bfa'];

export default function CollabEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const fileId    = searchParams.get('file');
  const fileName  = searchParams.get('name') || 'untitled';

  const [code, setCode]                   = useState('// Loading...');
  const [participants, setParticipants]   = useState([]);
  const [activeEditorId, setActiveEditorId] = useState(null);
  const [connected, setConnected]         = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [lastSaved, setLastSaved]         = useState(null);
  const [sessionStatus, setSessionStatus] = useState('Connecting…');
  const [retryCount, setRetryCount]       = useState(0);

  const stompRef    = useRef(null);
  const editorRef   = useRef(null);
  const suppressRef = useRef(false);

  const iLockIt   = activeEditorId === user?.userId;
  const isReadOnly = activeEditorId !== null && !iLockIt;

  /**
   * FIXED: Connect using SockJS to the correct /collab endpoint.
   * The backend registers /collab with .withSockJS(), so the frontend
   * must use SockJS (not raw WebSocket) to connect.
   */
  useEffect(() => {
    if (!sessionId || !user) return;

    let client;

    const connect = () => {
      client = new Client({
        // FIXED: Use SockJS factory - connects to /collab endpoint
        webSocketFactory: () => new SockJS(`${COLLAB_WS_BASE}/collab`),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          setConnected(true);
          setConnectionError('');
          setSessionStatus('Connected');
          setRetryCount(0);

          // Subscribe to session-level events (lock changes, session end)
          client.subscribe(`/topic/session/${sessionId}`, (msg) => {
            try {
              const payload = JSON.parse(msg.body);
              if (payload.type === 'LOCK_UPDATE') {
                setActiveEditorId(payload.activeEditorUserId ?? null);
              } else if (payload.type === 'SESSION_ENDED') {
                alert('The session owner has ended this session.');
                navigate(-1);
              }
            } catch { /* ignore malformed messages */ }
          });

          // Subscribe to participant join/leave events
          client.subscribe(`/topic/session/${sessionId}/participants`, () => {
            loadParticipants();
          });

          // Subscribe to code edits from other users
          client.subscribe(`/topic/session/${sessionId}/edit`, (msg) => {
            try {
              const payload = JSON.parse(msg.body);
              if (payload.userId !== user.userId) {
                suppressRef.current = true;
                setCode(payload.content);
                setTimeout(() => { suppressRef.current = false; }, 50);
              }
            } catch { /* ignore */ }
          });

          stompRef.current = client;
        },

        onDisconnect: () => {
          setConnected(false);
          setSessionStatus('Disconnected');
        },

        onStompError: (frame) => {
          console.error('STOMP error', frame);
          setConnectionError('WebSocket connection failed. Retrying…');
          setSessionStatus('Error');
        },

        onWebSocketError: (event) => {
          console.error('WS error', event);
          setConnectionError(`Could not connect to collaboration server at ${COLLAB_WS_BASE}. Make sure collab-service is running.`);
          setSessionStatus('Error');
          setRetryCount(c => c + 1);
        },
      });

      client.activate();
    };

    const initSession = async () => {
      // Join session via REST first, then open WS
      try {
        await collabAPI.joinSession(sessionId, { role: 'EDITOR' });
      } catch (err) {
        const msg = err.response?.data?.message || '';
        if (!msg.toLowerCase().includes('already in the session')) {
          setConnectionError(msg || 'Failed to join session');
        }
      }
      connect();
      loadFileContent();
      loadParticipants();
    };

    initSession();

    return () => {
      if (client) client.deactivate();
    };
  }, [sessionId, user]);

  const loadFileContent = async () => {
    if (!fileId) return;
    try {
      const res = await fileAPI.getContent(fileId);
      setCode(res.data);
    } catch {
      setCode('// Could not load file content');
    }
  };

  const loadParticipants = async () => {
    if (!sessionId) return;
    try {
      const res = await collabAPI.getParticipants(sessionId);
      setParticipants(res.data?.data || res.data || []);
    } catch { /* ignore */ }
  };

  // Broadcast code edits when the lock holder types
  const handleEditorChange = useCallback((value) => {
    if (suppressRef.current) return;
    setCode(value);

    if (stompRef.current?.connected && iLockIt) {
      stompRef.current.publish({
        destination: `/app/session/${sessionId}/edit`,
        body: JSON.stringify({ userId: user.userId, content: value }),
      });
    }
  }, [sessionId, user, iLockIt]);

  const handleRequestLock = () => {
    if (!stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: `/app/session/${sessionId}/request-lock`,
      body: JSON.stringify({ userId: user.userId }),
    });
  };

  const handleReleaseLock = () => {
    if (!stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: `/app/session/${sessionId}/release-lock`,
      body: JSON.stringify({ userId: user.userId }),
    });
  };

  const handleSave = async () => {
    if (!fileId) return;
    setIsSaving(true);
    try {
      await fileAPI.updateContent(fileId, { content: code, userId: user.userId });
      setLastSaved(new Date().toLocaleTimeString());
    } catch { /* silent */ } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    try {
      if (iLockIt) handleReleaseLock();
      await collabAPI.leaveSession(sessionId);
    } finally {
      navigate(-1);
    }
  };

  const getParticipantColor = (idx) => PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length];

  if (!sessionId) {
    return (
      <div className="collab-empty">
        <AlertTriangle size={40} />
        <p>No session ID provided. Please join a session first.</p>
      </div>
    );
  }

  return (
    <div className="collab-editor-page animate-fade-in">
      {/* Top bar */}
      <div className="collab-topbar">
        <div className="collab-topbar-left">
          <span className={`conn-badge ${connected ? 'conn-online' : 'conn-offline'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {sessionStatus}
            {retryCount > 0 && ` (attempt ${retryCount})`}
          </span>
          <span className="collab-filename">{fileName}</span>
        </div>

        <div className="collab-topbar-center">
          {activeEditorId === null ? (
            <button className="btn btn-primary btn-sm collab-lock-btn" onClick={handleRequestLock} disabled={!connected}>
              <Unlock size={14} /> Request Edit
            </button>
          ) : iLockIt ? (
            <>
              <span className="lock-status lock-owned">
                <Lock size={13} /> You are editing
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleReleaseLock}>
                Release
              </button>
            </>
          ) : (
            <span className="lock-status lock-other">
              <Lock size={13} /> User #{activeEditorId} is editing
            </span>
          )}
        </div>

        <div className="collab-topbar-right">
          {lastSaved && <span className="save-notice"><CheckCircle size={12} /> Saved {lastSaved}</span>}
          <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={13} className="spinner" /> : <Save size={13} />} Save
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleLeave}>
            <LogOut size={13} /> Leave
          </button>
        </div>
      </div>

      {connectionError && (
        <div className="alert alert-error" style={{ margin: '0 16px', borderRadius: 0 }}>
          <AlertTriangle size={14} /> {connectionError}
        </div>
      )}

      <div className="collab-body">
        {/* Participants sidebar */}
        <div className="collab-sidebar">
          <div className="collab-sidebar-header">
            <Users size={14} /> Participants ({participants.length})
          </div>
          <div className="collab-participants">
            {participants.length === 0 ? (
              <p className="text-muted" style={{ padding: 12, fontSize: '0.8rem' }}>No participants yet.</p>
            ) : (
              participants.map((p, idx) => (
                <div key={p.userId} className="participant-item">
                  <div className="participant-avatar" style={{ background: getParticipantColor(idx) }}>
                    {String(p.userId).charAt(0)}
                  </div>
                  <div className="participant-info">
                    <span className="participant-name">User #{p.userId}</span>
                    <span className="participant-role">{p.role}</span>
                  </div>
                  {activeEditorId === p.userId && (
                    <Lock size={12} style={{ color: '#fbbf24', flexShrink: 0 }} title="Currently editing" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="collab-editor-area">
          {isReadOnly && (
            <div className="collab-locked-banner">
              <Lock size={13} />
              <span>User #{activeEditorId} is currently editing. Your editor is in view mode.</span>
              <button className="btn btn-primary btn-sm" onClick={handleRequestLock}>
                <UserCheck size={13} /> Request Edit
              </button>
            </div>
          )}

          <Editor
            height={isReadOnly ? 'calc(100% - 40px)' : '100%'}
            language={getMonacoLanguage(fileName)}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{
              readOnly: isReadOnly,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
