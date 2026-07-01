import api from "./api";

export const emailService = {
  async analyze(content) {
    const { data } = await api.post("/email/analyze", { content });
    return data;
  },
};
