async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.details = data.details || {};
    throw err;
  }
  return data;
}

export const api = {
  meta: () => request('/meta'),
  insights: () => request('/insights'),
  listEmployees: (params) => request(`/employees?${new URLSearchParams(params)}`),
  createEmployee: (body) => request('/employees', { method: 'POST', body }),
  updateEmployee: (id, body) => request(`/employees/${id}`, { method: 'PUT', body }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
};
