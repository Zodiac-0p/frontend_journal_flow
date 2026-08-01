import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../layout/layout";
import reviewService from "../services/reviewService";
import api from "../services/api";

export default function ReviewReportsPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const role = currentUser?.primary_role || currentUser?.role || "author";
  const isManager = role === "editorial_manager" || role === "super_admin" || currentUser?.is_editorial_manager || currentUser?.is_superuser;
  
  // State management
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [editors, setEditors] = useState([]);
  
  // Workflow state
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [decision, setDecision] = useState("minor_revision");
  const [editorComment, setEditorComment] = useState(""); // <-- ADDED: State for the required editor comment

  // 1. Fetch reports and submission meta when the page loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch review reports
        const data = await reviewService.getSubmissionReviewReports(submissionId);
        setReports(data);

        // Fetch submission detail
        const subRes = await api.get(`/journals/submissions/${submissionId}/`);
        setSubmission(subRes.data);

        // Fetch editors list for re-assignment list
        const usersRes = await api.get("/accounts/users/?role=editor");
        setEditors(usersRes.data?.results || usersRes.data || []);
      } catch (err) {
        console.error("Failed to load reports/submission detail metadata:", err);
        toast.error("Failed to load review workspace metadata.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  // 3. Toggle selection of reports for sharing with the author
  const toggleReportSelection = (reportId) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  // 4. Send Selected Comments to Author (Endpoint 74B)
  const handleSendComments = async () => {
    if (selectedReportIds.length === 0) {
      toast.error("Please select at least one report to send.");
      return;
    }
    
    try {
      setProcessing(true);
      await api.post(`/journals/submissions/${submissionId}/send-review-comments/`, {
        review_report_ids: selectedReportIds,
      });
      toast.success("Reviewer comments sent to the author successfully!");
      setSelectedReportIds([]); // Clear selection after sending
    } catch (err) {
      console.error("Failed to send comments:", err);
      toast.error("Failed to send comments to the author.");
    } finally {
      setProcessing(false);
    }
  };

  // 5. Apply Final Editor Decision (Endpoint 75)
  const handleApplyDecision = async () => {
    // ADDED: Frontend validation to ensure comment isn't blank
    if (!editorComment.trim()) {
      toast.error("Please provide an editorial comment before finalizing.");
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/journals/submissions/${submissionId}/editor-decision/`, {
        decision: decision,
        editor_comment: editorComment, // <-- ADDED: Passing actual text to backend
      });
      toast.success(`Decision '${decision.replace('_', ' ')}' applied successfully!`);
      navigate(isManager ? "/manager/reviews" : "/editor/reviews");
    } catch (err) {
      console.error("Failed to apply decision:", err);
      // ADDED: Better error extraction to show exact backend rejection reason
      const backendError = err.response?.data?.detail || err.response?.data?.message || "Failed to apply decision.";
      toast.error(backendError);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1a3a5c]">Reviewer Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Select reports to share comments with the author, then finalize your editorial decision.
            </p>
          </div>

          {/* Reassign Editor Dropdown */}
          {submission && isManager && (
            <div className="bg-white px-3 py-2 border border-slate-200 rounded-sm flex items-center gap-3 shrink-0 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Editor:</span>
              <select
                value={submission.assigned_editor || ""}
                onChange={async (e) => {
                  const newEditorId = e.target.value;
                  if (!newEditorId) return;
                  try {
                    setProcessing(true);
                    await reviewService.reassignEditor(submissionId, newEditorId);
                    toast.success("Editor reassigned successfully.");
                    setSubmission(prev => ({ ...prev, assigned_editor: newEditorId }));
                  } catch (err) {
                    console.error("Reassign error:", err);
                    toast.error("Failed to reassign editor.");
                  } finally {
                    setProcessing(false);
                  }
                }}
                disabled={processing}
                className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent cursor-pointer"
              >
                <option value="">Unassigned</option>
                {editors.map((editor) => (
                  <option key={editor.id} value={editor.id}>
                    {editor.full_name || editor.name || editor.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#1a3a5c] h-10 w-10 mb-4" />
            <p className="text-sm text-slate-500 font-medium">Loading reviewer reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white p-12 rounded-sm border border-slate-200 text-center text-slate-500 shadow-sm">
            <p className="text-lg font-medium text-gray-700">No reports available.</p>
            <p className="mt-1">Reviewers have not transferred any reports for this manuscript yet.</p>
          </div>
        ) : (
          <>
            {/* Reports List */}
            <div className="space-y-6">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className={`bg-white p-6 rounded-sm border shadow-sm transition-all duration-200 ${
                    selectedReportIds.includes(report.id) 
                      ? "border-[#1a3a5c] ring-1 ring-[#1a3a5c]" 
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <input 
                        type="checkbox" 
                        checked={selectedReportIds.includes(report.id)}
                        onChange={() => toggleReportSelection(report.id)}
                        className="w-4 h-4 text-[#1a3a5c] border-slate-300 rounded-sm focus:ring-[#1a3a5c] cursor-pointer"
                        title="Select to share these comments with the author"
                      />
                      <h2 className="text-lg font-serif font-bold text-[#1a3a5c]">{report.reviewer.full_name}</h2>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase border border-slate-200 tracking-wider">
                      {report.recommendation.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="ml-7">
                    {/* Public Comments (To Author) */}
                    <div className="mb-4">
                      <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-2">Comments to Author</p>
                      <p className="text-[14px] text-slate-700 bg-slate-50 p-4 rounded-sm italic border border-slate-200 whitespace-pre-wrap break-words">
                        "{report.reviewer_comments_to_author || "No comments provided."}"
                      </p>
                    </div>
                    
                    {/* Confidential Comments (To Editor) */}
                    {report.confidential_comments_to_editor && (
                      <div className="mb-4 text-[14px] text-slate-800 bg-amber-50/50 p-4 rounded-sm border border-amber-200 whitespace-pre-wrap break-words">
                        <strong className="block mb-2 text-[13px] font-bold text-amber-800 uppercase tracking-wide">Confidential Comments to Editor</strong>
                        {report.confidential_comments_to_editor}
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="flex flex-wrap gap-6 text-sm border-t border-gray-100 pt-4 mt-4 text-gray-500">
                      <p>
                        <strong className="text-gray-700">Confidence:</strong>{" "}
                        <span className="capitalize">{report.paper_referee_confidence?.replace('_', ' ')}</span>
                      </p>
                      <p>
                        <strong className="text-gray-700">Suitability:</strong>{" "}
                        {report.referee_suitability_rating}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ADDED: Editorial Comment Input Section */}
            <div className="mt-8 bg-white p-6 rounded-sm border shadow-sm border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={18} className="text-[#1a3a5c]" />
                <h3 className="text-lg font-serif font-bold text-[#1a3a5c]">Editorial Decision Comment</h3>
              </div>
              <p className="text-[13px] text-slate-500 mb-4">
                Provide a justification or summary for your final decision. This will be saved to the manuscript record.
              </p>
              <textarea
                value={editorComment}
                onChange={(e) => setEditorComment(e.target.value)}
                disabled={processing}
                placeholder="Enter your final decision justification here..."
                className="w-full p-4 border border-slate-200 rounded-sm focus:border-[#1a3a5c] outline-none min-h-[120px] resize-y disabled:bg-slate-50 disabled:text-slate-400 text-[14px]"
              />
            </div>

            {/* Sticky Action Bar */}
            <div className="mt-8 bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between sticky bottom-6 z-10">
              
              {/* Action 1: Send Comments */}
              <div className="flex-1 w-full md:w-auto">
                <button 
                  onClick={handleSendComments}
                  disabled={processing || selectedReportIds.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={16} />
                  Send Selected Comments to Author
                </button>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-slate-200"></div>

              {/* Action 2: Apply Decision */}
              <div className="flex-1 w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <select 
                  value={decision} 
                  onChange={(e) => setDecision(e.target.value)}
                  disabled={processing}
                  className="flex-1 p-2.5 rounded-sm border border-slate-300 text-sm font-bold text-slate-700 focus:border-[#1a3a5c] outline-none disabled:bg-slate-100"
                >
                  <option value="minor_revision">Minor Revision</option>
                  <option value="major_revision">Major Revision</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button 
                  onClick={handleApplyDecision}
                  disabled={processing}
                  className="flex items-center justify-center gap-2 bg-[#1a3a5c] text-white px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-[#11263c] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <CheckCircle2 size={16} />
                  Finalize Decision
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}