import api from "./api";

export const userService = {
  async updateProfile({ full_name }) {
    const { data } = await api.put("/users/profile", { full_name });
    return data;
  },
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.post("/users/avatar", formData);
    return data;
  },
  async getAvatar(avatarUrl) {
    const path = avatarUrl?.replace(/^\/api/, "") || "";
    const { data } = await api.get(path, { responseType: "blob" });
    return URL.createObjectURL(data);
  },
};
