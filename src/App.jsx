import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Notifications from "./components/Notification";
import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";

// ==========================================
// AUTHOR PAGES
// ==========================================
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SubmitArticle from "./pages/SubmitArticle";
import About from "./pages/About";
import ArticlePreviewPage from "./pages/ArticlePreviewPage";
import ArticlesPage from "./pages/Articlepage";
import ProfilePage from "./pages/ProfilePage";
import Journals from "./pages/Journals";
import Reviews from "./pages/Reviews";
import RevisionPage from "./pages/RevisionPage";
import ReviewSubmissionPage from "./pages/ReviewSubmissionPage";

// ==========================================
// EDITOR PAGES
// ==========================================
import EditorLogin from "./pages/Editor/EditorLogin";
import EditorHome from "./pages/Editor/EditorHome";
// import Reviewers from "./pages/Editor/Reviewers";
import AssignReviewers from "./pages/Editor/AssignReviewers";
import ReviewReportsPage from "./pages/ReviewReportsPage";
import UserManagement from "./pages/Editorial Manager/UserManagement";
import JournalSettings from "./pages/Editorial Manager/JournalSettings";
import ManagerLogin from "./pages/Editorial Manager/ManagerLogin";
import EditorialManagerDashboard from "./pages/Editorial Manager/EditorialManagerDashboard";
import TrackArticle from "./pages/TrackArticle";

// ==========================================
// SUPER ADMIN PAGES
// ==========================================
import SuperAdminLogin from "./pages/SuperAdmin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";

// ==========================================
// HELPERS
// ==========================================
function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!getCurrentUser();
}

// 1. New dedicated isManager check
function isManager(user) {
  const role = user?.primary_role || user?.role;
  return (
    role === "editorial_manager" ||
    role === "super_admin" ||
    user?.is_editorial_manager ||
    user?.is_super_admin ||
    user?.is_superuser
  );
}

function isSuperAdmin(user) {
  return !!(
    user?.is_super_admin ||
    user?.primary_role === "super_admin" ||
    user?.role === "super_admin"
  );
}

function isEditor(user) {
  const role = user?.primary_role || user?.role;
  return (
    role === "editor" ||
    role === "editorial_manager" || // Managers usually have editor access too
    role === "super_admin" ||
    user?.is_editor ||
    user?.is_editorial_manager ||
    user?.is_super_admin
  );
}

function isReviewer(user) {
  return !!(
    user?.is_reviewer === true ||
    user?.role === "reviewer" ||
    user?.primary_role === "reviewer"
  );
}

