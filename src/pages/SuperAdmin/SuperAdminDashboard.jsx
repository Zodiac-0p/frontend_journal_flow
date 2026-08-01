import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users, FileText, ShieldCheck, LogOut,
  UserCheck, UserX, TrendingUp, RefreshCw,
  Search, ToggleLeft, ToggleRight,
  Crown, Shield, BookOpen, PenTool, Eye,
  Plus, Edit2, Trash2, X,
  Layers, Tag, Award, FileCode, Database,
  Menu, Bell, Link2, ClipboardList, FilePlus
} from "lucide-react";
import { toast } from "react-hot-toast";
import superAdminService from "../../services/superAdminService";

// ─── helpers ────────────────────────────────────────────────────────────────
function roleBadge(user) {
  if (user.is_super_admin)        return { label: "Super Admin", color: "bg-red-950/60 text-red-400 border-red-800/40" };
  if (user.is_editorial_manager)  return { label: "Manager",    color: "bg-purple-950/60 text-purple-400 border-purple-800/40" };
  if (user.is_editor)             return { label: "Editor",     color: "bg-blue-950/60 text-blue-400 border-blue-800/40" };
  if (user.is_reviewer)           return { label: "Reviewer",   color: "bg-amber-950/60 text-amber-400 border-amber-800/40" };
  return                                   { label: "Author",    color: "bg-slate-800/60 text-slate-400 border-slate-700/40" };
}

function BoolDot({ value }) {
  return value
    ? <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" title="Yes" />
    : <span className="inline-block w-3 h-3 rounded-full bg-red-500/70" title="No" />;
}

const SIDEBAR_ITEMS = [
  { id: "Overview",             label: "Overview",                  icon: Database,       group: "Main",          path: "/x9-admin/dashboard" },
  { id: "Users",                label: "Users",                     icon: Users,          group: "Accounts",      path: "/x9-admin/dashboard/users" },
  { id: "RoleChoices",          label: "Role Choices",              icon: Award,          group: "Accounts",      path: "/x9-admin/dashboard/role-choices" },
  { id: "Disciplines",          label: "Disciplines",               icon: BookOpen,       group: "Accounts",      path: "/x9-admin/dashboard/disciplines" },
  { id: "ArticleTypes",         label: "Article Types",             icon: Layers,         group: "Journals",      path: "/x9-admin/dashboard/article-types" },
  { id: "Classifications",      label: "Classifications",           icon: Tag,            group: "Journals",      path: "/x9-admin/dashboard/classifications" },
  { id: "ContributorRoles",     label: "Contributor Roles",         icon: Shield,         group: "Journals",      path: "/x9-admin/dashboard/contributor-roles" },
  { id: "FileTypes",            label: "Submission File Types",     icon: FileCode,       group: "Journals",      path: "/x9-admin/dashboard/file-types" },
  { id: "SubmissionAuthors",    label: "Submission Authors",        icon: PenTool,        group: "Journals",      path: "/x9-admin/dashboard/submission-authors" },
  { id: "SubmissionFiles",      label: "Submission Files",          icon: FilePlus,       group: "Journals",      path: "/x9-admin/dashboard/submission-files" },
  { id: "ReviewerAssignments",  label: "Reviewer Assignments",      icon: Link2,          group: "Journals",      path: "/x9-admin/dashboard/reviewer-assignments" },
  { id: "ReviewerReports",      label: "Reviewer Reports",          icon: ClipboardList,  group: "Journals",      path: "/x9-admin/dashboard/reviewer-reports" },
  { id: "Submissions",          label: "Submissions",               icon: FileText,       group: "Journals",      path: "/x9-admin/dashboard/submissions" },
  { id: "Notifications",        label: "Notifications",             icon: Bell,           group: "Notifications", path: "/x9-admin/dashboard/notifications" },
];

const ROLE_FILTERS = ["all", "author", "reviewer", "editor", "editorial_manager", "super_admin"];

