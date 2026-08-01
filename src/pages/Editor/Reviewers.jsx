// src/pages/Editor/Reviewers.jsx
import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react"; // Only keeping what is actually used
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../../layout/layout";
import api from "../../services/api";

export default function Reviewers() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all submissions to manage
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/journals/submissions/");
        setSubmissions(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        // Log the error so it's not "unused", or just remove the 'err' argument
        console.error("Failed to load submissions:", err);
        toast.error("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-[#00A8CC]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="bg-[#00A8CC] rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold">Review Management</h1>
          <p className="mt-2 text-white/90">Assign submitted papers to reviewers and manage the review workflow.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {submissions.map((paper) => (
            <div key={paper.id} className="p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex-1">
                <h3 className="font-bold text-[#24344D]">{paper.title || "Untitled Article"}</h3>
                <p className="text-sm text-gray-500 mt-1">Status: <span className="font-semibold text-[#00A8CC]">{paper.status}</span></p>
              </div>
              
              <button
                onClick={() => {
                  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
                  const role = currentUser?.primary_role || currentUser?.role || "author";
                  const isManager = role === "editorial_manager" || role === "super_admin" || currentUser?.is_editorial_manager || currentUser?.is_superuser;
                  navigate(isManager ? `/manager/assign-reviewers/${paper.id}` : `/editor/assign-reviewers/${paper.id}`);
                }}
                className="flex items-center gap-2 bg-[#00A8CC] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#008Caa] transition"
              >
                <UserPlus size={18} /> Assign Reviewers
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}