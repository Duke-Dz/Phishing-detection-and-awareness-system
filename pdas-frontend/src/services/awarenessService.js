import api from "./api";

export const awarenessService = {
  async list(params = {}) {
    const { data } = await api.get("/awareness", { params });
    return data;
  },
};
