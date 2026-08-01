import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  UserPlus,
  FileText,
  Clock,
  Star,
  CheckCircle2,
  Trash2,
  X,
  Search,
  Tags,
  UserRound,
  Briefcase,
  Mail,
  Ban,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../layout/layout";
import api from "../services/api";

export default function Reviewers() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reviewer Assignment Modal State
  const [reviewerModal, setReviewerModal] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [reviewersLoading, setReviewersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 🛠️ NEW SUBMITTING STATE
  const [reviewersForbidden, setReviewersForbidden] = useState(false);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [reviewerSearch, setReviewerSearch] = useState("");

  const isMounted = useRef(false);
  const fetchingReviewersRef = useRef(new Set());

  const selectedSubmission = useMemo(
    () => submissions.find((paper) => paper.id === selectedPaperId),
    [submissions, selectedPaperId]
  );

  const articleClassifications = useMemo(
    () => getClassifications(selectedSubmission),
    [selectedSubmission]
  );

  const reviewerAssignments = useMemo(
    () => getReviewerAssignments(selectedSubmission),
    [selectedSubmission]
  );

  const handleDeleteDraft = async (submissionId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;
    try {
      await api.delete(`/journals/submissions/${submissionId}/`);
      toast.success("Draft deleted successfully");
      fetchData(); 
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete draft");
    }
  };

  const matchedReviewers = useMemo(() => {
    const articleTags = normalizeList(articleClassifications);
    return reviewers
      .map((reviewer) => {
        const reviewerTagsRaw = getClassifications(reviewer);
        const matchedClassifications = reviewerTagsRaw.filter((tag) =>
          articleTags.includes(String(tag).toLowerCase().trim())
        );
        const isArticleAuthor = isReviewerArticleAuthor(reviewer, selectedSubmission);
        const assignment = reviewerAssignments.find(a => a.id === Number(reviewer.id));
        const isAlreadyAssigned = !!assignment;
        const assignmentStatus = assignment ? assignment.status : null;

        return {
          ...reviewer,
          reviewerTags: reviewerTagsRaw,
          matchedClassifications,
          hasMatchingClassification: matchedClassifications.length > 0,
          isArticleAuthor,
          isAlreadyAssigned,
          assignmentStatus,
          canAssign: !isArticleAuthor, // Removed && !isAlreadyAssigned so you can reassign them!
        };
      })
      .filter((reviewer) => {
        if (reviewer.isArticleAuthor) return false;
        const query = reviewerSearch.toLowerCase().trim();
        if (!query) return true;
        const reviewerName = reviewer.full_name || reviewer.fullName || reviewer.name || "";
        return (
          reviewerName.toLowerCase().includes(query) ||
          String(reviewer.email || "").toLowerCase().includes(query) ||
          reviewer.reviewerTags.some((tag) => String(tag).toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (a.canAssign !== b.canAssign) return a.canAssign ? -1 : 1;
        const nameA = String(a.full_name || a.fullName || a.name || "").toLowerCase();
        const nameB = String(b.full_name || b.fullName || b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [reviewers, articleClassifications, reviewerSearch, selectedSubmission, reviewerAssignments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const submissionsRes = await api.get("/journals/submissions/");
      const filtered = (
        Array.isArray(submissionsRes.data) ? submissionsRes.data : submissionsRes.data.results || []
      ).filter((paper) => paper.status !== "draft");
      setSubmissions(filtered);
    } catch (err) {
      console.error("Dashboard load error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async (submissionId) => {
    if (!submissionId || fetchingReviewersRef.current.has(submissionId)) return;
    try {
      fetchingReviewersRef.current.add(submissionId);
      setReviewersLoading(true);
      const usersRes = await api.get(`/journals/submissions/${submissionId}/eligible-reviewers/`);
      setReviewers(usersRes.data || []);
      setReviewersForbidden(false);
    } catch (usersErr) {
      console.error("Failed fetching eligible reviewers:", usersErr);
      setReviewers([]);
      if (usersErr?.response?.status === 403) {
        setReviewersForbidden(true);
        toast.error("Permission denied: you must be an editor.");
      }
    } finally {
      fetchingReviewersRef.current.delete(submissionId);
      setReviewersLoading(false);
    }
  };

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchData();
    }
  }, []);

  const openReviewerModal = (paper) => {
    if (reviewersForbidden) {
      toast.error("You don't have permission to assign reviewers.");
      return;
    }
    setSelectedPaperId(paper.id);
    setSelectedReviewerIds([]);
    setReviewerSearch("");
    setReviewerModal(true);
    fetchReviewers(paper.id);
  };

  const closeReviewerModal = () => {
    setReviewerModal(false);
    setSelectedPaperId(null);
    setSelectedReviewerIds([]);
    setReviewerSearch("");
  };

  const toggleReviewer = (reviewer) => {
    if (!reviewer.canAssign) return;

    setSelectedReviewerIds((prev) =>
      prev.includes(reviewer.id)
        ? prev.filter((id) => id !== reviewer.id)
        : [...prev, reviewer.id]
    );
  };

  const handleAssign = async () => {
    const validReviewerIds = selectedReviewerIds.filter((id) => {
      const reviewer = matchedReviewers.find((r) => r.id === id);
      return reviewer?.canAssign;
    });

    if (validReviewerIds.length === 0) {
      toast.error("Select at least one eligible reviewer");
      return;
    }

    try {
      setSubmitting(true); // 🛠️ START LOADER SPINNER PROGRESSION
      await api.post(`/journals/submissions/${selectedPaperId}/assign-reviewer/`, {
        reviewer_ids: validReviewerIds,
      });

      toast.success("Reviewers assigned successfully");
      closeReviewerModal();
      fetchData();
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error("Failed to assign reviewers");
    } finally {
      setSubmitting(false); // 🛠️ STOP LOADER SPINNER PROGRESSION
    }
  };

  const reviewedStatuses = ["reviewed", "accepted", "published", "minor_revision", "major_revision"];

  const getStatusLabel = (status) => {
    if (!status) return "Unknown";
    if (reviewedStatuses.includes(status)) return "Reviewed / Decision Made";
    if (status === "under_peer_review") return "Under peer review";
    if (status === "under_editor_review") return "Under editor review";
    if (status === "submitted") return "Submitted";

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusBadgeClass = (statusLabel) => {
    const s = (statusLabel || "").toLowerCase();
    if (s.includes("reviewed") || s.includes("decision")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("peer review")) {
      return "bg-purple-100 text-purple-800 border-purple-300 font-bold";
    }
    if (s.includes("editor review")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (s.includes("submitted")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (s.includes("withdrawn") || s.includes("rejected")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((p) => p.status === "submitted").length,
    reviewing: submissions.filter((p) => p.status === "under_peer_review").length,
    reviewed: submissions.filter((p) => reviewedStatuses.includes(p.status)).length,
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-[#00A8CC]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)", borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: ".6px", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Editorial Workflow</div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,32px)", color: "#fff", fontWeight: "600", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "12px" }}>
              Review Management
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", fontFamily: "var(--font-sans)", margin: 0, lineHeight: "1.6", maxWidth: "600px" }}>
              Manage your review workflow and assign experts to manuscripts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
          <StatCard icon={FileText} label="Total" value={stats.total} color="text-[#00A8CC]" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-yellow-600" />
          <StatCard icon={Star} label="Reviewing" value={stats.reviewing} color="text-blue-600" />
          <StatCard icon={CheckCircle2} label="Reviewed" value={stats.reviewed} color="text-emerald-600" />
        </div>

        {reviewersForbidden && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <strong className="font-semibold">Reviewer access unavailable.</strong> You do not have permission to load reviewer profiles. Please confirm your editor role or contact the administrator.
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[350px]">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <p className="font-semibold text-slate-600 text-sm">No submissions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse text-left text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3 border-r border-slate-200 w-[40px] text-center">#</th>
                    <th className="px-4 py-3 border-r border-slate-200">Article Title</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-[140px]">Status</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-[250px]">Assigned Reviewers</th>
                    <th className="px-4 py-3 text-center w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {submissions.map((paper, index) => {
                    const assignedReviewers = getAssignedReviewers(paper);
                    const statusLabel = getStatusLabel(paper.status);

                    return (
                      <tr key={paper.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-100 transition text-[13px]`}>
                        <td className="px-4 py-3 border-r border-slate-200 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200">
                          <h3 className="font-semibold text-slate-800 leading-snug">
                            {paper.title || "Untitled Article"}
                          </h3>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200">
                          <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${getStatusBadgeClass(statusLabel)}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200">
                          {assignedReviewers.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {assignedReviewers.slice(0, 3).map((reviewer, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold border truncate ${
                                    reviewer.status === 'rejected' 
                                      ? 'bg-red-50 text-red-700 border-red-200' 
                                      : 'bg-white text-slate-700 border-slate-200'
                                  }`}
                                  title={`${reviewer.name} ${reviewer.status === 'rejected' ? '(Rejected)' : ''}`}
                                >
                                  {reviewer.name} {reviewer.status === 'rejected' && '(Rejected)'}
                                </span>
                              ))}
                              {assignedReviewers.length > 3 && (
                                <span 
                                  className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-slate-100 text-slate-600 border-slate-300 cursor-help text-center" 
                                  title={assignedReviewers.slice(3).map(r => r.name).join(', ')}
                                >
                                  +{assignedReviewers.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No reviewers</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <div className="flex flex-col items-stretch justify-center gap-1.5">
                            {paper.status === "draft" && (
                              <button
                                onClick={() => handleDeleteDraft(paper.id)}
                                className="w-full text-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded px-2 py-1.5 transition text-[11px] font-semibold flex items-center justify-center gap-1 border border-transparent hover:border-red-100"
                                title="Delete Draft"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            )}

                            <button
                              onClick={() => {
                                const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
                                const role = currentUser?.primary_role || currentUser?.role || "author";
                                const isManager = role === "editorial_manager" || role === "super_admin" || currentUser?.is_editorial_manager || currentUser?.is_superuser;
                                navigate(isManager ? `/manager/article-preview/${paper.id}` : `/editor/article-preview/${paper.id}`, { state: { article: paper } });
                              }}
                              style={{ background: "#fff", color: "var(--navy)", border: "1px solid var(--border)", borderRadius: "4px", padding: "6px", fontSize: "11px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "background .15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                              title="Preview manuscript details"
                            >
                              <FileText size={12} />
                              Preview
                            </button>

                            {assignedReviewers.length > 0 && (
                              <button
                                onClick={() => {
                                  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
                                  const role = currentUser?.primary_role || currentUser?.role || "author";
                                  const isManager = role === "editorial_manager" || role === "super_admin" || currentUser?.is_editorial_manager || currentUser?.is_superuser;
                                  navigate(isManager ? `/manager/submission/${paper.id}/reports` : `/submission/${paper.id}/reports`);
                                }}
                                style={{ background: "#fff", color: "var(--navy)", border: "1px solid var(--border)", borderRadius: "4px", padding: "6px", fontSize: "11px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "background .15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                                title="View submitted reports for this manuscript"
                              >
                                <Eye size={12} />
                                View Reports
                              </button>
                            )}

                            <button
                              onClick={() => openReviewerModal(paper)}
                              disabled={reviewersForbidden}
                              style={{ 
                                background: reviewersForbidden ? "var(--bg-alt)" : "var(--navy)", 
                                color: reviewersForbidden ? "var(--text-secondary)" : "#fff", 
                                border: "1px solid " + (reviewersForbidden ? "var(--border)" : "var(--navy)"), borderRadius: "4px", padding: "6px", fontSize: "11px", fontWeight: "600", fontFamily: "var(--font-sans)", 
                                cursor: reviewersForbidden ? "not-allowed" : "pointer", 
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "background .15s" 
                              }}
                              onMouseEnter={e => { if(!reviewersForbidden) { e.currentTarget.style.background = "var(--blue)"; e.currentTarget.style.borderColor = "var(--blue)"; } }}
                              onMouseLeave={e => { if(!reviewersForbidden) { e.currentTarget.style.background = "var(--navy)"; e.currentTarget.style.borderColor = "var(--navy)"; } }}
                            >
                              <UserPlus size={12} />
                              {assignedReviewers.length > 0 ? "Edit Reviewers" : "Assign Reviewers"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer Assignment Modal */}
      {/* Reviewer Assignment Modal */}
      {reviewerModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          {/* Main Card Container Container Frame */}
          <div className="bg-white rounded-md w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[800px] transition-all">
            
            {/* 1. FIXED MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 px-8 py-5 shrink-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-[#24344D]">
                  Select Reviewers
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  All eligible reviewers are listed below. Reviewers with matching classifications are highlighted.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReviewerModal}
                className="p-2 -mr-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. FIX FOR CLASSIFICATION TAG OVERFLOW WITH AN INDEPENDENT INNER SCROLL TRACKER */}
            <div className="bg-[#F7FBFE] border-b border-slate-200 px-8 py-4 shrink-0 max-h-[180px] overflow-y-auto flex flex-col">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Manuscript
                </p>
                <h3 className="mt-0.5 text-base font-bold text-[#24344D] line-clamp-1">
                  {selectedSubmission?.title || "Untitled Article"}
                </h3>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
                {articleClassifications.length > 0 ? (
                  articleClassifications.map((classification) => (
                    <span
                      key={classification}
                      className="inline-flex items-center gap-1 rounded-full bg-[#EAF7FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#0077B6] border border-blue-100/50"
                    >
                      <Tags size={11} />
                      {classification}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No article classifications found.
                  </span>
                )}
              </div>
            </div>

            {/* 3. FIXED SEARCH BAR SECTION */}
            <div className="px-8 py-4 shrink-0 bg-white">
              <div className="flex h-11 items-center rounded-xl border border-[#D9EAF7] px-4 focus-within:border-[#00A8CC] focus-within:ring-4 focus-within:ring-[#00A8CC]/10 transition-all bg-white">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  value={reviewerSearch}
                  onChange={(e) => setReviewerSearch(e.target.value)}
                  placeholder="Search by reviewer name, email, or expertise..."
                  className="ml-3 w-full bg-transparent text-sm outline-none text-slate-800 placeholder-slate-400"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* 4. INDEPENDENT LOWER SCROLL WINDOW FOR THE REVIEWER LIST */}
            <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0 bg-white border-t border-slate-50">
              <div className="space-y-3 pb-2">
                {reviewersLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
                    <Loader2 className="mx-auto mb-3 animate-spin text-[#00A8CC]" size={28} />
                    <p className="font-semibold text-slate-700 text-sm">Loading eligible experts...</p>
                  </div>
                ) : matchedReviewers.length > 0 ? (
                  matchedReviewers.map((reviewer) => {
                    const reviewerName = reviewer.full_name || reviewer.fullName || reviewer.name || "Reviewer";
                    const selected = selectedReviewerIds.includes(reviewer.id);

                    return (
                      <button
                        key={reviewer.id}
                        type="button"
                        disabled={!reviewer.canAssign || submitting}
                        onClick={() => toggleReviewer(reviewer)}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? "border-[#00A8CC] bg-[#F0FBFF] ring-[3px] ring-[#00A8CC]/10 shadow-sm"
                            : reviewer.canAssign
                            ? "border-slate-200 bg-white hover:border-[#9DD8F5] hover:bg-slate-50/80"
                            : "cursor-not-allowed border-slate-100 bg-slate-50/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7FF] text-[#00A8CC]">
                              <UserRound size={18} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-[#24344D] text-sm truncate">
                                  {reviewerName}
                                </h4>

                                {reviewer.isArticleAuthor ? (
                                  <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                    <Ban size={10} /> Author
                                  </span>
                                ) : reviewer.isAlreadyAssigned ? (
                                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    reviewer.assignmentStatus === 'rejected' 
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {reviewer.assignmentStatus === 'rejected' ? 'Rejected' : 'Already assigned'}
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 truncate">
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate">{reviewer.email || "No email"}</span>
                              </p>

                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {reviewer.reviewerTags.length > 0 ? (
                                  reviewer.reviewerTags.map((tag) => {
                                    const isMatched = reviewer.matchedClassifications.includes(tag);
                                    return (
                                      <span
                                        key={tag}
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                                          isMatched
                                            ? "bg-[#00A8CC] text-white"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">No expertise tags</span>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Briefcase size={12} className="text-slate-400" />
                                  Active reviews: {reviewer.active_reviews || 0}
                                </span>
                                <span>
                                  Completed: {reviewer.completed_reviews || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-center pt-1">
                            {selected && reviewer.canAssign ? (
                              <CheckCircle2 size={20} className="text-[#00A8CC]" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center bg-slate-50/30">
                    <p className="font-semibold text-slate-700 text-sm">No reviewers found</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Try another search query or refine classification filters.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. FIXED FOOTER CONTROL ZONE */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-8 py-4 shrink-0">
              <p className="text-xs font-medium text-slate-500">
                {selectedReviewerIds.length} reviewer{selectedReviewerIds.length === 1 ? "" : "s"} selected
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={closeReviewerModal}
                  className="h-10 rounded-xl bg-slate-100 px-6 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={selectedReviewerIds.length === 0 || submitting}
                  className="h-10 rounded-xl bg-[#00A8CC] px-6 text-xs font-bold text-white transition hover:bg-[#008Caa] disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2 justify-center min-w-[150px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <span>Assign Reviewers</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ----------------------------------------------------
// UTILITY COMPONENTS AND FUNCTIONS
// ----------------------------------------------------

function StatCard({ icon: IconComponent, label, value, color }) {
  return (
    <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`p-2 rounded-sm bg-slate-50 border border-slate-100 ${color}`}>
        <IconComponent size={20} />
      </div>
    </div>
  );
}

function getAssignedReviewers(paper) {
  if (paper?.reviewer_assignments && Array.isArray(paper.reviewer_assignments)) {
    return paper.reviewer_assignments
      .map((assignment) => ({
        name: assignment.reviewer?.full_name || assignment.reviewer?.name || "Reviewer",
        status: assignment.status
      }))
      .filter((r) => r.name);
  }
  const assigned =
    paper?.assigned_reviewers ||
    paper?.reviewers ||
    paper?.reviewer_names ||
    paper?.assigned_reviewer_names ||
    [];

  if (!assigned) return [];

  if (Array.isArray(assigned)) {
    return assigned
      .map((item) => {
        if (typeof item === "string") return { name: item, status: "assigned" };
        const name = item?.full_name || item?.fullName || item?.name || item?.email || "";
        return name ? { name, status: "assigned" } : null;
      })
      .filter(Boolean);
  }

  if (typeof assigned === "string") {
    return assigned
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, status: "assigned" }));
  }

  return [];
}

function getReviewerAssignments(paper) {
  if (paper?.reviewer_assignments && Array.isArray(paper.reviewer_assignments)) {
    return paper.reviewer_assignments.map((assignment) => ({
      id: Number(assignment.reviewer?.id || assignment.reviewer_id),
      status: assignment.status
    })).filter(a => !isNaN(a.id));
  }

  const assigned =
    paper?.assigned_reviewer_ids ||
    paper?.reviewer_ids ||
    paper?.assigned_reviewers ||
    paper?.reviewers ||
    [];

  if (!assigned) return [];

  if (Array.isArray(assigned)) {
    return assigned
      .map((item) => {
        if (typeof item === "number") return { id: item, status: "assigned" };
        if (typeof item === "string") return { id: Number(item), status: "assigned" };
        const id = Number(item?.reviewer?.id || item?.id || item?.user_id || item?.reviewer_id);
        return isNaN(id) ? null : { id, status: "assigned" };
      })
      .filter(Boolean);
  }

  if (typeof assigned === "string") {
    return assigned
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((id) => !isNaN(id))
      .map((id) => ({ id, status: "assigned" }));
  }

  return [];
}

//  paradoxes = [];


function isReviewerArticleAuthor(reviewer, paper) {
  if (!reviewer || !paper) return false;

  const reviewerId = Number(reviewer.id);
  const reviewerEmail = String(reviewer.email || "").toLowerCase();

  const submitterId = Number(
    paper?.submitted_by?.id ||
      paper?.submitted_by_id ||
      paper?.author?.id ||
      paper?.author_id ||
      paper?.user?.id ||
      paper?.user_id ||
      paper?.author
  );

  const submitterEmail = String(
    paper?.submitted_by?.email ||
      paper?.author?.email ||
      paper?.user?.email ||
      paper?.email ||
      ""
  ).toLowerCase();

  const authorIds = getPeopleIds([
    paper?.author_ids,
    paper?.authors,
    paper?.co_authors,
    paper?.contributors,
  ]);

  const authorEmails = getPeopleEmails([
    paper?.author_emails,
    paper?.authors,
    paper?.co_authors,
    paper?.contributors,
  ]);

  const reviewerName = normalizePersonName(
    reviewer.full_name || reviewer.fullName || reviewer.name || reviewer.email || ""
  );

  const submitterName = normalizePersonName(
    paper?.submitted_by?.full_name ||
      paper?.submitted_by?.fullName ||
      paper?.submitted_by?.name ||
      paper?.author?.full_name ||
      paper?.author?.fullName ||
      paper?.author?.name ||
      paper?.user?.full_name ||
      paper?.user?.fullName ||
      paper?.user?.name ||
      paper?.name ||
      ""
  );

  const authorNames = getPeopleNames([
    paper?.authors,
    paper?.co_authors,
    paper?.contributors,
    paper?.author_names,
    paper?.author_name,
  ]);

  return (
    reviewerId === submitterId ||
    authorIds.includes(reviewerId) ||
    reviewerEmail === submitterEmail ||
    authorEmails.includes(reviewerEmail) ||
    reviewerName === submitterName ||
    authorNames.includes(reviewerName)
  );
}

function normalizePersonName(name) {
  return String(name || "").toLowerCase().trim();
}

function getPeopleNames(values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((item) => {
      if (typeof item === "string") return item;
      return (
        item?.full_name || item?.fullName || item?.name || item?.email || ""
      );
    })
    .map((name) => normalizePersonName(name))
    .filter(Boolean);
}

function getPeopleIds(values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return Number(item);
      return Number(item?.id || item?.user_id || item?.author_id);
    })
    .filter(Boolean);
}

function getPeopleEmails(values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((item) => {
      if (typeof item === "string" && item.includes("@")) return item.toLowerCase();
      return String(item?.email || "").toLowerCase();
    })
    .filter(Boolean);
}

function normalizeList(value) {
  return getList(value).map((item) => String(item).toLowerCase().trim());
}

function getClassifications(item) {
  return getList(
    item?.classifications_data ||
      item?.classifications ||
      item?.classification ||
      item?.categories ||
      item?.category ||
      item?.keywords ||
      item?.research_interests ||
      item?.expertise ||
      item?.specializations ||
      item?.areas_of_expertise ||
      []
  );
}

function getList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.name || item?.title || item?.label || "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}