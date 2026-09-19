// src/pages/LoginPage.jsx

import { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";
import authService from "../services/authService";
import { toast } from "react-hot-toast";

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-14 px-4 rounded-2xl border border-[#D9EAF7] focus:border-[#0077B6] focus:ring-4 focus:ring-[#0077B6]/10 outline-none transition-all ${className}`}
    />
  );
}

function PasswordInput({ value, onChange, placeholder, show, setShow }) {
  return (
    <div className="mt-4 flex items-center border border-[#D9EAF7] rounded-2xl px-4 h-14 focus-within:border-[#0077B6] focus-within:ring-4 focus-within:ring-[#0077B6]/10 transition-all">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        className="w-full outline-none bg-transparent"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-gray-500 hover:text-[#0077B6] transition"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [wantToBeReviewer, setWantToBeReviewer] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [selectedClassificationIds, setSelectedClassificationIds] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState(null);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState(0);
  const [otpTimerActive, setOtpTimerActive] = useState(false);
  const [fromUnverified, setFromUnverified] = useState(false);

  useEffect(() => {
    const loadClassifications = async () => {
      try {
        const response = await authService.getClassifications();
        const data =
          response?.results ||
          response?.data?.results ||
          response?.data ||
          response ||
          [];

        setClassifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load classifications:", err);
      }
    };

    loadClassifications();
  }, []);

  useEffect(() => {
    if (localStorage.getItem("session_closed_logout") === "true") {
      toast.error("You were logged out because the browser was closed.");
      localStorage.removeItem("session_closed_logout");
    }
  }, []);

  useEffect(() => {
    if (!otpTimerActive) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setOtpSecondsRemaining((prev) => {
        if (prev <= 1) {
          setOtpTimerActive(false);
          setError("Verification code expired. Please resend a new code.");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpTimerActive]);

  const formatOtpCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const startOtpTimer = () => {
    setOtpSecondsRemaining(600);
    setOtpTimerActive(true);
  };

  const redirectByRole = (user) => {
    const stringRole = String(user?.role || user?.primary_role || "author").toLowerCase().trim();
    const isManager =
      user?.is_editorial_manager ||
      user?.is_superuser ||
      stringRole === "editorial_manager" ||
      stringRole === "super_admin";

    if (isManager) {
      navigate("/manager/dashboard", { replace: true });
      return;
    }

    const isEditorFlag =
      user?.is_editor ||
      user?.is_staff ||
      stringRole === "editor" ||
      stringRole === "staff";

    if (isEditorFlag) {
      navigate("/editor/home", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const saveLocalUser = (user, fallbackName = "") => {
    const verifiedRoleString =
      user?.is_editor || user?.is_staff
        ? "editor"
        : user?.is_reviewer || user?.want_to_be_reviewer
          ? "reviewer"
          : "author";

    const storedUser = {
      id: user?.id,
      name: user?.full_name || user?.fullName || user?.name || fallbackName,
      email: user?.email || email.trim().toLowerCase(),
      role: verifiedRoleString,
      primary_role: user?.primary_role || verifiedRoleString,
      is_reviewer: user?.is_reviewer,
      want_to_be_reviewer: user?.want_to_be_reviewer,
      is_editor: user?.is_editor || user?.is_staff,
    };

    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const alreadyExists = existingUsers.some((u) => u.email === storedUser.email);

    if (!alreadyExists) {
      localStorage.setItem("users", JSON.stringify([...existingUsers, storedUser]));
    } else {
      localStorage.setItem(
        "users",
        JSON.stringify(
          existingUsers.map((u) =>
            u.email === storedUser.email ? { ...u, ...storedUser } : u
          )
        )
      );
    }
  };

  const readExistsValue = (data) => {
    const value =
      data?.exists ??
      data?.is_registered ??
      data?.registered ??
      data?.user_exists ??
      data?.email_exists ??
      data?.account_exists ??
      data?.found;

    return (
      value === true ||
      value === "true" ||
      value === 1 ||
      value === "1" ||
      value === "yes"
    );
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.checkEmail(normalizedEmail);
      const resData =
        response?.results || response?.data?.results || response?.data || response || {};

      console.log("=== CHECK EMAIL BACKEND RESPONSE PAYLOAD ===", resData);

      const exists = readExistsValue(resData);

      if (!exists) {
        setFullName("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setWantToBeReviewer(false);
        setSelectedClassificationIds([]);
        setStep("register");
        return;
      }

      const stringRole = String(
        resData.primary_role ||
        resData.role ||
        resData.user?.primary_role ||
        resData.user?.role ||
        ""
      ).toLowerCase().trim();

      const isManagerFlag =
        resData.is_editorial_manager === true ||
        resData.user?.is_editorial_manager === true ||
        resData.is_superuser === true ||
        resData.user?.is_superuser === true;

      const managerRoles = ["editorial_manager", "super_admin"];

      if (isManagerFlag || managerRoles.includes(stringRole)) {
        navigate("/manager/login", {
          state: { email: normalizedEmail },
        });
        return;
      }

      const isEditorFlag =
        resData.is_editor === true ||
        resData.is_editor === "true" ||
        resData.user?.is_editor === true ||
        resData.is_staff === true ||
        resData.is_staff === "true" ||
        resData.user?.is_staff === true;

      const editorRoles = ["editor", "staff"];

      if (isEditorFlag || editorRoles.includes(stringRole)) {
        navigate("/editor/login", {
          state: { email: normalizedEmail },
        });
        return;
      }

      // If the account exists but email is not verified, go to OTP step
      const action = resData.action || "";
      if (action === "verify_email") {
        // Resend a fresh OTP so the user can verify
        try {
          const resendResponse = await authService.resendVerificationEmail({ email: normalizedEmail });
          setVerificationToken(resendResponse?.verification_token || null);
        } catch (_) {
          // Resend failed silently — user can still try with old OTP or hit Resend
        }
        setOtp("");
        setPassword("");
        setShowPassword(false);
        setFromUnverified(true);
        startOtpTimer();
        toast("Your email is not verified yet. A new code has been sent to your inbox.", {
          icon: "📧",
        });
        setStep("otp");
        return;
      }

      setPassword("");
      setShowPassword(false);
      setStep("login");
    } catch (err) {
      console.error("Check email execution failure:", err);

      if (err.response?.status === 404) {
        setWantToBeReviewer(false);
        setSelectedClassificationIds([]);
        setStep("register");
      } else {
        setError(
          err.response?.data?.detail || "Unable to check email. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!password.trim()) {
      toast.error("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const user = await authService.login(normalizedEmail, password);

      saveLocalUser(user);

      toast.success("Login successful!");
      redirectByRole(user);
    } catch (err) {
      if (err.response?.status === 401) {
        let message =
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.message ||
          "Wrong password";

        if (message === "No active account found with the given credentials") {
          message = "Incorrect password";
        }

        if (/verify|verification|inactive|not active|confirm/i.test(String(message))) {
          toast.error(
            "Your account is not verified yet. Enter the verification code sent to your email."
          );
          setStep("otp");
          return;
        }

        toast.error(message);
      } else {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.message ||
          "Login failed. Please try again.";

        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (wantToBeReviewer && selectedClassificationIds.length < 4) {
      setError("Please select at least 4 classifications.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: normalizedEmail,
        username: normalizedEmail,
        full_name: fullName.trim(),
        password,
        want_to_be_reviewer: wantToBeReviewer,
        classification_ids: wantToBeReviewer ? selectedClassificationIds : [],
      };

      const response = await authService.requestRegistrationOtp(payload);

      setVerificationToken(response?.verification_token || null);
      setOtp("");
      setStep("otp");
      startOtpTimer();

      toast.success(
        "A verification code has been sent to your email. Please enter it to complete registration."
      );
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);

      const data = err.response?.data;

      if (
        data?.email?.some((msg) =>
          String(msg).toLowerCase().includes("already exists")
        ) ||
        data?.username?.some((msg) =>
          String(msg).toLowerCase().includes("already exists")
        )
      ) {
        toast.error("Account already exists. Please enter your password.");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setStep("login");
        return;
      }

      let message = data?.detail || data?.message || "Registration failed.";

      if (data?.email?.[0]) message = data.email[0];
      else if (data?.username?.[0]) message = data.username[0];
      else if (data?.password?.[0]) message = data.password[0];
      else if (data?.full_name?.[0]) message = data.full_name[0];
      else if (data?.classification_ids?.[0]) message = data.classification_ids[0];

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    // Password is required in both flows (registration and unverified-login)
    if (!password.trim()) {
      setError("Please enter your password so we can sign you in after verification.");
      return;
    }

    try {
      setLoading(true);

      await authService.verifyRegistrationOtp({
        email: normalizedEmail,
        otp: otp.trim(),
        verification_token: verificationToken,
      });

      const user = await authService.login(normalizedEmail, password);
      saveLocalUser(user, fullName.trim());

      toast.success("Account verified and signed in!");
      redirectByRole(user);
    } catch (err) {
      console.error("OTP verification failed:", err.response?.data || err);
      const data = err.response?.data;
      const message =
        data?.detail ||
        data?.message ||
        data?.otp?.[0] ||
        data?.code?.[0] ||
        "Verification failed. Please check your code and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email to resend verification code.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resendVerificationEmail({
        email: normalizedEmail,
      });
      setVerificationToken(response?.verification_token || null);
      setOtp("");
      startOtpTimer();
      toast.success("Verification code resent to your email.");
    } catch (err) {
      console.error("Resend OTP failed:", err.response?.data || err);
      setError(
        err.response?.data?.detail || "Unable to resend code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleClassification = (classificationId) => {
    setSelectedClassificationIds((prev) =>
      prev.includes(classificationId)
        ? prev.filter((id) => id !== classificationId)
        : [...prev, classificationId]
    );
  };

  const goBack = () => {
    setError("");
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setWantToBeReviewer(false);
    setSelectedClassificationIds([]);
    setOtp("");
    setVerificationToken(null);
    setOtpSecondsRemaining(0);
    setOtpTimerActive(false);
    setFromUnverified(false);
    setStep("email");
  };

  const pageTitle =
    step === "email"
      ? "Continue with Email"
      : step === "login"
        ? "Welcome Back"
        : step === "otp"
          ? "Verify Your Account"
          : "Create Your Account";

  const pageDescription =
    step === "email"
      ? "Enter your email to continue."
      : step === "login"
        ? "Sign in to access your research dashboard."
        : step === "otp"
          ? "Enter the verification code sent to your email."
          : "";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col bg-[#f8fafc] font-sans"
    >
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-0.5">Editorial Manager</div>
          <h1 className="text-lg font-serif font-bold text-[#1a3a5c]">Journal of Biomedical Signal and Image Processing</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white border border-slate-200 shadow-sm rounded-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-semibold text-slate-800">{pageTitle}</h2>
            {pageDescription && (
              <p className="text-slate-500 text-sm mt-1">{pageDescription}</p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
              {error}
            </div>
          )}

          <div>
            {step === "email" && (
              <form onSubmit={handleContinue}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  autoFocus
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-6 bg-[#1a3a5c] hover:bg-[#11263c] disabled:opacity-70 text-white rounded-sm text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? "Checking..." : "Continue"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

            {step === "login" && (
              <form onSubmit={handleLogin}>
                <Input
                  type="email"
                  value={email}
                  readOnly
                  className="bg-slate-50"
                />

                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  show={showPassword}
                  setShow={setShowPassword}
                />

                <div className="flex justify-end mt-1 px-1">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password", { state: { email } })}
                    className="text-[13px] text-[#1a3a5c] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-6 bg-[#1a3a5c] hover:bg-[#11263c] disabled:opacity-70 text-white rounded-sm text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full mt-4 text-[13px] text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Use another email
                </button>
              </form>
            )}

            {step === "register" && (
              <form onSubmit={handleRegister}>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  autoFocus
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  type="email"
                  value={email}
                  readOnly
                  className="mt-4 bg-slate-50"
                />

                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  show={showPassword}
                  setShow={setShowPassword}
                />

                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                />

                <div className="mt-5">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={wantToBeReviewer}
                      style={{ accentColor: "var(--navy)" }}
                      onChange={(e) => {
                        setWantToBeReviewer(e.target.checked);

                        if (!e.target.checked) {
                          setSelectedClassificationIds([]);
                        }
                      }}
                    />
                    <span className="font-semibold text-[#24344D]">
                      I want to be a reviewer
                    </span>
                  </label>

                  {wantToBeReviewer && (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-[#24344D]">
                        Select Classifications{" "}
                        <span className="text-red-500">*</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Select at least 4 research classifications.
                      </p>

                      <div className="mt-3 grid max-h-32 grid-cols-1 gap-2 overflow-y-auto pr-1">
                        {classifications.map((classification) => (
                          <label
                            key={classification.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedClassificationIds.includes(
                                classification.id
                              )}
                              style={{ accentColor: "var(--navy)" }}
                              onChange={() =>
                                toggleClassification(classification.id)
                              }
                            />
                            <span className="text-slate-700">
                              {classification.name}
                            </span>
                          </label>
                        ))}
                      </div>

                      <p className="mt-2 text-xs font-semibold text-gray-500">
                        {selectedClassificationIds.length} selected
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-6 bg-[#1a3a5c] hover:bg-[#11263c] disabled:opacity-70 text-white rounded-sm text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  {loading ? "Sending code..." : "Send verification code"}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full mt-4 text-[13px] text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Use another email
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <Input
                  type="email"
                  value={email}
                  readOnly
                  className="bg-slate-50"
                />

                <Input
                  type="text"
                  placeholder="Verification code"
                  value={otp}
                  autoFocus
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-4"
                />

                {/* Show password field when coming from unverified login flow */}
                {fromUnverified && (
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to sign in after verification"
                    show={showPassword}
                    setShow={setShowPassword}
                  />
                )}

                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>Code valid for {formatOtpCountdown(otpSecondsRemaining)}</span>
                  {otpSecondsRemaining === 0 ? (
                    <span className="text-red-500">Expired</span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpSecondsRemaining === 0}
                  className="w-full h-11 mt-4 bg-[#1a3a5c] hover:bg-[#11263c] disabled:opacity-70 text-white rounded-sm text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="w-full mt-3 text-[13px] text-[#1a3a5c] hover:underline"
                >
                  Resend code
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full mt-4 text-[13px] text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Use another email
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
}