// src/services/reviewService.js
import api from "./api";

const reviewService = {
  // ==========================================
  // FETCH ASSIGNMENTS
  // GET /api/journals/reviewer-assignments/ OR fallback to pending/accepted
  // ==========================================
// ==========================================
  // FETCH ASSIGNMENTS
  // ==========================================
  async getAssignedPapers() {
    const unwrapList = (data) =>
      Array.isArray(data) ? data : data?.results || [];

    try {
      // Fetch both valid endpoints defined in your Django URLconf
      const [pendingResponse, acceptedResponse] = await Promise.all([
        api.get("/journals/reviewer-assignments/pending/"),
        api.get("/journals/reviewer-assignments/accepted/"),
      ]);

      // Combine the results
      return [
        ...unwrapList(pendingResponse.data),
        ...unwrapList(acceptedResponse.data),
      ];
    } catch (error) {
      console.error("Error fetching reviewer assignments:", error);
      throw error;
    }
  },

  // ==========================================
  // ACCEPT ASSIGNMENT (From API Spec #68)
  // POST /api/journals/reviewer-assignments/{assignment_id}/accept/
  // ==========================================
  async acceptAssignment(assignmentId) {
    const response = await api.post(
      `/journals/reviewer-assignments/${assignmentId}/accept/`
    );
    return response.data;
  },

  // ==========================================
  // REJECT ASSIGNMENT (From API Spec #69)
  // POST /api/journals/reviewer-assignments/{assignment_id}/reject/
  // ==========================================
  async rejectAssignment(assignmentId) {
    const response = await api.post(
      `/journals/reviewer-assignments/${assignmentId}/reject/`
    );
    return response.data;
  },

  // ==========================================
  // SUBMIT FINAL REVIEW REPORT
  // (Placeholder: Backend report API not implemented yet)
  // ==========================================
  async submitReview(assignmentId, payload) {
    const response = await api.post(
      `/journals/reviewer-assignments/${assignmentId}/submit-report/`,
      payload
    );
    return response.data;
  },

  // ==========================================
  // GET REVIEWER ASSIGNMENTS FOR A SUBMISSION
  // GET /api/journals/submissions/{submission_id}/reviewer-assignments/
  // ==========================================
  async getSubmissionReviewerAssignments(submissionId) {
    const response = await api.get(
      `/journals/submissions/${submissionId}/reviewer-assignments/`
    );

    return Array.isArray(response.data)
      ? response.data
      : response.data.results || [];
  },

  // ==========================================
  // DEACTIVATE / REMOVE A REVIEWER ASSIGNMENT
  // POST /api/journals/reviewer-assignments/{assignment_id}/deactivate/
  // ==========================================
  async deactivateAssignment(assignmentId) {
    const response = await api.post(
      `/journals/reviewer-assignments/${assignmentId}/deactivate/`
    );
    return response.data;
  },

  // ==========================================
  // REASSIGN EDITOR FOR A SUBMISSION
  // POST /api/journals/submissions/{submission_id}/reassign-editor/
  // ==========================================
  async reassignEditor(submissionId, editorId) {
    const response = await api.post(
      `/journals/submissions/${submissionId}/reassign-editor/`,
      { editor_id: editorId }
    );
    return response.data;
  },

  // ==========================================
  // SUBMISSION STATUS HISTORY
  // GET /api/journals/submissions/{submission_id}/status-history/
  // ==========================================
  async getSubmissionStatusHistory(submissionId) {
    const response = await api.get(
      `/journals/submissions/${submissionId}/status-history/`
    );
    return response.data;
  },

  // ==========================================
  // REVIEWER DASHBOARD SUMMARY
  // GET /api/journals/reviewer-dashboard/
  // ==========================================
  async getReviewerDashboard() {
    const response = await api.get(`/journals/reviewer-dashboard/`);
    return response.data;
  },

  // ==========================================
  // LIST SUBMISSION REVIEW REPORTS
  // GET /api/journals/submissions/{submission_id}/review-reports/
  // ==========================================
  async getSubmissionReviewReports(submissionId) {
    const response = await api.get(
      `/journals/submissions/${submissionId}/review-reports/`
    );

    return Array.isArray(response.data)
      ? response.data
      : response.data.results || [];
  },
  // ==========================================
  // GET REVIEWER ASSIGNMENT DETAIL (From API Spec #68)
  // GET /api/journals/reviewer-assignments/{assignment_id}/
  // ==========================================
  async getReviewerAssignmentDetail(assignmentId) {
    const response = await api.get(
      `/journals/reviewer-assignments/${assignmentId}/`
    );
    return response.data;
  },
};

export default reviewService;