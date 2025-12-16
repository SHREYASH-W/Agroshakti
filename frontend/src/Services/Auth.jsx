import api from './Api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  async verifyToken(token) {
    const response = await api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async loginWithPhone(phoneData) {
    const response = await api.post('/auth/login/phone', phoneData);
    return response.data;
  },

  async verifyOTP(otpData) {
    const response = await api.post('/auth/verify/otp', otpData);
    return response.data;
  }
};