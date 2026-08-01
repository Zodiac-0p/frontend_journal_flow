import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert, Lock, KeyRound, Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import superAdminService from "../../services/superAdminService";

export default function SuperAdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [showKey, setShowKey]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [attempts, setAttempts]   = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !secretKey.trim()) {
      setError("All three fields are required.");
      return;
    }

    if (attempts >= 3) {
      setError("Too many failed attempts. Please wait before trying again.");
      return;
    }

    try {
      setLoading(true);
      await superAdminService.login(email, password, secretKey);
      toast.success("Super Admin authenticated.");
      navigate("/x9-admin/dashboard", { replace: true });
    } catch {
      setAttempts((prev) => prev + 1);
      // Always show generic message — never reveal which field failed
      setError("Invalid credentials or access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 font-sans">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px),
                            linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-[420px]"
      >
        {/* Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-600/30 via-orange-500/20 to-red-600/30 blur-xl" />

        <div className="relative bg-[#0d1327] border border-red-900/40 rounded-2xl p-8">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-700/50 flex items-center justify-center mb-4">
              <ShieldAlert size={26} className="text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              System Control Access
            </h1>
            <p className="text-red-400/70 text-xs mt-1 text-center">
              Restricted — Authorized Personnel Only
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 bg-red-950/60 border border-red-700/50 rounded-lg text-red-300 text-xs flex items-start gap-2"
            >
              <Lock size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  id="sa-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg pl-9 pr-4 text-[13px] text-white placeholder-slate-600 outline-none focus:border-red-700/70 transition-colors"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  id="sa-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg pl-9 pr-10 text-[13px] text-white placeholder-slate-600 outline-none focus:border-red-700/70 transition-colors"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                System Access Key
              </label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  id="sa-secret-key"
                  type={showKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg pl-9 pr-10 text-[13px] text-white placeholder-slate-600 outline-none focus:border-red-700/70 transition-colors"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || attempts >= 3}
              className="w-full h-11 mt-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldAlert size={15} />
                  Authenticate
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-700 mt-6">
            This session is monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
