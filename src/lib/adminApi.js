async function request(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    const err = new Error('Não autenticado');
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const adminApi = {
  login: (password) => request('admin-login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('admin-logout', { method: 'POST' }),
  session: () => request('admin-session'),

  listCoberturas: () => request('admin-coberturas'),
  createCobertura: (data) => request('admin-coberturas', { method: 'POST', body: JSON.stringify(data) }),
  updateCobertura: (id, data) => request('admin-coberturas', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  deleteCobertura: (id) => request(`admin-coberturas?id=${id}`, { method: 'DELETE' }),

  listAvisos: () => request('admin-em-breve'),
  createAviso: (data) => request('admin-em-breve', { method: 'POST', body: JSON.stringify(data) }),
  updateAviso: (id, data) => request('admin-em-breve', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  deleteAviso: (id) => request(`admin-em-breve?id=${id}`, { method: 'DELETE' }),

  listMetas: () => request('admin-progresso'),
  createMeta: (data) => request('admin-progresso', { method: 'POST', body: JSON.stringify(data) }),
  updateMeta: (id, data) => request('admin-progresso', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  deleteMeta: (id) => request(`admin-progresso?id=${id}`, { method: 'DELETE' }),
};
