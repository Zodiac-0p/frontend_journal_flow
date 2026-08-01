import api from "./api";

const managerService = {
  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  async listUsers(role = "") {
    const response = await api.get(`/accounts/users/${role ? `?role=${role}` : ""}`);
    return response.data?.results || response.data || [];
  },

  async toggleReviewerStatus(userId) {
    const response = await api.post(`/accounts/users/${userId}/make-reviewer/`);
    return response.data;
  },

  async createEditor(data) {
    const payload = {
      email: String(data.email || "").trim().toLowerCase(),
      username: data.username || String(data.email || "").split("@")[0],
      full_name: data.full_name,
      phone: data.phone || "",
      affiliation: data.affiliation || "",
      organization: data.organization || data.affiliation || "",
      job_title: data.job_title || "",
      expertise: data.expertise || "",
    };
    const response = await api.post("/accounts/users/create-editor/", payload);
    return response.data;
  },
};

export default managerService;
