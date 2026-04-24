import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fileAPI, projectAPI, executionAPI } from '../../services/api';
import Editor from '@monaco-editor/react';
import { Play, FileCode2, Terminal, FolderGit2, Loader2, Info, Eye, ArrowLeft } from 'lucide-react';
import './ViewerPage.css';

const LANGUAGE_MAP = {
  'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
  'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'go': 'go',
};

const getMonacoLanguage = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return LANGUAGE_MAP[ext] || 'plaintext';
};

export default function ViewerPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('// Select a file from the sidebar to view its code');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null); // null | 'RUNNING' | 'COMPLETED' | 'ERROR'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) loadProjectAndFiles();
  }, [projectId]);

  const loadProjectAndFiles = async () => {
    try {
      setLoading(true);
      const [pRes, fRes] = await Promise.all([
        projectAPI.getById(projectId),
        fileAPI.getTree(projectId),
      ]);
      setProject(pRes.data);
      setFiles(fRes.data);
      if (fRes.data.length > 0) handleFileSelect(fRes.data[0]);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    setActiveFile(file);
    try {
      const res = await fileAPI.getContent(file.fileId);
      setCode(res.data);
    } catch {
      setCode('// Could not load file content.');
    }
  };

  const handleRun = async () => {
    if (!activeFile) return;
    setIsExecuting(true);
    setExecutionStatus('RUNNING');
    setOutput('');

    try {
      const req = {
        projectId: parseInt(projectId),
        fileId: activeFile.fileId,
        userId: user.userId,
        language: getMonacoLanguage(activeFile.name),
        sourceCode: code,
        stdin: '',
      };
      const res = await executionAPI.run(req);
      const data = res.data?.data || res.data;

      if (data?.status === 'SUCCESS') {
        const out = data.stdout?.trim() || '(no output)';
        const timing = data.executionTimeMs ? `\n\n[Finished in ${data.executionTimeMs}ms]` : '';
        setOutput(out + timing);
        setExecutionStatus('COMPLETED');
      } else {
        const errOut = data?.stderr?.trim() || data?.stdout?.trim() || data?.errorMessage || 'Execution failed.';
        setOutput(`Error:\n${errOut}`);
        setExecutionStatus('ERROR');
      }
    } catch (err) {
      setOutput(`Error: ${err.response?.data?.message || err.message}`);
      setExecutionStatus('ERROR');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!projectId) {
    return (
      <div className="viewer-no-project">
        <Info size={40} />
        <h3>No project selected</h3>
        <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
      </div>
    );
  }

  const statusBadge = {
    RUNNING:   { label: 'Running…', cls: 'status-running' },
    COMPLETED: { label: 'Completed', cls: 'status-completed' },
    ERROR:     { label: 'Failed', cls: 'status-error' },
  };

  return (
    <div className="viewer-page animate-fade-in">
      {/* Read-only banner */}
      <div className="viewer-banner">
        <Eye size={14} />
        <span>View-only mode — you can run this code but editing is disabled</span>
        <Link to="/projects" className="viewer-back-link">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      </div>

      <div className="viewer-body">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3><FolderGit2 size={14} style={{ display: 'inline', marginRight: 4 }} />
              {loading ? '…' : project?.name || 'Project'}
            </h3>
          </div>
          <div className="file-tree">
            {loading ? (
              <div style={{ padding: 12 }}><Loader2 size={16} className="spinner" /></div>
            ) : files.length === 0 ? (
              <p className="text-muted" style={{ padding: 12, fontSize: '0.8rem' }}>No files found.</p>
            ) : (
              files.map(f => (
                <button
                  key={f.fileId}
                  className={`file-item ${activeFile?.fileId === f.fileId ? 'active' : ''}`}
                  onClick={() => handleFileSelect(f)}
                >
                  <FileCode2 size={14} />
                  {f.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main area */}
        <div className="main-content">
          <div className="editor-header">
            <div className="editor-tabs">
              {activeFile && (
                <div className="editor-tab active">
                  <FileCode2 size={14} /> {activeFile.name}
                  <span className="readonly-badge"><Eye size={10} /> read-only</span>
                </div>
              )}
            </div>
            <div className="editor-actions">
              {executionStatus && (
                <span className={`execution-status-badge ${statusBadge[executionStatus]?.cls}`}>
                  {executionStatus === 'RUNNING' && <Loader2 size={12} className="spinner" />}
                  {statusBadge[executionStatus]?.label}
                </span>
              )}
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

          <div className="editor-container">
            <Editor
              height="100%"
              language={activeFile ? getMonacoLanguage(activeFile.name) : 'plaintext'}
              theme="vs-dark"
              value={code}
              options={{
                readOnly: true,          // ← key: disables all editing
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                renderValidationDecorations: 'off',
                cursorStyle: 'underline',
              }}
            />
          </div>

          {/* Output Panel */}
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
            </div>
            <div className={`output-content ${executionStatus === 'ERROR' ? 'output-error' : executionStatus === 'COMPLETED' ? 'output-success' : ''}`}>
              {output || (
                <span className="text-muted">
                  <Info size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Click 'Run Code' to see output here.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
