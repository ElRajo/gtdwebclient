import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getProjects } from './api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InboxPage from './pages/InboxPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ActionsPage from './pages/ActionsPage';
import ContextsPage from './pages/ContextsPage';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [projectsOpen, setProjectsOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setProjects(await getProjects());
    } catch (_) { /* ignore */ }
  }, [isLoggedIn]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Refresh project list when navigating back to a projects-related page
  useEffect(() => {
    if (location.pathname.startsWith('/projects')) loadProjects();
  }, [location.pathname, loadProjects]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleProjects() {
    const opening = !projectsOpen;
    setProjectsOpen(opening);
    if (opening) loadProjects();
  }

  function truncate(str, len = 30) {
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  return (
    <div className="app">
      {isLoggedIn && (
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>GTD</h1>
            <span className="user-name">{user?.display_name || user?.email}</span>
          </div>
          <ul className="nav-links">
            <li><NavLink to="/inbox">Inbox</NavLink></li>
            <li>
              <div className="nav-group-header">
                <NavLink to="/projects">Projects</NavLink>
                <button
                  className="expand-btn"
                  onClick={() => toggleProjects()}
                  aria-label={projectsOpen ? 'Collapse projects' : 'Expand projects'}
                >
                  {projectsOpen ? '−' : '+'}
                </button>
              </div>
              {projectsOpen && (
                <ul className="sub-nav">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <NavLink to={`/projects/${p.id}`}>{truncate(p.name)}</NavLink>
                    </li>
                  ))}
                  {projects.length === 0 && (
                    <li className="sub-nav-empty">No projects yet</li>
                  )}
                </ul>
              )}
            </li>
            <li><NavLink to="/actions">Next Actions</NavLink></li>
            <li><NavLink to="/contexts">Contexts</NavLink></li>
          </ul>
          <button className="btn btn-outline logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </nav>
      )}

      <main className={isLoggedIn ? 'main-content' : 'main-content full'}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/actions" element={<ProtectedRoute><ActionsPage /></ProtectedRoute>} />
          <Route path="/contexts" element={<ProtectedRoute><ContextsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isLoggedIn ? '/inbox' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}
