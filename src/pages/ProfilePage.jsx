// src/pages/ProfilePage.jsx

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit3,
  Save,
  X,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  RefreshCw,
  AlertCircle,
  Tags,
  Lock
} from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../layout/layout";
import profileService from "../services/profileService";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Core State Engine
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Master Data Options Arrays
  const [roleChoices, setRoleChoices] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [classifications, setClassifications] = useState([]);

  const fetchProfile = useCallback(async () => {
    try {
      const [data, roles, discLists, classLists] = await Promise.all([
        profileService.getProfile(),
        profileService.getRoleChoices ? profileService.getRoleChoices() : [],
        profileService.getDisciplines ? profileService.getDisciplines() : [],
        profileService.getClassifications ? profileService.getClassifications() : [],
      ]);

      // Safely handle unwrapping direct arrays or Django paginated envelopes
      const resolvedRoles = roles?.results || roles || [];
      const resolvedDisciplines = discLists?.results || discLists || [];
      const resolvedClassifications = classLists?.results || classLists || [];

      setRoleChoices(resolvedRoles);
      setDisciplines(resolvedDisciplines);
      setClassifications(resolvedClassifications);

      const normalized = {
        ...data,
        fullName: data.full_name || data.fullName || data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        affiliation: data.affiliation || "",
        organization: data.organization || "",
        job_title: data.job_title || "",
        expertise: data.expertise || "",
        role_choice_id: data.role_choice?.id || data.role_choice_id || "",
        discipline_ids: data.disciplines?.map((d) => d.id) || data.discipline_ids || [],
        classification_ids: data.classifications?.map((c) => c.id) || data.classification_ids || [],
        want_to_be_reviewer: data.want_to_be_reviewer ?? data.is_reviewer ?? false,
      };

      setProfile(normalized);
      setFormData(normalized);

      sessionStorage.setItem("currentUser", JSON.stringify({
        ...normalized,
        name: normalized.fullName,
        role: normalized.primary_role || "author",
      }));
    } catch (error) {
      console.error("Profile synchronization error:", error);
      toast.error("Failed synchronization with researcher registry database.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Safe Asynchronous Lifecycle Mounting
  useEffect(() => {
    let isMounted = true;
    
    const initializeProfile = async () => {
      if (isMounted) {
        await fetchProfile();
      }
    };

    initializeProfile();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Dropdown Selection Add Handler
  const handleDropdownSelect = (targetField, id) => {
    if (!id) return;
    const numericId = parseInt(id, 10);
    
    setFormData((prev) => {
      const currentList = prev[targetField] || [];
      if (currentList.includes(numericId)) return prev; 
      return {
        ...prev,
        [targetField]: [...currentList, numericId]
      };
    });
  };

  // Badge list removal handler
  const handleRemoveBadge = (targetField, id) => {
    setFormData((prev) => ({
      ...prev,
      [targetField]: (prev[targetField] || []).filter((itemId) => itemId !== id)
    }));
  };

  const handleSave = async () => {
    if (formData.classification_ids.length > 0 && formData.classification_ids.length < 4) {
      toast.error("System Policy: Academic profiles require a minimum of 4 journal classifications.");
      return;
    }

    try {
      setSaving(true);
      const reviewerChanged = profile.want_to_be_reviewer !== formData.want_to_be_reviewer;

      const payload = {
        full_name: formData.fullName,
        phone: formData.phone,
        affiliation: formData.affiliation,
        organization: formData.organization,
        job_title: formData.job_title,
        expertise: formData.expertise,
        role_choice_id: formData.role_choice_id || null,
        discipline_ids: formData.discipline_ids,
        classification_ids: formData.classification_ids,
        want_to_be_reviewer: formData.want_to_be_reviewer,
      };

      await profileService.updateProfile(payload);
      toast.success("Profile saved accurately.");
      
      setLoading(true); 
      await fetchProfile();
      setIsEditing(false);

      if (reviewerChanged) {
        toast.success("Reviewer credentials updated. Renewing session tokens.");
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      console.error("Failed executing profile updates:", error);
      toast.error("Failed saving profile records transformations.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast("Account suspension routing logic is currently offline.");
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto px-6 text-center">
          <RefreshCw className="h-7 w-7 text-[#005F87] animate-spin mb-4" />
          <p className="text-slate-600 text-sm font-medium">Loading Profile Registry Data...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 text-left bg-white text-slate-800 antialiased">
        
        {/* SECTION 1: HEADER CONTROLS VIEW */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Profile Information</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your active journal credentials, roles, and profile indices</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => navigate("/forgot-password")} 
                  className="h-10 px-5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition flex items-center gap-2"
                >
                  <Lock size={15} /> Change Password
                </button>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="h-10 px-5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition flex items-center gap-2"
                >
                  <Edit3 size={15} /> Edit Profile
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="h-10 px-5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition flex items-center gap-2"
                >
                  <Save size={15} /> {saving ? "Saving..." : "Save"}
                </button>
                <button 
                  onClick={() => { setIsEditing(false); setFormData({ ...profile }); }} 
                  className="h-10 px-5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition flex items-center gap-2"
                >
                  <X size={15} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* SECTION 2: PERSONAL INFORMATION */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Full Name</label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    className="w-full h-11 text-sm pl-11 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all text-slate-800" 
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-2.5 rounded-xl">{formData.fullName || "—"}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="email" 
                  disabled 
                  value={formData.email} 
                  className="w-full h-11 text-sm pl-11 pr-4 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl cursor-not-allowed font-mono border-dashed" 
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Phone Number</label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className="w-full h-11 text-sm pl-11 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all text-slate-800" 
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-2.5 rounded-xl">{formData.phone || "—"}</p>
              )}
            </div>

            {/* Job Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Job Title</label>
              {isEditing ? (
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="job_title" 
                    value={formData.job_title} 
                    onChange={handleChange} 
                    className="w-full h-11 text-sm pl-11 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all text-slate-800" 
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-2.5 rounded-xl">{formData.job_title || "—"}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Role</label>
              {isEditing ? (
                <select 
                  name="role_choice_id" 
                  value={formData.role_choice_id || ""} 
                  onChange={handleChange} 
                  className="w-full h-11 text-sm px-4 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all font-medium cursor-pointer text-slate-800" 
                >
                  <option value="">Select an option...</option>
                  {roleChoices.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-2.5 rounded-xl">
                  {roleChoices.find(r => r.id === parseInt(formData.role_choice_id))?.name || "—"}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 3: RESEARCH INFORMATION */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Research Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Affiliation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Affiliation</label>
              {isEditing ? (
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="affiliation" 
                    value={formData.affiliation} 
                    onChange={handleChange} 
                    className="w-full h-11 text-sm pl-11 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all text-slate-800" 
                    placeholder="Institution / Affiliation" 
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-2.5 rounded-xl">{formData.affiliation || "—"}</p>
              )}
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Organization</label>
              {isEditing ? (
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="organization" 
                    value={formData.organization} 
                    onChange={handleChange} 
                    className="w-full h-11 text-sm pl-11 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all text-slate-800" 
                    placeholder="Organization" 
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-2.5 rounded-xl">{formData.organization || "—"}</p>
              )}
            </div>

            {/* Expertise */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Expertise</label>
              {isEditing ? (
                <textarea 
                  rows={4} 
                  name="expertise" 
                  value={formData.expertise} 
                  onChange={handleChange} 
                  className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all bg-white resize-none leading-relaxed text-slate-800" 
                  placeholder="Research Interests / Expertise" 
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 bg-slate-50/60 border border-slate-100 px-4 py-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {formData.expertise || "—"}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 4: DROPDOWN SELECTORS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          
          {/* Disciplines Dropdown */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Disciplines</label>
            {isEditing && (
              <select
                onChange={(e) => {
                  handleDropdownSelect("discipline_ids", e.target.value);
                  e.target.value = ""; 
                }}
                className="w-full h-11 text-sm px-4 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all font-medium cursor-pointer text-slate-800"
              >
                <option value="">Select or add a discipline...</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {/* Discipline Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(formData.discipline_ids || []).map((id) => {
                const item = disciplines.find((d) => d.id === id);
                if (!item) return null;
                return (
                  <span 
                    key={id} 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium"
                  >
                    {item.name}
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveBadge("discipline_ids", id)} 
                        className="text-slate-400 hover:text-rose-600 transition p-0.5 rounded-full hover:bg-slate-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                );
              })}
              {(formData.discipline_ids || []).length === 0 && (
                <p className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 w-full p-4 rounded-xl text-center">No academic disciplines currently attached.</p>
              )}
            </div>
          </div>

          {/* Classifications Dropdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Classifications</label>
              <span className="text-xs font-medium text-slate-400 lowercase">
                ({formData.classification_ids?.length || 0} selected, minimum 4 required)
              </span>
            </div>
            {isEditing && (
              <select
                onChange={(e) => {
                  handleDropdownSelect("classification_ids", e.target.value);
                  e.target.value = ""; 
                }}
                className="w-full h-11 text-sm px-4 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#005F87] focus:ring-4 focus:ring-[#005F87]/10 transition-all font-medium cursor-pointer text-slate-800"
              >
                <option value="">Select or add a classification...</option>
                {classifications.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Classification Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(formData.classification_ids || []).map((id) => {
                const item = classifications.find((c) => c.id === id);
                if (!item) return null;
                return (
                  <span 
                    key={id} 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/40 border border-blue-100 text-blue-800 text-sm font-medium animate-in fade-in duration-100"
                  >
                    <Tags size={14} className="text-blue-500 shrink-0" />
                    <span className="truncate">{item.name}</span>
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveBadge("classification_ids", id)} 
                        className="text-blue-400 hover:text-rose-600 transition p-0.5 rounded-full hover:bg-blue-100"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                );
              })}
              {(formData.classification_ids || []).length === 0 && (
                <p className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 w-full p-4 rounded-xl text-center">No journal subject definitions selected yet.</p>
              )}
            </div>
          </div>

        </div>

        {/* SECTION 5: BOARD SELECTIONS */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reviewer Status</h2>
          <label className="flex items-start gap-3.5 text-sm text-slate-700 select-none cursor-pointer group bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input 
              type="checkbox" 
              name="want_to_be_reviewer" 
              checked={!!formData.want_to_be_reviewer} 
              onChange={handleChange} 
              disabled={!isEditing} 
              className="w-4 h-4 mt-0.5 border-slate-300 accent-[#005F87] rounded cursor-pointer disabled:cursor-not-allowed transition" 
            />
            <span className="font-medium group-hover:text-slate-950 transition-colors">
              I am interested in being a peer reviewer
            </span>
          </label>
        </div>

        {/* SECTION 6: ACCOUNT DELETION */}
        <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
          <button 
            onClick={() => setShowDeleteModal(true)} 
            className="h-10 text-sm font-bold uppercase text-rose-600 hover:text-rose-700 transition flex items-center gap-2 rounded-xl hover:bg-rose-50 px-3 -ml-3"
          >
            <Trash2 size={15} /> Delete Account
          </button>
        </div>

        {/* DIALOG SHEET LAYER: Modal overlay wrapper */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1.5 text-left">
                  <h3 className="text-base font-bold text-slate-950">Confirm Account Deletion</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    This action will permanently delete your account and cannot be reversed.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 h-11 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount} 
                  className="flex-1 h-11 text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}