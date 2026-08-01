// src/services/superAdminService.js
//
// Every Super Admin API call in one place.
// Uses the shared axios instance (api.js):
//   ✅ Auto-attaches JWT Bearer token
//   ✅ Auto-retries on 401 with token refresh
//   ✅ CORS credentials (withCredentials: true)

import api from "./api";

const superAdminService = {

  // ─────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────

  async login(email, password, secretKey) {
    const response = await api.post("/accounts/sa-auth/", {
      email: email.trim().toLowerCase(),
      password,
      secret_key: secretKey,
    });
    const { access, user } = response.data;
    sessionStorage.setItem("accessToken", access);
    sessionStorage.setItem("token", access);
    const currentUser = {
      id: user.id,
      email: user.email,
      fullName: user.full_name || user.username || user.email,
      full_name: user.full_name || "",
      name: user.full_name || "",
      username: user.username || "",
      role: "super_admin",
      primary_role: "super_admin",
      is_super_admin: true,
      is_editorial_manager: !!user.is_editorial_manager,
      is_editor: !!user.is_editor,
      is_reviewer: false,
      is_superuser: !!user.is_superuser,
      is_staff: !!user.is_staff,
      organization: user.organization || "",
      affiliation: user.affiliation || "",
      job_title: user.job_title || "",
    };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    return currentUser;
  },

  logout() {
    api.post("/accounts/logout/").catch(() => {});
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    window.location.replace("/login");
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch { return null; }
  },

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return !!(user?.is_super_admin || user?.primary_role === "super_admin" || user?.role === "super_admin");
  },

  // ─────────────────────────────────────────────────────────────────
  // STATS
  // GET /api/accounts/sa-stats/
  // ─────────────────────────────────────────────────────────────────

  async getStats() {
    const r = await api.get("/accounts/sa-stats/");
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // USERS — full CRUD
  // ─────────────────────────────────────────────────────────────────

  async getUsers(role = "") {
    const url = role ? `/accounts/sa-users/?role=${role}` : "/accounts/sa-users/";
    const r = await api.get(url);
    return r.data?.results ?? r.data ?? [];
  },

  async getUser(userId) {
    const r = await api.get(`/accounts/sa-users/${userId}/detail/`);
    return r.data;
  },

  async createUser(data) {
    // data: { email, password, full_name, role, phone?, affiliation?, organization?, country?, job_title? }
    const r = await api.post("/accounts/sa-users/create/", data);
    return r.data;
  },

  async updateUser(userId, data) {
    // data: any subset of editable fields
    const r = await api.patch(`/accounts/sa-users/${userId}/detail/`, data);
    return r.data;
  },

  async deleteUser(userId) {
    const r = await api.delete(`/accounts/sa-users/${userId}/detail/`);
    return r.data;
  },

  async toggleManager(userId) {
    const r = await api.post(`/accounts/sa-users/${userId}/toggle-manager/`);
    return r.data;
  },

  async toggleActive(userId) {
    const r = await api.post(`/accounts/sa-users/${userId}/toggle-active/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // ROLE CHOICES — full CRUD
  // GET/POST   /api/accounts/role-choices/
  // PATCH/DEL  /api/accounts/role-choices/:id/
  // ─────────────────────────────────────────────────────────────────

  async getRoleChoices() {
    const r = await api.get("/accounts/role-choices/");
    return r.data?.results ?? r.data ?? [];
  },

  async createRoleChoice(name) {
    const r = await api.post("/accounts/role-choices/", { name, is_active: true });
    return r.data;
  },

  async updateRoleChoice(id, data) {
    const r = await api.patch(`/accounts/role-choices/${id}/`, data);
    return r.data;
  },

  async deleteRoleChoice(id) {
    const r = await api.delete(`/accounts/role-choices/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // DISCIPLINES — full CRUD
  // GET/POST   /api/accounts/disciplines/
  // PATCH/DEL  /api/accounts/disciplines/:id/
  // ─────────────────────────────────────────────────────────────────

  async getDisciplines() {
    const r = await api.get("/accounts/disciplines/");
    return r.data?.results ?? r.data ?? [];
  },

  async createDiscipline(name) {
    const r = await api.post("/accounts/disciplines/", { name, is_active: true });
    return r.data;
  },

  async updateDiscipline(id, data) {
    const r = await api.patch(`/accounts/disciplines/${id}/`, data);
    return r.data;
  },

  async deleteDiscipline(id) {
    const r = await api.delete(`/accounts/disciplines/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // ARTICLE TYPES — full CRUD
  // GET/POST   /api/journals/article-types/
  // PATCH/DEL  /api/journals/article-types/:id/
  // ─────────────────────────────────────────────────────────────────

  async getArticleTypes() {
    const r = await api.get("/journals/article-types/");
    return r.data?.results ?? r.data ?? [];
  },

  async createArticleType(name) {
    const r = await api.post("/journals/article-types/", { name, is_active: true });
    return r.data;
  },

  async updateArticleType(id, data) {
    const r = await api.patch(`/journals/article-types/${id}/`, data);
    return r.data;
  },

  async deleteArticleType(id) {
    const r = await api.delete(`/journals/article-types/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // CLASSIFICATIONS — full CRUD
  // GET/POST   /api/journals/classifications/
  // PATCH/DEL  /api/journals/classifications/:id/
  // ─────────────────────────────────────────────────────────────────

  async getClassifications() {
    const r = await api.get("/journals/classifications/");
    return r.data?.results ?? r.data ?? [];
  },

  async createClassification(name) {
    const r = await api.post("/journals/classifications/", { name, is_active: true });
    return r.data;
  },

  async updateClassification(id, data) {
    const r = await api.patch(`/journals/classifications/${id}/`, data);
    return r.data;
  },

  async deleteClassification(id) {
    const r = await api.delete(`/journals/classifications/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // CONTRIBUTOR ROLES — full CRUD
  // GET/POST   /api/journals/contributor-roles/
  // PATCH/DEL  /api/journals/contributor-roles/:id/
  // ─────────────────────────────────────────────────────────────────

  async getContributorRoles() {
    const r = await api.get("/journals/contributor-roles/");
    return r.data?.results ?? r.data ?? [];
  },

  async createContributorRole(name) {
    const r = await api.post("/journals/contributor-roles/", { name, is_active: true });
    return r.data;
  },

  async updateContributorRole(id, data) {
    const r = await api.patch(`/journals/contributor-roles/${id}/`, data);
    return r.data;
  },

  async deleteContributorRole(id) {
    const r = await api.delete(`/journals/contributor-roles/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // SUBMISSION FILE TYPES — full CRUD
  // GET/POST   /api/journals/submission-file-types/
  // PATCH/DEL  /api/journals/submission-file-types/:id/
  // ─────────────────────────────────────────────────────────────────

  async getFileTypes() {
    const r = await api.get("/journals/submission-file-types/");
    return r.data?.results ?? r.data ?? [];
  },

  async createFileType(data) {
    // data: { name, is_required, allow_multiple, is_active }
    const r = await api.post("/journals/submission-file-types/", { is_active: true, ...data });
    return r.data;
  },

  async updateFileType(id, data) {
    const r = await api.patch(`/journals/submission-file-types/${id}/`, data);
    return r.data;
  },

  async deleteFileType(id) {
    const r = await api.delete(`/journals/submission-file-types/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // SUBMISSIONS — list + status change
  // GET  /api/journals/submissions/
  // ─────────────────────────────────────────────────────────────────

  async getSubmissions(statusFilter = "") {
    const url = statusFilter
      ? `/journals/submissions/?status=${statusFilter}`
      : "/journals/submissions/";
    const r = await api.get(url);
    return r.data?.results ?? r.data ?? [];
  },

  async getSubmission(id) {
    const r = await api.get(`/journals/submissions/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // SUBMISSION AUTHORS — read-only list (nested under submissions)
  // GET /api/journals/submissions/:id/authors/
  // ─────────────────────────────────────────────────────────────────

  async getSubmissionAuthors(submissionId) {
    const r = await api.get(`/journals/submissions/${submissionId}/authors/`);
    return r.data?.results ?? r.data ?? [];
  },

  // ─────────────────────────────────────────────────────────────────
  // SUBMISSION FILES — read-only list (nested under submissions)
  // GET /api/journals/submissions/:id/files/
  // ─────────────────────────────────────────────────────────────────

  async getSubmissionFiles(submissionId) {
    const r = await api.get(`/journals/submissions/${submissionId}/files/`);
    return r.data?.results ?? r.data ?? [];
  },

  // ─────────────────────────────────────────────────────────────────
  // REVIEWER ASSIGNMENTS — list all
  // ─────────────────────────────────────────────────────────────────

  async getReviewerAssignments(status = "") {
    // accepted/pending lists are separate endpoints
    if (status === "pending") {
      const r = await api.get("/journals/reviewer-assignments/pending/");
      return r.data?.results ?? r.data ?? [];
    }
    if (status === "accepted") {
      const r = await api.get("/journals/reviewer-assignments/accepted/");
      return r.data?.results ?? r.data ?? [];
    }
    // Default: get accepted (most useful for admin overview)
    const r = await api.get("/journals/reviewer-assignments/accepted/");
    return r.data?.results ?? r.data ?? [];
  },

  async getReviewerAssignment(id) {
    const r = await api.get(`/journals/reviewer-assignments/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // REVIEWER REPORTS — list all
  // GET /api/journals/review-reports/
  // ─────────────────────────────────────────────────────────────────

  async getReviewReports() {
    const r = await api.get("/journals/review-reports/");
    return r.data?.results ?? r.data ?? [];
  },

  // ─────────────────────────────────────────────────────────────────
  // NOTIFICATIONS — list all (super admin endpoint)
  // GET /api/accounts/sa-notifications/
  // ─────────────────────────────────────────────────────────────────

  async getNotifications() {
    const r = await api.get("/accounts/sa-notifications/");
    return r.data?.results ?? r.data ?? [];
  },

  // ─────────────────────────────────────────────────────────────────
  // FULL SITE CONTROLS — DELETE SUPPORT FOR ALL MODELS
  // ─────────────────────────────────────────────────────────────────
  async deleteSubmission(id) {
    const r = await api.delete(`/journals/submissions/${id}/`);
    return r.data;
  },
  async deleteSubmissionAuthor(id) {
    const r = await api.delete(`/journals/submission-authors/${id}/`);
    return r.data;
  },
  async deleteSubmissionFile(id) {
    const r = await api.delete(`/journals/submission-files/${id}/`);
    return r.data;
  },
  async deleteReviewerAssignment(id) {
    const r = await api.delete(`/accounts/sa-reviewer-assignments/${id}/`);
    return r.data;
  },
  async deleteReviewReport(id) {
    const r = await api.delete(`/accounts/sa-review-reports/${id}/`);
    return r.data;
  },
  async deleteNotification(id) {
    const r = await api.delete(`/accounts/sa-notifications/${id}/`);
    return r.data;
  },

  // ─────────────────────────────────────────────────────────────────
  // FULL SITE CONTROLS — UPDATE SUPPORT FOR ALL MODELS
  // ─────────────────────────────────────────────────────────────────
  async updateSubmission(id, data) {
    const r = await api.patch(`/accounts/sa-submissions/${id}/edit/`, data);
    return r.data;
  },
  async updateSubmissionAuthor(id, data) {
    const r = await api.patch(`/accounts/sa-submission-authors/${id}/edit/`, data);
    return r.data;
  },
  async updateSubmissionFile(id, data) {
    const r = await api.patch(`/accounts/sa-submission-files/${id}/edit/`, data);
    return r.data;
  },
  async updateReviewerAssignment(id, data) {
    const r = await api.patch(`/accounts/sa-reviewer-assignments/${id}/edit/`, data);
    return r.data;
  },
  async updateReviewReport(id, data) {
    const r = await api.patch(`/accounts/sa-review-reports/${id}/edit/`, data);
    return r.data;
  },
  async updateNotification(id, data) {
    const r = await api.patch(`/accounts/sa-notifications/${id}/edit/`, data);
    return r.data;
  },
};

export default superAdminService;
