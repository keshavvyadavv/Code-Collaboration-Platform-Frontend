import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectAPI } from '../../services/api';
import { FolderGit2, Plus, Search, Code2, Globe, Lock } from 'lucide-react';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { user, isDeveloper } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PUBLIC, PRIVATE
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Create Project Form
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PUBLIC', language: 'JavaScript' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch user's projects and public projects, then merge
      const allMap = new Map();
      
      const publicRes = await projectAPI.getPublic();
      publicRes.data.forEach(p => allMap.set(p.projectId, p));

      if (isDeveloper()) {
        const ownerRes = await projectAPI.getByOwner(user.userId);
        ownerRes.data.forEach(p => allMap.set(p.projectId, p));
      }
      
      setProjects(Array.from(allMap.values()));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await projectAPI.create({ ...form, ownerId: user.userId });
      setProjects([res.data, ...projects]);
      setIsModalOpen(false);
      setForm({ name: '', description: '', visibility: 'PUBLIC', language: 'JavaScript' });
      navigate(`/editor?project=${res.data.projectId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filter === 'ALL' || p.visibility === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="projects-page page container animate-fade-in">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">Manage your collaborative workspaces</p>
        </div>
        {isDeveloper() && <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Project
        </button>}
      </div>

      <div className="projects-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Projects</option>
          <option value="PUBLIC">Public Only</option>
          {isDeveloper() && <option value="PRIVATE">Private Only</option>}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-lg"></span></div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state card">
          <FolderGit2 size={48} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
          <h3>No projects found</h3>
          <p>Try adjusting your search criteria or create a new project.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map(proj => (
            <Link to={isDeveloper() ? `/editor?project=${proj.projectId}` : `/viewer?project=${proj.projectId}`} key={proj.projectId} className="project-card card hover-scale">
              <div className="project-card-header">
                <span className="project-card-title">
                  {proj.visibility === 'PUBLIC' ? <Globe size={18} className="text-green" /> : <Lock size={18} className="text-muted" />}
                  {proj.name}
                </span>
                <span className={`badge badge-${proj.visibility === 'PUBLIC' ? 'green' : 'muted'}`}>
                  {proj.visibility}
                </span>
              </div>
              <p className="project-card-desc">{proj.description}</p>
              <div className="project-card-footer">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 size={14} /> {proj.language}
                </span>
                <span>{proj.ownerId === user?.userId ? 'Owner' : `Owner ID: ${proj.ownerId}`}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
              
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required autoFocus 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  style={{ minHeight: 80 }}
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select 
                    className="form-select"
                    value={form.visibility}
                    onChange={(e) => setForm({...form, visibility: e.target.value})}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Language</label>
                  <select 
                    className="form-select"
                    value={form.language}
                    onChange={(e) => setForm({...form, language: e.target.value})}
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="Go">Go</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : <Plus size={16} />} 
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
