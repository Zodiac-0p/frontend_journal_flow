API additions and frontend helpers added

What I added to the frontend codebase

1. reviewService helpers (file: src/services/reviewService.js)

- getSubmissionReviewerAssignments(submissionId)
  - GET /api/journals/submissions/{submission_id}/reviewer-assignments/
  - Returns assignment list (handles paginated or array responses)

- deactivateAssignment(assignmentId)
  - POST /api/journals/reviewer-assignments/{assignment_id}/deactivate/
  - Convenience wrapper for editors to deactivate assignments

- reassignEditor(submissionId, editorId)
  - POST /api/journals/submissions/{submission_id}/reassign-editor/
  - Wrapper to call the backend reassign-editor endpoint

- getSubmissionStatusHistory(submissionId)
  - GET /api/journals/submissions/{submission_id}/status-history/
  - Returns raw status-history payload from backend

- getReviewerDashboard()
  - GET /api/journals/reviewer-dashboard/
  - Returns reviewer summary (pending_count, accepted_count, submitted_report_count)

Notes: these functions are thin wrappers around the expected backend routes. If the backend uses different paths or response shapes, the helpers should be adapted.

2. notificationService helper (file: src/services/notificationService.js)

- getUnreadCount()
  - GET /api/notifications/unread-count/
  - Returns integer unread_count (0 if endpoint missing or empty response)

Why these changes

- You mentioned missing or useful administrative APIs (79-84). I added frontend helper functions that call these endpoints so the frontend can consume them once the backend is implemented.

Next steps you can take

- Implement the matching backend endpoints (if not present):
  - /api/journals/submissions/{submission_id}/reviewer-assignments/
  - /api/journals/reviewer-assignments/{assignment_id}/deactivate/
  - /api/journals/submissions/{submission_id}/reassign-editor/
  - /api/journals/submissions/{submission_id}/status-history/
  - /api/journals/reviewer-dashboard/
  - /api/notifications/unread-count/

- Update frontend UI pages to call these helpers where needed (editor dashboard, submission detail, reviewer dashboard, notification badge).

If you want, I can also scaffold the UI pages/components to display these endpoints' data and wire them into the app routing.
