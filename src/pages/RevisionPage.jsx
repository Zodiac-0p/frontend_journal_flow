import { useState, useEffect, useCallback } from "react";
import { FileText, Calendar, Eye, Send, RefreshCw, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AppLayout from "../layout/layout";
import reviewService from "../services/reviewService";

export default function RevisionPage() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // ==========================================
  // FETCH LOGIC
  // ==========================================
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getAssignedPapers();
      setAssignments(data);
    } catch (error) { 
      console.error("GET Assignments Error:", error);
      toast.error("Unable to load assigned reviews.");
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssignments();
  }, [fetchAssignments]);

  // ==========================================
  // THE FIX: SIMPLIFIED PREVIEW HANDLER
  // We pass the assignmentId and an isReviewer flag to the modal!
  // ==========================================
  const handleOpenPreview = (assignment) => {
    const paper = assignment.submission || assignment;
    const targetId = typeof paper === "number" || typeof paper === "string" ? paper : paper.id;
    const articleData = typeof paper === "object" ? paper : null;
    navigate(`/reviewer/article-preview/${targetId}`, {
      state: { article: articleData },
    });
  };

  // ==========================================
  // ACCEPT / REJECT HANDLERS
  // ==========================================
  const handleAccept = async (assignmentId) => {
    try {
      setProcessingId(assignmentId);
      await reviewService.acceptAssignment(assignmentId);
      toast.success("Assignment accepted! The editor has been notified.");
      await fetchAssignments(); 
    } catch (error) {
      console.error("Accept error:", error);
      toast.error("Failed to accept assignment. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (assignmentId) => {
    try {
      setProcessingId(assignmentId);
      await reviewService.rejectAssignment(assignmentId);
      toast.success("Assignment rejected. It has been removed from your queue.");
      await fetchAssignments(); 
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject assignment. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ==========================================
  // DATE FORMAT HELPER
  // ==========================================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  // ==========================================
  // UI: LOADING STATE
  // ==========================================
  if (loading && assignments.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 text-[#0077B6] animate-spin mb-4" />
          <p className="text-slate-500 font-medium tracking-wide">Syncing your assignments...</p>
        </div>
      </AppLayout>
    );
  }

  // ==========================================
  // UI: MAIN RENDER
  // ==========================================
  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        
        <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)", borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)", marginBottom: "28px" }}>
          <h1 className="text-4xl font-bold tracking-tight">Reviewer Dashboard</h1>
          <p className="mt-3 text-blue-100 text-lg">
            Manage your pending requests and evaluate accepted manuscripts.
          </p>
        </div>

        {assignments.length === 0 ? (
          
          <div className="mt-8 bg-white rounded-3xl border border-[#D9EAF7] p-16 text-center shadow-sm">
            <FileText size={70} className="mx-auto text-[#0077B6] opacity-80" />
            <h2 className="mt-6 text-3xl font-bold text-[#24344D]">No Assignments</h2>
            <p className="mt-3 text-gray-500 text-lg">
              You currently have no pending or active manuscript reviews.
            </p>
          </div>
        ) : (
          
          <div className="space-y-6 mt-8">
            {assignments.map((assignment) => {
              const paper = assignment.submission || assignment;
              const isProcessing = processingId === assignment.id;

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-3xl border border-[#D9EAF7] p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-bold text-[#24344D] leading-tight">
                          {paper.title || "Untitled Manuscript"}
                        </h2>
                        
                        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                          assignment.status === 'pending' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {assignment.status || "Assigned"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-gray-400" />
                          Assigned: {formatDate(assignment.assigned_at)}
                        </div>
                      </div>

                      <p className="mt-4 text-gray-600 leading-relaxed line-clamp-3">
                        {paper.abstract || "No abstract provided for this manuscript."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[220px] justify-center">
                      
                      <button
                        onClick={() => handleOpenPreview(assignment)}
                        className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                         <Eye size={16} />
                        Preview Abstract
                      </button>

                      {assignment.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(assignment.id)}
                            disabled={isProcessing}
                            className="flex-1 h-11 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1 transition disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <X size={16} /> Disagree
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleAccept(assignment.id)}
                            disabled={isProcessing}
                            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1 shadow-sm transition disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <Check size={16} /> Agree
                              </>
                            )}
                          </button>
                        </div>
                      ) : (assignment.review_report || assignment.has_submitted_report) ? ( 
                      <button disabled
                        className="w-full h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm opacity-80 cursor-not-allowed"
                      >
                        <Check size={16} /> Report Submitted
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sessionStorage.setItem("selectedReviewPaper", JSON.stringify(paper));
                          navigate(`/review-submission/${assignment.id}`);
                        }}
                        className="w-full h-11 rounded-xl bg-[#0077B6] hover:bg-[#005F91] text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <Send size={16} /> Evaluate Manuscript
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </AppLayout>
  );
}