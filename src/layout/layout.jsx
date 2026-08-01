// src/layout/layout.jsx
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function AppLayout({ children, fullWidth = false }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-light)" }}>
      <Navbar />
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        padding: fullWidth ? "0" : "32px 24px",
      }}>
        {children}
      </main>
      {/* Professional footer strip */}
      <footer style={{
        marginTop: "64px",
        borderTop: "1px solid var(--border)",
        background: "#fff",
        padding: "16px 32px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
        fontFamily: "var(--font-sans)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <span>© {new Date().getFullYear()} Journal of Biomedical Signal and Image Processing. All rights reserved.</span>
          <Link to="/about" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>About</Link>
        </div>
      </footer>
    </div>
  );
}