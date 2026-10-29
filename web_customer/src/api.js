import { io } from 'socket.io-client';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getStoredToken() {
  return localStorage.getItem('vs_token');
}

export function setStoredSession(token, refreshToken, user) {
  if (token) localStorage.setItem('vs_token', token);
  if (refreshToken) localStorage.setItem('vs_refresh_token', refreshToken);
  if (user) localStorage.setItem('vs_user', JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem('vs_token');
  localStorage.removeItem('vs_refresh_token');
  localStorage.removeItem('vs_user');
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (_) {
    throw new ApiError(
      'Unable to reach server. Please check your internet connection and try again.',
      0,
      { code: 'NETWORK_ERROR' }
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok || (payload && payload.success === false)) {
    const msg =
      payload?.error ||
      payload?.message ||
      `Request failed with HTTP ${response.status}`;
    throw new ApiError(msg, response.status, payload?.details || null);
  }

  return payload;
}

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body, extraHeaders = {}) =>
    apiRequest(path, { method: 'POST', body, headers: extraHeaders }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

let socketInstance = null;

export function connectRealtimeSocket() {
  const token = getStoredToken();
  if (socketInstance) {
    socketInstance.disconnect();
  }
  socketInstance = io('/', {
    path: '/socket.io',
    auth: token ? { token } : {},
    transports: ['websocket', 'polling'],
  });
  return socketInstance;
}

export function getRealtimeSocket() {
  if (!socketInstance) {
    return connectRealtimeSocket();
  }
  return socketInstance;
}

export function disconnectRealtimeSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
