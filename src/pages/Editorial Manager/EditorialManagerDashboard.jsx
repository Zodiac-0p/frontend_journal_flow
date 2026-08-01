import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Settings, FolderOpen, Loader2, Award, ClipboardList, BookOpen, UserCheck, ChevronRight 
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../layout/layout";
import authService from "../../services/authService";
import api from "../../services/api";

export default function EditorialManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    reviewerCount: 0,
    unassignedSubmissions: 0,
    activeReviews: 0,
  });
  const [recentManuscripts, setRecentManuscripts] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch submissions
      const subRes = await api.get("/journals/submissions/");
      const submissions = Array.isArray(subRes.data) ? subRes.data : subRes.data?.results || [];
      const submittedOnly = submissions.filter(s => s.status !== "draft");

      // Fetch reviewer users count
      const reviewers = await authService.listUsers("reviewer");
      const reviewerCount = Array.isArray(reviewers) ? reviewers.length : reviewers.results?.length || 0;

      // Count unassigned submissions (no editor assigned)
      const unassigned = submittedOnly.filter(s => !s.editor && !s.assigned_editor).length;

      // Fetch active reviewer assignments count
      const activeAssignments = submittedOnly.reduce((acc, curr) => {
        const assignments = curr.reviewer_assignments || curr.assigned_reviewers || [];
        return acc + assignments.filter(a => a.status === "pending" || a.status === "accepted").length;
      }, 0);

      setStats({
        totalSubmissions: submittedOnly.length,
        reviewerCount: reviewerCount,
        unassignedSubmissions: unassigned,
        activeReviews: activeAssignments,
      });

      // Display top 5 recently modified manuscripts
      const sorted = [...submittedOnly].sort((a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt));
      setRecentManuscripts(sorted.slice(0, 5));

    } catch (err) {
      console.error("Failed to load manager dashboard metrics:", err);
      toast.error("Failed to sync dashboard overview metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await loadDashboardData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loadDashboardData]);

  const cards = [
    {
      title: "Manuscripts",
      value: stats.totalSubmissions,
      desc: "Total submitted papers",
      icon: BookOpen,
      color: "from-blue-500 to-sky-400",
      path: "/manager/articles",
    },
    {
      title: "Reviewer Pool",
      value: stats.reviewerCount,
      desc: "Active academic reviewers",
      icon: Users,
      color: "from-emerald-500 to-teal-400",
      path: "/manager/users",
    },
    {
      title: "Unassigned Papers",
      value: stats.unassignedSubmissions,
      desc: "Needs editor assignment",
      icon: ClipboardList,
      color: "from-amber-500 to-orange-400",
      path: "/manager/articles",
    },
    {
      title: "Peer Reviews",
      value: stats.activeReviews,
      desc: "Ongoing review assignments",
      icon: UserCheck,
      color: "from-indigo-500 to-purple-400",
      path: "/manager/reviews",
    },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)",
          borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: "16px", flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: ".6px", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Editorial Manager</div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,32px)", color: "#fff", fontWeight: "600", margin: "0 0 6px" }}>Chief Editorial Console</h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", fontFamily: "var(--font-sans)", margin: 0, lineHeight: "1.6" }}>Overview publication queues, manage reviewer pools, assign coordinators, and configure journal parameters.</p>
          </div>
          <button onClick={loadDashboardData} style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer" }}>Refresh Dashboard</button>
        </div>

        {/* METRIC CARDS GRID */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <Loader2 style={{ color: "var(--blue)", animation: "spin 1s linear infinite", width: "32px", height: "32px" }} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            {cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(card.path)}
                  style={{
                    background: "#fff", padding: "20px 18px", textAlign: "left",
                    border: "none", cursor: "pointer", transition: "background .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "#E5F0FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={18} style={{ color: "var(--blue)" }} />
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: ".5px", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>{card.title}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "32px", fontWeight: "700", color: "var(--navy)", lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-sans)" }}>{card.desc}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN LAYOUT SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          
          {/* RECENT SUBMISSIONS QUEUE */}
          <div className="card-surface" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "300px" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <FolderOpen size={16} style={{ color: "var(--blue)" }} />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--navy)", margin: 0, fontWeight: "600" }}>Recent Submissions Queue</h2>
            </div>
            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 style={{ color: "var(--blue)", animation: "spin 1s linear infinite", width: "24px", height: "24px" }} />
              </div>
            ) : recentManuscripts.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "14px" }}>No submissions in queue.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
                <tbody>
                  {recentManuscripts.map((sub, idx) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid var(--border-light)", background: idx % 2 === 0 ? "#fff" : "var(--bg-light)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{ fontWeight: "600", color: "var(--navy)", fontSize: "14px", cursor: "pointer" }}
                          onClick={() => navigate(`/manager/assign-reviewers/${sub.id}`)}
                        >{sub.title || "Untitled Paper"}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Author: {sub.author_name || sub.author?.email || "Unknown"}</div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span className="badge badge-blue" style={{ textTransform: "capitalize" }}>{sub.status.replace(/_/g, " ")}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* QUICK LINKS PANEL */}
          <div>
            <div className="card-surface" style={{ padding: "0", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={16} style={{ color: "var(--blue)" }} />
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--navy)", margin: 0, fontWeight: "600" }}>Administrative Actions</h2>
              </div>
              <div style={{ padding: "8px" }}>
                {[{ label: "User Management", path: "/manager/users", icon: Users }, { label: "Configure Settings", path: "/manager/settings", icon: Settings }].map(({ label, path, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 12px", borderRadius: "4px", border: "none",
                      background: "transparent", cursor: "pointer", transition: "background .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600", color: "var(--navy)", fontFamily: "var(--font-sans)" }}>
                      <Icon size={15} style={{ color: "var(--blue)" }} />{label}
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Info Alert Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/20 rounded-3xl p-6 border border-amber-200/80 shadow-sm">
              <h3 className="font-bold text-amber-800 text-sm flex items-center gap-1.5">
                <Award size={16} />
                Taxonomy Audit Note
              </h3>
              <p className="text-xs text-amber-700/90 leading-5 mt-2">
                Users applying to become peer reviewers are held in queue. Before toggle validation checks permit reviewer activation, ensure they have configured at least 4 active classification expertise keywords.
              </p>
            </div>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}
