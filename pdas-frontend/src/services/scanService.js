import api from "./api";

export const scanService = {
  async list(params = {}) {
    const { data } = await api.get("/scan", { params });
    return data;
  },
  async scanUrl(url) {
    const { data } = await api.post("/scan/url", { url });
    return data;
  },
  async scanSms(content) {
    const { data } = await api.post("/scan/sms", { content });
    return data;
  },
};
