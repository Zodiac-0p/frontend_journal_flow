import { useState, useEffect, useRef } from "react";
import { X, Loader2, FileText, User, Calendar, CheckCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";
import reviewService from "../services/reviewService";

export default function ReviewReportsModal({ submissionId, submissionTitle, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Add a ref to track if we've already fetched for this ID
  const fetchedRef = useRef(null);

  useEffect(() => {
    // 1. Only fetch if submissionId exists AND it's different from the last one
    if (!submissionId || fetchedRef.current === submissionId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        fetchedRef.current = submissionId; // Mark as fetched
        const data = await reviewService.getSubmissionReviewReports(submissionId);
        setReports(data);
      } catch (err) {
        console.error("Failed to load review reports:", err);
        toast.error("Failed to load review reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [submissionId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRecommendationColor = (recommendation) => {
    if (!recommendation) return "bg-slate-50 border-slate-200 text-slate-700";
    const rec = String(recommendation).toLowerCase();
    if (rec.includes("accept")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (rec.includes("minor")) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    if (rec.includes("major")) return "bg-orange-50 border-orange-200 text-orange-700";
    if (rec.includes("reject")) return "bg-red-50 border-red-200 text-red-700";
    return "bg-slate-50 border-slate-200 text-slate-700";
  };


  return (
    <div className="fixed inset-0 bg-slate-900/55 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] w-full max-w-4xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-[#24344D]">Review Reports</h2>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{submissionTitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[700px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="animate-spin text-[#00A8CC] w-8 h-8" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto mb-4 text-slate-300 w-12 h-12" />
              <p className="font-semibold text-slate-700">No review reports submitted yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Reports will appear here as reviewers submit them.
              </p>
            </div>
          ) : selectedReport ? (
            <div className="p-8 space-y-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="mb-2 text-sm text-[#0077B6] hover:text-[#005F91] font-semibold flex items-center gap-1"
              >
                ← Back to reports
              </button>

              {/* Reviewer Info Header */}
              <div className="bg-gradient-to-r from-[#EAF7FF] to-[#F0FBFF] rounded-2xl p-6 border border-[#00A8CC]/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#24344D] flex items-center gap-2">
                      <User size={24} className="text-[#00A8CC]" />
                      {selectedReport.reviewer_name ||
                        selectedReport.reviewer?.full_name ||
                        "Anonymous Reviewer"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedReport.reviewer?.email || "No email available"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={14} />
                      Submitted: {formatDate(selectedReport.submitted_at || selectedReport.submittedAt || selectedReport.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Submission Status */}
              <div className="grid md:grid-cols-3 gap-4">
                {(selectedReport.report_complete || selectedReport.reportComplete) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">
                      Report Complete
                    </p>
                    <p className="text-sm font-semibold text-emerald-900">
                      {selectedReport.report_complete || selectedReport.reportComplete}
                    </p>
                  </div>
                )}

                {(selectedReport.transfer_report || selectedReport.transferReport) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">
                      Ready to Transfer
                    </p>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedReport.transfer_report || selectedReport.transferReport}
                    </p>
                  </div>
                )}

                {(selectedReport.final_decision || selectedReport.finalDecision) && (
                  <div
                    className={`rounded-xl p-4 border ${getRecommendationColor(
                      selectedReport.final_decision || selectedReport.finalDecision
                    ).replace("bg-", "bg-").replace("text-", "text-")}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide mb-1">
                      Final Recommendation
                    </p>
                    <p className="text-sm font-bold">
                      {selectedReport.final_decision || selectedReport.finalDecision}
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer Expertise & Confidence Fields */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4">
                  Reviewer Assessment
                </h4>
                <div className="grid md:grid-cols-2 gap-5">
                  {(selectedReport.referee_confidence || selectedReport.refereeConfidence) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Can Referee This Paper
                      </p>
                      <p className="text-sm bg-slate-50 p-3 rounded-lg text-slate-700 border border-slate-200">
                        {selectedReport.referee_confidence || selectedReport.refereeConfidence}
                      </p>
                    </div>
                  )}

                  {(selectedReport.suitability || selectedReport.suitability) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Suitability as Referee
                      </p>
                      <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-900 font-semibold border border-blue-200">
                        {selectedReport.suitability}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Paper Quality & Value Fields */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4">
                  Paper Evaluation
                </h4>
                <div className="grid md:grid-cols-2 gap-5">
                  {(selectedReport.quality || selectedReport.quality) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Paper Quality
                      </p>
                      <p className="text-sm bg-yellow-50 p-3 rounded-lg text-yellow-900 font-semibold border border-yellow-200">
                        {selectedReport.quality}
                      </p>
                    </div>
                  )}

                  {(selectedReport.value || selectedReport.value) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Paper Value & Worth
                      </p>
                      <p className="text-sm bg-slate-50 p-3 rounded-lg text-slate-700 border border-slate-200">
                        {selectedReport.value}
                      </p>
                    </div>
                  )}

                  {(selectedReport.classification || selectedReport.classification) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Classification
                      </p>
                      <p className="text-sm bg-purple-50 p-3 rounded-lg text-purple-900 font-semibold border border-purple-200">
                        {selectedReport.classification}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Content & Presentation Checks */}
              <div className="grid md:grid-cols-2 gap-6">
                {(selectedReport.content_checks?.length > 0 || selectedReport.contentChecks?.length > 0) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
                      Content Evaluation Checks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedReport.content_checks || selectedReport.contentChecks || []).map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200"
                        >
                          <CheckCircle size={13} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedReport.presentation_checks?.length > 0 || selectedReport.presentationChecks?.length > 0) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
                      Presentation Evaluation Checks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedReport.presentation_checks || selectedReport.presentationChecks || []).map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200"
                        >
                          <FileText size={13} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Sections */}
              <div className="grid md:grid-cols-2 gap-6">
                {(selectedReport.comments_to_author || selectedReport.commentsToAuthor) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText size={18} className="text-[#00A8CC]" />
                      <h4 className="font-bold text-[#24344D]">Comments to Author</h4>
                    </div>
                    <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {selectedReport.comments_to_author || selectedReport.commentsToAuthor}
                    </div>
                  </div>
                )}

                {(selectedReport.confidential_comments || selectedReport.confidentialComments) && (
                  <div className="bg-white rounded-2xl border border-red-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield size={18} className="text-red-600" />
                      <h4 className="font-bold text-red-900">Confidential Comments (Editor Only)</h4>
                    </div>
                    <div className="text-sm text-red-900 bg-red-50 p-4 rounded-xl border border-red-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {selectedReport.confidential_comments || selectedReport.confidentialComments}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Fields */}
              {(selectedReport.recommendation || selectedReport.comments || selectedReport.review_content) && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                    Additional Details
                  </h4>

                  {selectedReport.recommendation && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Recommendation
                      </p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {selectedReport.recommendation}
                      </p>
                    </div>
                  )}

                  {selectedReport.comments && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Comments
                      </p>
                      <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedReport.comments}
                      </div>
                    </div>
                  )}

                  {selectedReport.review_content && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Review Content
                      </p>
                      <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedReport.review_content}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reports.map((report, index) => (
                <div
                  key={report.id || index}
                  className="p-6 hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#24344D] flex items-center gap-2">
                        <User size={18} className="text-[#00A8CC]" />
                        {report.reviewer_name || report.reviewer?.full_name || "Anonymous Reviewer"}
                      </h3>

                      {(report.final_decision || report.finalDecision) && (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold">Recommendation:</span>{" "}
                          <span
                            className={`font-bold ${getRecommendationColor(
                              report.final_decision || report.finalDecision
                            ).split(" ")[2]}`}
                          >
                            {report.final_decision || report.finalDecision}
                          </span>
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {formatDate(report.submitted_at || report.created_at)}
                        </span>

                        {report.status && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {report.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl bg-slate-100 px-8 font-bold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
