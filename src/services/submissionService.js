// src/services/submissionService.js
import api from "./api";

const submissionService = {
  // Create a blank draft — article_type is null/blank on the backend so we don't pre-fill it
  createSubmission: async () => {
    const response = await api.post("/journals/submissions/", {});
    return response.data;
  },

  updateSubmission: async (submissionId, patchData) => {
    const response = await api.patch(`/journals/submissions/${submissionId}/`, patchData);
    return response.data;
  },

  uploadFile: async (submissionId, file, fileTypeId = 1) => {
    const formData = new FormData();
    formData.append("file_type", String(fileTypeId));
    formData.append("file", file);
    
    const response = await api.post(`/journals/submissions/${submissionId}/files/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, 
    });
    return response.data;
  },

  getUploadedFiles: async (submissionId) => {
    const response = await api.get(`/journals/submissions/${submissionId}/files/`);
    return response.data;
  },

  getSubmissionAuthors: async (submissionId) => {
    const response = await api.get(`/journals/submissions/${submissionId}/authors/`);
    return response.data;
  },

  addAuthor: async (submissionId, authorData) => {
    const response = await api.post(`/journals/submissions/${submissionId}/authors/`, authorData);
    return response.data;
  },

  updateAuthor: async (authorId, authorData) => {
    const response = await api.patch(`/journals/submission-authors/${authorId}/`, authorData);
    return response.data;
  },

  deleteSubmission: async (submissionId) => {
    const response = await api.delete(`/journals/submissions/${submissionId}/`);
    return response.data;
  },

  deleteAuthor: async (authorId) => {
    const response = await api.delete(`/journals/submission-authors/${authorId}/`);
    return response.data;
  },

  submitManuscript: async (submissionId) => {
    const response = await api.post(`/journals/submissions/${submissionId}/submit/`);
    return response.data;
  },

  publishSubmission: async (submissionId) => {
    const response = await api.post(`/journals/submissions/${submissionId}/publish/`);
    return response.data;
  },

  resubmitArticle: async (submissionId, formData) => {
    const response = await api.post(`/journals/submissions/${submissionId}/resubmit/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getSubmissions: async () => {
    const response = await api.get("/journals/submissions/");
    return response.data;
  },

  getSubmissionById: async (submissionId) => {
    try {
      const response = await api.get(`/journals/submissions/${submissionId}/`);
      return response.data;
    } catch (err) {
      // Fallback if detail endpoint is restricted or fails: search in getSubmissions
      const list = await submissionService.getSubmissions();
      const results = Array.isArray(list) ? list : list.results || [];
      return results.find(item => String(item.id) === String(submissionId)) || null;
    }
  },

  getPublishedArticles: async () => {
    const response = await api.get("/journals/submissions/published/");
    return response.data;
  },

  getClassifications: async () => {
    const response = await api.get("/journals/classifications/");
    return response.data;
  },

  getSubmissionFileTypes: async () => {
    const response = await api.get("/journals/submission-file-types/");
    return response.data;
  },

  getContributorRoles: async () => {
    const response = await api.get("/journals/contributor-roles/");
    return response.data;
  },

  // ✅ Added the method to dynamically fetch the article types from Django
  getArticleTypes: async () => {
    const response = await api.get("/journals/article-types/");
    return response.data;
  },

  withdrawSubmission: async (submissionId) => {
    const response = await api.post(`/journals/submissions/${submissionId}/withdraw/`);
    return response.data;
  },

  // Article Types CRUD
  createArticleType: async (payload) => {
    const response = await api.post("/journals/article-types/", payload);
    return response.data;
  },
  updateArticleType: async (id, payload) => {
    const response = await api.put(`/journals/article-types/${id}/`, payload);
    return response.data;
  },
  patchArticleType: async (id, payload) => {
    const response = await api.patch(`/journals/article-types/${id}/`, payload);
    return response.data;
  },
  deleteArticleType: async (id) => {
    const response = await api.delete(`/journals/article-types/${id}/`);
    return response.data;
  },

  // Submission File Types CRUD
  createSubmissionFileType: async (payload) => {
    const response = await api.post("/journals/submission-file-types/", payload);
    return response.data;
  },
  updateSubmissionFileType: async (id, payload) => {
    const response = await api.put(`/journals/submission-file-types/${id}/`, payload);
    return response.data;
  },
  patchSubmissionFileType: async (id, payload) => {
    const response = await api.patch(`/journals/submission-file-types/${id}/`, payload);
    return response.data;
  },
  deleteSubmissionFileType: async (id) => {
    const response = await api.delete(`/journals/submission-file-types/${id}/`);
    return response.data;
  },
};

export default submissionService;