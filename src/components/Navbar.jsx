// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  FilePlus2,
  FolderOpen,
  Users,
  Bell,
  LogOut,
  UserRound,
  AlertTriangle,
  ChevronDown,
  KeyRound,
  Menu,
  X,
  Settings,
  Search,
} from "lucide-react";
import logo from "../assets/logo.png";
import notificationService from "../services/notificationService";
import authService from "../services/authService";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Reference to close profile menu when clicking outside
  const profileMenuRef = useRef(null);

  // Get current logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

  // Current user role
  const role =
    currentUser?.role ||
    currentUser?.primary_role ||
    "author";

  // Check if user is editor/admin type
  const isEditorialUser =
    role === "editor" ||
    role === "editorial_manager" ||
    role === "super_admin" ||
    currentUser?.is_editor ||
    currentUser?.is_editorial_manager ||
    currentUser?.is_superuser;

  // ==========================================
  // CLICK OUTSIDE TO CLOSE PROFILE MENU
  // ==========================================
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // DYNAMIC NOTIFICATIONS SYNC
  // ==========================================
  useEffect(() => {
    if (!currentUser) return;

    async function fetchUnreadNotifications() {
      try {
        const { unreadCount, roleChanged } = await notificationService.getUnreadStatus();
        setUnreadNotificationsCount(unreadCount);

        if (roleChanged && !showRoleChangeModal) {
          setShowRoleChangeModal(true);
          await notificationService.markAllRead();
        }
      } catch (err) {
        console.error("Failed syncing active unread badge count in navbar context:", err);
      }
    }

    fetchUnreadNotifications();

    const intervalRef = setInterval(fetchUnreadNotifications, 10000);
    return () => clearInterval(intervalRef);
  }, [currentUser, showRoleChangeModal]);

  // ==========================================
  // AUTO LOGOUT COUNTDOWN
  // ==========================================
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await authService.logout();
  };

  useEffect(() => {
    if (showRoleChangeModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showRoleChangeModal && countdown === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      confirmLogout();
    }
  }, [showRoleChangeModal, countdown]);

  // ==========================================
  // ADVANCED NOTIFICATION CLICK HANDLER
  // ==========================================
  const handleNotificationClick = async () => {
    navigate("/notifications");
    setIsMobileMenuOpen(false);

    if (unreadNotificationsCount > 0) {
      setUnreadNotificationsCount(0);
      try {
        await notificationService.markAllRead();
      } catch (error) {
        console.error("Failed to mark notifications as read in backend:", error);
      }
    }
  };

  // =========================
  // NAVIGATION ITEMS
  // =========================
  const isManagerOrAdmin =
    role === "editorial_manager" ||
    role === "super_admin" ||
    currentUser?.is_editorial_manager ||
    currentUser?.is_superuser;

  const authorNavItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Submit Article", path: "/submitarticle", icon: FilePlus2 },
    { label: "My Articles", path: "/articles", icon: FolderOpen },
    { label: "Journals", path: "/journals", icon: FolderOpen },
    ...(currentUser?.want_to_be_reviewer ||
      currentUser?.is_reviewer ||
      currentUser?.role === "reviewer" ||
      currentUser?.primary_role === "reviewer"
      ? [{ label: "Revisions", path: "/revisions", icon: Users }]
      : []),
  ];

  // FIX: Updated paths to match App.jsx manager routes
  const editorNavItems = [
    { label: "Dashboard", path: isManagerOrAdmin ? "/manager/dashboard" : "/editor/home", icon: Home },
    ...(!isManagerOrAdmin ? [
      { label: "Submit Article", path: "/submitarticle", icon: FilePlus2 },
      { label: "My Articles", path: "/articles", icon: FolderOpen },
    ] : []),
    { label: "All Articles", path: isManagerOrAdmin ? "/manager/articles" : "/editor/articles", icon: FolderOpen },
    { label: "Reviews", path: isManagerOrAdmin ? "/manager/reviews" : "/editor/reviews", icon: Users },
    ...(isManagerOrAdmin
      ? [
        { label: "Track Article", path: "/manager/track", icon: Search },
        { label: "Users", path: "/manager/users", icon: Users },
        { label: "Settings", path: "/manager/settings", icon: Settings },
      ]
      : []),
  ];

  const navItems = isEditorialUser ? editorNavItems : authorNavItems;

  const getHomePath = () => {
    if (isManagerOrAdmin) return "/manager/dashboard";
    return isEditorialUser ? "/editor/home" : "/";
  };

  // =========================
  // HANDLERS
  // =========================
  const handleLogout = () => {
    setShowLogoutModal(true);
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  };

  const cancelLogout = () => setShowLogoutModal(false);

  const handleProfile = () => {
    navigate("/profile");
    setShowProfileMenu(false);
  };

  const handleChangePassword = () => {
    navigate("/forgot-password");
    setShowProfileMenu(false);
  };

  const handleNavClick = (item) => {
    if (item.label === "Home" || item.label === "Dashboard") {
      navigate(getHomePath());
    } else {
      navigate(item.path);
    }
    setIsMobileMenuOpen(false);
  };

  // Helper to check active state accurately for home dashboards and sub-routes
  const isRouteActive = (itemPath) => {
    if (itemPath === "/" && location.pathname === "/") return true;
    if (itemPath === "/editor/home" && location.pathname === "/editor/home") return true;
    if (itemPath === "/manager/dashboard" && location.pathname === "/manager/dashboard") return true;

    // For all other routes, check if the current pathname starts with the item path
    if (
      itemPath !== "/" &&
      itemPath !== "/editor/home" &&
      itemPath !== "/manager/dashboard" &&
      location.pathname.startsWith(itemPath)
    ) {
      return true;
    }
    return false;
  };

  /* ===== INLINE STYLE HELPERS ===== */
  const navBtnBase = {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "4px", fontSize: "14px",
    fontWeight: "500", fontFamily: "var(--font-sans)",
    cursor: "pointer", border: "none", background: "transparent",
    color: "var(--navy-mid)", transition: "all .15s",
    textDecoration: "none", whiteSpace: "nowrap",
  };

  return (
    <>
      {/* ===== TOP BRAND STRIP ===== */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: "100%", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "64px",
        }}>
          {/* Brand */}
          <div
            onClick={() => navigate(getHomePath())}
            style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", textDecoration: "none" }}
          >
            <img src={logo} alt="Journal" style={{ width: "44px", height: "44px", objectFit: "contain" }} />
            <div>
              <div style={{
                fontFamily: "var(--font-serif)", fontSize: "18px", fontWeight: "600",
                color: "var(--navy)", lineHeight: "1.25",
              }}>
                Journal of Biomedical
              </div>
              <div style={{
                fontFamily: "var(--font-serif)", fontSize: "14px", color: "var(--text-secondary)",
                lineHeight: "1.25",
              }}>
                Signal and Image Processing
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Notifications */}
            {currentUser && (
              <button
                onClick={handleNotificationClick}
                style={{
                  position: "relative", background: "transparent", border: "none",
                  width: "38px", height: "38px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--navy)", transition: "all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <Bell size={17} />
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    position: "absolute", top: "-5px", right: "-5px",
                    background: "var(--primary)", color: "#fff",
                    borderRadius: "50%", width: "17px", height: "17px",
                    fontSize: "10px", fontWeight: "700", fontFamily: "var(--font-sans)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fff",
                  }}>
                    {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Login */}
            {!currentUser && (
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "var(--blue)", color: "#fff",
                  border: "none", borderRadius: "4px",
                  padding: "8px 20px", fontSize: "14px", fontWeight: "600",
                  fontFamily: "var(--font-sans)", cursor: "pointer", transition: "background .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--blue-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--blue)"; }}
              >
                Sign In
              </button>
            )}

            {/* Profile dropdown */}
            {currentUser && (
              <div style={{ position: "relative" }} ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    background: "var(--bg-alt)", border: "1px solid var(--border)",
                    borderRadius: "6px", padding: "6px 12px 6px 8px",
                    cursor: "pointer", transition: "all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E5F0FB"; e.currentTarget.style.borderColor = "#B6D2EF"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-alt)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: "var(--blue)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0",
                    fontSize: "13px", fontWeight: "700", fontFamily: "var(--font-sans)",
                  }}>
                    {(currentUser.full_name || currentUser.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.3" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--navy)", fontFamily: "var(--font-sans)", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentUser.full_name || currentUser.name || "User"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
                      {role.replace(/_/g, " ")}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0, transform: showProfileMenu ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>

                {/* Profile dropdown panel */}
                <div style={{
                  position: "absolute", right: "0", top: "calc(100% + 6px)",
                  width: "260px", background: "#fff",
                  border: "1px solid var(--border)", borderRadius: "8px",
                  boxShadow: "0 8px 28px rgba(27,42,59,0.14)",
                  zIndex: 200, overflow: "hidden",
                  opacity: showProfileMenu ? 1 : 0,
                  visibility: showProfileMenu ? "visible" : "hidden",
                  transform: showProfileMenu ? "translateY(0)" : "translateY(-4px)",
                  transition: "all .15s",
                }}>
                  {/* Profile header */}
                  <div style={{ background: "var(--navy)", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: "#fff", fontSize: "18px", fontWeight: "700", fontFamily: "var(--font-sans)",
                    }}>
                      {(currentUser.full_name || currentUser.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "#fff", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentUser.full_name || currentUser.name || "User"}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
                        {role.replace(/_/g, " ")}
                      </div>
                      {currentUser.email && (
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {currentUser.email}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Dropdown actions */}
                  {[
                    { label: "My Profile", icon: UserRound, action: handleProfile },
                    { label: "Change Password", icon: KeyRound, action: handleChangePassword },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={action} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "10px",
                      padding: "11px 16px", background: "transparent", border: "none",
                      color: "var(--navy-mid)", fontSize: "14px", fontFamily: "var(--font-sans)",
                      cursor: "pointer", transition: "background .15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <Icon size={16} style={{ color: "var(--text-muted)" }} />
                      {label}
                    </button>
                  ))}
                  <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                  <button onClick={handleLogout} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "11px 16px", background: "transparent", border: "none",
                    color: "#B52626", fontSize: "14px", fontFamily: "var(--font-sans)",
                    cursor: "pointer", transition: "background .15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FDF2F2"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <LogOut size={16} style={{ color: "#B52626" }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: "none", background: "none", border: "none",
                cursor: "pointer", color: "var(--navy-mid)", padding: "6px",
              }}
              className="md-hidden-show"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ===== NAVIGATION STRIP ===== */}
      <div style={{
        background: "var(--navy)",
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "3px solid var(--primary)",
      }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "stretch", overflowX: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                style={{
                  ...navBtnBase,
                  padding: "14px 16px",
                  borderRadius: "0",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.72)",
                  borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                  fontWeight: isActive ? "600" : "400",
                  fontSize: "13.5px",
                  marginBottom: "-3px",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.72)"; e.currentTarget.style.background = "transparent"; } }}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== MOBILE NAV ===== */}
      {isMobileMenuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "#fff", zIndex: 300, overflowY: "auto",
          padding: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "18px", fontWeight: "700", color: "var(--navy)" }}>Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--navy-mid)" }}>
              <X size={24} />
            </button>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "12px",
                    padding: "13px 16px", borderRadius: "6px", border: "none",
                    background: isActive ? "#E5F0FB" : "transparent",
                    color: isActive ? "var(--blue)" : "var(--navy-mid)",
                    fontSize: "15px", fontWeight: isActive ? "600" : "400",
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                    borderLeft: isActive ? "3px solid var(--blue)" : "3px solid transparent",
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ===== LOGOUT MODAL ===== */}
      {showLogoutModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(27,42,59,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: "#fff", borderRadius: "10px", padding: "40px",
            width: "100%", maxWidth: "420px", textAlign: "center",
            boxShadow: "0 20px 50px rgba(27,42,59,0.2)",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "#FDEEEE", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle size={26} style={{ color: "#B52626" }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--navy)", margin: "0 0 8px" }}>
              Sign Out
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.7", margin: "0 0 28px", fontFamily: "var(--font-sans)" }}>
              Are you sure you want to sign out of your account?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={cancelLogout}
                style={{
                  flex: 1, padding: "11px", border: "1px solid var(--border)",
                  borderRadius: "6px", background: "#fff", color: "var(--navy-mid)",
                  fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: "11px", border: "none",
                  borderRadius: "6px", background: "#B52626", color: "#fff",
                  fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#8F1E1E"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#B52626"; }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROLE CHANGE MODAL ===== */}
      {showRoleChangeModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          background: "rgba(27,42,59,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: "#fff", borderRadius: "10px", padding: "40px",
            width: "100%", maxWidth: "420px", textAlign: "center",
            boxShadow: "0 20px 50px rgba(27,42,59,0.2)",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "#FFF0E6", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle size={26} style={{ color: "#C14B00" }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--navy)", margin: "0 0 8px" }}>
              Account Role Updated
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.7", margin: 0, fontFamily: "var(--font-sans)" }}>
              Your account permissions have been changed by an administrator. You will be signed out in{" "}
              <strong style={{ color: "#B52626", fontSize: "17px" }}>{countdown}</strong> seconds.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
