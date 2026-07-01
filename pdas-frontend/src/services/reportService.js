import api from "./api";

export const reportService = {
  async list(params = {}) {
    const { data } = await api.get("/reports", { params });
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/reports", payload);
    return data;
  },
};
