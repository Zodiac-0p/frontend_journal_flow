import { useEffect, useState } from "react";
import { 
  Settings, Loader2, Plus, Edit2, Trash2, AlertCircle 
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../layout/layout";
import profileService from "../../services/profileService";
import submissionService from "../../services/submissionService";

export default function JournalSettings() {
  const [activeTab, setActiveTab] = useState("articleTypes");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Tab definition
  const tabs = [
    { id: "articleTypes", label: "Article Types" },
    { id: "fileTypes", label: "File Types" },
    { id: "classifications", label: "Classifications" },
    { id: "roleChoices", label: "Role Choices" },
    { id: "disciplines", label: "Disciplines" },
  ];

  const fetchData = async (tab) => {
    try {
      setLoading(true);
      let data = [];
      if (tab === "articleTypes") {
        data = await submissionService.getArticleTypes();
      } else if (tab === "fileTypes") {
        data = await submissionService.getSubmissionFileTypes();
      } else if (tab === "classifications") {
        data = await profileService.getClassifications();
      } else if (tab === "roleChoices") {
        data = await profileService.getRoleChoices();
      } else if (tab === "disciplines") {
        data = await profileService.getDisciplines();
      }
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed fetching configuration data:", err);
      toast.error("Failed to load settings list.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await fetchData(activeTab);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName("");
    setIsRequired(false);
    setAllowMultiple(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setName(item.name || "");
    setIsRequired(item.is_required || false);
    setAllowMultiple(item.allow_multiple || false);
    setIsActive(item.is_active ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setLoading(true);
      const payload = { name: name.trim() };
      
      // Additional properties for specific file types
      if (activeTab === "fileTypes") {
        payload.is_required = isRequired;
        payload.allow_multiple = allowMultiple;
        payload.is_active = isActive;
      } else if (activeTab === "articleTypes" || activeTab === "classifications") {
        payload.is_active = isActive;
      }

      if (editingItem) {
        // Update Action
        if (activeTab === "articleTypes") {
          await submissionService.updateArticleType(editingItem.id, payload);
        } else if (activeTab === "fileTypes") {
          await submissionService.updateSubmissionFileType(editingItem.id, payload);
        } else if (activeTab === "classifications") {
          await profileService.updateClassification(editingItem.id, payload);
        } else if (activeTab === "roleChoices") {
          await profileService.updateRoleChoice(editingItem.id, payload);
        } else if (activeTab === "disciplines") {
          await profileService.updateDiscipline(editingItem.id, payload);
        }
        toast.success("Updated successfully");
      } else {
        // Create Action
        if (activeTab === "articleTypes") {
          await submissionService.createArticleType(payload);
        } else if (activeTab === "fileTypes") {
          await submissionService.createSubmissionFileType(payload);
        } else if (activeTab === "classifications") {
          await profileService.createClassification(payload);
        } else if (activeTab === "roleChoices") {
          await profileService.createRoleChoice(payload);
        } else if (activeTab === "disciplines") {
          await profileService.createDiscipline(payload);
        }
        toast.success("Created successfully");
      }

      setIsModalOpen(false);
      fetchData(activeTab);
    } catch (err) {
      console.error("Save config error:", err);
      toast.error("Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate/soft-delete this item? Existing user records and drafts will retain references to it.")) {
      return;
    }

    try {
      setLoading(true);
      if (activeTab === "articleTypes") {
        await submissionService.deleteArticleType(id);
      } else if (activeTab === "fileTypes") {
        await submissionService.deleteSubmissionFileType(id);
      } else if (activeTab === "classifications") {
        await profileService.deleteClassification(id);
      } else if (activeTab === "roleChoices") {
        await profileService.deleteRoleChoice(id);
      } else if (activeTab === "disciplines") {
        await profileService.deleteDiscipline(id);
      }
      toast.success("Soft deleted / Deactivated successfully");
      fetchData(activeTab);
    } catch (err) {
      console.error("Delete config error:", err);
      toast.error("Failed to delete configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)", borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: ".6px", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Platform Configuration</div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,32px)", color: "#fff", fontWeight: "600", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Settings className="animate-spin text-blue-200" size={32} style={{ animationDuration: '6s' }} />
              Journal Settings
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", fontFamily: "var(--font-sans)", margin: 0, lineHeight: "1.6", maxWidth: "600px" }}>
              Configure master journal metadata, file submission rules, discipline structures, and taxonomy classifications.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate} 
            style={{ background: "#fff", color: "var(--navy)", border: "none", borderRadius: "4px", padding: "10px 18px", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-alt)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
          >
            <Plus size={16} /> Add Configuration
          </button>
        </div>

        {/* TABS MENU */}
        <div className="border-b border-slate-200/80 mb-6 flex overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 px-4 font-bold text-xs uppercase tracking-wider transition border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#0077B6] text-[#0077B6]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LIST TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[300px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0077B6]" size={36} />
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="font-semibold text-slate-600 text-sm">No configurations found.</p>
              <p className="text-xs text-slate-400 mt-1">Click the button above to add the first item.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              
              {/* TABLE HEADER */}
              <div className="grid grid-cols-[1fr_120px_160px] bg-slate-50/50 px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <div>Name / Description</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {/* ROWS */}
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_120px_160px] items-center px-6 py-4 hover:bg-slate-50/30 transition">
                  
                  {/* Name & Flags */}
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">{item.name}</h3>
                    
                    {/* File type specific properties */}
                    {activeTab === "fileTypes" && (
                      <div className="flex gap-2 mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.is_required ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
                          {item.is_required ? "Required" : "Optional"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.allow_multiple ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-600'}`}>
                          {item.allow_multiple ? "Multiple Allowed" : "Single Upload"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {item.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                      title="Edit item"
                    >
                      <Edit2 size={13} />
                    </button>
                    {item.is_active !== false && (
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                        title="Deactivate item"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                </div>
              ))}

            </div>
          )}
        </div>

      </div>

      {/* FORM OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingItem ? "Edit Configuration" : "New Configuration"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure options for {tabs.find(t => t.id === activeTab)?.label}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Configuration Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Research Paper, Machine Learning"
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-blue-100 transition"
                  required
                />
              </div>

              {/* File Type options */}
              {activeTab === "fileTypes" && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isRequired} 
                      onChange={(e) => setIsRequired(e.target.checked)} 
                      className="accent-[#0077B6]"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-700">Required Document</p>
                      <p className="text-[10px] text-slate-400">Authors cannot complete submission without this file.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowMultiple} 
                      onChange={(e) => setAllowMultiple(e.target.checked)} 
                      className="accent-[#0077B6]"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-700">Allow Multiple Uploads</p>
                      <p className="text-[10px] text-slate-400">Authors can attach multiple files of this category.</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Status toggles for item states */}
              {(activeTab === "articleTypes" || activeTab === "fileTypes" || activeTab === "classifications") && (
                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)} 
                    className="accent-[#0077B6]"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-700">Active State</p>
                    <p className="text-[10px] text-slate-400">Allows authors to select this category options in fields.</p>
                  </div>
                </label>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="h-10 px-5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="h-10 px-5 bg-[#0077B6] hover:bg-[#005F92] text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center min-w-[80px]"
              >
                Save Choice
              </button>
            </div>

          </form>
        </div>
      )}
    </AppLayout>
  );
}
