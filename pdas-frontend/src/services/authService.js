import api from "./api";

export const authService = {
  async register({ username, full_name, email, password }) {
    const { data } = await api.post("/auth/register", {
      username,
      full_name,
      email,
      password,
    });
    return data;
  },

  async login({ identifier, password, remember_me }) {
    const { data } = await api.post("/auth/login", { identifier, password, remember_me });
    return data;
  },

  async verifyEmail({ token }) {
    const { data } = await api.post("/auth/verify-email", { token });
    return data;
  },

  async resendVerification(email) {
    const { data } = await api.post("/auth/resend-verification", { email });
    return data;
  },

  async forgotPassword(email) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword({ token, new_password, confirm_password }) {
    const { data } = await api.post("/auth/reset-password", {
      token,
      new_password,
      confirm_password,
    });
    return data;
  },

  async refreshToken(refreshToken) {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    return data;
  },

  async getMe() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async logout({ refreshToken, allDevices = false }) {
    const { data } = await api.post("/auth/logout", {
      refreshToken,
      all_devices: allDevices,
    });
    return data;
  },
};
