import { useState } from "react";
import { motion } from "framer-motion";
import { 
  useNavigate, useLocation 
} from "react-router-dom";
import { 
  Eye, EyeOff, ShieldCheck, AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";

import authService from "../../services/authService";
import AppLayout from "../../layout/layout";

export default function ManagerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }

    try {
      setLoading(true);
      const user = await authService.login(email.trim().toLowerCase(), password);

      // Verify Chief Editorial Manager / Admin Access
      const role = user?.primary_role || user?.role || "author";
      const isManager = role === "editorial_manager" || role === "super_admin" || user?.is_editorial_manager || user?.is_superuser;

      if (!isManager) {
        setError("This panel is restricted to Chief Editorial Managers and Administrators.");
        return;
      }

      toast.success("Manager authentication successful!");
      navigate("/manager/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError("Incorrect password");
      } else {
        const message = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Authentication failed. Please try again.";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="min-h-[calc(100vh-4rem)] flex flex-col bg-[#f8fafc] font-sans"
      >
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[440px] bg-white border border-slate-200 shadow-sm rounded-md p-8">
            <div className="mb-6">
              <div className="inline-flex bg-red-50 text-red-700 px-2 py-0.5 rounded-sm items-center gap-1.5 border border-red-100 mb-3">
                <ShieldCheck size={12} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Administrative Access</span>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-slate-800">Manager Console</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to manage active editorial processes and system configurations.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm flex items-start gap-2">
                <AlertTriangle size={15} className="mt-[2px] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Console Username / Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. administrator@journal.org"
                  className="w-full h-11 bg-white border border-slate-200 rounded-sm px-4 outline-none text-[13px] text-slate-800 focus:border-[#1a3a5c] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Security Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 bg-white border border-slate-200 rounded-sm px-4 pr-10 outline-none text-[13px] text-slate-800 focus:border-[#1a3a5c] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-[#1a3a5c] hover:bg-[#11263c] disabled:opacity-70 text-white rounded-sm text-sm font-semibold flex items-center justify-center transition-colors"
              >
                {loading ? "Verifying Credentials..." : "Authenticate & Continue"}
              </button>
            </form>
          </div>
        </main>
      </motion.div>
    </AppLayout>
  );
}
