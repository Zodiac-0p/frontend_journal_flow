import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, UserPlus, XCircle, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../../layout/layout";
import api from "../../services/api";
import ReviewerSelectionModal from "./ReviewerSelectionModal";
import reviewService from "../../services/reviewService";

export default function AssignReviewers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSubmission = async (isInitial = false) => {
    try {
      if (!isInitial) setLoading(true);
      const res = await api.get(`/journals/submissions/${id}/`);
      setSubmission(res.data);
    } catch (err) {
      console.error("Failed to load submission:", err);
      toast.error("Failed to load submission details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to cancel / deactivate this reviewer assignment?")) {
      return;
    }

    try {
      setLoading(true);
      await reviewService.deactivateAssignment(assignmentId);
      toast.success("Reviewer assignment deactivated.");
      fetchSubmission();
    } catch (err) {
      console.error("Deactivate assignment error:", err);
      toast.error("Failed to deactivate assignment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: loading is already true in useState, so we skip synchronous setLoading
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmission(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-[#00A8CC]" />
        </div>
      </AppLayout>
    );
  }

  if (!submission) {
    return (
      <AppLayout>
        <div className="p-20 text-center">
          <h2 className="text-xl font-bold">Submission not found</h2>
          <button onClick={() => navigate(-1)} className="text-[#00A8CC] mt-4 hover:underline">
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  const assignments = submission.reviewer_assignments || [];

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => {
            const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
            const role = currentUser?.primary_role || currentUser?.role || "author";
            const isManager = role === "editorial_manager" || role === "super_admin" || currentUser?.is_editorial_manager || currentUser?.is_superuser;
            navigate(isManager ? "/manager/reviewers" : "/reviewers");
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={16} /> Back to Reviewers List
        </button>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h1 className="text-2xl font-bold text-[#24344D] mb-2">{submission.title || "Untitled Article"}</h1>
          <p className="text-sm text-gray-500 mb-6">Manage reviewers for this manuscript.</p>
          
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-lg font-semibold text-[#24344D]">Assigned Reviewers</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#00A8CC] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#008Caa] transition text-sm"
            >
              <UserPlus size={16} /> Assign New Reviewer
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No reviewers assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const isRejected = assignment.status === "rejected";
                const isAccepted = assignment.status === "accepted";
                const isPending = assignment.status === "pending";

                return (
                  <div
                    key={assignment.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      isRejected ? "border-red-100 bg-red-50" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-[#24344D]">
                        {assignment.reviewer?.full_name || assignment.reviewer?.name || "Unknown Reviewer"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{assignment.reviewer?.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isRejected && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
                            <XCircle size={14} /> Rejected
                          </span>
                        )}
                        {isAccepted && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                            <CheckCircle2 size={14} /> Accepted
                          </span>
                        )}
                        {isPending && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">
                            <Clock size={14} /> Pending
                          </span>
                        )}
                        {assignment.is_active === false && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      {assignment.is_active !== false && (
                        <button
                          onClick={() => handleDeactivate(assignment.id)}
                          className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Cancel/Deactivate Assignment"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ReviewerSelectionModal
        open={isModalOpen}
        submissionId={submission.id}
        onClose={() => setIsModalOpen(false)}
        onAssigned={() => {
          fetchSubmission();
        }}
      />
    </AppLayout>
  );
}
