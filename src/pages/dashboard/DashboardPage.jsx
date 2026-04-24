import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectAPI, executionAPI } from '../../services/api';
import { FolderGit2, TerminalSquare, Eye, ArrowRight, Clock, Plus } from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, isDeveloper } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || user.role === 'ADMIN') return;
        
        let projRes;
        
        if (isDeveloper()) {
           projRes = await projectAPI.getByOwner(user.userId);
        } else {
           projRes = await projectAPI.getPublic();
        }

        const statsRes = await executionAPI.getStats(user.userId).catch(() => ({ data: { totalExecutions: 0, totalErrors: 0, languagesUsed: 0 } }));
        
        setProjects(projRes.data.slice(0, 4)); // Get top 4 recent
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="dashboard-page page container animate-fade-in">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username || user?.userName || 'Developer'}</h1>
        <p className="text-muted">Here's your latest activity and workspace overview.</p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-primary)' }}>
            <FolderGit2 size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Projects</h3>
            <p>{projects.length}</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(34, 211, 160, 0.15)', color: 'var(--accent-green)' }}>
            <TerminalSquare size={24} />
          </div>
          <div className="stat-info">
            <h3>Code Executions</h3>
            <p>{stats?.totalExecutions || 0}</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.15)', color: 'var(--accent-orange)' }}>
            <Eye size={24} />
          </div>
          <div className="stat-info">
            <h3>Languages Used</h3>
            <p>{stats?.languagesUsed || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Recent Projects */}
        <div className="section-projects">
          <div className="section-title">
            <h2>{isDeveloper() ? "Recent Projects" : "Explore Public Projects"}</h2>
            <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          
          {projects.length > 0 ? (
            <div className="recent-projects-grid">
              {projects.map((proj) => (
                <Link to={isDeveloper() ? `/editor?project=${proj.projectId}` : `/viewer?project=${proj.projectId}`} key={proj.projectId} className="project-card card" >
                  <div className="project-card-header">
                    <span className="project-card-title">
                      <FolderGit2 size={18} className="text-accent" />
                      {proj.name}
                    </span>
                    <span className={`badge badge-${proj.visibility === 'PUBLIC' ? 'green' : 'muted'}`}>
                      {proj.visibility}
                    </span>
                  </div>
                  <p className="project-card-desc">{proj.description}</p>
                  <div className="project-card-footer">
                    <span>{proj.language}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <FolderGit2 size={40} style={{ opacity: 0.5, marginBottom: 16 }} />
              <h3>No projects found</h3>
              {isDeveloper() && <Link to="/projects" className="btn btn-primary"><Plus size={16} /> New Project</Link>}
            </div>
          )}
        </div>

        {/* Activity feed placeholder */}
        <div className="section-activity">
          <div className="section-title">
            <h2>Recent Activity</h2>
          </div>
          <div className="card">
             <div className="activity-list">
               <div className="activity-item">
                 <div className="activity-icon"><Clock size={16} /></div>
                 <div className="activity-text">
                   <p>Logged into CodeSync</p>
                   <span>Just now</span>
                 </div>
               </div>
               <div className="empty-state" style={{ padding: '20px' }}>
                 <p>More activity will appear here soon.</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
