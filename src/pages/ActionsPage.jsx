import { useState, useEffect } from 'react';
import {
  getActions, createAction, updateAction, deleteAction,
  getProjects, getContexts,
} from '../api';

const ACTION_STATUSES = ['active', 'completed', 'waiting'];
const ENERGY_LEVELS = ['low', 'medium', 'high'];

export default function ActionsPage() {
  const [actions, setActions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contexts, setContexts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterContext, setFilterContext] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // form fields
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [energy, setEnergy] = useState('medium');
  const [minutes, setMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedContexts, setSelectedContexts] = useState([]);

  async function loadMeta() {
    try {
      const [p, c] = await Promise.all([getProjects(), getContexts()]);
      setProjects(p);
      setContexts(c);
    } catch (_) { /* ignored */ }
  }

  async function load() {
    try {
      const filters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterProject) filters.project_id = filterProject;
      if (filterContext) filters.context_id = filterContext;
      setActions(await getActions(filters));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { load(); }, [filterStatus, filterProject, filterContext]);

  function toggleContext(cid) {
    setSelectedContexts((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createAction({
        title: title.trim(),
        notes: notes.trim() || undefined,
        energyLevel: energy,
        estimatedMinutes: minutes ? parseInt(minutes, 10) : undefined,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        contextIds: selectedContexts.length ? selectedContexts : undefined,
      });
      setTitle('');
      setNotes('');
      setEnergy('medium');
      setMinutes('');
      setDueDate('');
      setProjectId('');
      setSelectedContexts([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateAction(id, { status: newStatus });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAction(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function projectName(pid) {
    const p = projects.find((x) => x.id === pid);
    return p ? p.name : '';
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Next Actions</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Action'}
        </button>
      </div>

      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterContext} onChange={(e) => setFilterContext(e.target.value)}>
          <option value="">All contexts</option>
          {contexts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleCreate}>
          <label>
            Title
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </label>
          <div className="form-row">
            <label>
              Project
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>
              Energy
              <select value={energy} onChange={(e) => setEnergy(e.target.value)}>
                {ENERGY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label>
              Est. Minutes
              <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} min={1} />
            </label>
            <label>
              Due Date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          {contexts.length > 0 && (
            <fieldset className="context-picker">
              <legend>Contexts</legend>
              {contexts.map((c) => (
                <label key={c.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedContexts.includes(c.id)}
                    onChange={() => toggleContext(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </fieldset>
          )}
          <button className="btn btn-primary" type="submit">Create Action</button>
        </form>
      )}

      <ul className="item-list">
        {actions.map((a) => (
          <li key={a.id} className={`item-card ${a.status === 'completed' ? 'processed' : ''}`}>
            <div className="item-main">
              <span className="item-title">{a.title}</span>
              {a.project_id && <span className="meta-tag project-tag">{projectName(a.project_id)}</span>}
              {a.notes && <p className="item-desc">{a.notes}</p>}
              <div className="action-meta">
                <span className={`badge badge-${a.status}`}>{a.status}</span>
                <span className="badge badge-energy">{a.energy_level} energy</span>
                {a.estimated_minutes && <span className="meta-tag">{a.estimated_minutes} min</span>}
                {a.due_date && <span className="meta-tag">Due: {new Date(a.due_date).toLocaleDateString()}</span>}
              </div>
              {a.contexts && a.contexts.length > 0 && (
                <div className="context-tags">
                  {a.contexts.map((c) => (
                    <span key={c.id} className="context-tag">@{c.name}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="item-actions">
              <select
                value={a.status}
                onChange={(e) => handleStatusChange(a.id, e.target.value)}
                className="status-select"
              >
                {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(a.id)}>Delete</button>
            </div>
          </li>
        ))}
        {actions.length === 0 && <li className="empty-state">No actions match your filters.</li>}
      </ul>
    </div>
  );
}
