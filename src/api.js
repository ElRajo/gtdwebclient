const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('gtd_token');
}

function setAuth(token, user) {
  localStorage.setItem('gtd_token', token);
  localStorage.setItem('gtd_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('gtd_token');
  localStorage.removeItem('gtd_user');
}

function getUser() {
  const raw = localStorage.getItem('gtd_user');
  return raw ? JSON.parse(raw) : null;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }

  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────
export async function register(email, password, displayName) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  setAuth(data.token, data.user);
  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.token, data.user);
  return data;
}

export function logout() {
  clearAuth();
}

export { getUser, getToken };

// ── Inbox ────────────────────────────────────────────────────────────
export async function getInbox(all = false) {
  return request(`/inbox${all ? '?all=true' : ''}`);
}

export async function createInboxItem(content) {
  return request('/inbox', { method: 'POST', body: JSON.stringify({ content }) });
}

export async function updateInboxItem(id, updates) {
  return request(`/inbox/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteInboxItem(id) {
  return request(`/inbox/${id}`, { method: 'DELETE' });
}

// ── Projects ─────────────────────────────────────────────────────────
export async function getProjects(status) {
  const qs = status ? `?status=${status}` : '';
  return request(`/projects${qs}`);
}

export async function getProject(id) {
  return request(`/projects/${id}`);
}

export async function createProject(name, description) {
  return request('/projects', { method: 'POST', body: JSON.stringify({ name, description }) });
}

export async function updateProject(id, updates) {
  return request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteProject(id) {
  return request(`/projects/${id}`, { method: 'DELETE' });
}

// ── Actions ──────────────────────────────────────────────────────────
export async function getActions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.project_id) params.set('project_id', filters.project_id);
  if (filters.context_id) params.set('context_id', filters.context_id);
  const qs = params.toString();
  return request(`/actions${qs ? `?${qs}` : ''}`);
}

export async function getAction(id) {
  return request(`/actions/${id}`);
}

export async function createAction(payload) {
  return request('/actions', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAction(id, updates) {
  return request(`/actions/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteAction(id) {
  return request(`/actions/${id}`, { method: 'DELETE' });
}

// ── Contexts ─────────────────────────────────────────────────────────
export async function getContexts() {
  return request('/contexts');
}

export async function createContext(name, description) {
  return request('/contexts', { method: 'POST', body: JSON.stringify({ name, description }) });
}

export async function updateContext(id, updates) {
  return request(`/contexts/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteContext(id) {
  return request(`/contexts/${id}`, { method: 'DELETE' });
}
