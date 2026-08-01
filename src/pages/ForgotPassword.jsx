import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
Mail, Eye, EyeOff,
  ArrowLeft, Loader2, CheckCircle2
} from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if a logged-in user came here via "Change Password" menu
  const storedUser = (() => {
    try {
      const sessionUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (sessionUser && sessionUser.email) return sessionUser;
      const localUser = JSON.parse(localStorage.getItem("currentUser"));
      if (localUser && localUser.email) return localUser;
      return {};
    } catch { return {}; }
  })();
  const isLoggedInFlow = !!storedUser?.email;

  // Step 1 = enter/confirm email + send OTP
  // Step 2 = enter OTP + new password
  // Step 3 = success
  // For logged-in users: start on step 1 with email pre-filled — user still clicks Send OTP manually
  // (auto-sending hits Django's rate limiter immediately on mount)
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(
    location.state?.email || storedUser?.email || ""
  );
  const [otpSent, setOtpSent] = useState(false);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (targetEmail) => {
    setLoading(true);
    try {
      const res = await api.post("/accounts/forgot-password/", {
        email: targetEmail.trim().toLowerCase(),
      });
      toast.success(res.data.message || "OTP sent to your email.");
      setOtpSent(true);
      setStep(2);
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Failed to send OTP. Try again."
      );
      // If auto-send failed, fall back to manual email entry
      if (isLoggedInFlow) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 1: Manually send OTP ──────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email."); return; }
    await sendOtp(email);
  };

  // ── STEP 2: Reset Password ─────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { toast.error("Please enter the OTP."); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.post("/accounts/reset-password/", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setStep(3);
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.otp?.[0] ||
        data?.error ||
        data?.new_password?.[0] ||
        "Failed to reset password. Check your OTP and try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    await sendOtp(email);
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans">
      <div className="w-full max-w-[440px]">

        {/* Card */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-8 space-y-6">

            {step === 1 && (
              <>
                <div className="space-y-1 mb-6">
                  <h1 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">
                    {isLoggedInFlow ? "Change Password" : "Forgot Password"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {isLoggedInFlow
                      ? <>We'll send a one-time code to <span className="font-semibold text-slate-700">{email}</span> to verify it's you.</>  
                      : "Enter your registered email and we'll send you a one-time code to reset your password."
                    }
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        readOnly={isLoggedInFlow}
                        className={`w-full h-11 pl-11 pr-4 text-[13px] border border-slate-200 rounded-sm focus:outline-none focus:border-[#1a3a5c] transition-all ${
                          isLoggedInFlow ? "bg-slate-50 text-slate-500 cursor-default" : ""
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#1a3a5c] hover:bg-[#11263c] text-white font-semibold text-sm rounded-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm mt-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </form>

                <button
                  onClick={() => isLoggedInFlow ? navigate(-1) : navigate("/login")}
                  className="flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 transition mt-4"
                >
                  <ArrowLeft size={14} /> {isLoggedInFlow ? "Cancel" : "Back to Login"}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1 mb-6">
                  <h1 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">
                    {isLoggedInFlow ? "Change Password" : "Reset Password"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {loading && !otpSent
                      ? "Sending OTP to your email..."
                      : <>A 6-digit code was sent to <span className="font-semibold text-slate-700">{email}</span>. Enter it below with your new password.</>
                    }
                  </p>
                </div>

                {(!loading || otpSent) && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* OTP */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">6-Digit OTP</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="_ _ _ _ _ _"
                        className="w-full h-12 px-4 text-center text-lg font-bold tracking-[0.4em] border border-slate-200 rounded-sm focus:outline-none focus:border-[#1a3a5c] transition-all"
                        required
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full h-11 pl-4 pr-10 text-[13px] border border-slate-200 rounded-sm focus:outline-none focus:border-[#1a3a5c] transition-all"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className={`w-full h-11 pl-4 pr-10 text-[13px] border rounded-sm focus:outline-none transition-all ${
                            confirmPassword && newPassword !== confirmPassword
                              ? "border-red-400 focus:border-red-400"
                              : "border-slate-200 focus:border-[#1a3a5c]"
                          }`}
                          required
                        />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[11px] text-red-500 font-medium">Passwords do not match</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-[#1a3a5c] hover:bg-[#11263c] text-white font-semibold text-sm rounded-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm mt-2"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      {loading ? "Saving..." : isLoggedInFlow ? "Change Password" : "Reset Password"}
                    </button>
                  </form>
                )}

                <div className="flex items-center justify-between pt-1">
                  {!isLoggedInFlow && (
                    <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-600 transition">
                      <ArrowLeft size={14} /> Change email
                    </button>
                  )}
                  {isLoggedInFlow && (
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-600 transition">
                      <ArrowLeft size={14} /> Cancel
                    </button>
                  )}
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-[13px] text-[#1a3a5c] hover:underline font-medium disabled:opacity-50 ml-auto"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="text-center space-y-5 py-4">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-500" size={30} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif font-bold text-slate-800">
                    {isLoggedInFlow ? "Password Changed!" : "Password Reset!"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Your password has been updated successfully.{" "}
                    {isLoggedInFlow
                      ? "Please log in again with your new password."
                      : "You can now log in with your new password."
                    }
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                    sessionStorage.clear();
                    navigate("/login");
                  }}
                  className="w-full h-11 bg-[#1a3a5c] hover:bg-[#11263c] text-white font-semibold text-sm rounded-sm transition shadow-sm"
                >
                  Go to Login
                </button>
              </div>
            )}

          </div>

        {/* Step dots (only for non-logged-in forgot flow) */}
        {!isLoggedInFlow && step < 3 && (
          <div className="flex justify-center gap-2 mt-5">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? "w-6 bg-[#1a3a5c]" : "w-2 bg-slate-300"}`} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}