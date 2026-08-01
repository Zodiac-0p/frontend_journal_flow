// src/pages/Editor/EditorLoginPage.jsx

import { useState } from "react";
import { motion } from "framer-motion";

import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import { toast } from "react-hot-toast";

import logo from "../../assets/logo.png";

import authService from "../../services/authService";

import AppLayout from "../../layout/layout";

export default function EditorLoginPage() {
  const navigate = useNavigate();

  const location = useLocation();

  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] =
    useState(
      location.state?.email || ""
    );

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [errorType, setErrorType] =
    useState("");

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async () => {
    setError("");

    setErrorType("");

    // VALIDATION

    if (
      !email.trim() ||
      !password.trim()
    ) {
      setError(
        "Please enter email and password"
      );

      setErrorType(
        "validation"
      );

      return;
    }

    // EMAIL VALIDATION

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(email)
    ) {
      setError(
        "Invalid email format"
      );

      setErrorType("email");

      return;
    }

    try {
      setLoading(true);

      // BACKEND LOGIN

      const user =
        await authService.login(
          email
            .trim()
            .toLowerCase(),
          password
        );

      // VERIFY EDITOR ACCESS

      const role =
        user?.primary_role ||
        user?.role ||
        "author";

      const allowedRoles = [
        "editor",
        "editorial_manager",
        "super_admin",
      ];

      if (
        !allowedRoles.includes(
          role
        )
      ) {
        setError(
          "This account does not have editor access."
        );

        setErrorType(
          "account"
        );

        return;
      }

      toast.success(
        "Editor login successful!"
      );

      const isManager =
        role === "editorial_manager" ||
        role === "super_admin" ||
        user?.is_editorial_manager ||
        user?.is_superuser;

      navigate(
        isManager ? "/manager/dashboard" : "/editor/home",
        {
          replace: true,
        }
      );
    } catch (err) {
      const status =
        err.response?.status;

      if (status === 401) {
        setError(
          "Incorrect password"
        );

        setErrorType(
          "password"
        );
      } else {
        const message =
          err.response?.data
            ?.detail ||
          err.response?.data
            ?.non_field_errors?.[0] ||
          "Login failed. Please try again.";

        setError(message);

        setErrorType(
          "server"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <AppLayout>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="min-h-[calc(100vh-90px)] flex items-center justify-center px-4 py-10 overflow-hidden relative"
      >

        {/* BACKGROUND GLOW */}

        <div className="absolute top-[-120px] left-[-120px] w-[280px] h-[280px] bg-[#D7ECF8] rounded-full blur-3xl opacity-70"></div>

        <div className="absolute bottom-[-120px] right-[-120px] w-[280px] h-[280px] bg-[#CFE8F6] rounded-full blur-3xl opacity-70"></div>

        {/* LOGIN CARD */}

        <div className="relative w-full max-w-[420px] bg-white/90 backdrop-blur-xl border border-[#D6E3EC] rounded-md  shadow-[0_10px_35px_rgba(0,0,0,0.05)] p-6 sm:p-7">

          {/* LOGO */}

          <div className="flex flex-col items-center">

            <div className="w-[72px] h-[72px] rounded-[24px] bg-[#F8FBFD] border border-[#D6E3EC] flex items-center justify-center shadow-sm">

              <img
                src={logo}
                alt="Logo"
                className="w-[44px] h-[44px] object-contain"
              />
            </div>

            {/* BADGE */}

            <div className="bg-[#E8F4FB] text-[#005792] px-4 py-2 rounded-2xl flex items-center gap-2 mt-5">

              <ShieldCheck size={16} />

              <p className="text-[12px] font-medium tracking-wide">
                Editorial Portal
              </p>
            </div>
          </div>

          {/* TITLE */}

          <div className="text-center mt-6">

            <h1 className="text-[30px] font-semibold text-[#1E293B]">
              Editor Login
            </h1>

            <p className="text-[13px] text-[#64748B] mt-3 leading-6 max-w-[300px] mx-auto">
              Access the editorial dashboard
              to manage journals and
              publication workflows.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className={`rounded-2xl px-4 py-3 mt-6 text-[13px] border flex items-start gap-3 ${
                errorType ===
                "server"
                  ? "bg-orange-100 border-orange-200 text-orange-700"
                  : "bg-red-100 border-red-200 text-red-600"
              }`}
            >
              <AlertTriangle
                size={15}
                className="mt-[2px]"
              />

              <p className="leading-6">
                {error}
              </p>
            </div>
          )}

          {/* FORM */}

          <div className="mt-6 space-y-5">

            {/* EMAIL */}

            <div>
              <label className="block text-[13px] font-medium text-[#1E293B] mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="Enter editor email"
                className="w-full h-[48px] bg-[#F8FBFD] border border-[#D6E3EC] rounded-2xl px-4 outline-none text-[14px] text-[#1E293B] focus:border-[#005792] focus:ring-4 focus:ring-[#DCECF7] transition"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="block text-[13px] font-medium text-[#1E293B] mb-2">
                Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter password"
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handleLogin();
                    }
                  }}
                  className="w-full h-[48px] bg-[#F8FBFD] border border-[#D6E3EC] rounded-2xl px-4 pr-14 outline-none text-[14px] text-[#1E293B] focus:border-[#005792] focus:ring-4 focus:ring-[#DCECF7] transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-[#64748B] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[13px] font-medium text-[#005792] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}

            <button
              onClick={
                handleLogin
              }
              disabled={loading}
              className={`w-full h-[48px] rounded-md text-[14px] font-medium transition-all duration-300 cursor-pointer shadow-sm ${
                loading
                  ? "bg-[#7EA8C4] text-white cursor-not-allowed"
                  : "bg-[#1a3a5c] hover:bg-[#11263c] text-white"
              }`}
            >
              {loading
                ? "Authenticating..."
                : "Login to Editorial Panel"}
            </button>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}