// ==========================================
// PROTECTED ROUTE
// ==========================================
function ProtectedRoute({
  children,
  requireReviewer = false,
  requireEditor = false,
  requireManager = false,
  requireSuperAdmin = false,
}) {
  const user = getCurrentUser();

  // Not logged in
  if (!user || !isAuthenticated()) {
    return (
      <Navigate
        to={
          requireSuperAdmin ? "/x9-admin"
            : requireManager ? "/manager/login"
              : requireEditor ? "/editor/login"
                : "/login"
        }
        replace
      />
    );
  }

  // Super Admin only pages
  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  // Manager-only pages 
  if (requireManager && !isManager(user)) {
    return <Navigate to="/editor/home" replace />;
  }

  // Editor-only pages: if the route is for editors, but the user is actually a manager, forcefully redirect them to the manager dashboard
  if (requireEditor && !requireManager && isManager(user)) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  // Editor-only pages
  if (requireEditor && !requireManager && !isEditor(user)) {
    return <Navigate to="/login" replace />;
  }

  // Reviewer-only pages
  if (requireReviewer && !isReviewer(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ==========================================
// PUBLIC-ONLY ROUTE
// Routes logged-in users to their correct dashboard
// ==========================================
function PublicOnlyRoute({ children }) {
  const user = getCurrentUser();

  // Not logged in → allow access to the login page
  if (!user) {
    return children;
  }

  // Already logged in → Redirect based on highest role
  if (isManager(user)) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  if (isEditor(user)) {
    return <Navigate to="/editor/home" replace />;
  }

  // Default Fallback (Author/Reviewer Dashboard)
  return <Navigate to="/" replace />;
}

// ==========================================
// HOME ROUTE WITH AUTO-REDIRECT FOR LOGGED-IN USERS
// ==========================================
function HomeRoute() {
  const user = getCurrentUser();

  if (user && isAuthenticated()) {
    if (isManager(user)) {
      return <Navigate to="/manager/dashboard" replace />;
    }
    if (isEditor(user)) {
      return <Navigate to="/editor/home" replace />;
    }
    // Reviewers and Authors stay on the public home page
  }

  return <HomePage />;
}

// ==========================================
// APP
// ==========================================
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ==========================================
            PUBLIC ROUTES
        ========================================== */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/about" element={<About />} />
        <Route path="/journals" element={<Journals />} />
        <Route path="/article/:id" element={<ArticlePreviewPage />} />
        <Route path="/article-preview/:id" element={<ArticlePreviewPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ==========================================
            LOGIN ROUTES (Simplified)
        ========================================== */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/editor/login"
          element={
            <PublicOnlyRoute>
              <EditorLogin />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/manager/login"
          element={
            <PublicOnlyRoute>
              <ManagerLogin />
            </PublicOnlyRoute>
          }
        />

        {/* ==========================================
            SUPER ADMIN ROUTES (secret URL — not linked anywhere)
        ========================================== */}
        {/* Login page: no PublicOnlyRoute wrapper — keep it invisible */}
        <Route path="/x9-admin" element={<SuperAdminLogin />} />
        <Route path="/x9-admin/*" element={<SuperAdminLogin />} />
        <Route
          path="/x9-admin/dashboard/*"
          element={
            <ProtectedRoute requireSuperAdmin>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==========================================
            AUTHOR ROUTES
        ========================================== */}
        <Route
          path="/submitarticle"
          element={<ProtectedRoute><SubmitArticle /></ProtectedRoute>}
        />
        <Route
          path="/articles"
          element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />

        {/* ==========================================
            REVIEWER ROUTES
        ========================================== */}
        <Route
          path="/revisions"
          element={<ProtectedRoute requireReviewer><RevisionPage /></ProtectedRoute>}
        />
        <Route
          path="/review-submission/:id"
          element={<ProtectedRoute requireReviewer><ReviewSubmissionPage /></ProtectedRoute>}
        />
        <Route
          path="/reviewer/article-preview/:id"
          element={<ProtectedRoute requireReviewer><ArticlePreviewPage /></ProtectedRoute>}
        />
        <Route
          path="/reviewer/article/:id"
          element={<ProtectedRoute requireReviewer><ArticlePreviewPage /></ProtectedRoute>}
        />

        {/* ==========================================
            EDITOR ROUTES
        ========================================== */}
        <Route
          path="/editor/home"
          element={<ProtectedRoute requireEditor><EditorHome /></ProtectedRoute>}
        />
        <Route
          path="/editor/articles"
          element={<ProtectedRoute requireEditor><ArticlesPage /></ProtectedRoute>}
        />
        <Route
          path="/editor/reviews"
          element={<ProtectedRoute requireEditor><Reviews /></ProtectedRoute>}
        />
        {/* <Route
          path="/reviewers"
          element={<ProtectedRoute requireEditor><Reviewers /></ProtectedRoute>}
        /> */}
        <Route
          path="/submission/:submissionId/reports"
          element={<ProtectedRoute requireEditor><ReviewReportsPage /></ProtectedRoute>}
        />
        <Route
          path="/editor/assign-reviewers/:id"
          element={<ProtectedRoute requireEditor><AssignReviewers /></ProtectedRoute>}
        />
        <Route
          path="/editor/article-preview/:id"
          element={<ProtectedRoute requireEditor><ArticlePreviewPage /></ProtectedRoute>}
        />
        <Route
          path="/editor/article/:id"
          element={<ProtectedRoute requireEditor><ArticlePreviewPage /></ProtectedRoute>}
        />

        {/* ==========================================
            MANAGER ROUTES
        ========================================== */}
        <Route
          path="/manager/users"
          element={<ProtectedRoute requireManager><UserManagement /></ProtectedRoute>}
        />
        <Route
          path="/manager/settings"
          element={<ProtectedRoute requireManager><JournalSettings /></ProtectedRoute>}
        />
        <Route
          path="/manager/dashboard"
          element={<ProtectedRoute requireManager><EditorialManagerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/manager/articles"
          element={<ProtectedRoute requireManager><ArticlesPage /></ProtectedRoute>}
        />
        <Route
          path="/manager/reviews"
          element={<ProtectedRoute requireManager><Reviews /></ProtectedRoute>}
        />
        {/* <Route
          path="/manager/reviewers"
          element={<ProtectedRoute requireManager><Reviewers /></ProtectedRoute>}
        /> */}
        <Route
          path="/manager/assign-reviewers/:id"
          element={<ProtectedRoute requireManager><AssignReviewers /></ProtectedRoute>}
        />
        <Route
          path="/manager/submission/:submissionId/reports"
          element={<ProtectedRoute requireManager><ReviewReportsPage /></ProtectedRoute>}
        />
        <Route
          path="/manager/track"
          element={<ProtectedRoute requireManager><TrackArticle /></ProtectedRoute>}
        />
        <Route
          path="/manager/article-preview/:id"
          element={<ProtectedRoute requireManager><ArticlePreviewPage /></ProtectedRoute>}
        />
        <Route
          path="/manager/article/:id"
          element={<ProtectedRoute requireManager><ArticlePreviewPage /></ProtectedRoute>}
        />

        {/* ==========================================
            FALLBACK
        ========================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

// ==========================================
// APP
// ==========================================
export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}