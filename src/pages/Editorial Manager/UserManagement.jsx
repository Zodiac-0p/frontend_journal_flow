import { useEffect, useState, useCallback } from "react";
import { 
  Loader2, Search, Filter, Award, AlertTriangle, X, UserPlus, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../layout/layout";
import authService from "../../services/authService";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const initialFormState = {
    email: "",
    username: "",
    full_name: "",
    phone: "",
    affiliation: "",
    organization: "",
    job_title: "",
    expertise: "",
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialFormState);
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.listUsers(roleFilter);
      setUsers(data);
    } catch (err) {
      console.error("Failed fetching user list:", err);
      toast.error("Failed to load user accounts database.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await fetchUsers();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchUsers]);

  const confirmToast = (message) =>
    new Promise((resolve) => {
      toast(
        (t) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#1e293b", lineHeight: "1.5" }}>
                {message}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { toast.dismiss(t.id); resolve(false); }}
                style={{
                  padding: "6px 14px", borderRadius: "8px", border: "1px solid #e2e8f0",
                  background: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { toast.dismiss(t.id); resolve(true); }}
                style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none",
                  background: "#0f172a", color: "#fff", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        ),
        { duration: Infinity, style: { maxWidth: "360px", padding: "16px" } }
      );
    });

  const handleRoleToggle = async (user) => {
    // Determine target state
    const currentIsReviewer = user.is_reviewer || user.role === "reviewer" || user.primary_role === "reviewer";
    const targetRoleText = currentIsReviewer ? "Author" : "Reviewer";

    const confirmed = await confirmToast(
      `Change role for ${user.full_name || user.email} to ${targetRoleText}?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await authService.toggleReviewerStatus(user.id);
      toast.success(res.message || `Role updated successfully to ${targetRoleText}`);
      fetchUsers();
    } catch (err) {
      console.error("Role toggle error:", err);
      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error(`Unable to promote user. Reviewers require at least 4 active taxonomy classifications.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEditor = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.full_name) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsCreating(true);
      await authService.createEditor(createForm);
      toast.success("Editor account created successfully!");
      setIsCreateModalOpen(false);
      setCreateForm(initialFormState);
      fetchUsers();
    } catch (err) {
      console.error("Failed to create editor:", err);
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === "object") {
          const firstErrorKey = Object.keys(errors)[0];
          const firstErrorMsg = Array.isArray(errors[firstErrorKey]) 
            ? errors[firstErrorKey][0] 
            : errors[firstErrorKey];
          toast.error(`${firstErrorKey}: ${firstErrorMsg}`);
        } else {
          toast.error(errors.detail || "Failed to create editor account.");
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Filter local users by search input
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    const name = String(u.full_name || u.fullName || u.name || "").toLowerCase();
    const email = String(u.email || "").toLowerCase();
    const affiliation = String(u.affiliation || u.organization || "").toLowerCase();
    const expertise = String(u.expertise || "").toLowerCase();

    return name.includes(q) || email.includes(q) || affiliation.includes(q) || expertise.includes(q);
  });

  const getRoleBadgeColor = (roleStr, isReviewer, isSuper) => {
    const r = String(roleStr || "").toLowerCase();
    if (r === "super_admin" || r === "editorial_manager" || isSuper) {
      return "bg-red-50 text-red-600 border border-red-100";
    }
    if (r === "editor" || r === "staff") {
      return "bg-blue-50 text-blue-600 border border-blue-100";
    }
    if (r === "reviewer" || isReviewer) {
      return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    }
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const getRoleLabel = (roleStr, isReviewer, isSuper) => {
    const r = String(roleStr || "").toLowerCase();
    if (r === "super_admin" || isSuper) return "Super Admin";
    if (r === "editorial_manager") return "Editorial Manager";
    if (r === "editor") return "Editor";
    if (r === "reviewer" || isReviewer) return "Reviewer";
    return "Author";
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)", borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: ".6px", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Editorial Manager</div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,32px)", color: "#fff", fontWeight: "600", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldAlert className="text-blue-200" size={32} />
              User Management
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", fontFamily: "var(--font-sans)", margin: 0, lineHeight: "1.6", maxWidth: "600px" }}>
              Oversee all registered accounts, modify access levels, assign editor/reviewer roles, and manage system security.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              style={{ background: "#fff", color: "var(--navy)", border: "none", borderRadius: "4px", padding: "10px 18px", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >
              <UserPlus size={16} />
              Add Editor Account
            </button>
            <button 
              onClick={fetchUsers} 
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", padding: "10px 18px", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              Refresh Table
            </button>
          </div>
        </div>

        {/* FILTERS & SEARCH ROW */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 mb-6 shrink-0">
          
          {/* SEARCH BAR */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by user name, email, affiliation, or fields of expertise..." 
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition bg-white" 
            />
          </div>

          {/* ROLE SELECTOR */}
          <div className="relative">
            <Filter size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-semibold uppercase tracking-wider outline-none focus:border-[#0077B6] bg-white text-slate-700 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="author">Authors</option>
              <option value="reviewer">Reviewers</option>
              <option value="editor">Editors</option>
              <option value="editorial_manager">Editorial Managers</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

        </div>

        {/* USERS CONTAINER TABLE */}
        <div className="bg-white rounded-md border border-slate-200/80 shadow-sm overflow-hidden min-h-[350px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0077B6]" size={36} />
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
              <p className="font-semibold text-slate-600 text-sm">No users match your criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try refining your filters or search keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                
                {/* TABLE HEADER */}
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">User Detail</th>
                    <th className="px-6 py-4">Affiliation / Organization</th>
                    <th className="px-6 py-4">Expertise / Classifications</th>
                    <th className="px-6 py-4 text-center">Active Role</th>
                    <th className="px-6 py-4 text-right">Reviewer Promotion</th>
                  </tr>
                </thead>

                {/* TABLE BODY ROWS */}
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isReviewerRole = user.is_reviewer || user.role === "reviewer" || user.primary_role === "reviewer";
                    const isStaffAdmin = user.is_superuser || user.is_staff || user.is_editorial_manager || ["editor", "editorial_manager", "super_admin"].includes(String(user.role).toLowerCase());

                    // Parse classifications counts
                    const classificationsList = user.classifications || user.classifications_data || [];
                    const classificationCount = classificationsList.length;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/20 transition text-sm">
                        
                        {/* Name & Contact */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{user.full_name || user.username || "Anonymous"}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1.5">{user.email}</p>
                            {user.phone && <p className="text-[10px] text-slate-400 font-medium mt-0.5">📞 {user.phone}</p>}
                          </div>
                        </td>

                        {/* Affiliation */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-600 leading-snug">{user.organization || user.affiliation || "N/A"}</p>
                            {user.job_title && <p className="text-xs text-slate-400 font-medium mt-1">{user.job_title}</p>}
                          </div>
                        </td>

                        {/* Classifications / expertise */}
                        <td className="px-6 py-4 max-w-[280px]">
                          <div>
                            {user.expertise ? (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{user.expertise}</p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No expertise listed</p>
                            )}
                            
                            {classificationCount > 0 && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <Award size={12} className="text-[#0077B6]" />
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {classificationCount} Classifications
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Current Role Badge */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold ${getRoleBadgeColor(user.role || user.primary_role, user.is_reviewer, user.is_superuser)}`}>
                            {getRoleLabel(user.role || user.primary_role, user.is_reviewer, user.is_superuser)}
                          </span>
                        </td>

                        {/* Reviewer Promotion Action Switch */}
                        <td className="px-6 py-4 text-right">
                          {isStaffAdmin ? (
                            <span className="text-xs text-slate-400 italic font-medium px-2">Admin Profile</span>
                          ) : (
                            <div className="flex items-center justify-end gap-3.5">
                              {/* Display badge if user want to be reviewer */}
                              {user.want_to_be_reviewer && !isReviewerRole && (
                                <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse" title="User requested to be promoted to reviewer">
                                  Applied
                                </span>
                              )}
                              
                              {/* Promotion Toggle switch */}
                              <button
                                type="button"
                                onClick={() => handleRoleToggle(user)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                  isReviewerRole ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isReviewerRole ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}
        </div>

        {/* CREATE EDITOR MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8FBFF]">
                <div>
                  <h2 className="text-lg font-semibold text-[#24344D] flex items-center gap-2">
                    <UserPlus size={18} className="text-[#0077B6]" />
                    Create Editor Account
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Add a new editor coordinator credentials</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition p-1 rounded-md hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateEditor} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                    <input 
                      required
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition bg-white text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                    <input 
                      required
                      type="email"
                      autoComplete="new-password"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username (Optional)</label>
                    <input 
                      value={createForm.username}
                      onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                      placeholder="jane_doe"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Affiliation / Org</label>
                    <input 
                      value={createForm.affiliation}
                      onChange={(e) => setCreateForm({...createForm, affiliation: e.target.value})}
                      placeholder="University / Institute"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition bg-white text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title</label>
                    <input 
                      value={createForm.job_title}
                      onChange={(e) => setCreateForm({...createForm, job_title: e.target.value})}
                      placeholder="Associate Professor, etc."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expertise / Fields</label>
                  <textarea 
                    value={createForm.expertise}
                    onChange={(e) => setCreateForm({...createForm, expertise: e.target.value})}
                    placeholder="e.g. Machine Learning, Natural Language Processing"
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition resize-none bg-white text-slate-800"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)" }}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
