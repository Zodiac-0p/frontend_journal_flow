// src/pages/AboutPage.jsx

import {
  BookOpen,
  Users,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

import AppLayout from "../layout/layout";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="px-2 py-4">

        {/* HERO */}

        <section className="bg-[#EAF6FF] rounded-2xl overflow-hidden">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">

            {/* LOGO */}

            <div className="flex justify-center">

              <div className="w-[82px] h-[82px] rounded-3xl bg-white shadow-sm border border-[#D9EAF7] flex items-center justify-center">

                <img
                  src={logo}
                  alt="JournalFlow Logo"
                  className="w-[52px] h-[52px] object-contain"
                />
              </div>
            </div>

            {/* TITLE */}

            <h1 className="text-[38px] sm:text-[50px] lg:text-[58px] font-light text-[#24344D] leading-[48px] sm:leading-[62px] lg:leading-[70px] mt-8">

              About JournalFlow

            </h1>

            {/* DESCRIPTION */}

            <p className="max-w-[850px] mx-auto text-[15px] sm:text-[17px] lg:text-[18px] text-gray-600 mt-6 leading-8">

              JournalFlow is a modern academic
              publication platform designed for
              researchers, authors, reviewers,
              and editors to manage article
              submissions and peer-review
              workflows efficiently.

            </p>

            {/* BUTTON */}

            <button
              onClick={() =>
                navigate("/")
              }
              className="mt-8 h-11 px-6 rounded-xl bg-[#0077B6] hover:bg-[#005F91] text-white text-[14px] font-medium transition"
            >
              Back to Home
            </button>
          </div>
        </section>

        {/* ABOUT CONTENT */}

        <section className="max-w-6xl mx-auto py-14">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* LEFT */}

            <div>

              <h2 className="text-[30px] sm:text-[38px] font-semibold text-[#24344D]">

                Simplifying Academic Publishing

              </h2>

              <p className="text-gray-600 mt-6 leading-8 text-[15px] sm:text-[17px]">

                JournalFlow provides a streamlined
                environment for article submission,
                peer review, and publication
                management. The platform is inspired
                by modern academic systems like
                ScienceDirect and aims to create an
                organized publication workflow for
                colleges and research institutions.

              </p>

              <p className="text-gray-600 mt-6 leading-8 text-[15px] sm:text-[17px]">

                Authors can submit research papers,
                reviewers can evaluate assigned
                manuscripts, and editors can manage
                publication decisions through a
                centralized dashboard.

              </p>
            </div>

            {/* RIGHT */}

            <div className="bg-white rounded-2xl shadow-sm border border-[#D9EAF7] p-6 sm:p-8">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* CARD 1 */}

                <FeatureCard
                  icon={FileText}
                  title="Article Submission"
                  description="Submit and manage academic papers easily."
                />

                {/* CARD 2 */}

                <FeatureCard
                  icon={Users}
                  title="Peer Review"
                  description="Structured reviewer assignment and evaluation."
                />

                {/* CARD 3 */}

                <FeatureCard
                  icon={BookOpen}
                  title="Journal Management"
                  description="Manage journals, categories, and publications."
                />

                {/* CARD 4 */}

                <FeatureCard
                  icon={ShieldCheck}
                  title="Secure Workflow"
                  description="Role-based access for authors, reviewers, and editors."
                />
              </div>
            </div>
          </div>
        </section>

        {/* MISSION */}

        <section className="bg-white rounded-2xl border border-[#D9EAF7]">

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">

            <h2 className="text-[30px] sm:text-[38px] font-semibold text-[#24344D]">

              Our Mission

            </h2>

            <p className="text-gray-600 mt-6 leading-8 text-[15px] sm:text-[17px] max-w-[850px] mx-auto">

              To provide a modern and accessible
              academic publication platform that
              simplifies research collaboration,
              article management, and peer-review
              processes for educational institutions
              and research communities.

            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

// ==========================================
// FEATURE CARD
// ==========================================

function FeatureCard({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="bg-[#F8FBFF] rounded-2xl p-5">

      <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center">

        <Icon
          size={24}
          className="text-[#0077B6]"
        />
      </div>

      <h3 className="text-[18px] font-semibold text-[#24344D] mt-5">

        {title}

      </h3>

      <p className="text-gray-600 mt-3 leading-7 text-[14px]">

        {description}

      </p>
    </div>
  );
}