import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  GitBranch,
  Globe,
  Shield,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Terminal size={24} />,
    title: 'Live Cloud Runtime',
    desc: 'Run code in multiple languages with fast output and a clean feedback loop.',
    color: '#22d3ee',
  },
  {
    icon: <Users size={24} />,
    title: 'Team Editing',
    desc: 'Collaborate in real time with synced cursors, edits, and session state.',
    color: '#4ade80',
  },
  {
    icon: <GitBranch size={24} />,
    title: 'Version History',
    desc: 'Review and restore project states quickly with built-in project timelines.',
    color: '#facc15',
  },
  {
    icon: <Zap size={24} />,
    title: 'Focused Developer UX',
    desc: 'Monaco-powered editing with frictionless flows for daily coding work.',
    color: '#60a5fa',
  },
  {
    icon: <Shield size={24} />,
    title: 'Role-Based Security',
    desc: 'Secure access with separate user, developer, and admin pathways.',
    color: '#fb7185',
  },
  {
    icon: <Globe size={24} />,
    title: 'Public + Private Projects',
    desc: 'Share publicly when ready or keep work private while iterating.',
    color: '#fb923c',
  },
];

const quickStats = [
  { label: 'Active sessions', value: '2.8k+' },
  { label: 'Average sync speed', value: '<120ms' },
  { label: 'Supported languages', value: '10+' },
  { label: 'Team workspaces', value: '500+' },
];

const workflow = [
  { icon: <Code2 size={18} />, title: 'Create', desc: 'Spin up a project in seconds.' },
  { icon: <Users size={18} />, title: 'Collaborate', desc: 'Invite your team instantly.' },
  { icon: <Terminal size={18} />, title: 'Execute', desc: 'Run and debug from one place.' },
  { icon: <GitBranch size={18} />, title: 'Ship', desc: 'Track versions and publish faster.' },
];

const languages = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'C#',
];

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <section className="hero-section">
        <div className="container hero-layout">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge badge-blue">
                <Zap size={12} />
                Real-time collaborative engineering platform
              </span>
            </div>

            <h1 className="hero-title">
              Build Faster,
              <br />
              <span className="gradient-text">Ship Cleaner Code</span>
            </h1>

            <p className="hero-subtitle">
              CodeSync helps teams design, write, run, and review code in one modern workspace.
              It is built for developers who care about speed, clarity, and collaborative output.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Building
                <ArrowRight size={18} />
              </Link>
              <Link to="/apply" className="btn btn-secondary btn-lg">
                Apply as Developer
              </Link>
            </div>

            <div className="hero-langs">
              {languages.map((lang) => (
                <span key={lang} className="lang-pill">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-console card card-elevated">
              <div className="console-header">
                <span className="console-dot dot-red" />
                <span className="console-dot dot-yellow" />
                <span className="console-dot dot-green" />
                <span className="console-title">workspace.console</span>
              </div>
              <div className="console-body">
                <p>
                  <span className="console-prompt">$</span> git checkout -b feature/realtime-editor
                </p>
                <p>
                  <span className="console-prompt">$</span> npm run dev
                </p>
                <p>
                  <span className="console-prompt">$</span> teammate joined: akash@team
                </p>
                <p className="console-success">
                  sync status: connected and running at 118ms
                </p>
              </div>
            </div>

            <div className="hero-metrics">
              {quickStats.map((item) => (
                <div key={item.label} className="metric-card">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section">
        <div className="container">
          <div className="workflow-strip card">
            {workflow.map((item, index) => (
              <article key={item.title} className="workflow-step">
                <span className="workflow-number">{`0${index + 1}`}</span>
                <div className="workflow-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Built to feel like a serious engineering product</h2>
            <p>
              Every surface is designed to keep teams in flow and reduce friction from idea to shipped
              code.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`feature-card card feature-card-${(index % 3) + 1}`}
              >
                <div className="feature-icon" style={{ background: `${feature.color}22`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-copy">
              <h2>Ready to level up your team workflow?</h2>
              <p>
                Join CodeSync and move from scattered tools to one focused collaboration environment.
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <Code2 size={20} />
            <span>CodeSync</span>
          </div>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/apply">Apply as Developer</Link>
            <Link to="/admin/login">Admin</Link>
          </div>
          <p className="footer-copy">© 2026 CodeSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
