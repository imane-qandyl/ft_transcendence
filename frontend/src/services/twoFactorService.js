import axios from 'axios';

// Use relative path - nginx will proxy to backend
const API_URL = '/api/v1';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const twoFactorService = {
  // Check if 2FA is enabled
  async getStatus() {
    const response = await api.get('auth/2fa/status');
    return response.data;
  },

  // Enable 2FA and get QR code
  async enable() {
    const response = await api.post('auth/2fa/enable');
    return response.data;
  },

  // Verify 2FA token
  async verify(token) {
    const response = await api.post('auth/2fa/verify', { token });
    return response.data;
  },

  // Disable 2FA
  async disable(token) {
    const response = await api.post('auth/2fa/disable', { token });
    return response.data;
  },

  // Login with 2FA
  async loginWith2FA(credentials, twoFactorToken) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      ...credentials,
      twoFactorToken
    });
    return response.data;
  }
};

export default twoFactorService;