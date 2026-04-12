import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject, updateProject } from '../api';

const STATUSES = ['active', 'completed', 'on_hold', 'cancelled'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setProjects(await getProjects(filterStatus || undefined));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createProject(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteProject(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateProject(id, { status: newStatus });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Projects</h2>
        <div className="header-controls">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleCreate}>
          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          <button className="btn btn-primary" type="submit">Create Project</button>
        </form>
      )}

      <ul className="item-list">
        {projects.map((p) => (
          <li key={p.id} className="item-card">
            <div className="item-main">
              <Link to={`/projects/${p.id}`} className="item-title">{p.name}</Link>
              {p.description && <p className="item-desc">{p.description}</p>}
            </div>
            <div className="item-actions">
              <select
                value={p.status}
                onChange={(e) => handleStatusChange(p.id, e.target.value)}
                className="status-select"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
            </div>
          </li>
        ))}
        {projects.length === 0 && <li className="empty-state">No projects yet. Create one to get started.</li>}
      </ul>
    </div>
  );
}
