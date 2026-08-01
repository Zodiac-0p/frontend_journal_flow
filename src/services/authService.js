// src/services/authService.js

import api from "./api";

const getDisplayName = (user = {}) => {
  return (
    user.full_name ||
    user.fullName ||
    user.name ||
    user.username ||
    user.email?.split("@")[0] ||
    "User"
  );
};

const authService = {
  // ==========================================
  // CHECK IF EMAIL EXISTS
  // POST /api/accounts/check-email/
  // ==========================================
  async checkEmail(email) {
    const response = await api.post("/accounts/check-email/", {
      email,
    });

    return response.data;
  },

  // ==========================================
  // LIST PUBLIC CLASSIFICATIONS
  // GET /api/journals/classifications/
  // ==========================================
  async getClassifications() {
    const response = await api.get("/journals/classifications/");
    return response.data;
  },

  // ==========================================
  // REGISTER NEW USER
  // POST /api/accounts/register/
  // ==========================================
  async register(data) {
    const normalizedEmail = String(data.email || "").trim().toLowerCase();
    const displayName = data.full_name || data.fullName || data.name || "User";

    const payload = {
      email: normalizedEmail,
      username: data.username || displayName || normalizedEmail,
      full_name: displayName,
      password: data.password,

      phone: data.phone || "",
      affiliation: data.affiliation || "",
      organization: data.organization || data.affiliation || "",
      job_title: data.job_title || data.jobTitle || "",
      expertise: data.expertise || "",

      want_to_be_reviewer: data.want_to_be_reviewer || false,

      role_choice_id: data.role_choice_id || null,
      discipline_ids: data.discipline_ids || [],
      classification_ids: data.classification_ids || [],
    };

    const response = await api.post("/accounts/register/", payload);
    return response.data;
  },

  // ==========================================
  // REQUEST REGISTRATION OTP
  // POST /api/accounts/register/
  // ==========================================
  async requestRegistrationOtp(data) {
    const normalizedEmail = String(data.email || "").trim().toLowerCase();
    const displayName = data.full_name || data.fullName || data.name || "User";

    const payload = {
      email: normalizedEmail,
      username: data.username || displayName || normalizedEmail,
      full_name: displayName,
      password: data.password,
      want_to_be_reviewer: data.want_to_be_reviewer || false,
      classification_ids: data.classification_ids || [],
    };

    const response = await api.post("/accounts/register/", payload);
    return response.data;
  },

  // ==========================================
  // VERIFY REGISTRATION OTP
  // POST /api/accounts/verify-email/ or /api/accounts/verify-registration-otp/
  // ==========================================
  async verifyRegistrationOtp(data) {
    const payload = {
      email: String(data.email || "").trim().toLowerCase(),
      otp: data.otp,
      code: data.otp,
      key: data.otp,
      verification_token: data.verification_token || null,
    };

    try {
      const response = await api.post("/accounts/verify-email/", payload);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const fallbackResponse = await api.post(
          "/accounts/verify-registration-otp/",
          payload
        );
        return fallbackResponse.data;
      }
      throw error;
    }
  },

  // ==========================================
  // RESEND VERIFICATION EMAIL
  // POST /api/accounts/resend-verification-email/
  // ==========================================
  async resendVerificationEmail(data) {
    const response = await api.post("/accounts/resend-verification-email/", {
      email: String(data.email || "").trim().toLowerCase(),
    });

    return response.data;
  },

  // ==========================================
  // LOGIN
  // POST /api/accounts/login/
  // ==========================================
  async login(email, password) {
    const response = await api.post("/accounts/login/", {
      email,
      password,
    });

    const { access, refresh, user } = response.data;
    const displayName = getDisplayName(user);

    sessionStorage.setItem("accessToken", access);
    sessionStorage.setItem("token", access);

    const currentUser = {
      id: user.id,
      email: user.email,

      fullName: displayName,
      full_name: displayName,
      name: displayName,
      username: user.username || "",

      role:
        user.primary_role ||
        (user.is_editor || user.is_staff
          ? "editor"
          : user.is_reviewer
          ? "reviewer"
          : "author"),

      primary_role:
        user.primary_role ||
        (user.is_editor || user.is_staff
          ? "editor"
          : user.is_reviewer
          ? "reviewer"
          : "author"),

      is_editor: !!(user.is_editor || user.is_staff || user.is_superuser),
      is_editorial_manager: !!user.is_editorial_manager,
      is_super_admin: !!user.is_super_admin,
      is_reviewer: !!user.is_reviewer,
      want_to_be_reviewer: !!user.want_to_be_reviewer,
      is_superuser: !!user.is_superuser,
      is_staff: !!user.is_staff,

      organization: user.organization || "",
      affiliation: user.affiliation || "",
      job_title: user.job_title || "",
      expertise: user.expertise || "",
      classifications: user.classifications || [],
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    return currentUser;
  },

  // ==========================================
  // REGISTER + AUTO LOGIN
  // ==========================================
  async registerAndLogin(data) {
    await this.register(data);
    return await this.login(data.email, data.password);
  },

  // ==========================================
  // SUPER ADMIN LOGIN  (3-factor)
  // POST /api/accounts/sa-auth/
  // ==========================================
  async superAdminLogin(email, password, secretKey) {
    const response = await api.post("/accounts/sa-auth/", {
      email: email.trim().toLowerCase(),
      password,
      secret_key: secretKey,
    });

    const { access, user } = response.data;
    const displayName = getDisplayName(user);

    sessionStorage.setItem("accessToken", access);
    sessionStorage.setItem("token", access);

    const currentUser = {
      id: user.id,
      email: user.email,
      fullName: displayName,
      full_name: displayName,
      name: displayName,
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

  // ==========================================
  // GET PROFILE
  // GET /api/accounts/profile/
  // ==========================================
  async getProfile() {
    const response = await api.get("/accounts/profile/");
    return response.data;
  },

  // ==========================================
  // UPDATE PROFILE
  // PATCH /api/accounts/profile/
  // ==========================================
  async updateProfile(data) {
    const response = await api.patch("/accounts/profile/", data);

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const displayName =
      data.full_name ||
      data.fullName ||
      data.name ||
      currentUser.fullName ||
      currentUser.name ||
      "User";

    const updatedUser = {
      ...currentUser,
      ...data,

      fullName: displayName,
      full_name: displayName,
      name: displayName,
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    return response.data;
  },

  // ==========================================
  // CHANGE PASSWORD
  // POST /api/accounts/change-password/
  // ==========================================
  async changePassword(data) {
    const response = await api.post("/accounts/change-password/", data);
    return response.data;
  },

  // ==========================================
  // LOGOUT
  // ==========================================
  logout() {
    const token = sessionStorage.getItem("accessToken");

    // Run backend logout in background to avoid blocking the UI
    api.post("/accounts/logout/", {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).catch((e) => {
      console.error("Backend logout failed:", e);
    });

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    
    window.location.replace("/login");
  },

  // ==========================================
  // IS AUTHENTICATED
  // ==========================================
  isAuthenticated() {
    return !!sessionStorage.getItem("accessToken");
  },

  // ==========================================
  // GET CURRENT USER
  // ==========================================
  getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  },

  // ==========================================
  // GET USER ROLE
  // ==========================================
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || user?.primary_role || "author";
  },

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

  // ==========================================
  // ROLE HELPERS
  // ==========================================
  isEditor() {
    const user = this.getCurrentUser();

    if (
      user?.is_editor ||
      user?.is_staff ||
      user?.is_superuser ||
      user?.is_editorial_manager
    ) {
      return true;
    }

    const role = this.getUserRole();

    return ["editor", "editorial_manager", "super_admin", "staff"].includes(
      String(role).toLowerCase()
    );
  },

  isReviewer() {
    const user = this.getCurrentUser();

    if (user?.is_reviewer || user?.want_to_be_reviewer) {
      return true;
    }

    const role = this.getUserRole();
    return String(role).toLowerCase() === "reviewer";
  },

  isAuthor() {
    return !this.isEditor() && !this.isReviewer();
  },
};

export default authService;