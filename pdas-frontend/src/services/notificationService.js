import api from "./api";

export const notificationService = {
  async list(params = {}) {
    const { data } = await api.get("/notifications", { params });
    return data;
  },
  async markRead(notificationId) {
    const { data } = await api.patch(`/notifications/${notificationId}/read`);
    return data;
  },
  async markAllRead() {
    const { data } = await api.patch("/notifications/read-all");
    return data;
  },
  async clearRead() {
    const { data } = await api.delete("/notifications/read");
    return data;
  },
};
