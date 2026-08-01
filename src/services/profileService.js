// src/services/profileService.js
import api from "./api";

const profileService = {
  // Profile Core Data
  getProfile: async () => {
    const response = await api.get("/accounts/profile/");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.patch("/accounts/profile/", profileData);
    return response.data;
  },

  // Relational Choice Option Lists from your Spec
  getRoleChoices: async () => {
    const response = await api.get("/accounts/role-choices/");
    // Safely unwrap Django's pagination array if present, otherwise fallback to direct data
    return response.data?.results || response.data;
  },

  getDisciplines: async () => {
    const response = await api.get("/accounts/disciplines/");
    // Safely unwrap Django's pagination array if present, otherwise fallback to direct data
    return response.data?.results || response.data;
  },

  getClassifications: async () => {
    // Public endpoint as per Section 2, Note #30
    const response = await api.get("/journals/classifications/");
    // Safely unwrap Django's pagination array if present, otherwise fallback to direct data
    return response.data?.results || response.data;
  },

  // Role Choices CRUD
  createRoleChoice: async (payload) => {
    const response = await api.post("/accounts/role-choices/", payload);
    return response.data;
  },
  updateRoleChoice: async (id, payload) => {
    const response = await api.put(`/accounts/role-choices/${id}/`, payload);
    return response.data;
  },
  patchRoleChoice: async (id, payload) => {
    const response = await api.patch(`/accounts/role-choices/${id}/`, payload);
    return response.data;
  },
  deleteRoleChoice: async (id) => {
    const response = await api.delete(`/accounts/role-choices/${id}/`);
    return response.data;
  },

  // Disciplines CRUD
  createDiscipline: async (payload) => {
    const response = await api.post("/accounts/disciplines/", payload);
    return response.data;
  },
  updateDiscipline: async (id, payload) => {
    const response = await api.put(`/accounts/disciplines/${id}/`, payload);
    return response.data;
  },
  patchDiscipline: async (id, payload) => {
    const response = await api.patch(`/accounts/disciplines/${id}/`, payload);
    return response.data;
  },
  deleteDiscipline: async (id) => {
    const response = await api.delete(`/accounts/disciplines/${id}/`);
    return response.data;
  },

  // Classifications CRUD
  createClassification: async (payload) => {
    const response = await api.post("/journals/classifications/", payload);
    return response.data;
  },
  updateClassification: async (id, payload) => {
    const response = await api.put(`/journals/classifications/${id}/`, payload);
    return response.data;
  },
  patchClassification: async (id, payload) => {
    const response = await api.patch(`/journals/classifications/${id}/`, payload);
    return response.data;
  },
  deleteClassification: async (id) => {
    const response = await api.delete(`/journals/classifications/${id}/`);
    return response.data;
  },
};

export default profileService;