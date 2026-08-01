import { useState } from "react";
import { Search, CalendarDays, UserRound, AlertCircle, MapPin, Activity } from "lucide-react";
import AppLayout from "../layout/layout";
import submissionService from "../services/submissionService";

export default function TrackArticle() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [article, setArticle] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setArticle(null);

      const response = await submissionService.getSubmissions();
      const submissions = Array.isArray(response.data) ? response.data : response.results || response || [];
      
      const foundArticle = submissions.find(
        (sub) => sub.manuscript_reference?.toLowerCase() === referenceNumber.toLowerCase().trim()
      );

      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        setError("No article found with that reference number.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while tracking the article.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes("review")) return "text-blue-600 bg-blue-50";
    if (s.includes("accept")) return "text-teal-600 bg-teal-50 border-teal-200";
    if (s.includes("publish")) return "text-green-600 bg-green-50 border-green-200";
    if (s.includes("reject")) return "text-red-600 bg-red-50";
    if (s.includes("minor")) return "text-amber-600 bg-amber-50";
    if (s.includes("major")) return "text-orange-600 bg-orange-50 border-orange-200";
    if (s.includes("withdrawn")) return "text-slate-600 bg-slate-50 border-slate-200";
    return "text-indigo-600 bg-indigo-50";
  };

  return (
    <AppLayout>
      <div className="px-4 py-8 max-w-4xl mx-auto space-y-8">
        <div style={{
          background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)",
          borderRadius: "8px", padding: "32px", borderTop: "4px solid var(--primary)",
        }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,32px)", color: "#fff", fontWeight: "600", margin: "0 0 12px" }}>
            Track Manuscript
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", margin: 0, fontFamily: "var(--font-sans)", maxWidth: "600px" }}>
            Enter the manuscript reference number to view the current status and tracking details of the article.
          </p>

          <form onSubmit={handleTrack} className="mt-8 relative max-w-lg">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="e.g. JBSIP-123456"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full pl-12 pr-24 py-3.5 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-[15px] text-[#24344D] shadow-lg"
            />
            <button 
              type="submit"
              disabled={loading || !referenceNumber.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0077B6] hover:bg-[#005f91] text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </form>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {article && (
          <div className="bg-white border border-[#D9EAF7] rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
                  {article.manuscript_reference || "N/A"}
                </span>
                <h2 className="text-2xl font-bold text-[#24344D] leading-snug">
                  {article.title || "Untitled Article"}
                </h2>
                <p className="text-[#0077B6] font-medium mt-2">
                  {article.journal || (article.article_type ? article.article_type.name : "JournalFlow")}
                </p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize border ${getStatusColor(article.status)}`}>
                {(article.status || "Pending").replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#EEF5FA]">
              <div className="flex gap-3">
                <UserRound className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Authors</p>
                  <p className="text-sm font-medium text-gray-700">
                    {article.authors?.length > 0
                      ? article.authors.map(a => `${a.first_name || a.firstName} ${a.last_name || a.lastName}`).join(", ")
                      : article.author?.email || "Unknown Author"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CalendarDays className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted On</p>
                  <p className="text-sm font-medium text-gray-700">
                    {article.submitted_at || article.created_at 
                      ? new Date(article.submitted_at || article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Activity className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Stage</p>
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {(article.status || "Submission").replace(/_/g, " ")} Phase
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Editorial Action</p>
                  <p className="text-sm font-medium text-gray-700">
                    {article.assigned_editor ? "Assigned to Editor" : "Awaiting Editor Assignment"}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
