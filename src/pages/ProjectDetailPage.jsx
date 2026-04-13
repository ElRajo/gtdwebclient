import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getProject, updateProject, createAction, getContexts,
  getReferenceDocs, createReferenceDoc, deleteReferenceDoc,
  decomposeProject, getSuggestions, acceptSuggestion, dismissSuggestion,
} from '../api';

const ACTION_STATUSES = ['active', 'completed', 'waiting'];
const ENERGY_LEVELS = ['low', 'medium', 'high'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [contexts, setContexts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // Reference docs state
  const [docs, setDocs] = useState([]);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docUrl, setDocUrl] = useState('');

  // AI suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [decomposing, setDecomposing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  // new action form fields
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [energy, setEnergy] = useState('medium');
  const [minutes, setMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedContexts, setSelectedContexts] = useState([]);

  async function load() {
    try {
      const [p, ctx, d, s] = await Promise.all([
        getProject(id),
        getContexts(),
        getReferenceDocs(id),
        getSuggestions(id),
      ]);
      setProject(p);
      setContexts(ctx);
      setDocs(d);
      setSuggestions(s);
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

  async function handleAddDoc(e) {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;
    try {
      await createReferenceDoc(id, {
        title: docTitle.trim(),
        content: docContent.trim(),
        sourceUrl: docUrl.trim() || undefined,
      });
      setDocTitle('');
      setDocContent('');
      setDocUrl('');
      setShowDocForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteDoc(docId) {
    try {
      await deleteReferenceDoc(id, docId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDecompose() {
    setDecomposing(true);
    setError('');
    try {
      const newSuggestions = await decomposeProject(id);
      setSuggestions((prev) => [...newSuggestions, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setDecomposing(false);
    }
  }

  async function handleAccept(suggestionId) {
    setAcceptingId(suggestionId);
    try {
      await acceptSuggestion(suggestionId);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleDismiss(suggestionId) {
    try {
      await dismissSuggestion(suggestionId);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAcceptAll() {
    for (const s of suggestions) {
      await handleAccept(s.id);
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

      {/* ── AI Suggestions ──────────────────────────────────────────── */}
      <div className="section-header">
        <h3>AI Suggestions</h3>
        <button
          className="btn btn-primary"
          onClick={handleDecompose}
          disabled={decomposing}
        >
          {decomposing ? 'Analyzing…' : '✨ Suggest Next Actions'}
        </button>
      </div>

      {decomposing && (
        <div className="ai-loading">
          <p>The AI agent is analyzing your project, reviewing reference docs, and searching for relevant information…</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="suggestion-actions-bar">
            <span className="text-muted">{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} pending</span>
            <button className="btn btn-success btn-small" onClick={handleAcceptAll}>Accept All</button>
          </div>
          <ul className="item-list">
            {suggestions.map((s) => (
              <li key={s.id} className="item-card suggestion-card">
                <div className="item-main">
                  <span className="item-title">{s.title}</span>
                  {s.notes && <p className="item-desc">{s.notes}</p>}
                  <div className="action-meta">
                    {s.energy_level && <span className="badge badge-energy">{s.energy_level} energy</span>}
                    {s.estimated_minutes && <span className="meta-tag">{s.estimated_minutes} min</span>}
                    {s.context_names && s.context_names.length > 0 && s.context_names.map((c, i) => (
                      <span key={i} className="context-tag">@{c}</span>
                    ))}
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    className="btn btn-success btn-small"
                    onClick={() => handleAccept(s.id)}
                    disabled={acceptingId === s.id}
                  >
                    {acceptingId === s.id ? '…' : 'Accept'}
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => handleDismiss(s.id)}>Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Reference Documents ─────────────────────────────────────── */}
      <div className="section-header">
        <h3>Reference Documents ({docs.length})</h3>
        <button className="btn btn-small" onClick={() => setShowDocForm(!showDocForm)}>
          {showDocForm ? 'Cancel' : '+ Add Document'}
        </button>
      </div>

      {showDocForm && (
        <form className="card-form" onSubmit={handleAddDoc}>
          <label>
            Title
            <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required autoFocus />
          </label>
          <label>
            Content (paste email, notes, etc.)
            <textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={5} required />
          </label>
          <label>
            Source URL (optional)
            <input type="url" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." />
          </label>
          <button className="btn btn-primary" type="submit">Save Document</button>
        </form>
      )}

      <ul className="item-list">
        {docs.map((d) => (
          <li key={d.id} className="item-card">
            <div className="item-main">
              <span className="item-title">{d.title}</span>
              {d.source_url && <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="item-desc">{d.source_url}</a>}
              <p className="item-desc doc-preview">{d.content.slice(0, 200)}{d.content.length > 200 ? '…' : ''}</p>
            </div>
            <div className="item-actions">
              <button className="btn btn-danger btn-small" onClick={() => handleDeleteDoc(d.id)}>Delete</button>
            </div>
          </li>
        ))}
        {docs.length === 0 && !showDocForm && (
          <li className="empty-state">No reference documents. Add emails, notes, or links to give the AI more context.</li>
        )}
      </ul>
    </div>
  );
}
