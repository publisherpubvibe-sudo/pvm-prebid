import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pv_pub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pv_pub_token');
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
  addWebsite: (id, data) => client.post(`/publishers/${id}/websites`, data),
  addAdUnit: (id, data) => client.post(`/publishers/${id}/adunits`, data),
};

export const logsApi = {
  auction: (params) => client.get('/logs/auction', { params }),
};

export const statsApi = {
  overview: () => client.get('/stats/overview'),
  timeseries: (hours) => client.get('/stats/timeseries', { params: { hours } }),
};

export default client;
