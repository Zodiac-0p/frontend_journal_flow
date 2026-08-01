import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Eye,
  CalendarDays,
  Clock,
  UserRound,
  FileText,
  Download,
  Upload,
  Ban,
  Globe,
} from "lucide-react";

import AppLayout from "../layout/layout";

import submissionService from "../services/submissionService";
import ResubmitModal from "../pages/ResubmitModal";

export default function ArticlesPage() {

  // ==========================================
  // LOAD ARTICLES & STATE
  // ==========================================

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [resubmitArticle, setResubmitArticle] = useState(null);

  // ==========================================
  // CURRENT USER
  // ==========================================

  const currentUser = JSON.parse(
    localStorage.getItem(
      "currentUser"
    ) || "null"
  );

  const location = useLocation();
  const navigate = useNavigate();
  const isEditorView = location.pathname.startsWith("/editor") || location.pathname.startsWith("/manager");

  // ==========================================
  // FETCH LOGIC (Moved to useCallback to allow manual refreshing)
  // ==========================================
  const fetchSubmittedData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await submissionService.getSubmissions();

      const formatted = (response || []).map((submission) => {

        // --- EXPLICIT STATUS LABELS ---
        let statusLabel = "Pending";
        if (["submitted", "under_editor_review", "under_peer_review"].includes(submission.status)) {
          statusLabel = "Under Review";
        } else if (submission.status === "published") {
          statusLabel = "Published";
        } else if (submission.status === "accepted") {
          statusLabel = "Accepted";
        } else if (submission.status === "rejected") {
          statusLabel = "Rejected";
        } else if (submission.status === "major_revision") {
          statusLabel = "Major Revision";
        } else if (submission.status === "minor_revision") {
          statusLabel = "Minor Revision";
        } else if (submission.status === "resubmitted") {
          statusLabel = "Resubmitted"; // <-- ADDED EXPLICIT RESUBMITTED STATUS
        } else if (submission.status === "withdrawn") {
          statusLabel = "Withdrawn";
        } else if (submission.status === "draft") {
          statusLabel = "Draft";
        }

        let keywordsArray = [];
        if (typeof submission.keywords === "string" && submission.keywords.trim()) {
          keywordsArray = submission.keywords.split(",").map(k => k.trim()).filter(Boolean);
        } else if (Array.isArray(submission.keywords)) {
          keywordsArray = submission.keywords;
        }

        const mappedAuthors = (submission.authors || []).map(auth => ({
          firstName: auth.first_name || "",
          lastName: auth.last_name || "",
          institution: auth.institution || "",
          email: auth.email || ""
        }));

        let mainFile = null;
        if (submission.submission_files && submission.submission_files.length > 0) {
          const primaryDoc = submission.submission_files.find(f =>
            f.file_type === 12 ||
            f.file_type_id === 12 ||
            f.file_type === 1 ||
            f.file_type_id === 1 ||
            (f.file_type && typeof f.file_type === 'object' && (f.file_type.id === 12 || f.file_type.id === 1 || f.file_type.is_required || f.file_type.name === "Manuscript"))
          ) || submission.submission_files[0];
          const fileUrl = primaryDoc.file || "";
          mainFile = {
            url: fileUrl.startsWith("http") ? fileUrl : `http://127.0.0.1:8000${fileUrl}`,
            name: primaryDoc.original_filename || "manuscript.pdf"
          };
        }

        return {
          ...submission,
          title: submission.title || "Untitled Article",
          journal: submission.journal || (submission.article_type ? submission.article_type.name : "JournalFlow Matrix"),
          keywords: keywordsArray,
          authors: mappedAuthors,
          status: statusLabel,
          submittedAt: submission.submitted_at || submission.created_at,
          uploadedFile: mainFile,
          submittedBy: submission.author ? {
            id: submission.author.id,
            email: submission.author.email
          } : null
        };
      });

      setArticles(formatted);
    } catch (err) {
      console.error("Failed to recover user submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmittedData();
  }, [fetchSubmittedData]);

  // ==========================================
  // SHOW ONLY USER ARTICLES (FILTERED OUT DRAFTS)
  // ==========================================

  const filteredArticles = articles.filter((article) => {
    if (article.status === "Draft") {
      return false;
    }

    if (isEditorView) {
      return true;
    }

    const isAuthorMatch =
      article.author === currentUser?.id ||
      (article.submittedBy?.email && article.submittedBy.email === currentUser?.email) ||
      (article.submittedBy?.id && article.submittedBy.id === currentUser?.id);

    return isAuthorMatch;
  });

  // ==========================================
  // DOWNLOAD FILE
  // ==========================================

  const handleDownload = (
    article
  ) => {

    if (
      !article?.uploadedFile ||
      !article?.uploadedFile?.url
    ) {

      alert(
        "No file available for download."
      );

      return;
    }

    try {

      const link =
        document.createElement("a");

      link.href =
        article.uploadedFile.url;

      link.download =
        article.uploadedFile.name ||
        "article-file";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

    } catch (error) {

      console.error(
        "Download failed:",
        error
      );

      alert(
        "Unable to download file."
      );
    }
  };

  const handleWithdraw = async (articleId) => {
    if (!window.confirm("Are you sure you want to withdraw this article submission? This action is permanent.")) {
      return;
    }

    try {
      setLoading(true);
      await submissionService.withdrawSubmission(articleId);
      toast.success("Submission withdrawn successfully.");
      fetchSubmittedData();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error(error.response?.data?.detail || "Failed to withdraw manuscript.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (articleId) => {
    if (!window.confirm("Are you sure you want to publish this article? It will be publicly visible on the Journals page.")) {
      return;
    }

    try {
      setLoading(true);
      await submissionService.publishSubmission(articleId);
      toast.success("Article successfully published!");
      fetchSubmittedData();
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(error.response?.data?.detail || "Failed to publish article.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STATUS COLORS
  // ==========================================

  const getStatusColor = (
    status
  ) => {

    switch (status) {

      case "Under Review":
        return "bg-blue-100 text-blue-700";

      case "Reviewed":
        return "bg-green-100 text-green-700";

      case "Accepted":
        return "bg-teal-100 text-teal-700 font-bold border border-teal-200";

      case "Published":
        return "bg-green-100 text-green-700 font-bold border border-green-200";

      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Minor Revision":
        return "bg-amber-100 text-amber-700";

      case "Major Revision":
        return "bg-orange-100 text-orange-800 font-bold border border-orange-200";

      case "Resubmitted":
        return "bg-indigo-100 text-indigo-700 font-bold border border-indigo-200"; // <-- ADDED COLOR FOR RESUBMITTED

      case "Withdrawn":
        return "bg-slate-100 text-slate-600 border border-slate-200";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <AppLayout>

      <div className="px-2 py-4">

        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)", borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)", marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,36px)", color: "#fff", fontWeight: "600", margin: "0 0 10px" }}>
            {isEditorView ? "Submitted Articles" : "My Submitted Articles"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", lineHeight: "1.7", margin: 0, fontFamily: "var(--font-sans)", maxWidth: "600px" }}>
            View and manage all your
            submitted research articles
            and publication records.
          </p>
        </div>

        {/* LOADING ANIMATION */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0077B6] mx-auto"></div>
            <p className="text-gray-400 text-sm mt-4 font-medium">Fetching article records from backend server...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredArticles.length === 0 && (
          <div className="bg-white border border-[#D9EAF7] rounded-2xl p-14 text-center shadow-sm mt-6">
            <FileText className="w-14 h-14 mx-auto text-gray-300" />
            <h2 className="text-2xl font-semibold text-[#24344D] mt-5">
              No Articles Found
            </h2>
            <p className="text-gray-500 mt-3">
              {isEditorView
                ? "No submitted articles are available at the moment."
                : "You have not submitted any articles yet."}
            </p>
          </div>
        )}

        {/* ARTICLES TABLE */}
        {!loading && filteredArticles.length > 0 && (
          <div className="bg-white border border-[#D9EAF7] rounded-2xl overflow-hidden shadow-sm mt-6">

            {/* TABLE HEADER */}
            <div className="hidden lg:grid grid-cols-[80px_2fr_1.2fr_1fr_160px_280px] bg-[#F8FBFF] border-b border-[#D9EAF7] px-6 py-4 text-[13px] font-semibold text-[#24344D]">
              <div>ID</div>
              <div>Article</div>
              <div>Authors</div>
              <div>Status</div>
              <div>Submitted</div>
              <div>Actions</div>
            </div>

            {/* ROWS */}
            {filteredArticles.map((article, index) => {
              let dateStr = "N/A";
              let timeStr = "";
              if (article.submittedAt) {
                const dateObj = new Date(article.submittedAt);
                dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
              }

              // Check if this article needs revision
              const isRevision = article.status === "Minor Revision" || article.status === "Major Revision";

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 lg:grid-cols-[80px_2fr_1.2fr_1fr_160px_280px] gap-5 lg:gap-0 items-start lg:items-center px-6 py-5 border-b border-[#EEF5FA] hover:bg-[#FAFCFF] transition"
                >

                  {/* ID */}
                  <div className="text-[14px] font-medium text-[#24344D]">
                    #{index + 1}
                  </div>

                  {/* ARTICLE */}
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#24344D] leading-6 capitalize">
                      {article.title || "Untitled Article"}
                    </h3>
                    <p className="text-[13px] text-[#0077B6] mt-1">
                      {article.journal || "No Journal"}
                    </p>

                    {/* KEYWORDS */}
                    {article.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "2px 10px", borderRadius: "3px",
                              background: "var(--bg-alt)", color: "var(--text-secondary)",
                              fontSize: "11px", fontFamily: "var(--font-sans)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {keyword}
                          </span>
                        )
                        )}
                      </div>
                    )}
                  </div>

                  {/* AUTHORS */}
                  <div className="flex items-start gap-2 text-[13px] text-gray-600 leading-6">
                    <UserRound size={15} className="mt-[2px]" />
                    <span>
                      {article.authors?.length > 0
                        ? article.authors
                          .map((author) => `${author.firstName} ${author.lastName}`)
                          .join(", ")
                        : "No Authors"}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(
                        article.status
                      )}`}
                    >
                      {article.status || "Pending"}
                    </span>
                  </div>

                  {/* DATE & TIME */}
                  <div className="flex flex-col gap-1 text-[13px] text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-gray-400" />
                      <span className="font-medium">{dateStr}</span>
                    </div>
                    {timeStr && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-500 text-[12px]">{timeStr}</span>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3">

                    {/* PREVIEW */}
                    <button
                      onClick={() => {
                        const basePath = location.pathname.startsWith("/manager")
                          ? "/manager/article-preview"
                          : location.pathname.startsWith("/editor")
                            ? "/editor/article-preview"
                            : "/article-preview";
                        navigate(`${basePath}/${article.id}`, { state: { article } });
                      }}
                      style={{
                        flex: 1, height: "40px", borderRadius: "4px", background: "var(--navy)",
                        color: "#fff", fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        border: "none", cursor: "pointer", transition: "background .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--blue)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "var(--navy)"; }}
                    >
                      <Eye size={16} />
                      Preview
                    </button>

                    {/* DOWNLOAD */}
                    <button
                      onClick={() => handleDownload(article)}
                      className="flex-1 h-10 rounded-xl border border-[#D9EAF7] hover:bg-[#F8FBFF] text-[#24344D] text-[13px] font-medium transition flex items-center justify-center gap-2"
                    >
                      <Download size={15} />
                      Download
                    </button>

                    {/* UPDATED: CONDITIONAL RESUBMIT BUTTON */}
                    {isRevision && !isEditorView && (
                      <button
                        onClick={() => setResubmitArticle(article)}
                        className="flex-1 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-medium transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Upload size={15} />
                        Resubmit
                      </button>
                    )}

                    {/* WITHDRAW BUTTON */}
                    {(() => {
                      const isUserAuthor = currentUser && (article.submittedBy?.email === currentUser.email || article.author?.id === currentUser.id);
                      if (!isUserAuthor) return null;
                      if (!["Pending", "Under Review", "Resubmitted", "Minor Revision", "Major Revision"].includes(article.status)) return null;

                      return (
                        <button
                          onClick={() => handleWithdraw(article.id)}
                          className="flex-1 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-[13px] font-medium transition flex items-center justify-center gap-2"
                        >
                          <Ban size={14} />
                          Withdraw
                        </button>
                      );
                    })()}

                    {/* PUBLISH BUTTON */}
                    {(() => {
                      const isManager = currentUser && (
                        currentUser.role === "editorial_manager" ||
                        currentUser.role === "super_admin" ||
                        currentUser.is_editorial_manager ||
                        currentUser.is_super_admin ||
                        currentUser.is_superuser
                      );

                      if (isManager && article.status === "Accepted") {
                        return (
                          <button
                            onClick={() => handlePublish(article.id)}
                            className="flex-1 h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[13px] font-medium transition flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Globe size={15} />
                            Publish
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RESUBMIT MODAL */}
      {resubmitArticle && (
        <ResubmitModal
          article={resubmitArticle}
          onClose={() => setResubmitArticle(null)}
          onSuccess={() => {
            setResubmitArticle(null);
            // --- UPDATED: Show toast and re-fetch instead of hard reloading! ---
            toast.success("Manuscript resubmitted successfully!");
            fetchSubmittedData();
          }}
        />
      )}
    </AppLayout>
  );
}