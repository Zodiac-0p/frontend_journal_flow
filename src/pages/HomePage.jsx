import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Upload, BookOpen, FileText, CheckCircle } from "lucide-react";
import AppLayout from "../layout/layout";

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: "Manuscript Submission",
      description: "Submit your research manuscripts with our structured multi-step workflow. Track every stage of the editorial process in real time.",
    },
    {
      icon: BookOpen,
      title: "Explore Journals",
      description: "Browse peer-reviewed articles published across engineering, biomedical, and interdisciplinary research domains.",
      action: () => navigate("/journals"),
    },
    {
      icon: FileText,
      title: "Peer Review System",
      description: "A rigorous, structured double-blind review process managed by a dedicated editorial board.",
    },
    {
      icon: CheckCircle,
      title: "Open Access",
      description: "Published articles are made available to the global academic community immediately upon acceptance.",
    },
  ];

  return (
    <AppLayout>
      {/* ===== HERO ===== */}
      <section style={{
        background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)",
        borderRadius: "8px", padding: "56px 48px", marginBottom: "40px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "4px", background: "var(--primary)",
        }} />

        <div style={{ maxWidth: "720px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)",
            borderRadius: "3px", padding: "4px 12px",
            color: "#FF9A4D", fontSize: "12px", fontWeight: "700",
            letterSpacing: ".6px", textTransform: "uppercase",
            fontFamily: "var(--font-sans)", marginBottom: "20px",
          }}>
            Open Access Journal
          </div>

          <h1 style={{
            fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 46px)",
            color: "#fff", fontWeight: "600", lineHeight: "1.2",
            margin: "0 0 20px", letterSpacing: "-.3px",
          }}>
            Advancing Research in Biomedical<br />Signal and Image Processing
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.72)", fontSize: "17px", lineHeight: "1.75",
            margin: "0 0 36px", fontFamily: "var(--font-sans)",
          }}>
            A peer-reviewed journal dedicated to high-quality research in biomedical engineering,
            signal processing, and medical imaging — from submission to global publication.
          </p>

          {/* Search bar */}
          <div style={{
            background: "#fff", borderRadius: "4px",
            display: "flex", alignItems: "center",
            padding: "0 16px", marginBottom: "28px",
            maxWidth: "560px", height: "48px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
            <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search articles, keywords, authors…"
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: "14px", padding: "0 12px",
                color: "var(--text-primary)", background: "transparent",
                fontFamily: "var(--font-sans)",
              }}
            />
            <button style={{
              background: "var(--blue)", color: "#fff",
              border: "none", borderRadius: "3px",
              padding: "6px 14px", fontSize: "13px", fontWeight: "600",
              fontFamily: "var(--font-sans)", cursor: "pointer",
            }}>
              Search
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/journals")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "var(--primary)", color: "#fff",
                border: "none", borderRadius: "4px",
                padding: "12px 24px", fontSize: "14px", fontWeight: "600",
                fontFamily: "var(--font-sans)", cursor: "pointer",
                transition: "background .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-dark)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--primary)"; }}
            >
              Browse Published Articles <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/submitarticle")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.35)", borderRadius: "4px",
                padding: "12px 24px", fontSize: "14px", fontWeight: "500",
                fontFamily: "var(--font-sans)", cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              Submit Your Manuscript
            </button>
          </div>
        </div>
      </section>

      {/* ===== QUICK STATS ===== */}
      <section style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
        gap: "1px", background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "8px",
        overflow: "hidden", marginBottom: "40px",
      }}>
        {[
          { value: "100+", label: "Articles Published" },
          { value: "50+", label: "Peer Reviewers" },
          { value: "30+", label: "Countries Reached" },
          { value: "2024", label: "Publishing Since" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "#fff", padding: "24px 20px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-serif)", fontSize: "32px", fontWeight: "700",
              color: "var(--navy)", lineHeight: 1,
            }}>{stat.value}</div>
            <div style={{
              color: "var(--text-muted)", fontSize: "13px", marginTop: "6px",
              fontFamily: "var(--font-sans)",
            }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ===== FEATURES ===== */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{
          fontFamily: "var(--font-serif)", fontSize: "26px", color: "var(--navy)",
          margin: "0 0 24px", fontWeight: "600",
          paddingBottom: "12px", borderBottom: "2px solid var(--border)",
        }}>
          Journal Services
        </h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "20px",
        }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                onClick={f.action}
                className="card-surface"
                style={{
                  padding: "24px", cursor: f.action ? "pointer" : "default",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "6px",
                  background: "#E5F0FB", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={20} style={{ color: "var(--blue)" }} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--navy)",
                    margin: "0 0 6px", fontWeight: "600",
                  }}>{f.title}</h3>
                  <p style={{
                    color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.65",
                    margin: 0, fontFamily: "var(--font-sans)",
                  }}>{f.description}</p>
                </div>
                {f.action && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    color: "var(--blue)", fontSize: "13px", fontWeight: "600",
                    fontFamily: "var(--font-sans)", marginTop: "4px",
                  }}>
                    Learn more <ArrowRight size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}