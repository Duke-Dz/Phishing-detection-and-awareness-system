import api from "./api";

const extractError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred.";
  throw new Error(message);
};

export const authService = {
  async register({ username, full_name, email, password }) {
    try {
      const { data } = await api.post("/auth/register", {
        username,
        full_name,
        email,
        password,
      });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async login({ identifier, password }) {
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async verifyEmail({ email, otp_code }) {
    try {
      const { data } = await api.post("/auth/verify-email", {
        email,
        otp_code,
      });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async resendVerification(email) {
    try {
      const { data } = await api.post("/auth/resend-verification", { email });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async forgotPassword(email) {
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async resetPassword({ email, otp_code, new_password, confirm_password }) {
    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        otp_code,
        new_password,
        confirm_password,
      });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async refreshToken(refreshToken) {
    try {
      const { data } = await api.post("/auth/refresh", { refreshToken });
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async getMe() {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (error) {
      extractError(error);
    }
  },

  async logout({ refreshToken, allDevices = false }) {
    try {
      const { data } = await api.post("/auth/logout", {
        refreshToken,
        all_devices: allDevices,
      });
      return data;
    } catch (error) {
      extractError(error);
    }
  },
};
