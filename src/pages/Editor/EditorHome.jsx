// src/pages/Editor/EditorHome.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus2,
  FolderOpen,
  Users,
  Bell,
  Loader2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../layout/layout";
import submissionService from "../../services/submissionService";

export default function HomePage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let cancelled = false;
    submissionService.getSubmissions().then(data => {
      if (cancelled) return;
      const activeSubmissions = (Array.isArray(data) ? data : data?.results || [])
        .filter(s => s.status !== "draft");
      setSubmissions(activeSubmissions);
    }).catch(err => {
      if (cancelled) return;
      console.error("Failed to load editor dashboard data:", err);
      toast.error("Failed to sync dashboard metrics.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ==========================================
  // DYNAMIC STATS CALCULATION
  // ==========================================
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'under_editor_review').length;
  const underReviewCount = submissions.filter(s => s.status === 'under_peer_review' || s.status === 'minor_revision' || s.status === 'major_revision').length;
  const acceptedCount = submissions.filter(s => s.status === 'accepted').length;
  const publishedCount = submissions.filter(s => s.status === 'published').length;

  const stats = [
    {
      label: "Submitted",
      value: String(submittedCount),
    },
    {
      label: "Under Review",
      value: String(underReviewCount),
    },
    {
      label: "Accepted",
      value: String(acceptedCount),
    },
    {
      label: "Published",
      value: String(publishedCount),
    },
  ];

  // ==========================================
  // QUICK ACTIONS CARDS
  // ==========================================
  const cards = [
    {
      title: "Submit Article",
      description:
        "Start a new manuscript submission with the guided multi-step workflow.",
      icon: FilePlus2,
      path: "/submitarticle",
    },
    {
      title: "View Articles",
      description:
        "Review and track all active journal submissions.",
      icon: FolderOpen,
      path: "/editor/articles",
    },
    {
      title: "Manage Reviewers",
      description:
        "Assign reviewers and monitor peer review progress.",
      icon: Users,
      path: "/reviewers",
    },
    {
      title: "Notifications",
      description:
        "Track submission updates, review requests, and editorial decisions.",
      icon: Bell,
      path: "/notifications",
    },
  ];

  // Get top 5 recently updated active submissions
  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt))
    .slice(0, 5);

  return (
    <AppLayout>
      <div>
        {/* ===== PAGE HEADER ===== */}
        <div style={{
          borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "28px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              fontSize: "12px", fontWeight: "700", letterSpacing: ".6px", textTransform: "uppercase",
              color: "var(--primary)", fontFamily: "var(--font-sans)", marginBottom: "6px",
            }}>Editor Dashboard</div>
            <h1 style={{
              fontFamily: "var(--font-serif)", fontSize: "clamp(24px, 3vw, 34px)",
              color: "var(--navy)", margin: 0, fontWeight: "600",
            }}>Editorial Workbench</h1>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/submitarticle")}
              style={{
                background: "var(--blue)", color: "#fff", border: "none", borderRadius: "4px",
                padding: "9px 20px", fontSize: "14px", fontWeight: "600",
                fontFamily: "var(--font-sans)", cursor: "pointer", transition: "background .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--blue-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--blue)"; }}
            >
              Submit Article
            </button>
            <button
              onClick={() => navigate("/editor/articles")}
              style={{
                background: "#fff", color: "var(--navy-mid)", border: "1px solid var(--border)",
                borderRadius: "4px", padding: "9px 20px", fontSize: "14px", fontWeight: "600",
                fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >
              View All Articles
            </button>
          </div>
        </div>

        {/* ===== STATS ROW ===== */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))",
          gap: "1px", background: "var(--border)",
          border: "1px solid var(--border)", borderRadius: "8px",
          overflow: "hidden", marginBottom: "32px",
        }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{
              background: "#fff", padding: "20px 18px",
              borderLeft: stat.label === "Submitted" ? "3px solid var(--blue)" :
                          stat.label === "Under Review" ? "3px solid #C14B00" :
                          stat.label === "Accepted" ? "3px solid #1A7A38" : "3px solid #5E2DA0",
            }}>
              <div style={{
                fontSize: "11px", fontWeight: "700", letterSpacing: ".5px",
                textTransform: "uppercase", color: "var(--text-muted)",
                fontFamily: "var(--font-sans)", marginBottom: "8px",
              }}>{stat.label}</div>
              {loading ? (
                <div style={{ height: "32px", width: "48px", background: "#EFF4F9", borderRadius: "4px" }} />
              ) : (
                <div style={{
                  fontFamily: "var(--font-serif)", fontSize: "34px", fontWeight: "700",
                  color: "var(--navy)", lineHeight: 1,
                }}>{stat.value}</div>
              )}
            </div>
          ))}
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>

          {/* RECENT SUBMISSIONS */}
          <div className="card-surface" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{
                  fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                  letterSpacing: ".5px", color: "var(--text-muted)", fontFamily: "var(--font-sans)",
                  marginBottom: "2px",
                }}>Active Queue</div>
                <h2 style={{
                  fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--navy)",
                  margin: 0, fontWeight: "600",
                }}>Recent Submissions</h2>
              </div>
              <button
                onClick={() => navigate("/editor/articles")}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  color: "var(--blue)", fontSize: "13px", fontWeight: "600",
                  fontFamily: "var(--font-sans)", background: "none", border: "none",
                  cursor: "pointer",
                }}
              >
                View All <ChevronRight size={15} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
                <Loader2 style={{ color: "var(--blue)", animation: "spin 1s linear infinite", width: "28px", height: "28px" }} />
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "48px", textAlign: "center", color: "var(--text-muted)",
              }}>
                <BookOpen size={40} style={{ marginBottom: "12px", opacity: .4 }} />
                <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "14px" }}>
                  No active submissions in the queue.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
                <thead>
                  <tr style={{ background: "var(--bg-light)", borderBottom: "1px solid var(--border)" }}>
                    {["Manuscript", "Author", "Status", "Action"].map(h => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left", fontSize: "11px",
                        fontWeight: "700", letterSpacing: ".5px", textTransform: "uppercase",
                        color: "var(--text-muted)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub, idx) => {
                    const subId = sub.id;
                    const showAssign = sub.status === 'submitted' || sub.status === 'under_editor_review';
                    const showReports = sub.status === 'under_peer_review' || sub.status === 'minor_revision' || sub.status === 'major_revision';
                    const badgeClass =
                      sub.status === 'accepted' || sub.status === 'published' ? 'badge badge-green' :
                      sub.status === 'rejected' ? 'badge badge-red' :
                      sub.status === 'under_peer_review' || sub.status === 'minor_revision' || sub.status === 'major_revision' ? 'badge badge-orange' :
                      'badge badge-blue';

                    return (
                      <tr key={subId} style={{
                        borderBottom: "1px solid var(--border-light)",
                        background: idx % 2 === 0 ? "#fff" : "var(--bg-light)",
                      }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{
                            fontFamily: "var(--font-sans)", fontWeight: "600",
                            color: "var(--navy)", fontSize: "14px",
                            maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {sub.title || "Untitled"}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {sub.article_type_data?.name || sub.article_type?.name || "Article"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                          {sub.author_name || sub.author?.email || "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={badgeClass}>
                            {sub.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {showAssign && (
                            <button
                              onClick={() => navigate(`/editor/assign-reviewers/${subId}`)}
                              style={{
                                background: "var(--blue)", color: "#fff", border: "none",
                                borderRadius: "3px", padding: "5px 12px",
                                fontSize: "12px", fontWeight: "600", fontFamily: "var(--font-sans)",
                                cursor: "pointer",
                              }}
                            >
                              Assign Reviewers
                            </button>
                          )}
                          {showReports && (
                            <button
                              onClick={() => navigate(`/submission/${subId}/reports`)}
                              style={{
                                background: "#E6F4EC", color: "#1A7A38", border: "1px solid #A5D9B8",
                                borderRadius: "3px", padding: "5px 12px",
                                fontSize: "12px", fontWeight: "600", fontFamily: "var(--font-sans)",
                                cursor: "pointer",
                              }}
                            >
                              View Reports
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* QUICK ACTIONS SIDE PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card-surface" style={{ padding: "0", overflow: "hidden" }}>
              <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border)",
                background: "var(--bg-light)",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-serif)", fontSize: "16px",
                  color: "var(--navy)", margin: 0, fontWeight: "600",
                }}>Quick Actions</h3>
              </div>
              <div style={{ padding: "8px" }}>
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      onClick={() => navigate(card.path)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "12px",
                        padding: "11px 12px", borderRadius: "4px", border: "none",
                        background: "transparent", cursor: "pointer", textAlign: "left",
                        transition: "background .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "6px",
                        background: "#E5F0FB", display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={17} style={{ color: "var(--blue)" }} />
                      </div>
                      <div>
                        <div style={{
                          fontSize: "14px", fontWeight: "600", color: "var(--navy)",
                          fontFamily: "var(--font-sans)",
                        }}>{card.title}</div>
                        <div style={{
                          fontSize: "12px", color: "var(--text-muted)",
                          fontFamily: "var(--font-sans)", marginTop: "1px",
                          lineHeight: "1.4",
                        }}>{card.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
