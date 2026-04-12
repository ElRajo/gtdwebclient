import { useState, useEffect } from 'react';
import { getContexts, createContext, updateContext, deleteContext } from '../api';

export default function ContextsPage() {
  const [contexts, setContexts] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setContexts(await getContexts());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createContext(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(ctx) {
    setEditingId(ctx.id);
    setEditName(ctx.name);
    setEditDesc(ctx.description || '');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    try {
      await updateContext(editingId, { name: editName.trim(), description: editDesc.trim() || undefined });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteContext(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Contexts</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Context'}
        </button>
      </div>
      <p className="page-subtitle">Contexts describe the situation or place where you can do an action (e.g. @office, @phone, @errands).</p>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleCreate}>
          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="e.g. @office" />
          </label>
          <label>
            Description
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </label>
          <button className="btn btn-primary" type="submit">Create Context</button>
        </form>
      )}

      <ul className="item-list">
        {contexts.map((c) => (
          <li key={c.id} className="item-card">
            {editingId === c.id ? (
              <form className="inline-edit-form" onSubmit={handleSaveEdit}>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                <button className="btn btn-small btn-primary" type="submit">Save</button>
                <button className="btn btn-small" type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <div className="item-main">
                  <span className="item-title context-name">@{c.name}</span>
                  {c.description && <p className="item-desc">{c.description}</p>}
                </div>
                <div className="item-actions">
                  <button className="btn btn-small" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn btn-small btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
        {contexts.length === 0 && <li className="empty-state">No contexts yet. Create one to tag where actions can be done.</li>}
      </ul>
    </div>
  );
}