// ─── stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0d1327] border border-slate-800/60 rounded-xl p-5 flex items-center gap-4 shadow-lg"
    >
      <div className={`w-11 h-11 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value ?? "—"}</p>
      </div>
    </motion.div>
  );
}

// ─── Bulk Edit Modal for Django Admin Action Bar ────────────────────────────
function BulkEditModal({ isOpen, onClose, onSave, section, items, busy = false }) {
  const [formData, setFormData] = useState(() => {
    const initial = {};
    if (items) {
      items.forEach((item) => {
        initial[item.id] = { ...item };
      });
    }
    return initial;
  });

  if (!isOpen || !items || items.length === 0) return null;

  const handleChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(Object.values(formData));
  };

  const renderFieldsForItem = (item) => {
    const id = item.id;
    const current = formData[id] || {};

    if (["RoleChoices", "Disciplines", "ArticleTypes", "Classifications", "ContributorRoles"].includes(section)) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={current.name || ""}
              onChange={(e) => handleChange(id, "name", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={current.is_active !== false ? "true" : "false"}
              onChange={(e) => handleChange(id, "is_active", e.target.value === "true")}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      );
    }

    if (section === "FileTypes") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">File Type Name</label>
            <input
              type="text"
              value={current.name || ""}
              onChange={(e) => handleChange(id, "name", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Required</label>
            <select
              value={current.is_required ? "true" : "false"}
              onChange={(e) => handleChange(id, "is_required", e.target.value === "true")}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="true">Yes</option>
              <option value="false">Optional</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Allow Multiple</label>
            <select
              value={current.allow_multiple ? "true" : "false"}
              onChange={(e) => handleChange(id, "allow_multiple", e.target.value === "true")}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="true">Allowed</option>
              <option value="false">Single Only</option>
            </select>
          </div>
        </div>
      );
    }

    if (section === "Users") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              value={current.full_name || ""}
              onChange={(e) => handleChange(id, "full_name", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Country</label>
            <input
              type="text"
              value={current.country || ""}
              onChange={(e) => handleChange(id, "country", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Organization</label>
            <input
              type="text"
              value={current.organization || ""}
              onChange={(e) => handleChange(id, "organization", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={current.is_active ? "true" : "false"}
              onChange={(e) => handleChange(id, "is_active", e.target.value === "true")}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      );
    }

    if (section === "Submissions") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={current.title || ""}
              onChange={(e) => handleChange(id, "title", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={current.status || "draft"}
              onChange={(e) => handleChange(id, "status", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_editor_review">Under Editor Review</option>
              <option value="under_peer_review">Under Peer Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      );
    }

    if (section === "SubmissionAuthors") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">First Name</label>
            <input
              type="text"
              value={current.first_name || ""}
              onChange={(e) => handleChange(id, "first_name", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Last Name</label>
            <input
              type="text"
              value={current.last_name || ""}
              onChange={(e) => handleChange(id, "last_name", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={current.email || ""}
              onChange={(e) => handleChange(id, "email", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Institution</label>
            <input
              type="text"
              value={current.institution || ""}
              onChange={(e) => handleChange(id, "institution", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
        </div>
      );
    }

    if (section === "SubmissionFiles") {
      return (
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filename</label>
            <input
              type="text"
              value={current.original_filename || ""}
              onChange={(e) => handleChange(id, "original_filename", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            />
          </div>
        </div>
      );
    }

    if (section === "ReviewerAssignments") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={current.status || "pending"}
              onChange={(e) => handleChange(id, "status", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Active</label>
            <select
              value={current.is_active ? "true" : "false"}
              onChange={(e) => handleChange(id, "is_active", e.target.value === "true")}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      );
    }

    if (section === "ReviewerReports") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Recommendation</label>
            <select
              value={current.recommendation || "minor_revision"}
              onChange={(e) => handleChange(id, "recommendation", e.target.value)}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="accept">Accept</option>
              <option value="minor_revision">Minor Revision</option>
              <option value="major_revision">Major Revision</option>
              <option value="reject">Reject</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Complete</label>
            <select
              value={current.review_report_complete ? "true" : "false"}
              onChange={(e) => handleChange(id, "review_report_complete", e.target.value === "true")}
              className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      );
    }

    if (section === "Notifications") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={current.title || ""}
                onChange={(e) => handleChange(id, "title", e.target.value)}
                className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Read Status</label>
              <select
                value={current.is_read ? "true" : "false"}
                onChange={(e) => handleChange(id, "is_read", e.target.value === "true")}
                className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
              >
                <option value="true">Read</option>
                <option value="false">Unread</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Message</label>
            <textarea
              rows={3}
              value={current.message || ""}
              onChange={(e) => handleChange(id, "message", e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 rounded p-2.5 text-xs text-white outline-none focus:border-slate-500 transition-colors"
              placeholder="Notification message..."
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Name / Title</label>
        <input
          type="text"
          value={current.name || current.title || ""}
          onChange={(e) => handleChange(id, current.name !== undefined ? "name" : "title", e.target.value)}
          className="w-full h-9 bg-[#111827] border border-slate-700 rounded px-2.5 text-xs text-white"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0d1327] border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Selected Items ({items.length})</h3>
            <p className="text-xs text-slate-400 mt-0.5">Edit contents below and click save to apply changes across all selected items.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-[#111827]/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  #{idx + 1} — ID: {item.id} ({item.name || item.title || item.email || item.original_filename || "Item"})
                </span>
              </div>
              {renderFieldsForItem(item)}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {busy ? "Saving All..." : `Save Changes (${items.length})`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── generic modal for master data CRUD ─────────────────────────────────────
function ItemModal({ onClose, onSave, initialName = "", title = "Add Item", busy = false }) {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0d1327] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name..."
              className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" autoFocus />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">{busy ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── file type modal (with checkboxes) ──────────────────────────────────────
function FileTypeModal({ onClose, onSave, initialData = null, title = "Add File Type", busy = false }) {
  const [name, setName] = useState(initialData?.name || "");
  const [isRequired, setIsRequired] = useState(!!initialData?.is_required);
  const [allowMultiple, setAllowMultiple] = useState(initialData ? !!initialData.allow_multiple : true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    onSave({ name: name.trim(), is_required: isRequired, allow_multiple: allowMultiple });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1327] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">File Type Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manuscript, Cover Letter..."
              className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" autoFocus />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input id="is_required_chk" type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
            <label htmlFor="is_required_chk" className="text-sm text-slate-300 cursor-pointer">Required for submission</label>
          </div>
          <div className="flex items-center gap-3">
            <input id="allow_mult_chk" type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
            <label htmlFor="allow_mult_chk" className="text-sm text-slate-300 cursor-pointer">Allow multiple files</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">{busy ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── create user modal ──────────────────────────────────────────────────────
function CreateUserModal({ onClose, onSave, busy = false }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole]         = useState("author");
  const [org, setOrg]           = useState("");
  const [affil, setAffil]       = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) { toast.error("Email, Password, and Full Name are required"); return; }
    onSave({ email: email.trim(), password, full_name: fullName.trim(), role, organization: org.trim(), affiliation: affil.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1327] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Create New User Account</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Full Name *</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Doe"
                className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Email Address *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@university.edu"
                className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Password *</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Strong password..."
                className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" required autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white outline-none focus:border-red-600 transition-colors">
                <option value="author">Author</option>
                <option value="reviewer">Reviewer</option>
                <option value="editor">Editor</option>
                <option value="editorial_manager">Editorial Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Organization</label>
              <input type="text" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="University / Institute"
                className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Affiliation</label>
              <input type="text" value={affil} onChange={(e) => setAffil(e.target.value)} placeholder="Department..."
                className="w-full h-11 bg-[#111827] border border-slate-700/60 rounded-lg px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-600 transition-colors" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">{busy ? "Creating..." : "Create User"}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Django Admin Action Bar ───────────────────────────────────────────────
function DjangoActionBar({ totalCount, selectedIds, onSelectAll, onClearAll, onRunAction, actions = [] }) {
  const [selectedAction, setSelectedAction] = useState("");

  const handleRun = () => {
    if (!selectedAction || selectedIds.length === 0) return;
    onRunAction(selectedAction, selectedIds);
    setSelectedAction("");
  };

  const allSelected = totalCount > 0 && selectedIds.length === totalCount;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1327] border border-slate-800/60 rounded-xl p-3 shadow-lg">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => e.target.checked ? onSelectAll() : onClearAll()}
            className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0"
          />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Action:</span>
        </div>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="h-9 bg-[#111827] border border-slate-700/60 rounded px-3 text-xs text-white outline-none cursor-pointer"
        >
          <option value="">---------</option>
          {actions.map((act) => (
            <option key={act.value} value={act.value}>{act.label}</option>
          ))}
        </select>
        <button
          onClick={handleRun}
          disabled={!selectedAction || selectedIds.length === 0}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-semibold rounded border border-slate-700/60 transition-colors"
        >
          Run
        </button>
        <span className="text-xs text-slate-400 font-medium ml-1">
          {selectedIds.length} of {totalCount} selected
        </span>
      </div>
    </div>
  );
}

// ─── generic master data table ──────────────────────────────────────────────
function MasterDataTable({ items, loading, title, onAdd, onEdit, onDelete, onBulkEdit, searchPlaceholder = "Search items..." }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const filtered = items.filter((item) => item.name?.toLowerCase().includes(query.toLowerCase()));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const selectAll = () => setSelectedIds(filtered.map((i) => i.id));
  const clearAll = () => setSelectedIds([]);

  const handleRunBulkAction = async (action, ids) => {
    if (action === "delete") {
      if (!window.confirm(`Delete ${ids.length} selected item(s)?`)) return;
      for (const id of ids) {
        if (onDelete) await onDelete(id, true);
      }
      clearAll();
    } else if (action === "edit" && onBulkEdit) {
      const selectedItems = items.filter((i) => ids.includes(i.id));
      onBulkEdit(selectedItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder}
            className="w-full h-10 bg-[#0d1327] border border-slate-800/60 rounded-lg pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-600 transition-colors" />
        </div>
        {onAdd && (
          <button onClick={onAdd}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-red-950/40">
            <Plus size={16} /> Add {title}
          </button>
        )}
      </div>

      {(onDelete || onBulkEdit) && (
        <DjangoActionBar
          totalCount={filtered.length}
          selectedIds={selectedIds}
          onSelectAll={selectAll}
          onClearAll={clearAll}
          onRunAction={handleRunBulkAction}
          actions={[
            { value: "delete", label: `Delete selected ${title}s` },
            { value: "edit", label: `Edit selected ${title}s` },
          ]}
        />
      )}

      <div className="bg-[#0d1327] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600 text-sm"><RefreshCw size={16} className="animate-spin mr-2" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">No items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={(e) => e.target.checked ? selectAll() : clearAll()}
                      className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  {(onEdit || onDelete) && <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white">{item.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.is_active !== false ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" : "bg-slate-800/60 text-slate-500 border-slate-700/40"}`}>
                        {item.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {(onEdit || onDelete) && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors" title="Edit"><Edit2 size={14} /></button>}
                          {onDelete && <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── generic Admin DataTable (with search, bulk actions & delete) ────────────
function AdminDataTable({ columns, rows, loading, emptyMsg = "No data found.", onDelete, onEdit, onBulkEdit, searchPlaceholder = "Search...", title = "item" }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = rows.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(q));
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const selectAll = () => setSelectedIds(filtered.map((i) => i.id).filter(Boolean));
  const clearAll = () => setSelectedIds([]);

  const handleRunBulkAction = async (action, ids) => {
    if (action === "delete" && onDelete) {
      if (!window.confirm(`Permanently delete ${ids.length} selected ${title}(s)?`)) return;
      for (const id of ids) {
        await onDelete(id, true);
      }
      clearAll();
    } else if (action === "edit" && onBulkEdit) {
      const selectedItems = rows.filter((r) => ids.includes(r.id));
      onBulkEdit(selectedItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder}
            className="w-full h-10 bg-[#0d1327] border border-slate-800/60 rounded-lg pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-600 transition-colors" />
        </div>
      </div>

      {(onDelete || onBulkEdit) && (
        <DjangoActionBar
          totalCount={filtered.length}
          selectedIds={selectedIds}
          onSelectAll={selectAll}
          onClearAll={clearAll}
          onRunAction={handleRunBulkAction}
          actions={[
            { value: "delete", label: `Delete selected ${title}s` },
            { value: "edit", label: `Edit selected ${title}s` },
          ]}
        />
      )}

      <div className="bg-[#0d1327] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600 text-sm"><RefreshCw size={16} className="animate-spin mr-2" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">{emptyMsg}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {onDelete && (
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onChange={(e) => e.target.checked ? selectAll() : clearAll()}
                        className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th key={col.key} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{col.label}</th>
                  ))}
                  {(onDelete || onEdit) && <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-slate-800/20 transition-colors">
                    {onDelete && (
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={row.id ? selectedIds.includes(row.id) : false} onChange={() => row.id && toggleSelect(row.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                        {col.render ? col.render(row) : (row[col.key] ?? "—")}
                      </td>
                    ))}
                    {(onDelete || onEdit) && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onEdit && row.id && (
                            <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {onDelete && row.id && (
                            <button onClick={() => onDelete(row.id)} className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  // Sync current section from URL path
  const currentPath = location.pathname.replace(/\/$/, ""); // remove trailing slash
  const activeItem = SIDEBAR_ITEMS.find((i) => i.path === currentPath) || SIDEBAR_ITEMS[0];
  const activeSection = activeItem.id;

  // Stats
  const [stats, setStats]               = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users
  const [users, setUsers]                           = useState([]);
  const [roleFilter, setRole]                       = useState("all");
  const [userSearch, setUserSearch]                 = useState("");
  const [selectedUserIds, setSelectedUserIds]       = useState([]);
  const [loadingUsers, setLoadingUsers]             = useState(false);
  const [actionUserId, setActionUserId]             = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [busyCreateUser, setBusyCreateUser]         = useState(false);

  // Master Data
  const [roleChoices, setRoleChoices]           = useState([]);
  const [disciplines, setDisciplines]           = useState([]);
  const [articleTypes, setArticleTypes]         = useState([]);
  const [classifications, setClassifications]   = useState([]);
  const [contributorRoles, setContributorRoles] = useState([]);
  const [fileTypes, setFileTypes]               = useState([]);
  const [loadingMaster, setLoadingMaster]       = useState(false);

  // Submissions
  const [submissions, setSubmissions]               = useState([]);
  const [statusFilter, setStatusFilter]             = useState("");
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // New Sections Data
  const [submissionAuthors, setSubmissionAuthors]       = useState([]);
  const [submissionFiles, setSubmissionFiles]           = useState([]);
  const [reviewerAssignments, setReviewerAssignments]   = useState([]);
  const [reviewerReports, setReviewerReports]           = useState([]);
  const [notifications, setNotifications]               = useState([]);
  const [loadingSection, setLoadingSection]             = useState(false);
  const [assignmentFilter, setAssignmentFilter]         = useState("accepted");

  // Modals
  const [modalOpen, setModalOpen]             = useState(false);
  const [modalTitle, setModalTitle]           = useState("");
  const [editingItem, setEditingItem]         = useState(null);
  const [modalType, setModalType]             = useState("");
  const [busyModal, setBusyModal]             = useState(false);
  const [fileModalOpen, setFileModalOpen]     = useState(false);
  const [fileModalTitle, setFileModalTitle]   = useState("");
  const [editingFileType, setEditingFileType] = useState(null);
  const [busyFileModal, setBusyFileModal]     = useState(false);

  // Bulk Edit Modal
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditSection, setBulkEditSection]     = useState("");
  const [bulkEditItems, setBulkEditItems]         = useState([]);
  const [busyBulkEdit, setBusyBulkEdit]           = useState(false);

  const currentUser = superAdminService.getCurrentUser();

  // Redirect if not super admin
  useEffect(() => {
    if (!superAdminService.isSuperAdmin()) navigate("/x9-admin", { replace: true });
  }, [navigate]);

  // Refs for manual refresh
  const fetchStatsRef       = useRef(null);
  const fetchUsersRef       = useRef(null);
  const fetchMasterRef      = useRef(null);
  const fetchSubmissionsRef = useRef(null);
  const fetchSectionRef     = useRef(null);

  // 1. Stats
  useEffect(() => {
    let c = false;
    async function run() {
      setLoadingStats(true);
      try { const d = await superAdminService.getStats(); if (!c) setStats(d); }
      catch { if (!c) toast.error("Failed to load stats."); }
      finally { if (!c) setLoadingStats(false); }
    }
    run(); fetchStatsRef.current = run;
    return () => { c = true; };
  }, []);

  // 2. Users
  useEffect(() => {
    if (activeSection !== "Users") return;
    let c = false;
    async function run() {
      setLoadingUsers(true);
      try { const d = await superAdminService.getUsers(roleFilter === "all" ? "" : roleFilter); if (!c) setUsers(d); }
      catch { if (!c) toast.error("Failed to load users."); }
      finally { if (!c) setLoadingUsers(false); }
    }
    run(); fetchUsersRef.current = run;
    return () => { c = true; };
  }, [activeSection, roleFilter]);

  // 3. Master Data
  useEffect(() => {
    const masterSections = ["RoleChoices", "Disciplines", "ArticleTypes", "Classifications", "ContributorRoles", "FileTypes"];
    if (!masterSections.includes(activeSection)) return;
    let c = false;
    async function run() {
      setLoadingMaster(true);
      try {
        let res;
        if (activeSection === "RoleChoices")      res = await superAdminService.getRoleChoices();
        else if (activeSection === "Disciplines")      res = await superAdminService.getDisciplines();
        else if (activeSection === "ArticleTypes")     res = await superAdminService.getArticleTypes();
        else if (activeSection === "Classifications")  res = await superAdminService.getClassifications();
        else if (activeSection === "ContributorRoles") res = await superAdminService.getContributorRoles();
        else if (activeSection === "FileTypes")        res = await superAdminService.getFileTypes();
        if (!c) {
          if (activeSection === "RoleChoices") setRoleChoices(res);
          else if (activeSection === "Disciplines") setDisciplines(res);
          else if (activeSection === "ArticleTypes") setArticleTypes(res);
          else if (activeSection === "Classifications") setClassifications(res);
          else if (activeSection === "ContributorRoles") setContributorRoles(res);
          else if (activeSection === "FileTypes") setFileTypes(res);
        }
      } catch { if (!c) toast.error(`Failed to load ${activeSection}`); }
      finally { if (!c) setLoadingMaster(false); }
    }
    run(); fetchMasterRef.current = run;
    return () => { c = true; };
  }, [activeSection]);

  // 4. Submissions
  useEffect(() => {
    if (activeSection !== "Submissions") return;
    let c = false;
    async function run() {
      setLoadingSubmissions(true);
      try { const d = await superAdminService.getSubmissions(statusFilter); if (!c) setSubmissions(d); }
      catch { if (!c) toast.error("Failed to load submissions."); }
      finally { if (!c) setLoadingSubmissions(false); }
    }
    run(); fetchSubmissionsRef.current = run;
    return () => { c = true; };
  }, [activeSection, statusFilter]);

  // 5. New Sections (SubmissionAuthors, SubmissionFiles, ReviewerAssignments, ReviewerReports, Notifications)
  useEffect(() => {
    const newSections = ["SubmissionAuthors", "SubmissionFiles", "ReviewerAssignments", "ReviewerReports", "Notifications"];
    if (!newSections.includes(activeSection)) return;
    let c = false;
    async function run() {
      setLoadingSection(true);
      try {
        if (activeSection === "SubmissionAuthors") {
          const subs = await superAdminService.getSubmissions();
          const allAuthors = [];
          for (const sub of subs) {
            if (sub.authors && sub.authors.length > 0) {
              for (const a of sub.authors) {
                allAuthors.push({ ...a, submission_title: sub.title || "Untitled", submission_id: sub.id });
              }
            }
          }
          if (!c) setSubmissionAuthors(allAuthors);
        } else if (activeSection === "SubmissionFiles") {
          const subs = await superAdminService.getSubmissions();
          const allFiles = [];
          for (const sub of subs) {
            if (sub.submission_files && sub.submission_files.length > 0) {
              for (const f of sub.submission_files) {
                allFiles.push({ ...f, submission_title: sub.title || "Untitled", submission_id: sub.id });
              }
            }
          }
          if (!c) setSubmissionFiles(allFiles);
        } else if (activeSection === "ReviewerAssignments") {
          const d = await superAdminService.getReviewerAssignments(assignmentFilter);
          if (!c) setReviewerAssignments(d);
        } else if (activeSection === "ReviewerReports") {
          const d = await superAdminService.getReviewReports();
          if (!c) setReviewerReports(d);
        } else if (activeSection === "Notifications") {
          const d = await superAdminService.getNotifications();
          if (!c) setNotifications(d);
        }
      } catch { if (!c) toast.error(`Failed to load ${activeSection}`); }
      finally { if (!c) setLoadingSection(false); }
    }
    run(); fetchSectionRef.current = run;
    return () => { c = true; };
  }, [activeSection, assignmentFilter]);

  // User Actions
  const toggleManager = async (userId) => {
    try { setActionUserId(userId); await superAdminService.toggleManager(userId); toast.success("Role updated."); fetchUsersRef.current?.(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed."); } finally { setActionUserId(null); }
  };
  const toggleActive = async (userId) => {
    try { setActionUserId(userId); await superAdminService.toggleActive(userId); toast.success("Account status updated."); fetchUsersRef.current?.(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed."); } finally { setActionUserId(null); }
  };
  const deleteUser = async (userId, email, silent = false) => {
    if (!silent && !window.confirm(`Permanently delete user ${email}? This cannot be undone.`)) return;
    try { setActionUserId(userId); await superAdminService.deleteUser(userId); toast.success("User deleted."); fetchUsersRef.current?.(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed to delete."); } finally { setActionUserId(null); }
  };
  const handleCreateUser = async (data) => {
    try { setBusyCreateUser(true); await superAdminService.createUser(data); toast.success("User created!"); setShowCreateUserModal(false); fetchUsersRef.current?.(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed to create user."); } finally { setBusyCreateUser(false); }
  };

  // Bulk User Actions (Django Admin style)
  const handleRunBulkUserAction = async (action, ids) => {
    if (action === "delete") {
      if (!window.confirm(`Permanently delete ${ids.length} selected user(s)?`)) return;
      for (const id of ids) {
        await deleteUser(id, "", true);
      }
      setSelectedUserIds([]);
    } else if (action === "edit") {
      const selectedUsers = users.filter((u) => ids.includes(u.id));
      handleOpenBulkEdit("Users", selectedUsers);
    } else if (action === "activate" || action === "deactivate") {
      for (const id of ids) {
        await toggleActive(id);
      }
      setSelectedUserIds([]);
    }
  };

  // Generic Deletion for ALL Admin List items (FULL CONTROLS)
  const handleAdminDelete = async (section, id, silent = false) => {
    if (!silent && !window.confirm("Permanently delete this item? This cannot be undone.")) return;
    try {
      if (section === "Submissions") await superAdminService.deleteSubmission(id);
      else if (section === "SubmissionAuthors") await superAdminService.deleteSubmissionAuthor(id);
      else if (section === "SubmissionFiles") await superAdminService.deleteSubmissionFile(id);
      else if (section === "ReviewerAssignments") await superAdminService.deleteReviewerAssignment(id);
      else if (section === "ReviewerReports") await superAdminService.deleteReviewReport(id);
      else if (section === "Notifications") await superAdminService.deleteNotification(id);
      if (!silent) toast.success("Deleted successfully.");
      refreshCurrent();
    } catch (e) {
      if (!silent) toast.error(e.response?.data?.detail || "Delete failed.");
    }
  };

  // Open Bulk Edit modal for any section
  const handleOpenBulkEdit = (section, items) => {
    setBulkEditSection(section);
    setBulkEditItems(items);
    setBulkEditModalOpen(true);
  };

  // Save Bulk Edit changes
  const handleSaveBulkEdit = async (updatedItems) => {
    try {
      setBusyBulkEdit(true);
      const fns = {
        RoleChoices:          (id, data) => superAdminService.updateRoleChoice(id, data),
        Disciplines:          (id, data) => superAdminService.updateDiscipline(id, data),
        ArticleTypes:         (id, data) => superAdminService.updateArticleType(id, data),
        Classifications:      (id, data) => superAdminService.updateClassification(id, data),
        ContributorRoles:     (id, data) => superAdminService.updateContributorRole(id, data),
        FileTypes:            (id, data) => superAdminService.updateFileType(id, data),
        Users:                (id, data) => superAdminService.updateUser(id, data),
        Submissions:          (id, data) => superAdminService.updateSubmission(id, data),
        SubmissionAuthors:    (id, data) => superAdminService.updateSubmissionAuthor(id, data),
        SubmissionFiles:      (id, data) => superAdminService.updateSubmissionFile(id, data),
        ReviewerAssignments:  (id, data) => superAdminService.updateReviewerAssignment(id, data),
        ReviewerReports:      (id, data) => superAdminService.updateReviewReport(id, data),
        Notifications:        (id, data) => superAdminService.updateNotification(id, data),
      };
      const fn = fns[bulkEditSection];
      for (const item of updatedItems) {
        if (fn) await fn(item.id, item);
      }
      toast.success(`Successfully updated ${updatedItems.length} item(s)!`);
      setBulkEditModalOpen(false);
      refreshCurrent();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save some items.");
    } finally {
      setBusyBulkEdit(false);
    }
  };

  // Master Data Modal Actions
  const openAddItemModal = (type, label) => { setModalType(type); setEditingItem(null); setModalTitle(`Add ${label}`); setModalOpen(true); };
  const openEditItemModal = (type, label, item) => { setModalType(type); setEditingItem(item); setModalTitle(`Edit ${label}`); setModalOpen(true); };

  const handleSaveItemModal = async (name) => {
    try {
      setBusyModal(true);
      const fns = {
        RoleChoices:      { create: superAdminService.createRoleChoice, update: superAdminService.updateRoleChoice },
        Disciplines:      { create: superAdminService.createDiscipline, update: superAdminService.updateDiscipline },
        ArticleTypes:     { create: superAdminService.createArticleType, update: superAdminService.updateArticleType },
        Classifications:  { create: superAdminService.createClassification, update: superAdminService.updateClassification },
        ContributorRoles: { create: superAdminService.createContributorRole, update: superAdminService.updateContributorRole },
      };
      const fn = fns[modalType];
      if (editingItem) await fn.update(editingItem.id, { name }); else await fn.create(name);
      toast.success("Saved."); setModalOpen(false); fetchMasterRef.current?.();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed."); } finally { setBusyModal(false); }
  };

  const handleDeleteItem = async (type, id, silent = false) => {
    if (!silent && !window.confirm("Delete/deactivate this item?")) return;
    try {
      const fns = { RoleChoices: superAdminService.deleteRoleChoice, Disciplines: superAdminService.deleteDiscipline, ArticleTypes: superAdminService.deleteArticleType, Classifications: superAdminService.deleteClassification, ContributorRoles: superAdminService.deleteContributorRole, FileTypes: superAdminService.deleteFileType };
      await fns[type](id); toast.success("Item deleted/deactivated."); fetchMasterRef.current?.();
    } catch (e) { toast.error(e.response?.data?.detail || "Delete failed."); }
  };

  // File Type Modal
  const openAddFileModal = () => { setEditingFileType(null); setFileModalTitle("Add Submission File Type"); setFileModalOpen(true); };
  const openEditFileModal = (ft) => { setEditingFileType(ft); setFileModalTitle("Edit Submission File Type"); setFileModalOpen(true); };
  const handleSaveFileModal = async (data) => {
    try { setBusyFileModal(true); if (editingFileType) await superAdminService.updateFileType(editingFileType.id, data); else await superAdminService.createFileType(data); toast.success("Saved."); setFileModalOpen(false); fetchMasterRef.current?.(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed."); } finally { setBusyFileModal(false); }
  };

  const handleLogout = () => superAdminService.logout();

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const refreshCurrent = () => {
    if (activeSection === "Overview") fetchStatsRef.current?.();
    else if (activeSection === "Users") fetchUsersRef.current?.();
    else if (activeSection === "Submissions") fetchSubmissionsRef.current?.();
    else if (["SubmissionAuthors", "SubmissionFiles", "ReviewerAssignments", "ReviewerReports", "Notifications"].includes(activeSection)) fetchSectionRef.current?.();
    else fetchMasterRef.current?.();
    toast.success("Refreshed");
  };

  return (
    <div className="min-h-screen bg-[#080d1b] text-white font-sans flex flex-col md:flex-row">

      {/* ── Mobile Header ──────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-[#080d1b]/95 backdrop-blur border-b border-slate-800/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-400 hover:text-white"><Menu size={20} /></button>
          <span className="font-bold text-sm text-white">Django Site Administration</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"><LogOut size={14} /> Logout</button>
      </header>

      {/* ── Left Sidebar ───────────────────────────────────────── */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0d1327] border-r border-slate-800/60 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center">
              <Crown size={16} className="text-red-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">Django Admin</span>
              <span className="text-[10px] text-red-400/80 uppercase font-bold tracking-wider">Site Administration</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {["Main", "Accounts", "Journals", "Notifications"].map((groupName) => {
            const groupItems = SIDEBAR_ITEMS.filter((i) => i.group === groupName);
            if (groupItems.length === 0) return null;
            return (
              <div key={groupName}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">{groupName}</p>
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button key={item.id} onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-red-700/90 text-white shadow-lg shadow-red-950/50 border border-red-600/40" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}>
                        <Icon size={17} className={isActive ? "text-white" : "text-slate-500"} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-slate-400 truncate max-w-[150px]">{currentUser?.email}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-950/60 text-red-400 border border-red-800/40 rounded">SA</span>
          </div>
          <button onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-red-950/40 hover:text-red-400 text-slate-400 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
            <LogOut size={14} /> End Session
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">

        {/* Django Admin Breadcrumb Bar */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 pb-3 border-b border-slate-800/60 font-medium">
          <span className="text-red-400 hover:underline cursor-pointer" onClick={() => navigate("/x9-admin/dashboard")}>Home</span>
          <span>›</span>
          <span className="uppercase tracking-wider text-[11px] text-slate-500">{activeItem.group}</span>
          <span>›</span>
          <span className="text-white font-semibold">{activeItem.label}</span>
        </div>

        {/* Title bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {activeSection === "Overview" ? "Site administration" : `Select ${activeItem.label.toLowerCase().replace(/s$/, "")} to change`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refreshCurrent}
              className="px-3 py-2 bg-[#0d1327] hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {activeSection === "Overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Users size={14} /> User Accounts</h2>
              {loadingStats ? (
                <div className="flex items-center gap-2 text-slate-600 text-sm py-8"><RefreshCw size={16} className="animate-spin" /> Loading stats…</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard icon={Users}      label="Total Users"   value={stats?.users?.total}        color="bg-slate-800/80 text-slate-400" />
                  <StatCard icon={PenTool}    label="Authors"       value={stats?.users?.authors}      color="bg-slate-800/80 text-slate-400" />
                  <StatCard icon={Eye}        label="Reviewers"     value={stats?.users?.reviewers}    color="bg-amber-950/60 text-amber-400" />
                  <StatCard icon={BookOpen}   label="Editors"       value={stats?.users?.editors}      color="bg-blue-950/60 text-blue-400" />
                  <StatCard icon={Shield}     label="Managers"      value={stats?.users?.managers}     color="bg-purple-950/60 text-purple-400" />
                  <StatCard icon={Crown}      label="Super Admins"  value={stats?.users?.super_admins} color="bg-red-950/60 text-red-400" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><FileText size={14} /> Submissions Pipeline</h2>
              {loadingStats ? (
                <div className="flex items-center gap-2 text-slate-600 text-sm py-8"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <StatCard icon={FileText}   label="Total"         value={stats?.submissions?.total}        color="bg-slate-800/80 text-slate-400" />
                  <StatCard icon={FileText}   label="Draft"         value={stats?.submissions?.draft}        color="bg-slate-800/80 text-slate-400" />
                  <StatCard icon={TrendingUp} label="Submitted"     value={stats?.submissions?.submitted}    color="bg-blue-950/60 text-blue-400" />
                  <StatCard icon={TrendingUp} label="Under Review"  value={stats?.submissions?.under_review} color="bg-amber-950/60 text-amber-400" />
                  <StatCard icon={UserCheck}  label="Accepted"      value={stats?.submissions?.accepted}     color="bg-emerald-950/60 text-emerald-400" />
                  <StatCard icon={UserX}      label="Rejected"      value={stats?.submissions?.rejected}     color="bg-red-950/60 text-red-400" />
                  <StatCard icon={ShieldCheck}label="Published"     value={stats?.submissions?.published}    color="bg-purple-950/60 text-purple-400" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ USERS (Expanded Django-style) ══════════════ */}
        {activeSection === "Users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name or email…"
                    className="w-full h-10 bg-[#0d1327] border border-slate-800/60 rounded-lg pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-600 transition-colors" />
                </div>
                <select value={roleFilter} onChange={(e) => setRole(e.target.value)}
                  className="h-10 bg-[#0d1327] border border-slate-800/60 rounded-lg px-3 pr-8 text-sm text-white outline-none cursor-pointer">
                  {ROLE_FILTERS.map((r) => (
                    <option key={r} value={r}>{r === "all" ? "All Roles" : r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-red-950/40">
                <Plus size={16} /> Add User
              </button>
            </div>

            <DjangoActionBar
              totalCount={filteredUsers.length}
              selectedIds={selectedUserIds}
              onSelectAll={() => setSelectedUserIds(filteredUsers.map((u) => u.id))}
              onClearAll={() => setSelectedUserIds([])}
              onRunAction={handleRunBulkUserAction}
              actions={[
                { value: "delete", label: "Delete selected users" },
                { value: "edit", label: "Edit selected users" },
                { value: "activate", label: "Activate selected users" },
                { value: "deactivate", label: "Deactivate selected users" },
              ]}
            />

            <div className="bg-[#0d1327] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-16 text-slate-600 text-sm"><RefreshCw size={16} className="animate-spin mr-2" /> Loading users…</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-slate-600 text-sm">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="w-10 px-4 py-3">
                          <input type="checkbox" checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                            onChange={(e) => e.target.checked ? setSelectedUserIds(filteredUsers.map((u) => u.id)) : setSelectedUserIds([])}
                            className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Email</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Full Name</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Country</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Primary Role</th>
                        <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Email Verified</th>
                        <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Is Reviewer</th>
                        <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Is Editor</th>
                        <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Is Manager</th>
                        <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Is Super Admin</th>
                        <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Active</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Created At</th>
                        <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredUsers.map((user) => {
                        const isMe = user.id === currentUser?.id;
                        const busy = actionUserId === user.id;
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <tr key={user.id} className={`hover:bg-slate-800/20 transition-colors ${isSelected ? "bg-slate-800/30" : ""}`}>
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={isSelected}
                                onChange={() => setSelectedUserIds((prev) => isSelected ? prev.filter((i) => i !== user.id) : [...prev, user.id])}
                                className="w-4 h-4 rounded border-slate-700 bg-[#111827] text-red-600 focus:ring-0" />
                            </td>
                            <td className="px-4 py-3 text-blue-400 font-medium text-xs whitespace-nowrap">{user.email}</td>
                            <td className="px-4 py-3 text-white text-xs whitespace-nowrap">{user.full_name || "—"}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{user.country || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleBadge(user).color}`}>{user.primary_role?.replace("_", " ")}</span>
                            </td>
                            <td className="px-3 py-3 text-center"><BoolDot value={user.is_email_verified} /></td>
                            <td className="px-3 py-3 text-center"><BoolDot value={user.is_reviewer} /></td>
                            <td className="px-3 py-3 text-center"><BoolDot value={user.is_editor} /></td>
                            <td className="px-3 py-3 text-center"><BoolDot value={user.is_editorial_manager} /></td>
                            <td className="px-3 py-3 text-center"><BoolDot value={user.is_super_admin} /></td>
                            <td className="px-3 py-3 text-center"><BoolDot value={user.is_active} /></td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{user.created_at ? new Date(user.created_at).toLocaleString() : "—"}</td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {isMe || user.is_super_admin ? (
                                <span className="text-xs text-slate-600 italic">Protected</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => handleOpenBulkEdit("Users", [user])} disabled={busy} title="Edit User"
                                    className="p-1.5 rounded text-xs border transition-colors disabled:opacity-50 bg-slate-800/60 hover:bg-slate-700 text-slate-300 border-slate-700/40">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => toggleManager(user.id)} disabled={busy} title={user.is_editorial_manager ? "Remove Manager" : "Make Manager"}
                                    className={`p-1.5 rounded text-xs border transition-colors disabled:opacity-50 ${user.is_editorial_manager ? "bg-purple-950/60 text-purple-400 border-purple-800/40" : "bg-slate-800/60 text-slate-400 border-slate-700/40"}`}>
                                    {user.is_editorial_manager ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                  </button>
                                  <button onClick={() => toggleActive(user.id)} disabled={busy} title={user.is_active ? "Deactivate" : "Activate"}
                                    className={`p-1.5 rounded text-xs border transition-colors disabled:opacity-50 ${user.is_active ? "bg-red-950/60 text-red-400 border-red-800/40" : "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"}`}>
                                    {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                  </button>
                                  <button onClick={() => deleteUser(user.id, user.email)} disabled={busy} title="Delete"
                                    className="p-1.5 rounded bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/40 transition-colors disabled:opacity-50">
                                    <Trash2 size={14} />
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
              <div className="px-5 py-3 border-t border-slate-800/60 text-xs text-slate-500">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
        )}

        {/* ══════════════ MASTER DATA SECTIONS ══════════════ */}
        {activeSection === "RoleChoices" && <MasterDataTable items={roleChoices} loading={loadingMaster} title="Role Choice" onAdd={() => openAddItemModal("RoleChoices", "Role Choice")} onEdit={(item) => openEditItemModal("RoleChoices", "Role Choice", item)} onDelete={(id, silent) => handleDeleteItem("RoleChoices", id, silent)} onBulkEdit={(items) => handleOpenBulkEdit("RoleChoices", items)} />}
        {activeSection === "Disciplines" && <MasterDataTable items={disciplines} loading={loadingMaster} title="Discipline" onAdd={() => openAddItemModal("Disciplines", "Discipline")} onEdit={(item) => openEditItemModal("Disciplines", "Discipline", item)} onDelete={(id, silent) => handleDeleteItem("Disciplines", id, silent)} onBulkEdit={(items) => handleOpenBulkEdit("Disciplines", items)} />}
        {activeSection === "ArticleTypes" && <MasterDataTable items={articleTypes} loading={loadingMaster} title="Article Type" onAdd={() => openAddItemModal("ArticleTypes", "Article Type")} onEdit={(item) => openEditItemModal("ArticleTypes", "Article Type", item)} onDelete={(id, silent) => handleDeleteItem("ArticleTypes", id, silent)} onBulkEdit={(items) => handleOpenBulkEdit("ArticleTypes", items)} />}
        {activeSection === "Classifications" && <MasterDataTable items={classifications} loading={loadingMaster} title="Classification" onAdd={() => openAddItemModal("Classifications", "Classification")} onEdit={(item) => openEditItemModal("Classifications", "Classification", item)} onDelete={(id, silent) => handleDeleteItem("Classifications", id, silent)} onBulkEdit={(items) => handleOpenBulkEdit("Classifications", items)} />}
        {activeSection === "ContributorRoles" && <MasterDataTable items={contributorRoles} loading={loadingMaster} title="Contributor Role" onAdd={() => openAddItemModal("ContributorRoles", "Contributor Role")} onEdit={(item) => openEditItemModal("ContributorRoles", "Contributor Role", item)} onDelete={(id, silent) => handleDeleteItem("ContributorRoles", id, silent)} onBulkEdit={(items) => handleOpenBulkEdit("ContributorRoles", items)} />}

        {/* ══════════════ FILE TYPES ══════════════ */}
        {activeSection === "FileTypes" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={openAddFileModal} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-950/40">
                <Plus size={16} /> Add File Type
              </button>
            </div>
            <AdminDataTable loading={loadingMaster} rows={fileTypes} emptyMsg="No file types found." title="file type"
              onDelete={(id, silent) => handleDeleteItem("FileTypes", id, silent)}
              onEdit={openEditFileModal}
              onBulkEdit={(items) => handleOpenBulkEdit("FileTypes", items)}
              columns={[
                { key: "name", label: "File Type Name", render: (r) => <span className="font-medium text-white">{r.name}</span> },
                { key: "is_required", label: "Required", render: (r) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${r.is_required ? "bg-red-950/60 text-red-400 border-red-800/40" : "bg-slate-800/60 text-slate-500 border-slate-700/40"}`}>{r.is_required ? "Yes" : "Optional"}</span> },
                { key: "allow_multiple", label: "Multiple", render: (r) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${r.allow_multiple ? "bg-blue-950/60 text-blue-400 border-blue-800/40" : "bg-slate-800/60 text-slate-500 border-slate-700/40"}`}>{r.allow_multiple ? "Allowed" : "Single"}</span> },
                { key: "is_active", label: "Status", render: (r) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${r.is_active !== false ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" : "bg-slate-800/60 text-slate-500 border-slate-700/40"}`}>{r.is_active !== false ? "Active" : "Inactive"}</span> },
              ]}
            />
          </div>
        )}

        {/* ══════════════ SUBMISSION AUTHORS (FULL CONTROLS) ══════════════ */}
        {activeSection === "SubmissionAuthors" && (
          <AdminDataTable loading={loadingSection} rows={submissionAuthors} emptyMsg="No submission authors found." title="author"
            onDelete={(id, silent) => handleAdminDelete("SubmissionAuthors", id, silent)}
            onEdit={(item) => handleOpenBulkEdit("SubmissionAuthors", [item])}
            onBulkEdit={(items) => handleOpenBulkEdit("SubmissionAuthors", items)}
            columns={[
              { key: "first_name", label: "First Name", render: (r) => <span className="text-white font-medium">{r.first_name}</span> },
              { key: "last_name", label: "Last Name", render: (r) => <span className="text-white">{r.last_name}</span> },
              { key: "email", label: "Email", render: (r) => <span className="text-blue-400">{r.email}</span> },
              { key: "institution", label: "Institution" },
              { key: "is_corresponding_author", label: "Corresponding", render: (r) => <BoolDot value={r.is_corresponding_author} /> },
              { key: "order", label: "Order" },
              { key: "submission_title", label: "Submission", render: (r) => <span className="text-slate-300 max-w-[200px] truncate block">{r.submission_title}</span> },
            ]}
          />
        )}

        {/* ══════════════ SUBMISSION FILES (FULL CONTROLS) ══════════════ */}
        {activeSection === "SubmissionFiles" && (
          <AdminDataTable loading={loadingSection} rows={submissionFiles} emptyMsg="No submission files found." title="file"
            onDelete={(id, silent) => handleAdminDelete("SubmissionFiles", id, silent)}
            onEdit={(item) => handleOpenBulkEdit("SubmissionFiles", [item])}
            onBulkEdit={(items) => handleOpenBulkEdit("SubmissionFiles", items)}
            columns={[
              { key: "original_filename", label: "Filename", render: (r) => <span className="text-white font-medium">{r.original_filename || "—"}</span> },
              { key: "file_type_name", label: "File Type", render: (r) => <span className="text-slate-300">{r.file_type_name || r.file_type || "—"}</span> },
              { key: "file_size", label: "Size", render: (r) => <span>{r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : "—"}</span> },
              { key: "submission_title", label: "Submission", render: (r) => <span className="text-slate-300 max-w-[200px] truncate block">{r.submission_title}</span> },
              { key: "created_at", label: "Uploaded", render: (r) => <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span> },
            ]}
          />
        )}

        {/* ══════════════ REVIEWER ASSIGNMENTS (FULL CONTROLS) ══════════════ */}
        {activeSection === "ReviewerAssignments" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {["accepted", "pending"].map((f) => (
                <button key={f} onClick={() => setAssignmentFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${assignmentFilter === f ? "bg-red-700 text-white shadow-lg" : "text-slate-500 hover:text-white bg-slate-800/40"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <AdminDataTable loading={loadingSection} rows={reviewerAssignments} emptyMsg="No reviewer assignments found." title="assignment"
              onDelete={(id, silent) => handleAdminDelete("ReviewerAssignments", id, silent)}
              onEdit={(item) => handleOpenBulkEdit("ReviewerAssignments", [item])}
              onBulkEdit={(items) => handleOpenBulkEdit("ReviewerAssignments", items)}
              columns={[
                { key: "reviewer", label: "Reviewer", render: (r) => <span className="text-white font-medium">{r.reviewer?.full_name || r.reviewer?.email || "—"}</span> },
                { key: "submission", label: "Submission", render: (r) => <span className="text-slate-300 max-w-[250px] truncate block">{r.submission?.title || `#${r.submission?.id || r.submission}` || "—"}</span> },
                { key: "status", label: "Status", render: (r) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${r.status === "accepted" ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" : r.status === "pending" ? "bg-amber-950/60 text-amber-400 border-amber-800/40" : "bg-red-950/60 text-red-400 border-red-800/40"}`}>{r.status}</span> },
                { key: "assigned_by_name", label: "Assigned By" },
                { key: "assigned_at", label: "Assigned", render: (r) => <span>{r.assigned_at ? new Date(r.assigned_at).toLocaleDateString() : "—"}</span> },
                { key: "is_active", label: "Active", render: (r) => <BoolDot value={r.is_active} /> },
              ]}
            />
          </div>
        )}

        {/* ══════════════ REVIEWER REPORTS (FULL CONTROLS) ══════════════ */}
        {activeSection === "ReviewerReports" && (
          <AdminDataTable loading={loadingSection} rows={reviewerReports} emptyMsg="No reviewer reports found." title="report"
            onDelete={(id, silent) => handleAdminDelete("ReviewerReports", id, silent)}
            onEdit={(item) => handleOpenBulkEdit("ReviewerReports", [item])}
            onBulkEdit={(items) => handleOpenBulkEdit("ReviewerReports", items)}
            columns={[
              { key: "reviewer", label: "Reviewer", render: (r) => <span className="text-white font-medium">{r.reviewer?.full_name || r.reviewer?.email || "—"}</span> },
              { key: "submission", label: "Submission", render: (r) => <span className="text-slate-300 max-w-[200px] truncate block">{r.submission?.title || "—"}</span> },
              { key: "recommendation", label: "Recommendation", render: (r) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${r.recommendation === "accept" ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40" : r.recommendation === "reject" ? "bg-red-950/60 text-red-400 border-red-800/40" : "bg-amber-950/60 text-amber-400 border-amber-800/40"}`}>{r.recommendation?.replace("_", " ") || "Pending"}</span> },
              { key: "review_report_complete", label: "Complete", render: (r) => <BoolDot value={r.review_report_complete} /> },
              { key: "ready_to_transfer_to_editor", label: "Ready for Editor", render: (r) => <BoolDot value={r.ready_to_transfer_to_editor} /> },
              { key: "submitted_at", label: "Submitted", render: (r) => <span>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "Not yet"}</span> },
            ]}
          />
        )}

        {/* ══════════════ SUBMISSIONS (FULL CONTROLS) ══════════════ */}
        {activeSection === "Submissions" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 bg-[#0d1327] border border-slate-800/60 rounded-lg px-3 pr-8 text-sm text-white outline-none cursor-pointer max-w-xs">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_editor_review">Under Editor Review</option>
                <option value="under_peer_review">Under Peer Review</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
              </select>
            </div>
            <AdminDataTable loading={loadingSubmissions} rows={submissions} emptyMsg="No submissions found." title="submission"
              onDelete={(id, silent) => handleAdminDelete("Submissions", id, silent)}
              onEdit={(item) => handleOpenBulkEdit("Submissions", [item])}
              onBulkEdit={(items) => handleOpenBulkEdit("Submissions", items)}
              columns={[
                { key: "title", label: "Title", render: (r) => <span className="text-white font-semibold max-w-[250px] truncate block">{r.title || "Untitled"}</span> },
                { key: "manuscript_reference", label: "Reference", render: (r) => <span className="text-slate-400 text-xs">{r.manuscript_reference || "—"}</span> },
                { key: "author", label: "Author", render: (r) => <span>{r.author?.full_name || r.author?.email || "—"}</span> },
                { key: "status", label: "Status", render: (r) => <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800/60 text-slate-400 border-slate-700/40 uppercase">{r.status?.replace(/_/g, " ")}</span> },
                { key: "submitted_at", label: "Submitted", render: (r) => <span>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "Draft"}</span> },
              ]}
            />
          </div>
        )}

        {/* ══════════════ NOTIFICATIONS (FULL CONTROLS) ══════════════ */}
        {activeSection === "Notifications" && (
          <AdminDataTable loading={loadingSection} rows={notifications} emptyMsg="No notifications found." title="notification"
            onDelete={(id, silent) => handleAdminDelete("Notifications", id, silent)}
            onEdit={(item) => handleOpenBulkEdit("Notifications", [item])}
            onBulkEdit={(items) => handleOpenBulkEdit("Notifications", items)}
            columns={[
              { key: "user_email", label: "User", render: (r) => <span className="text-blue-400 text-xs">{r.user_email || "—"}</span> },
              { key: "title", label: "Title", render: (r) => <span className="text-white font-medium">{r.title}</span> },
              { key: "message", label: "Message", render: (r) => <span className="text-slate-400 max-w-[300px] truncate block text-xs">{r.message}</span> },
              { key: "notification_type", label: "Type", render: (r) => <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800/60 text-slate-400 border-slate-700/40 uppercase">{r.notification_type}</span> },
              { key: "is_read", label: "Read", render: (r) => <BoolDot value={r.is_read} /> },
              { key: "created_at", label: "Date", render: (r) => <span>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</span> },
            ]}
          />
        )}

      </main>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && <ItemModal key={editingItem?.id ? `edit-${editingItem.id}` : `add-${modalType}`} onClose={() => setModalOpen(false)} onSave={handleSaveItemModal} initialName={editingItem?.name || ""} title={modalTitle} busy={busyModal} />}
      </AnimatePresence>
      <AnimatePresence>
        {fileModalOpen && <FileTypeModal key={editingFileType?.id ? `edit-file-${editingFileType.id}` : "add-file"} onClose={() => setFileModalOpen(false)} onSave={handleSaveFileModal} initialData={editingFileType} title={fileModalTitle} busy={busyFileModal} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateUserModal && <CreateUserModal onClose={() => setShowCreateUserModal(false)} onSave={handleCreateUser} busy={busyCreateUser} />}
      </AnimatePresence>
      <AnimatePresence>
        {bulkEditModalOpen && <BulkEditModal key={bulkEditItems.map((i) => i.id).join("-")} isOpen={bulkEditModalOpen} onClose={() => setBulkEditModalOpen(false)} onSave={handleSaveBulkEdit} section={bulkEditSection} items={bulkEditItems} busy={busyBulkEdit} />}
      </AnimatePresence>
    </div>
  );
}
