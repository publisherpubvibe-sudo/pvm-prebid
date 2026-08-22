import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const client = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pv_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  me: () => client.get('/auth/me'),
  changePassword: (data) => client.post('/auth/change-password', data),
};

export const publisherApi = {
  list: () => client.get('/publishers'),
  get: (id) => client.get(`/publishers/${id}`),
  create: (data) => client.post('/publishers', data),
  update: (id, data) => client.patch(`/publishers/${id}`, data),
  remove: (id) => client.delete(`/publishers/${id}`),
  addWebsite: (id, data) => client.post(`/publishers/${id}/websites`, data),
  addAdUnit: (id, data) => client.post(`/publishers/${id}/adunits`, data),
};

export const adminApi = {
  list: () => client.get('/admins'),
  create: (data) => client.post('/admins', data),
  update: (id, data) => client.patch(`/admins/${id}`, data),
  remove: (id) => client.delete(`/admins/${id}`),
};

export const logsApi = {
  auction: (params) => client.get('/logs/auction', { params }),
  server: (lines) => client.get('/logs/server', { params: { lines } }),
  errors: (lines) => client.get('/logs/errors', { params: { lines } }),
};

export const statsApi = {
  overview: () => client.get('/stats/overview'),
  timeseries: (hours) => client.get('/stats/timeseries', { params: { hours } }),
};

export const testApi = {
  bid: (data) => client.post('/test/bid', data),
  bidAll: (data) => client.post('/test/bid-all', data),
};

export const bidderApi = {
  list: () => client.get('/bidders'),
  endpoints: () => client.get('/bidders/pubvibe/endpoints'),
};

export const websiteApi = {
  list: () => client.get('/websites'),
  approve: (pubId, siteId) => client.patch(`/websites/${pubId}/${siteId}/approve`),
  remove: (pubId, siteId) => client.delete(`/websites/${pubId}/${siteId}`),
};

export default client;
