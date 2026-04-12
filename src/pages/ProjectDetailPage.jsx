import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, updateProject, createAction, getContexts } from '../api';

const ACTION_STATUSES = ['active', 'completed', 'waiting'];
const ENERGY_LEVELS = ['low', 'medium', 'high'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [contexts, setContexts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // new action form fields
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [energy, setEnergy] = useState('medium');
  const [minutes, setMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedContexts, setSelectedContexts] = useState([]);

  async function load() {
    try {
      const [p, ctx] = await Promise.all([getProject(id), getContexts()]);
      setProject(p);
      setContexts(ctx);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  function toggleContext(cid) {
    setSelectedContexts((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  }

  async function handleAddAction(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createAction({
        title: title.trim(),
        notes: notes.trim() || undefined,
        energyLevel: energy,
        estimatedMinutes: minutes ? parseInt(minutes, 10) : undefined,
        dueDate: dueDate || undefined,
        projectId: project.id,
        contextIds: selectedContexts.length ? selectedContexts : undefined,
      });
      setTitle('');
      setNotes('');
      setEnergy('medium');
      setMinutes('');
      setDueDate('');
      setSelectedContexts([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <Link to="/projects" className="back-link">← Back to Projects</Link>

      <div className="page-header">
        <div>
          <h2>{project.name}</h2>
          {project.description && <p className="page-subtitle">{project.description}</p>}
          <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Action'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleAddAction}>
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

      <h3>Actions ({project.actions?.length || 0})</h3>
      <ul className="item-list">
        {(project.actions || []).map((a) => (
          <li key={a.id} className={`item-card ${a.status === 'completed' ? 'processed' : ''}`}>
            <div className="item-main">
              <span className="item-title">{a.title}</span>
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
          </li>
        ))}
        {(!project.actions || project.actions.length === 0) && (
          <li className="empty-state">No actions yet. Add one to define the next steps.</li>
        )}
      </ul>
    </div>
  );
}
