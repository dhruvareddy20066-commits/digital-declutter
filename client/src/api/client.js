import axios from 'axios';

export const ITEMS_CHANGED = 'items:changed';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

client.interceptors.response.use(
  (response) => {
    // Any write tells listeners (e.g. the navbar badge) to refresh.
    if (response.config.method !== 'get') window.dispatchEvent(new Event(ITEMS_CHANGED));
    return response;
  },
  (error) => {
    const data = error.response?.data;
    error.userMessage = data?.message
      ? data.message
      : 'Cannot reach the server. Check that the API is running on port 5000.';
    error.fieldErrors = (data?.errors || []).reduce(
      (acc, e) => (e.field ? { ...acc, [e.field]: e.message } : acc),
      {}
    );
    error.status = error.response?.status;
    return Promise.reject(error);
  }
);

export const listItems = (params) => client.get('/items', { params }).then((r) => r.data);
export const getItem = (id) => client.get(`/items/${id}`).then((r) => r.data);
export const createItem = (body) => client.post('/items', body).then((r) => r.data);
export const updateItem = (id, body) => client.put(`/items/${id}`, body).then((r) => r.data);
export const reviewItem = (id) => client.patch(`/items/${id}/review`).then((r) => r.data);
export const deleteItem = (id) => client.delete(`/items/${id}`).then((r) => r.data);
export const getStaleItems = (days) => client.get('/items/stale', { params: { days } }).then((r) => r.data);
export const getStats = (days) => client.get('/stats', { params: { days } }).then((r) => r.data);

export default client;
