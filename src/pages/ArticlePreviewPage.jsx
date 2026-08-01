import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layout/layout";
import submissionService from "../services/submissionService";
import reviewService from "../services/reviewService";
import { BACKEND_ORIGIN } from "../services/api";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  User,
  Calendar,
  FileText,
  Tag,
  Clock,
  ShieldCheck,
  BookOpen,
  Hash,
  Paperclip,
  Ban,
  Loader2,
  Eye,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  History,
  Info,
} from "lucide-react";

export default function ArticlePreviewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State initialization: try location.state first for instant loading
  const initialArticle = location.state?.article || location.state?.paper || location.state?.submission || null;
  const [article, setArticle] = useState(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const [error, setError] = useState(null);

  // Tab State: "overview" | "preview"
  const [activeTab, setActiveTab] = useState("overview");

  // Audit trail / Status history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Action states
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Current User
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  })();

  // ==========================================
  // FETCH ARTICLE & STATUS HISTORY
  // ==========================================
  useEffect(() => {
    async function fetchArticleData() {
      if (!id) return;
      try {
        if (!article) {
          setLoading(true);
        }
        setError(null);
        const data = await submissionService.getSubmissionById(id);
        if (data) {
          // Normalizing data fields for consistent presentation
          const normalized = {
            ...data,
            title: data.title || "Untitled Manuscript",
            journal: data.journal || (data.article_type ? data.article_type.name : "JournalFlow Matrix"),
            submittedAt: data.submitted_at || data.created_at || data.submittedAt,
          };
          setArticle(normalized);
        } else {
          setError("Manuscript record could not be found or has been removed.");
        }
      } catch (err) {
        console.error("Failed to load article:", err);
        setError("Unable to retrieve manuscript record. Please check your permissions or network connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchArticleData();
  }, [id]);

  useEffect(() => {
    async function fetchHistory() {
      const targetId = id || article?.id;
      if (!targetId) return;
      try {
        setHistoryLoading(true);
        const data = await reviewService.getSubmissionStatusHistory(targetId);
        const list = Array.isArray(data) ? data : data.results || [];
        setHistory(list);
      } catch (err) {
        console.warn("Could not retrieve submission audit trail:", err);
      } finally {
        setHistoryLoading(false);
      }
    }

    if (id || article?.id) {
      fetchHistory();
    }
  }, [id, article?.id]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleWithdraw = async () => {
    if (!article?.id) return;
    try {
      setWithdrawing(true);
      await submissionService.withdrawSubmission(article.id);
      toast.success("Manuscript submission has been withdrawn.");
      setShowWithdrawConfirm(false);
      // Update local state
      setArticle((prev) => (prev ? { ...prev, status: "Withdrawn" } : null));
    } catch (err) {
      console.error("Withdraw error:", err);
      toast.error(err.response?.data?.detail || "Failed to withdraw manuscript submission.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handlePublish = async () => {
    if (!article?.id) return;
    try {
      setPublishing(true);
      await submissionService.publishSubmission(article.id);
      toast.success("Manuscript successfully published!");
      setArticle((prev) => (prev ? { ...prev, status: "Published" } : null));
    } catch (err) {
      console.error("Publish error:", err);
      toast.error(err.response?.data?.detail || "Failed to publish manuscript.");
    } finally {
      setPublishing(false);
    }
  };

  const handleBack = () => {
    // Navigate back to previous view in history, or fallback to relevant dashboard
    if (window.history.length > 2) {
      navigate(-1);
    } else if (currentUser?.role === "editorial_manager" || currentUser?.is_editorial_manager || currentUser?.is_super_admin) {
      navigate("/manager/articles");
    } else if (currentUser?.role === "editor" || currentUser?.is_editor) {
      navigate("/editor/articles");
    } else if (currentUser?.role === "reviewer" || currentUser?.is_reviewer) {
      navigate("/revisions");
    } else {
      navigate("/articles");
    }
  };

  // ==========================================
  // FILE EXTRACTION & HELPERS
  // ==========================================
  const primaryFileObj = (() => {
    if (!article) return null;
    if (article.submission_files && article.submission_files.length > 0) {
      return (
        article.submission_files.find((f) =>
          f.file_type === 12 ||
          f.file_type_id === 12 ||
          f.file_type === 1 ||
          f.file_type_id === 1 ||
          (f.file_type &&
            typeof f.file_type === "object" &&
            (f.file_type.id === 12 || f.file_type.id === 1 || f.file_type.is_required || f.file_type.name === "Manuscript"))
        ) || article.submission_files[0]
      );
    }
    return null;
  })();

  const rawFileUrl =
    article?.uploadedFile?.url ||
    article?.uploadedFile?.file ||
    article?.file ||
    primaryFileObj?.file ||
    "";

  const isBase64 = rawFileUrl?.startsWith("data:");
  const isBlob = rawFileUrl?.startsWith("blob:");
  const isHttp = rawFileUrl?.startsWith("http");

  const fileUrl = rawFileUrl
    ? isBase64 || isBlob || isHttp
      ? rawFileUrl
      : `${BACKEND_ORIGIN}${rawFileUrl}`
    : "";

  const displayFileName =
    article?.uploadedFile?.name ||
    article?.uploadedFile?.fileName ||
    primaryFileObj?.original_filename ||
    (rawFileUrl ? rawFileUrl.split("/").pop() : "manuscript_document.pdf");

  const supplementaryFiles = (() => {
    if (!article) return [];
    if (article.submission_files && Array.isArray(article.submission_files)) {
      return article.submission_files.filter((f) => f.id !== primaryFileObj?.id);
    }
    if (article.supplementary_file) {
      return [
        typeof article.supplementary_file === "string"
          ? { file: article.supplementary_file }
          : article.supplementary_file,
      ];
    }
    return [];
  })();

  const downloadFile = (url, name) => {
    if (!url) {
      toast.error("No downloadable file available for this record.");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "manuscript.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (statusStr = "") => {
    const s = String(statusStr).toLowerCase();
    if (s.includes("publish") || s.includes("accept")) {
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        dot: "bg-emerald-600",
      };
    }
    if (s.includes("review")) {
      return {
        bg: "bg-sky-50 text-sky-800 border-sky-200/80",
        dot: "bg-sky-600",
      };
    }
    if (s.includes("reject") || s.includes("withdrawn")) {
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-300",
        dot: "bg-slate-500",
      };
    }
    if (s.includes("revision") || s.includes("resubmit")) {
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-200/80",
        dot: "bg-amber-600",
      };
    }
    return {
      bg: "bg-slate-50 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    };
  };

  // ==========================================
  // LOADING / ERROR STATES
  // ==========================================
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            <p className="text-sm font-medium text-slate-600 font-sans tracking-wide">
              Loading manuscript record...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !article) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] bg-[#F8FAFC] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">
              Manuscript Unavailable
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {error || "The requested manuscript could not be loaded."}
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
            >
              <ArrowLeft size={16} />
              Return to Submissions
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const displayReference = article.manuscript_reference || `REF-${article.id || "0000"}`;
  const displayArticleType =
    article.article_type_name ||
    article.articleType ||
    (article.article_type && article.article_type.name) ||
    "Original Research";
  const statusStyle = getStatusStyle(article.status);

  const authorsText =
    article.authors?.length > 0
      ? article.authors
          .map((a) =>
            `${a.firstName || a.first_name || ""} ${a.lastName || a.last_name || ""}`.trim()
          )
          .filter(Boolean)
          .join(", ")
      : article.author_name || "Author Not Specified";

  const isUserAuthor =
    currentUser &&
    (article.submittedBy?.email === currentUser.email ||
      article.author === currentUser.id ||
      article.author?.id === currentUser.id);

  const canUserWithdraw =
    isUserAuthor &&
    ["pending", "under review", "resubmitted", "minor revision", "major revision"].includes(
      String(article.status || "").toLowerCase()
    );

  const isManager =
    currentUser &&
    (currentUser.role === "editorial_manager" ||
      currentUser.role === "super_admin" ||
      currentUser.is_editorial_manager ||
      currentUser.is_super_admin ||
      currentUser.is_superuser);

  const canUserPublish = isManager && String(article.status || "").toLowerCase() === "accepted";

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] pb-20">
        {/* ==========================================
            TOP NAVIGATION & BREADCRUMB STRIP
        ========================================== */}
        <div className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold tracking-wide transition shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 truncate font-sans">
                <span>Submissions</span>
                <span>/</span>
                <span className="text-slate-800 font-medium truncate">
                  {displayReference}
                </span>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              {fileUrl && (
                <button
                  onClick={() => window.open(fileUrl, "_blank")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  title="Open manuscript file in a new browser tab"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open in Tab</span>
                </button>
              )}

              <button
                onClick={() => downloadFile(fileUrl, displayFileName)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm"
              >
                <Download size={14} />
                <span>Download Manuscript</span>
              </button>

              {/* Publish Action (for Managers) */}
              {canUserPublish && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
                >
                  {publishing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Globe size={14} />
                  )}
                  <span>Publish Article</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            MANUSCRIPT HERO HEADER
        ========================================== */}
        <div className="bg-white border-b border-slate-200/80 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Reference ID Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-mono text-xs font-semibold tracking-wide">
                <Hash size={12} className="text-slate-400" />
                {displayReference}
              </span>

              {/* Article Type Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-medium">
                {displayArticleType}
              </span>

              {/* Status Pill with Status Dot */}
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-semibold ${statusStyle.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                <span>{article.status || "Pending"}</span>
              </span>
            </div>

            {/* Article Title */}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight max-w-5xl mb-6"
              style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
            >
              {article.title || "Untitled Manuscript"}
            </h1>

            {/* Authors & Metadata Strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User size={15} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{authorsText}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-slate-400 shrink-0" />
                <span>
                  Submitted{" "}
                  {article.submittedAt
                    ? new Date(article.submittedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Date Unspecified"}
                </span>
              </div>

              {article.journal && (
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">{article.journal}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            VIEW SWITCHER TABS (OVERVIEW / PDF PREVIEW)
        ========================================== */}
        <div className="bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText size={16} />
                <span>Manuscript Overview</span>
              </button>

              {fileUrl && (
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`py-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                    activeTab === "preview"
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Eye size={16} />
                  <span>Document Viewer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            MAIN CONTENT AREA
        ========================================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {activeTab === "preview" && fileUrl ? (
            /* --- DOCUMENT VIEWER TAB --- */
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <FileCheck size={16} className="text-slate-500" />
                  <span>{displayFileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile(fileUrl, displayFileName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  >
                    <Download size={13} />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              <div className="w-full h-[800px] bg-slate-100 flex items-center justify-center">
                <iframe
                  src={fileUrl}
                  title={displayFileName}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            /* --- MANUSCRIPT OVERVIEW TAB --- */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COLUMN: EDITORIAL CONTENT (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                {/* PRIMARY MANUSCRIPT RECORD CARD */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700 shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-sans">
                          Primary Manuscript File
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800 mt-1 break-all">
                          {displayFileName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Available for editorial assessment and peer review
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {fileUrl && (
                        <button
                          onClick={() => setActiveTab("preview")}
                          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                        >
                          <Eye size={14} />
                          <span>Preview</span>
                        </button>
                      )}
                      <button
                        onClick={() => downloadFile(fileUrl, displayFileName)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ABSTRACT CARD */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                  <h2
                    className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-4"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Abstract
                  </h2>
                  <div
                    className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap"
                    style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
                  >
                    {article.abstract || "No abstract has been provided for this submission."}
                  </div>
                </div>

                {/* KEYWORDS CARD */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-4">
                    Keywords & Classifications
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords ? (
                      (Array.isArray(article.keywords)
                        ? article.keywords
                        : String(article.keywords)
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                      ).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-medium border border-slate-200/80 transition"
                        >
                          <Tag size={12} className="text-slate-400" />
                          <span>{keyword}</span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No keywords associated with this manuscript.
                      </p>
                    )}
                  </div>
                </div>

                {/* SUPPLEMENTARY FILES SECTION */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Supplementary Materials & Datasets
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Supporting documents, figures, and data files attached by the author
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {supplementaryFiles.length}{" "}
                      {supplementaryFiles.length === 1 ? "file" : "files"}
                    </span>
                  </div>

                  {supplementaryFiles.length > 0 ? (
                    <div className="divide-y divide-slate-200/80 border-t border-slate-200/80">
                      {supplementaryFiles.map((fileObj, idx) => {
                        const rawUrl = fileObj.file || "";
                        const url = rawUrl
                          ? rawUrl.startsWith("http") ||
                            rawUrl.startsWith("data:") ||
                            rawUrl.startsWith("blob:")
                            ? rawUrl
                            : `${BACKEND_ORIGIN}${rawUrl}`
                          : "";
                        const name =
                          fileObj.original_filename ||
                          fileObj.name ||
                          (rawUrl
                            ? rawUrl.split("/").pop()
                            : `Supplementary_File_${idx + 1}`);

                        return (
                          <div
                            key={fileObj.id || idx}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <Paperclip
                                size={16}
                                className="text-slate-400 shrink-0 mt-0.5"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                                  {name}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Supplementary Attachment
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {url && (
                                <button
                                  type="button"
                                  onClick={() => window.open(url, "_blank")}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                                >
                                  <ExternalLink size={13} />
                                  <span>View</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => downloadFile(url, name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
                              >
                                <Download size={13} />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      <p className="text-xs text-slate-400 italic">
                        No supplementary records attached to this submission.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: SIDEBAR METADATA & AUDIT TRAIL (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* SUBMISSION METADATA CARD */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                  <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-5">
                    Manuscript Metadata
                  </h2>
                  <div className="space-y-4 divide-y divide-slate-100">
                    <MetaRow
                      label="Manuscript Ref"
                      value={displayReference}
                      mono
                    />
                    <MetaRow
                      label="Current Status"
                      value={article.status || "Pending"}
                    />
                    <MetaRow
                      label="Article Type"
                      value={displayArticleType}
                    />
                    <MetaRow
                      label="Handling Reviewer(s)"
                      value={
                        article.assignedReviewer?.map((r) => r.name).join(", ") ||
                        article.reviewer_assignments?.map((r) => r.reviewer?.full_name).join(", ") ||
                        "Not assigned"
                      }
                    />
                    <MetaRow
                      label="Submission Date"
                      value={
                        article.submittedAt
                          ? new Date(article.submittedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"
                      }
                    />
                    <MetaRow
                      label="Journal / Section"
                      value={article.journal || "JournalFlow Matrix"}
                    />
                  </div>
                </div>

                {/* AUTHOR WITHDRAWAL CONTROLS (CONDITIONAL) */}
                {canUserWithdraw && (
                  <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                    <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-3">
                      Author Controls
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      You may withdraw this manuscript from editorial consideration while it remains under preliminary assessment.
                    </p>

                    {!showWithdrawConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowWithdrawConfirm(true)}
                        className="w-full py-2.5 px-4 rounded-lg bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200 text-xs font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Ban size={14} />
                        <span>Withdraw Submission</span>
                      </button>
                    ) : (
                      <div className="bg-red-50/60 border border-red-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-900 font-medium leading-relaxed">
                            Are you certain you wish to withdraw this submission? This action removes the manuscript from review.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleWithdraw}
                            disabled={withdrawing}
                            className="flex-1 py-2 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                          >
                            {withdrawing ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <span>Confirm Withdrawal</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowWithdrawConfirm(false)}
                            disabled={withdrawing}
                            className="py-2 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AUDIT TRAIL / TIMELINE CARD */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Workflow Audit Trail
                    </h2>
                    <History size={15} className="text-slate-400" />
                  </div>

                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : history.length > 0 ? (
                    <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-6 mt-4">
                      {history.map((h, idx) => {
                        const dateStr = h.created_at
                          ? new Date(h.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A";
                        const newStatus = h.new_status || "Pending";
                        return (
                          <div key={idx} className="relative text-xs">
                            <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-slate-500 ring-4 ring-white" />
                            <p className="font-semibold text-slate-800 capitalize tracking-wide">
                              {newStatus.replace(/_/g, " ")}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {dateStr}
                            </p>
                            {h.comment && (
                              <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 italic text-[11px] leading-relaxed">
                                "{h.comment}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4">
                      No status transitions recorded yet for this submission.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Helper Component for Sidebar Metadata Rows
function MetaRow({ label, value, mono = false }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-sm text-slate-800 font-medium break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
