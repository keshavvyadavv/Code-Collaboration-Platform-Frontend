import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fileAPI, projectAPI, executionAPI, versionAPI, collabAPI } from '../../services/api';
import Editor from '@monaco-editor/react';
import {
  Play, Save, FileCode2, Terminal, Plus, FolderGit2,
  Loader2, Info, History, GitCommit, RotateCcw, X,
  CheckCircle, AlertTriangle, Clock, Users, GitBranch, ChevronDown
} from 'lucide-react';
import JoinCollabModal from '../collab/JoinCollabModal';
import './EditorPage.css';

const LANGUAGE_MAP = {
  'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
  'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'go': 'go',
};
const getMonacoLanguage = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return LANGUAGE_MAP[ext] || 'plaintext';
};

export default function EditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const [project, setProject]       = useState(null);
  const [files, setFiles]           = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode]             = useState('// Select or create a file to start coding');

  // Execution state
  const [output, setOutput]               = useState('');
  const [isExecuting, setIsExecuting]     = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [executionStatus, setExecutionStatus]     = useState(null); // null | 'RUNNING' | 'COMPLETED' | 'ERROR'

  // Collab
  const [isStartingCollab, setIsStartingCollab] = useState(false);
  const [showCollabModal, setShowCollabModal]   = useState(false);

  // New file
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Branch state - Issue #2 Fix
  const [branches, setBranches]             = useState(['main']);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [newBranchName, setNewBranchName]   = useState('');
  const [showNewBranch, setShowNewBranch]   = useState(false);

  // Version History - Issue #3 Fix
  const [showHistory, setShowHistory]         = useState(false);
  const [versionHistory, setVersionHistory]   = useState([]);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [expandedBranch, setExpandedBranch]   = useState(null);
  const [branchVersions, setBranchVersions]   = useState({});
  const [showSaveVersion, setShowSaveVersion] = useState(false);
  const [commitMessage, setCommitMessage]     = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  const editorRef   = useRef(null);
  const outputRef   = useRef(null);

  useEffect(() => {
    if (projectId) loadProjectAndFiles();
  }, [projectId]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current && output) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Load branches when project changes
  useEffect(() => {
    if (projectId) loadBranches();
  }, [projectId]);

  const loadProjectAndFiles = async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        projectAPI.getById(projectId),
        fileAPI.getTree(projectId),
      ]);
      setProject(pRes.data);
      setFiles(fRes.data);
      if (fRes.data.length > 0) handleFileSelect(fRes.data[0]);
    } catch (err) {
      console.error('Error loading project', err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await versionAPI.getBranches(projectId);
      const data = res.data?.data || res.data || [];
      setBranches(Array.isArray(data) ? data : ['main']);
    } catch {
      setBranches(['main']);
    }
  };

  const handleEditorMount  = (editor) => { editorRef.current = editor; };
  const handleEditorChange = (value)  => { setCode(value); setHasUnsavedChanges(true); };

  const handleFileSelect = async (file) => {
    if (activeFile && hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Save before switching?')) await handleSave();
    }
    setActiveFile(file);
    setVersionHistory([]);
    setShowHistory(false);
    try {
      const res = await fileAPI.getContent(file.fileId);
      setCode(res.data);
      setHasUnsavedChanges(false);
    } catch {
      setCode('// Error loading file content');
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await fileAPI.updateContent(activeFile.fileId, { content: code, userId: user.userId });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * FIXED: Synchronous run.
   * Calls /api/executions/run which waits and returns full output in one response.
   * No polling needed - output is displayed immediately.
   */
  const handleRun = async () => {
    if (!activeFile) return;
    setIsExecuting(true);
    setExecutionStatus('RUNNING');
    setOutput('⏳ Running code...');

    if (hasUnsavedChanges) await handleSave();

    try {
      const req = {
        projectId: parseInt(projectId),
        fileId: activeFile.fileId,
        userId: user.userId,
        language: getMonacoLanguage(activeFile.name),
        sourceCode: code,
        stdin: '',
      };

      // Single synchronous call - backend runs and returns complete result
      const res = await executionAPI.run(req);
      const data = res.data?.data || res.data;

      if (data) {
        const status = data.status;
        if (status === 'SUCCESS') {
          const out = data.stdout?.trim() || '(no output)';
          const timing = data.executionTimeMs ? `\n\n[Finished in ${data.executionTimeMs}ms]` : '';
          setOutput(out + timing);
          setExecutionStatus('COMPLETED');
        } else {
          // FAILED
          const errOut = data.stderr?.trim() || data.stdout?.trim() || data.errorMessage || 'Execution failed.';
          setOutput(`❌ Error:\n${errOut}`);
          setExecutionStatus('ERROR');
        }
      } else {
        setOutput('Unexpected response from execution service.');
        setExecutionStatus('ERROR');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setOutput(`Error connecting to execution service:\n${msg}`);
      setExecutionStatus('ERROR');
    } finally {
      setIsExecuting(false);
    }
  };

  const createNewFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const req = {
        projectId: parseInt(projectId),
        name: newFileName,
        path: `/${newFileName}`,
        language: getMonacoLanguage(newFileName),
        content: `// New file: ${newFileName}\n`,
        createdById: user.userId,
      };
      const res = await fileAPI.create(req);
      setFiles([...files, res.data]);
      handleFileSelect(res.data);
      setShowNewFile(false);
      setNewFileName('');
    } catch {
      alert('Failed to create file');
    }
  };

  // ── Branch management - Issue #2 Fix ─────────────────────────────────────

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setShowBranchDropdown(false);
    // If history is open, reload it filtered to the new branch
    if (showHistory) loadBranchHistory(branch);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await versionAPI.createBranch({ projectId: parseInt(projectId), branchName: newBranchName });
      await loadBranches();
      setSelectedBranch(newBranchName);
      setNewBranchName('');
      setShowNewBranch(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create branch');
    }
  };

  // ── Version History - Issue #3 Fix ───────────────────────────────────────

  /**
   * FIXED: Load history - shows all branches and their version counts.
   * Clicking a branch expands it to show individual versions.
   */
  const loadHistory = async () => {
    if (!activeFile) return;
    setHistoryLoading(true);
    try {
      // Load all snapshots for this file
      const res = await versionAPI.getHistory(activeFile.fileId);
      // Response is wrapped: { status, message, data: [...] }
      const snapshots = res.data?.data || res.data || [];
      setVersionHistory(Array.isArray(snapshots) ? snapshots : []);
    } catch (err) {
      console.error('Failed to load version history', err);
      setVersionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadBranchHistory = async (branch) => {
    try {
      const res = await versionAPI.getByBranch(projectId, branch);
      const snaps = res.data?.data || res.data || [];
      setBranchVersions(prev => ({ ...prev, [branch]: Array.isArray(snaps) ? snaps : [] }));
    } catch {
      setBranchVersions(prev => ({ ...prev, [branch]: [] }));
    }
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory(!showHistory);
  };

  const toggleBranchExpand = (branch) => {
    if (expandedBranch === branch) {
      setExpandedBranch(null);
    } else {
      setExpandedBranch(branch);
      if (!branchVersions[branch]) loadBranchHistory(branch);
    }
  };

  const handleSaveVersion = async () => {
    if (!activeFile || !commitMessage.trim()) return;
    setIsSavingVersion(true);
    try {
      if (hasUnsavedChanges) await handleSave();
      await versionAPI.createSnapshot({
        projectId: parseInt(projectId),
        fileId: activeFile.fileId,
        authorId: user.userId,
        message: commitMessage,
        content: code,
        branch: selectedBranch,
      });
      setCommitMessage('');
      setShowSaveVersion(false);
      // Refresh
      loadHistory();
      setBranchVersions({});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save version');
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleRestore = async (snapshotId) => {
    if (!window.confirm('Restore this version? Current content will be overwritten.')) return;
    try {
      const res = await versionAPI.restoreSnapshot(snapshotId);
      const restored = res.data?.data || res.data;
      setCode(restored?.content || code);
      setHasUnsavedChanges(true);
      setShowHistory(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore version');
    }
  };

  const handleStartCollab = async () => {
    if (!activeFile) return;
    if (hasUnsavedChanges) await handleSave();
    setShowCollabModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Group history by branch for the history panel
  const historyByBranch = versionHistory.reduce((acc, snap) => {
    const b = snap.branch || 'main';
    if (!acc[b]) acc[b] = [];
    acc[b].push(snap);
    return acc;
  }, {});

  if (!projectId) return <div className="loading-page">Please select a project to open editor.</div>;

  const statusConfig = {
    RUNNING:   { label: 'Running…',  icon: <Loader2 size={12} className="spinner" />, cls: 'status-running' },
    COMPLETED: { label: 'Completed', icon: <CheckCircle size={12} />,                 cls: 'status-completed' },
    ERROR:     { label: 'Failed',    icon: <AlertTriangle size={12} />,               cls: 'status-error' },
  };

  return (
    <div className="editor-page animate-fade-in">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3><FolderGit2 size={14} style={{ display: 'inline', marginRight: 4 }} />{project?.name || 'Project'}</h3>
          <button className="btn btn-icon" onClick={() => setShowNewFile(true)} title="New File">
            <Plus size={16} />
          </button>
        </div>

        {showNewFile && (
          <div style={{ padding: '8px 12px' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createNewFile()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={createNewFile}>Add</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewFile(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="file-tree">
          {files.map(f => (
            <button
              key={f.fileId}
              className={`file-item ${activeFile?.fileId === f.fileId ? 'active' : ''}`}
              onClick={() => handleFileSelect(f)}
            >
              <FileCode2 size={14} /> {f.name}
            </button>
          ))}
          {files.length === 0 && !showNewFile && (
            <p className="text-muted" style={{ padding: 12, fontSize: '0.8rem' }}>
              No files found. Click + to create one.
            </p>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="main-content">
        <div className="editor-header">
          <div className="editor-tabs">
            {activeFile && (
              <div className="editor-tab active">
                <FileCode2 size={14} />
                {activeFile.name} {hasUnsavedChanges && '●'}
              </div>
            )}
          </div>

          <div className="editor-actions">
            {executionStatus && (
              <span className={`execution-status-badge ${statusConfig[executionStatus]?.cls}`}>
                {statusConfig[executionStatus]?.icon}
                {statusConfig[executionStatus]?.label}
              </span>
            )}

            {/* Branch Selector - Issue #2 Fix */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                title="Switch Branch"
              >
                <GitBranch size={14} /> {selectedBranch} <ChevronDown size={12} />
              </button>
              {showBranchDropdown && (
                <div className="branch-dropdown">
                  {branches.map(b => (
                    <button
                      key={b}
                      className={`branch-option ${b === selectedBranch ? 'active' : ''}`}
                      onClick={() => handleBranchSelect(b)}
                    >
                      <GitBranch size={12} /> {b}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                    {showNewBranch ? (
                      <div style={{ padding: '4px 8px', display: 'flex', gap: 4 }}>
                        <input
                          className="form-input"
                          style={{ padding: '2px 6px', fontSize: '0.75rem', flex: 1 }}
                          placeholder="branch-name"
                          value={newBranchName}
                          onChange={e => setNewBranchName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                          autoFocus
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleCreateBranch}>✓</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowNewBranch(false)}>✕</button>
                      </div>
                    ) : (
                      <button
                        className="branch-option"
                        onClick={() => { setShowNewBranch(true); }}
                        style={{ color: 'var(--accent-green)' }}
                      >
                        <Plus size={12} /> New branch
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Version History - Issue #3 Fix */}
            <button
              className={`btn btn-secondary btn-sm ${showHistory ? 'active' : ''}`}
              onClick={toggleHistory}
              disabled={!activeFile}
              title="Version History"
            >
              <History size={14} /> History
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSaveVersion(true)}
              disabled={!activeFile}
              title="Save Version"
            >
              <GitCommit size={14} /> Save Version
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleStartCollab}
              disabled={!activeFile || isStartingCollab}
              title="Start Collaboration"
            >
              {isStartingCollab ? <Loader2 size={14} className="spinner" /> : <Users size={14} />}
              Collaborate
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving || !activeFile}
            >
              {isSaving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
              Save
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleRun}
              disabled={isExecuting || !activeFile}
              style={{ background: 'var(--accent-green)' }}
            >
              {isExecuting ? <Loader2 size={14} className="spinner" /> : <Play size={14} />}
              Run Code
            </button>
          </div>
        </div>

        {/* Save Version Modal */}
        {showSaveVersion && (
          <div className="version-modal-bar">
            <GitCommit size={14} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Branch: <strong>{selectedBranch}</strong>
            </span>
            <input
              className="form-input version-commit-input"
              placeholder="Describe this version (e.g. 'Add sorting logic')"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveVersion()}
              autoFocus
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveVersion}
              disabled={isSavingVersion || !commitMessage.trim()}
            >
              {isSavingVersion ? <Loader2 size={12} className="spinner" /> : 'Commit'}
            </button>
            <button className="btn btn-icon btn-secondary" onClick={() => setShowSaveVersion(false)}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="editor-body">
          {/* Code Editor */}
          <div className="editor-container">
            <Editor
              height="100%"
              language={activeFile ? getMonacoLanguage(activeFile.name) : 'plaintext'}
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
              }}
            />
          </div>

          {/* FIXED: Version History Panel with branch tree - Issue #3 */}
          {showHistory && (
            <div className="history-panel">
              <div className="history-header">
                <span><History size={13} /> Version History</span>
                <button className="btn btn-icon" onClick={() => setShowHistory(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="history-list">
                {historyLoading ? (
                  <div style={{ padding: 16, textAlign: 'center' }}><Loader2 size={16} className="spinner" /></div>
                ) : Object.keys(historyByBranch).length === 0 ? (
                  <p className="text-muted" style={{ padding: 16, fontSize: '0.8rem' }}>
                    No versions saved yet. Use "Save Version" to create one.
                  </p>
                ) : (
                  Object.entries(historyByBranch).map(([branch, snaps]) => (
                    <div key={branch} className="history-branch-group">
                      {/* Branch header - clickable to expand */}
                      <button
                        className="history-branch-header"
                        onClick={() => toggleBranchExpand(branch)}
                      >
                        <GitBranch size={12} />
                        <span className="history-branch-name">{branch}</span>
                        <span className="history-branch-count">{snaps.length} version{snaps.length !== 1 ? 's' : ''}</span>
                        <ChevronDown
                          size={12}
                          style={{ transform: expandedBranch === branch ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                        />
                      </button>

                      {/* Expanded branch versions */}
                      {expandedBranch === branch && snaps.map((snap) => (
                        <div key={snap.snapshotId} className="history-item" style={{ marginLeft: 12 }}>
                          <div className="history-item-meta">
                            <GitCommit size={12} />
                            <span className="history-msg">{snap.message || 'No message'}</span>
                          </div>
                          <div className="history-item-time">
                            <Clock size={10} />{formatDate(snap.createdAt)}
                          </div>
                          <button
                            className="btn btn-secondary btn-sm history-restore-btn"
                            onClick={() => handleRestore(snap.snapshotId)}
                            title="Restore this version"
                          >
                            <RotateCcw size={11} /> Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* FIXED: Output Panel - Issue #1 */}
        <div className="output-panel">
          <div className="output-header">
            <span>
              <Terminal size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Terminal Output
            </span>
            {isExecuting && (
              <span className="text-muted">
                <Loader2 size={12} className="spinner" style={{ display: 'inline' }} /> Executing…
              </span>
            )}
            {output && !isExecuting && (
              <button
                className="btn btn-icon"
                style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                onClick={() => { setOutput(''); setExecutionStatus(null); }}
                title="Clear output"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div
            ref={outputRef}
            className={`output-content ${executionStatus === 'ERROR' ? 'output-error' : executionStatus === 'COMPLETED' ? 'output-success' : ''}`}
          >
            {output || (
              <span className="text-muted">
                <Info size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Click 'Run Code' to see output here.
              </span>
            )}
          </div>
        </div>
      </div>

      {showCollabModal && (
        <JoinCollabModal
          isOpen={showCollabModal}
          onClose={() => setShowCollabModal(false)}
          projectId={projectId}
          fileId={activeFile?.fileId}
          fileName={activeFile?.name}
          ownerId={user.userId}
        />
      )}
    </div>
  );
}
