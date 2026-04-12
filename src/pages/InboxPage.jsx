import { useState, useEffect } from 'react';
import { getInbox, createInboxItem, updateInboxItem, deleteInboxItem, createProject } from '../api';

export default function InboxPage() {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setItems(await getInbox(showAll));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [showAll]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createInboxItem(content.trim());
      setContent('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleProcess(id) {
    try {
      await updateInboxItem(id, { processed: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddAsProject(item) {
    try {
      await createProject(item.content);
      await updateInboxItem(item.id, { processed: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteInboxItem(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Inbox</h2>
        <label className="toggle-label">
          <input type="checkbox" checked={showAll} onChange={() => setShowAll(!showAll)} />
          Show processed
        </label>
      </div>
      <p className="page-subtitle">Capture everything on your mind. Process later.</p>

      {error && <p className="error-msg">{error}</p>}

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <button className="btn btn-primary" type="submit">Capture</button>
      </form>

      <ul className="item-list">
        {items.map((item) => (
          <li key={item.id} className={`item-card ${item.processed_at ? 'processed' : ''}`}>
            <span className="item-content">{item.content}</span>
            <div className="item-actions">
              {!item.processed_at && (
                <>
                  <button className="btn btn-small btn-primary" onClick={() => handleAddAsProject(item)}>
                    Add as project
                  </button>
                  <button className="btn btn-small btn-success" onClick={() => handleProcess(item.id)}>
                    Processed
                  </button>
                </>
              )}
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(item.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="empty-state">Your inbox is empty — great job!</li>}
      </ul>
    </div>
  );
}
