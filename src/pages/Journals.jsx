// src/pages/JournalExplorePage.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Calendar,
  User,
  BookOpen,
  Eye,
  Loader2,
  X,
  Download,
  Share2,
} from "lucide-react";

import AppLayout from "../layout/layout";

import axios from "axios";

const defaultHost = window.location.hostname || "127.0.0.1";
const PUBLIC_API =
  import.meta.env.VITE_API_URL || `http://${defaultHost}:8000/api`;
const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL || `http://${defaultHost}:8000`;

export default function JournalExplorePage() {
  // ==========================================
  // STATE
  // ==========================================

  const [articles, setArticles] =
    useState([]);

  const [selectedArticle, setSelectedArticle] = 
    useState(null);

  const [activeTab, setActiveTab] = useState("about");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // FETCH ARTICLES
  // ==========================================

  const fetchPublishedArticles =
    async () => {
      try {
        setLoading(true);

        setError("");

        const response =
          await axios.get(
            `${PUBLIC_API}/journals/submissions/published/`
          );

        const data =
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data
                .results || [];

        setArticles(data);
      } catch (err) {
        console.error(
          "Failed to fetch articles:",
          err
        );

        setError(
          "Unable to load published articles."
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

useEffect(() => {
  const loadData = async () => {
    await fetchPublishedArticles();
  };

  loadData();
}, []);

  // ==========================================
  // FILTERED ARTICLES
  // ==========================================

  const filteredArticles =
    useMemo(() => {
      const q =
        search
          .toLowerCase()
          .trim();

      if (!q) return articles;

      return articles.filter(
        (article) => {
          const title = (
            article.title || ""
          ).toLowerCase();

          const abstract = (
            article.abstract || ""
          ).toLowerCase();

          const subject = (
            article.subject_name ||
            article.subject
              ?.name ||
            ""
          ).toLowerCase();

          const author = (
            article.author_name ||
            article.author
              ?.full_name ||
            article.author
              ?.name ||
            ""
          ).toLowerCase();

          return (
            title.includes(q) ||
            abstract.includes(
              q
            ) ||
            subject.includes(
              q
            ) ||
            author.includes(q)
          );
        }
      );
    }, [search, articles]);

  // ==========================================
  // HELPERS
  // ==========================================

  const getAuthorName = (
    article
  ) => {
    return (
      article.author_name ||
      article.author
        ?.full_name ||
      article.author
        ?.name ||
      "Unknown Author"
    );
  };

  const getSubjectName = (
    article
  ) => {
    return (
      article.subject_name ||
      article.subject
        ?.name ||
      "General Research"
    );
  };

  const getPublishedDate = (
    article
  ) => {
    const date =
      article.updated_at ||
      article.created_at ||
      article.submitted_at;

    if (!date)
      return "Recently Published";

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const getFileUrl = (article) => {
    if (article.manuscript_file) return article.manuscript_file;
    if (article.submission_files && article.submission_files.length > 0) {
      const primaryDoc = article.submission_files.find(f => 
        f.file_type === 1 || 
        f.file_type_id === 1 || 
        (f.file_type && typeof f.file_type === 'object' && (f.file_type.id === 12 || f.file_type.id === 1 || f.file_type.is_required || f.file_type.name === "Manuscript"))
      ) || article.submission_files[0];
      
      const fileUrl = primaryDoc.file || "";
      if (!fileUrl) return null;
      return fileUrl.startsWith("http")
        ? fileUrl
        : `${BACKEND_ORIGIN}${fileUrl}`;
    }
    return null;
  }

  const openArticle = (
    article
  ) => {
    setSelectedArticle(article);
    setActiveTab("about");
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <AppLayout>
      <div className="px-2 py-4">
        {/* HERO */}

        {/* HERO — matches new navy/orange design system */}
        <div style={{
          background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)",
          borderRadius: "8px", padding: "36px 40px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--primary)" }} />
          <h1 style={{
            fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,36px)",
            color: "#fff", fontWeight: "600", margin: "0 0 10px",
          }}>Explore Journals</h1>
          <p style={{
            color: "rgba(255,255,255,0.72)", fontSize: "15px", lineHeight: "1.7",
            margin: "0 0 24px", fontFamily: "var(--font-sans)", maxWidth: "600px",
          }}>Discover published research articles, review groundbreaking studies, and explore the latest academic contributions.</p>
          <div style={{ position: "relative", maxWidth: "580px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, abstract, author, or subject…"
              style={{
                width: "100%", height: "42px", paddingLeft: "40px", paddingRight: "16px",
                border: "none", borderRadius: "4px", outline: "none",
                fontSize: "14px", fontFamily: "var(--font-sans)",
                color: "var(--text-primary)", background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* CONTENT */}

        <div style={{ marginTop: "28px" }}>
          {loading ? (
            <div className="card-surface" style={{ padding: "56px", textAlign: "center" }}>
              <Loader2 style={{ width: "32px", height: "32px", margin: "0 auto", color: "var(--blue)", animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "14px" }}>Loading articles…</p>
            </div>
          ) : error ? (
            <div className="card-surface" style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#B52626", fontFamily: "var(--font-sans)" }}>{error}</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="card-surface" style={{ padding: "56px", textAlign: "center" }}>
              <BookOpen size={40} style={{ margin: "0 auto", color: "var(--border)", display: "block" }} />
              <h3 style={{ marginTop: "16px", fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--navy)" }}>No Articles Found</h3>
              <p style={{ marginTop: "8px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "14px" }}>Try a different search term.</p>
            </div>
          ) : (
            <>
              {/* HEADER */}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--navy)", margin: 0, fontWeight: "600" }}>Published Articles</h2>
                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                  {
                    filteredArticles.length
                  }{" "}
                  article
                  {filteredArticles.length !==
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              {/* GRID */}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: "20px" }}>
                {filteredArticles.map((article) => (
                  <div key={article.id} className="card-surface" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                    {/* Subject badge */}
                    <span className="badge badge-blue" style={{ marginBottom: "14px", alignSelf: "flex-start" }}>
                      {getSubjectName(article)}
                    </span>

                    {/* Title */}
                    <h3 style={{
                      fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--navy)",
                      lineHeight: "1.5", margin: "0 0 10px", fontWeight: "600", textTransform: "capitalize"
                    }}>{article.title || "Untitled Article"}</h3>

                    {/* Abstract */}
                    <p style={{
                      color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.7",
                      margin: "0 0 16px", fontFamily: "var(--font-sans)",
                      display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden",
                      flex: 1,
                    }}>{article.abstract || "No abstract available."}</p>

                    {/* Meta */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        <User size={14} /><span>{getAuthorName(article)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        <Calendar size={14} /><span>{getPublishedDate(article)}</span>
                      </div>
                    </div>

                    {/* Keywords */}
                    {article.keywords && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                        {article.keywords.split(",").slice(0,5).map((kw, idx) => (
                          <span key={idx} style={{
                            padding: "2px 10px", borderRadius: "3px",
                            background: "var(--bg-alt)", color: "var(--text-secondary)",
                            fontSize: "11px", fontFamily: "var(--font-sans)",
                            border: "1px solid var(--border)",
                          }}>{kw.trim()}</span>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => openArticle(article)}
                      style={{
                        width: "100%", background: "var(--navy)", color: "#fff",
                        border: "none", borderRadius: "4px", height: "40px",
                        fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "8px", transition: "background .15s",
                        marginTop: "auto",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--blue)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "var(--navy)"; }}
                    >
                      <Eye size={16} /> Read Article
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FULL-SCREEN ARTICLE MODAL */}
      {selectedArticle && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "var(--bg-light)", overflowY: "auto" }}>
          {/* HEADER */}
          <div style={{ background: "var(--navy)", color: "#fff", position: "relative", borderBottom: "4px solid var(--primary)" }}>
            <button
              onClick={() => setSelectedArticle(null)}
              style={{
                position: "absolute", top: "20px", right: "24px",
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "4px",
                width: "36px", height: "36px", display: "flex", alignItems: "center",
                justifyContent: "center", color: "rgba(255,255,255,0.8)", cursor: "pointer",
                transition: "background .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              <X size={20} />
            </button>
            <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 64px 24px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".6px", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-sans)" }}>
                {getSubjectName(selectedArticle)}
              </span>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,38px)", color: "#fff", fontWeight: "600", margin: "10px 0 12px", lineHeight: "1.25", textTransform: "capitalize" }}>
                {selectedArticle.title || "Untitled Article"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", fontFamily: "var(--font-sans)", margin: "0 0 24px" }}>
                Authored by: <strong style={{ color: "#fff" }}>{getAuthorName(selectedArticle)}</strong>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {(() => {
                  const fileUrl = getFileUrl(selectedArticle);
                  if (fileUrl) return (
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "var(--primary)", color: "#fff",
                      borderRadius: "4px", padding: "9px 20px",
                      fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)",
                      textDecoration: "none",
                    }}><Download size={16} />Download Manuscript</a>
                  );
                  return (
                    <button disabled style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)",
                      border: "none", borderRadius: "4px", padding: "9px 20px",
                      fontSize: "14px", fontFamily: "var(--font-sans)", cursor: "not-allowed",
                    }}><Download size={16} />File Not Available</button>
                  );
                })()}
                <button style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(255,255,255,0.25)", borderRadius: "4px",
                  padding: "9px 18px", fontSize: "14px", fontFamily: "var(--font-sans)", cursor: "pointer",
                }}><Share2 size={16} />Share</button>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
            <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 64px", display: "flex", alignItems: "stretch", gap: "0" }}>
              {[["about","About the article"],["keywords","Keywords"],["authors","Author(s)"]].map(([tab,label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "14px 20px", border: "none", background: "transparent",
                    fontSize: "14px", fontWeight: activeTab === tab ? "700" : "400",
                    fontFamily: "var(--font-sans)",
                    color: activeTab === tab ? "var(--blue)" : "var(--text-secondary)",
                    borderBottom: activeTab === tab ? "3px solid var(--blue)" : "3px solid transparent",
                    cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
                    marginBottom: "-1px",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* CONTENT AREA */}
          <div style={{ flex: 1, background: "#fff" }}>
            <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 64px" }}>
              {activeTab === "about" && (
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--navy)", margin: "0 0 24px", fontWeight: "600" }}>About the article</h2>
                  <div style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "6px", padding: "20px", marginBottom: "28px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: "14px" }}>
                      {[{ label: "Published", value: getPublishedDate(selectedArticle) }, { label: "Subject Area", value: getSubjectName(selectedArticle) }, { label: "Access Type", value: "Open Access" }].map(({ label, value }) => (
                        <tr key={label} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "10px 16px 10px 0", fontWeight: "700", color: "var(--text-muted)", whiteSpace: "nowrap", width: "140px" }}>{label}</td>
                          <td style={{ padding: "10px 0", color: "var(--navy)" }}>{value}</td>
                        </tr>
                      ))}
                    </table>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--navy)", margin: "0 0 12px", fontWeight: "600" }}>Abstract</h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.85" }}>
                    {selectedArticle.abstract || "No abstract available for this manuscript."}
                  </p>
                </div>
              )}
              {activeTab === "keywords" && (
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--navy)", margin: "0 0 24px", fontWeight: "600" }}>Keywords</h2>
                  {selectedArticle.keywords ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {selectedArticle.keywords.split(",").map((k, i) => (
                        <span key={i} style={{
                          padding: "4px 14px", borderRadius: "3px",
                          background: "var(--bg-alt)", border: "1px solid var(--border)",
                          fontSize: "13px", color: "var(--navy-mid)", fontFamily: "var(--font-sans)",
                        }}>{k.trim()}</span>
                      ))}
                    </div>
                  ) : <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>No keywords provided.</p>}
                </div>
              )}
              {activeTab === "authors" && (
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--navy)", margin: "0 0 24px", fontWeight: "600" }}>Author(s)</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "6px", padding: "20px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "18px", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
                      {getAuthorName(selectedArticle).charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: "600", color: "var(--navy)" }}>{getAuthorName(selectedArticle)}</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>Lead Author / Submitting Author</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}