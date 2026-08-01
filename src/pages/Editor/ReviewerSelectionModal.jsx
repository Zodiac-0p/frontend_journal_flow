import { useEffect, useMemo, useState } from "react";
import { 
  X, UserRound, Mail, CheckCircle2, Loader2, 
  GraduationCap, Globe, Search 
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ReviewerSelectionModal({ open, submissionId, onClose, onAssigned }) {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [search, setSearch] = useState("");
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setSelectedReviewerIds([]);
      setSearch("");
      try {
        setLoading(true);
        const subRes = await api.get(`/journals/submissions/${submissionId}/`);
        setSubmission(subRes.data || null);
        const usersRes = await api.get(`/journals/submissions/${submissionId}/eligible-reviewers/`);
        setReviewers(usersRes.data || []);
      } catch (err) {
        console.error("Failed to load reviewers for editor modal:", err);
        toast.error("Unable to load reviewers");
        setReviewers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, submissionId]);

  const articleClassifications = useMemo(() => {
    if (!submission) return [];
    
    let list = submission.classifications_data || submission.classifications || submission.classification || [];
    
    if (Array.isArray(list)) {
      return list.map((i) => {
        if (typeof i === "string") return i;
        if (typeof i === "number") {
          const matched = reviewers.flatMap(r => r.classifications || []).find(c => c.id === i);
          return matched ? matched.name : String(i);
        }
        return i?.name || "";
      }).filter(Boolean).map((s) => s.toLowerCase().trim());
    }
    return String(list).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }, [submission, reviewers]);

  function reviewerMatchesClassification(reviewer) {
    if (!articleClassifications || articleClassifications.length === 0) return true;
    const tags = (reviewer.classifications || reviewer.expertise || []).map((t) => (typeof t === "string" ? t : t?.name || "")).filter(Boolean).map((s) => s.toLowerCase().trim());
    return tags.some((t) => articleClassifications.includes(t));
  }

  function getAssignedIdsFromSubmission(sub) {
    if (!sub) return [];
    const assigned = sub.reviewer_assignments || sub.assigned_reviewers || [];
    if (Array.isArray(assigned)) {
      return assigned.map((item) => {
        if (typeof item === "number") return item;
        return Number(item?.reviewer?.id || item?.reviewer_id);
      }).filter(Boolean);
    }
    return [];
  }

  function isReviewerAuthor(reviewer) {
    if (!reviewer || !submission) return false;
    const rId = Number(reviewer.id);
    const authorId = Number(submission.author);
    return rId === authorId;
  }

  const assignedReviewerIds = getAssignedIdsFromSubmission(submission);

  const filteredReviewers = reviewers
    .map((r) => ({
      ...r,
      reviewerTags: (r.classifications || r.expertise || []).map((t) => (typeof t === "string" ? t : t?.name || "")).filter(Boolean),
      matches: reviewerMatchesClassification(r),
      isAuthor: isReviewerAuthor(r),
      // NEW: We flag if they are already assigned so we can show the badge
      isAssigned: assignedReviewerIds.includes(Number(r.id)),
    }))
    // CHANGED: We intentionally removed the filter that was hiding already assigned reviewers!
    // Now they will show up in the list so the editor can re-select them.
    .filter((r) => r.matches && !r.isAuthor)
    .filter((r) => {
      const q = search?.toLowerCase().trim();
      if (!q) return true;
      const name = String(r.full_name || r.name || "").toLowerCase();
      const qualification = String(r.job_title || r.organization || "").toLowerCase();
      
      return name.includes(q) || 
             String(r.email || "").toLowerCase().includes(q) || 
             qualification.includes(q) ||
             r.reviewerTags.some((t) => String(t).toLowerCase().includes(q));
    });

  const toggle = (id) => {
    setSelectedReviewerIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const assign = async () => {
    if (selectedReviewerIds.length === 0) return toast.error("Select at least one reviewer");
    try {
      setSubmitting(true);
      await api.post(`/journals/submissions/${submissionId}/assign-reviewer/`, { reviewer_ids: selectedReviewerIds });
      toast.success("Reviewers assigned");
      onAssigned && onAssigned(selectedReviewerIds);
      onClose && onClose();
    } catch (err) {
      console.error("Assign error:", err);
      toast.error("Failed to assign reviewers");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-md w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] max-h-[750px] overflow-hidden">
        
        <div className="flex items-start justify-between border-b border-slate-100 px-8 py-5 shrink-0">
          <div>
            <h2 className="text-[20px] font-bold text-[#24344D]">Select Reviewers</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              All eligible reviewers are listed below. Reviewers with matching classifications are highlighted.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 -mr-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-8 py-4 shrink-0 bg-slate-50/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
            Manuscript
          </p>
          <h3 className="text-[14px] font-bold text-[#24344D]">
            {submission?.title || "Loading manuscript title..."}
          </h3>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {articleClassifications.length > 0 ? (
              articleClassifications.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-100">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[12px] text-amber-600 font-medium">Processing active entry metadata tags...</span>
            )}
          </div>
        </div>

        <div className="px-8 py-4 shrink-0">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by reviewer name, email, qualification..." 
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#60C9DB] focus:ring-4 focus:ring-[#60C9DB]/10 transition" 
            />
          </div>
        </div>

        <div className="overflow-y-auto px-8 pb-4 flex-1 min-h-0">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto animate-spin text-[#60C9DB]" size={32} />
              </div>
            ) : filteredReviewers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <p className="font-semibold text-slate-600 text-sm">No matching reviewers available in the matching tier pool</p>
              </div>
            ) : (
              filteredReviewers.map((r) => {
                const name = r.full_name || r.name || "Reviewer";
                const email = r.email || "No email";
                const qualification = r.job_title || "Not specified";
                const country = r.organization || "Location unknown";
                const isSelected = selectedReviewerIds.includes(r.id);

                return (
                  <button 
                    key={r.id} 
                    type="button" 
                    onClick={() => toggle(r.id)} 
                    // This button will now ALWAYS be clickable
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected 
                        ? "bg-white border-[#60C9DB] ring-[3px] ring-[#60C9DB]/10" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-[40px] w-[40px] shrink-0 rounded-full bg-[#EAF7FF] flex items-center justify-center text-[#60C9DB]">
                        <UserRound size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 pr-4">
                            <h4 className="font-bold text-[#24344D] text-[14px] truncate">{name}</h4>
                            
                            {/* NEW: Display the ALREADY ASSIGNED badge if applicable */}
                            {r.isAssigned && (
                              <span className="text-[9px] font-bold text-[#7AA7F4] uppercase tracking-wider bg-[#EAF1FD] px-2 py-0.5 rounded">
                                Already Assigned
                              </span>
                            )}
                          </div>
                          
                          <div className="shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="text-[#60C9DB] bg-white rounded-full" size={18} />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-0.5">
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>

                        <div className="flex items-center gap-4 text-[12px] text-slate-500 mt-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <GraduationCap size={12} className="shrink-0 text-slate-400" />
                            <span className="truncate">{qualification}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe size={12} className="shrink-0 text-slate-400" />
                            <span className="truncate">{country}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {r.reviewerTags && r.reviewerTags.length > 0 ? (
                            r.reviewerTags.map((t) => (
                              <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8.5px] font-bold uppercase tracking-wider">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-8 py-4 shrink-0 bg-white">
          <div className="text-[13px] font-medium text-slate-500">
            {selectedReviewerIds.length} reviewers selected
          </div>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="h-9 px-5 rounded-lg font-bold text-[#24344D] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition text-[13px]"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={assign} 
              className="h-9 px-5 rounded-lg font-bold bg-[#60C9DB] hover:bg-[#4BB8CA] text-white transition disabled:opacity-50 text-[13px] flex items-center gap-2 justify-center min-w-[130px]" 
              disabled={selectedReviewerIds.length === 0 || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
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
  );
}