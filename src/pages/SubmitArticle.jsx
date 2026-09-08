// src/pages/SubmitArticle.jsx

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Upload, FileText, Check, X, FileBadge, Files, UserRound, Globe, Tags,
  MessageSquareText, ClipboardCheck, Loader2, Trash2, Download
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../layout/layout";
import submissionService from "../services/submissionService";

export default function SubmitArticlePage() {
  const navigate = useNavigate();

  // State
  const [submissionId, setSubmissionId] = useState(null);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  const [articleType, setArticleType] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [openAccess, setOpenAccess] = useState("Open Access");
  const [comments, setComments] = useState("");
  const [funding, setFunding] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [authorsList, setAuthorsList] = useState([{ firstName: "", lastName: "", institution: "", email: "", corresponding: true }]);

  const [selectedRequiredTypeId, setSelectedRequiredTypeId] = useState("");
  const [selectedOptionalTypeId, setSelectedOptionalTypeId] = useState("");
  const [uploadedRequiredFiles, setUploadedRequiredFiles] = useState([]); // [{id, name, fileTypeId, fileTypeName, url}]

  const [backendCategories, setBackendCategories] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [authorRoles, setAuthorRoles] = useState([]);
  const [backendArticleTypes, setBackendArticleTypes] = useState([]);

  // Refs to control the hidden file inputs
  const manuscriptInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const requiredFileInputRef = useRef(null);
  const optionalFileInputRef = useRef(null);

  const tasks = useMemo(() => [
    { title: "Article Type", icon: FileBadge }, { title: "Upload Files", icon: Files },
    { title: "Article Details", icon: FileText }, { title: "Authors", icon: UserRound },
    { title: "Open Access", icon: Globe }, { title: "Categories", icon: Tags },
    { title: "Additional Information", icon: MessageSquareText }, { title: "Review & Submit", icon: ClipboardCheck },
  ], []);

  // 1. INIT & SYNC
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsInitializing(true);
      try {
        const [cats, types, roles, artTypes] = await Promise.all([
          submissionService.getClassifications(),
          submissionService.getSubmissionFileTypes(),
          submissionService.getContributorRoles(),
          submissionService.getArticleTypes(),
        ]);
        const drafts = await submissionService.getSubmissions();
        const active = Array.isArray(drafts)
          ? drafts.find(d => d.status === "draft")
          : (drafts?.results || []).find(d => d.status === "draft");

        if (!isMounted) return;

        setBackendCategories(cats || []);
        setFileTypes(types || []);
        setAuthorRoles(roles || []);
        setBackendArticleTypes(artTypes || []);

        if (active) {
          setSubmissionId(active.id);

          if (active.article_type) {
            setArticleType(String(active.article_type));
          }

          // Filter out placeholder values so the user sees empty fields on fresh drafts
          setTitle(active.title === "Untitled Draft" ? "" : active.title || "");
          setAbstract(active.abstract === "Pending" ? "" : active.abstract || "");
          setKeywords(active.keywords === "Pending" ? "" : active.keywords || "");

          // ✅ FIX: Backend returns classifications as `classifications_data` (array of objects)
          // NOT `classification_ids` (array of numbers) — extract IDs from the objects
          const restoredIds = (active.classifications_data || []).map(c => c.id);
          setSelectedCategoryIds(restoredIds);

          // ✅ FIX: Restore open_access from draft
          setOpenAccess(active.open_access === false ? "Subscription Access" : "Open Access");

          // ✅ FIX: Restore funding and comments from draft
          setFunding(
            !active.funding_information || active.funding_information === "None Provided"
              ? ""
              : active.funding_information
          );
          setComments(
            !active.additional_notes || active.additional_notes === "None Provided"
              ? ""
              : active.additional_notes
          );

          const auths = await submissionService.getSubmissionAuthors(active.id);
          if (auths?.length > 0) setAuthorsList(auths.map(a => ({
            id: a.id, firstName: a.first_name, lastName: a.last_name, institution: a.institution, email: a.email, corresponding: a.is_corresponding_author
          })));

          const files = await submissionService.getUploadedFiles(active.id);
          if (files?.length > 0) {
            const requiredTypeIds = new Set(
              (types || []).filter(t => t.is_required && t.is_active).map(t => String(t.id))
            );
            const reqFiles = files.filter(f => {
              const tid = f.file_type && typeof f.file_type === 'object' ? f.file_type.id : f.file_type;
              return requiredTypeIds.has(String(tid));
            });
            const optFiles = files.filter(f => !reqFiles.find(r => r.id === f.id));

            setUploadedRequiredFiles(reqFiles.map(f => ({
              id: f.id,
              name: f.original_filename || f.file.split('/').pop(),
              fileTypeId: f.file_type && typeof f.file_type === 'object' ? f.file_type.id : f.file_type,
              fileTypeName: f.file_type && typeof f.file_type === 'object' ? f.file_type.name : 'Required File',
              url: f.file
            })));
            // backward compat — keep uploadedFile truthy if any required file exists
            if (reqFiles.length > 0) {
              const first = reqFiles[0];
              setFileName(first.original_filename || first.file.split('/').pop());
              setUploadedFile({ name: 'Existing File' });
            }
            setMediaFiles(optFiles.map(f => ({
              id: f.id,
              name: f.original_filename || f.file.split('/').pop(),
              type: f.file_type && typeof f.file_type === 'object' ? f.file_type.name : 'Supplementary',
              isAlreadyUploaded: true,
              url: f.file
            })));
          }
        } else {
          // Create a blank draft with no pre-filled article type
          const fresh = await submissionService.createSubmission();
          if (isMounted) setSubmissionId(fresh.id);
        }
      } catch (e) { console.error("Draft init error:", e); }
      finally { if (isMounted) setIsInitializing(false); }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  // 2. PATCH & SYNC ENGINES
  const debounceRef = useRef(null);
  const patchQueue = useRef({});
  const processRemotePatch = (payload) => {
    patchQueue.current = { ...patchQueue.current, ...payload };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = { ...patchQueue.current };
      patchQueue.current = {};
      if (submissionId) {
        setIsSaving(true);
        await submissionService.updateSubmission(submissionId, data).catch(console.error);
        setIsSaving(false);
      }
    }, 1000);
  };

  // ✅ FIX: Save classifications to backend when navigating AWAY from step 6
  // This ensures selections persist on refresh even when exactly 4 are chosen
  // (The inline onChange only patches at 4+, but step-change is a reliable save point)
  const prevStepRef = useRef(step);
  useEffect(() => {
    const wasOnCategoryStep = prevStepRef.current === 6;
    prevStepRef.current = step;
    if (wasOnCategoryStep && step !== 6 && submissionId && selectedCategoryIds.length >= 4) {
      submissionService.updateSubmission(submissionId, { classification_ids: selectedCategoryIds })
        .catch(e => console.warn("Classification save on step-change failed:", e));
    }
  }, [step, submissionId, selectedCategoryIds]);

  const syncAuthor = async (index) => {
    const auth = authorsList[index];
    if (!auth.firstName || !auth.lastName || !auth.email || !auth.institution) return;
    const payload = {
      first_name: auth.firstName, last_name: auth.lastName, institution: auth.institution, email: auth.email,
      contributor_role_ids: authorRoles.length > 0 ? [authorRoles[0].id] : [1],
      is_corresponding_author: index === 0, order: index + 1
    };
    try {
      if (auth.id) await submissionService.updateAuthor(auth.id, payload);
      else {
        const res = await submissionService.addAuthor(submissionId, payload);
        const updated = [...authorsList]; updated[index].id = res.id; setAuthorsList(updated);
      }
    } catch (e) { console.error(e); }
  };

  // 3. ACTIONS
  const handlePurgeDraft = useCallback(async () => {
    if (!window.confirm("Are you sure you want to completely reset this draft? This will permanently delete all draft data from the server.")) {
      return;
    }

    try {
      setIsSubmitting(true);

      // ✅ Cancel any pending auto-save debounce so stale data doesn't patch back in
      if (debounceRef.current) clearTimeout(debounceRef.current);
      patchQueue.current = {};

      if (submissionId) {
        // ✅ Delete the whole submission (clean slate) — patching article_type: null was rejected
        // by Django (required field), so it survived the wipe. Delete+recreate fixes this properly.
        setLoadingStatus("Deleting draft from server...");
        await submissionService.deleteSubmission(submissionId)
          .catch(e => console.warn("Could not delete draft:", e));
      }

      // Create a blank fresh draft with no pre-filled data
      setLoadingStatus("Creating a fresh draft...");
      const fresh = await submissionService.createSubmission();

      // Reset all local state
      setSubmissionId(fresh.id);
      setArticleType("");
      setTitle("");
      setAbstract("");
      setKeywords("");
      setOpenAccess("Open Access");
      setComments("");
      setFunding("");
      setFileName("");
      setUploadedFile(null);
      setMediaFiles([]);
      setSelectedCategoryIds([]);
      setAuthorsList([{ firstName: "", lastName: "", institution: "", email: "", corresponding: true }]);

      // Clear hidden file inputs so they accept new files
      if (manuscriptInputRef.current) manuscriptInputRef.current.value = "";
      if (mediaInputRef.current) mediaInputRef.current.value = "";
      if (requiredFileInputRef.current) requiredFileInputRef.current.value = "";
      if (optionalFileInputRef.current) optionalFileInputRef.current.value = "";
      setUploadedRequiredFiles([]);
      setSelectedRequiredTypeId("");
      setSelectedOptionalTypeId("");

      setShowValidationErrors(false);
      setStep(1);

      toast.success("Draft has been completely reset.");
    } catch (err) {
      console.error("Draft reset failed:", err);
      toast.error("Failed to reset the draft. Check your connection.");
    } finally {
      setIsSubmitting(false);
      setLoadingStatus("");
    }
  }, [submissionId]);

  const handleAuthorChange = (index, field, value) => {
    const updated = [...authorsList]; updated[index][field] = value; setAuthorsList(updated);
  };

  const addAuthor = () => setAuthorsList([...authorsList, { firstName: "", lastName: "", institution: "", email: "", corresponding: false }]);

  const removeAuthor = async (index) => {
    const auth = authorsList[index];
    if (auth.id) await submissionService.deleteAuthor(auth.id);
    setAuthorsList(authorsList.filter((_, i) => i !== index));
  };

  const removeMedia = async (index) => {
    const fileObj = mediaFiles[index];
    if (fileObj.id) {
      try {
        setIsSubmitting(true);
        setLoadingStatus("Removing supplementary file from server...");
        try {
          await api.delete(`/journals/submissions/${submissionId}/files/${fileObj.id}/`);
        } catch {
          await api.delete(`/journals/submission-files/${fileObj.id}/`);
        }
        toast.success("Supplementary file deleted successfully.");
      } catch (err) {
        console.error("Failed to delete supplementary file:", err);
        toast.error("Failed to delete file from server.");
        return;
      } finally {
        setIsSubmitting(false);
        setLoadingStatus("");
      }
    }
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // REQUIRED FILE UPLOAD
  // ==========================================
  const handleRequiredUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !submissionId || !selectedRequiredTypeId) return;
    const resolvedTypeId = parseInt(selectedRequiredTypeId);
    const targetIdStr = String(resolvedTypeId);
    const typeName = fileTypes.find(t => String(t.id) === targetIdStr)?.name || 'Required File';
    try {
      setIsSubmitting(true);
      setLoadingStatus('Checking for existing file...');
      let currentFiles = [];
      try { currentFiles = await submissionService.getUploadedFiles(submissionId); }
      catch (e) { console.warn('Could not query files:', e); }
      if (Array.isArray(currentFiles) && currentFiles.length > 0) {
        const existing = currentFiles.find(f =>
          String(f.file_type) === targetIdStr || String(f.file_type_id) === targetIdStr ||
          (f.file_type && String(f.file_type.id) === targetIdStr)
        );
        if (existing?.id) {
          setLoadingStatus('Replacing previous file...');
          try { await api.delete(`/journals/submissions/${submissionId}/files/${existing.id}/`); }
          catch { await api.delete(`/journals/submission-files/${existing.id}/`).catch(console.error); }
          await new Promise(r => setTimeout(r, 500));
          setUploadedRequiredFiles(prev => prev.filter(f => f.id !== existing.id));
        }
      }
      setLoadingStatus('Uploading file...');
      const uploaded = await submissionService.uploadFile(submissionId, file, resolvedTypeId);
      const newEntry = { id: uploaded.id, name: file.name, fileTypeId: resolvedTypeId, fileTypeName: typeName, url: uploaded.file || '' };
      setUploadedRequiredFiles(prev => [...prev.filter(f => f.fileTypeId !== resolvedTypeId), newEntry]);
      setFileName(file.name); setUploadedFile(file);
      toast.success('File uploaded successfully.');
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const firstError = Object.values(err.response.data)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else { toast.error('File upload failed.'); }
    } finally {
      setIsSubmitting(false); setLoadingStatus('');
      if (requiredFileInputRef.current) requiredFileInputRef.current.value = '';
    }
  };

  // ==========================================
  // OPTIONAL FILE UPLOAD
  // ==========================================
  const handleOptionalUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !submissionId || !selectedOptionalTypeId) return;
    const resolvedTypeId = parseInt(selectedOptionalTypeId);
    try {
      setIsSubmitting(true);
      const newFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingStatus(`Uploading file (${i + 1}/${files.length})...`);
        const uploaded = await submissionService.uploadFile(submissionId, file, resolvedTypeId);
        newFiles.push({ id: uploaded.id, name: file.name, type: file.type || 'Supplementary File', isAlreadyUploaded: true, url: uploaded.file || '' });
      }
      setMediaFiles(prev => [...prev, ...newFiles]);
      toast.success('File(s) uploaded successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file(s).');
    } finally {
      setIsSubmitting(false); setLoadingStatus('');
      if (optionalFileInputRef.current) optionalFileInputRef.current.value = '';
    }
  };

  // ==========================================
  // REMOVE REQUIRED FILE
  // ==========================================
  const handleRemoveRequiredFile = async (fileId) => {

    try {
      setIsSubmitting(true); setLoadingStatus('Removing file...');
      try { await api.delete(`/journals/submissions/${submissionId}/files/${fileId}/`); }
      catch { await api.delete(`/journals/submission-files/${fileId}/`).catch(console.error); }
      const remaining = uploadedRequiredFiles.filter(f => f.id !== fileId);
      setUploadedRequiredFiles(remaining);
      if (remaining.length === 0) { setUploadedFile(null); setFileName(''); }
      toast.success('File removed.');
    } catch (err) {
      console.error(err); toast.error('Could not remove file.');
    } finally { setIsSubmitting(false); setLoadingStatus(''); }
  };

  const getStepStatus = (n) => {
    if (n === 1) return articleType ? 'valid' : 'invalid';
    if (n === 2) return uploadedRequiredFiles.length > 0 ? 'valid' : 'invalid';
    if (n === 3) return title.trim() && abstract.trim() && keywords.trim() ? 'valid' : 'invalid';
    if (n === 4) return authorsList.length > 0 && !authorsList.some(a => !a.firstName.trim() || !a.lastName.trim() || !a.institution.trim() || !a.email.trim()) ? "valid" : "invalid";
    if (n === 5) return openAccess ? "valid" : "invalid";
    // ✅ FIX: Require 4+ classifications to show green (backend enforces this on submit)
    if (n === 6) return selectedCategoryIds.length >= 4 ? "valid" : "invalid";
    if (n === 7) return funding.trim() || comments.trim() ? "valid" : "invalid";
    return "valid";
  };

  // 4. SUBMIT
  const handleSubmit = async () => {
    let firstBrokenStep = null;
    for (let i = 1; i <= 7; i++) {
      if (getStepStatus(i) === "invalid") { firstBrokenStep = i; break; }
    }
    if (firstBrokenStep) { setShowValidationErrors(true); setStep(firstBrokenStep); return; }
    if (uploadedRequiredFiles.length === 0) { setShowValidationErrors(true); setStep(2); toast.error('Please upload at least one required file.'); return; }

    try {
      setIsSubmitting(true);
      // Supplementary files are uploaded immediately during step 2 selection, so no need to upload them here.
      setLoadingStatus("Finalizing details...");
      await submissionService.updateSubmission(submissionId, {
        title: title.trim(), abstract: abstract.trim(), keywords: keywords.trim(), open_access: openAccess === "Open Access",
        classification_ids: selectedCategoryIds, funding_information: funding.trim() || "None Provided",
        additional_notes: comments.trim() || "None Provided", conflict_of_interest: "None Declared", ethics_accepted: true
      });

      setLoadingStatus("Submitting to editorial...");
      await submissionService.submitManuscript(submissionId);
      toast.success("Article submitted successfully!");
      // ✅ FIX: Correct route (was /my-articles which doesn't exist)
      navigate("/articles");
    } catch (e) {
      if (e.response?.data) {
        const errorData = e.response.data;
        if (errorData.classification_ids) {
          toast.error(errorData.classification_ids[0]);
        } else if (errorData.detail) {
          toast.error(errorData.detail);
        } else {
          // Fallback to extract the first error message dynamically
          const firstError = Object.values(errorData)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
        }
      } else {
        toast.error("Submission failed. Please try again.");
      }
    }
    finally { setIsSubmitting(false); setLoadingStatus(""); }
  };

  // ✅ FIX: Show loading state while draft is being fetched — prevents empty flash
  if (isInitializing) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-[#0077B6] animate-spin" size={44} strokeWidth={2} />
            <p className="text-slate-500 font-medium text-sm">Loading your draft...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-2 py-4 max-w-7xl mx-auto">
        <div style={{
          background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)",
          borderRadius: "8px", padding: "28px 36px",
          display: "flex", flexDirection: "row", justifyContent: "space-between",
          alignItems: "center", gap: "20px", flexWrap: "wrap",
          borderTop: "4px solid var(--primary)",
        }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,32px)", color: "#fff", fontWeight: "600", margin: "0 0 6px" }}>Submit Your Research</h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", fontFamily: "var(--font-sans)", margin: 0, lineHeight: "1.6" }}>Publish your research article directly through JournalFlow.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isSaving && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "var(--font-sans)" }}>Auto-saving…</span>}
            <button onClick={handlePurgeDraft} disabled={isSubmitting} style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer" }}>Reset Form Fields</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] xl:grid-cols-[1fr_320px] gap-6 xl:gap-8 mt-8 items-start">
          <div className="relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 rounded-3xl flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm text-center">
                  <Loader2 className="text-[#0077B6] animate-spin mb-4" size={40} strokeWidth={2.5} />
                  <h3 className="font-bold text-slate-800">Processing Submission</h3>
                  <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{loadingStatus}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-8 min-h-[460px] flex flex-col justify-between">
              <div>
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-3">
                    <label className="block font-semibold text-slate-800">Select Article Type <span className="text-red-500">*</span></label>
                    <select
                      value={articleType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setArticleType(val);
                        if (val) {
                          processRemotePatch({ article_type: parseInt(val) });
                        }
                      }}
                      className={`w-full border rounded-2xl px-4 py-3.5 outline-none font-medium ${!articleType && showValidationErrors ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-[#0077B6]'}`}
                    >
                      <option value="">Choose article type</option>

                      {/* ✅ Dynamically maps all article types from the backend */}
                      {backendArticleTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-8">
                    <h2 className="text-xl font-bold text-slate-800">Upload your submission files</h2>

                    {/* ── REQUIRED FILES ── */}
                    <div className="space-y-5">

                      {fileTypes.filter(t => t.is_required && t.is_active).length > 0 && (
                        <div>
                          {/* <p className="text-sm text-red-500 mb-3">These are the required files. You can read more about upload requirements in the instructions.</p> */}
                          <ul className="space-y-2">
                            {fileTypes.filter(t => t.is_required && t.is_active).map(t => {
                              const isUploaded = uploadedRequiredFiles.some(f => String(f.fileTypeId) === String(t.id));
                              return (
                                <li key={t.id} className="flex items-center gap-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                  <span className="text-sm text-slate-700 font-medium">{t.name}</span>
                                  {isUploaded ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      <Check size={11} strokeWidth={3} /> File added
                                    </span>
                                  ) : (
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-orange-100 transition">
                                      <Upload size={11} /> Upload file
                                      <input
                                        type="file"
                                        className="hidden"
                                        disabled={!submissionId}
                                        onChange={(e) => {
                                          setSelectedRequiredTypeId(String(t.id));
                                          handleRequiredUpload({ target: e.target, _typeOverride: String(t.id) });
                                        }}
                                      />
                                    </label>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Uploaded required file cards */}
                      {uploadedRequiredFiles.map(file => (
                        <div key={file.id} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{file.fileTypeName}</span>
                            <button type="button" onClick={() => handleRemoveRequiredFile(file.id)} className="text-slate-400 hover:text-red-500 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-sm text-slate-700 font-medium break-all">{file.name}</p>
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0077B6] font-semibold hover:underline">
                                <Download size={12} /> Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {uploadedRequiredFiles.length === 0 && showValidationErrors && (
                        <p className="text-xs text-red-500 font-medium">⚠️ At least one required file must be uploaded.</p>
                      )}

                      {/* General required file type selector + upload */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Choose file type to upload</label>
                        <div className="flex gap-3 items-center flex-wrap">
                          <select
                            value={selectedRequiredTypeId}
                            onChange={(e) => setSelectedRequiredTypeId(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0077B6] min-w-[220px] bg-white"
                          >
                            <option value="">Select file type</option>
                            {fileTypes.filter(t => t.is_required && t.is_active).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <label className={`flex items-center gap-2 border px-5 py-2 rounded-lg text-sm font-semibold transition ${!selectedRequiredTypeId || !submissionId
                              ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
                              : 'border-[#0077B6] text-[#0077B6] hover:bg-blue-50 cursor-pointer'
                            }`}>
                            <Upload size={14} /> Upload
                            <input type="file" className="hidden" ref={requiredFileInputRef} disabled={!selectedRequiredTypeId || !submissionId} onChange={handleRequiredUpload} />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* ── OPTIONAL / SUPPLEMENTARY FILES ── */}
                    <div className="space-y-5 pt-6 border-t border-slate-100">
                      <h3 className="font-bold text-slate-700">Upload your optional and supplementary files</h3>

                      {/* Uploaded optional file cards */}
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{typeof file.type === 'string' && !file.type.includes('/') ? file.type : 'Supplementary'}</span>
                            <button type="button" onClick={() => removeMedia(index)} className="text-slate-400 hover:text-red-500 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-sm text-slate-700 font-medium break-all">{file.name}</p>
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0077B6] font-semibold hover:underline">
                                <Download size={12} /> Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Optional file type selector + upload */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Choose file type to upload</label>
                        <div className="flex gap-3 items-center flex-wrap">
                          <select
                            value={selectedOptionalTypeId}
                            onChange={(e) => setSelectedOptionalTypeId(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0077B6] min-w-[220px] bg-white"
                          >
                            <option value="">Select file type</option>
                            {fileTypes.filter(t => !t.is_required && t.is_active).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <label className={`flex items-center gap-2 border px-5 py-2 rounded-lg text-sm font-semibold transition ${!selectedOptionalTypeId || !submissionId
                              ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
                              : 'border-[#0077B6] text-[#0077B6] hover:bg-blue-50 cursor-pointer'
                            }`}>
                            <Upload size={14} /> Upload
                            <input type="file" multiple className="hidden" ref={optionalFileInputRef} disabled={!selectedOptionalTypeId || !submissionId} onChange={handleOptionalUpload} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Article Title <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Article Title" value={title} onChange={(e) => { setTitle(e.target.value); processRemotePatch({ title: e.target.value.trim() }); }} className={`w-full border rounded-2xl px-4 py-3 outline-none ${!title.trim() && showValidationErrors ? 'border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-[#0077B6]'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Abstract <span className="text-red-500">*</span></label>
                      <textarea rows={5} placeholder="Abstract" value={abstract} onChange={(e) => { setAbstract(e.target.value); processRemotePatch({ abstract: e.target.value.trim() }); }} className={`w-full border rounded-2xl px-4 py-3 outline-none resize-none ${!abstract.trim() && showValidationErrors ? 'border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-[#0077B6]'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Keywords <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Keywords (Comma separated list)" value={keywords} onChange={(e) => { setKeywords(e.target.value); processRemotePatch({ keywords: e.target.value.trim() }); }} className={`w-full border rounded-2xl px-4 py-3 outline-none ${!keywords.trim() && showValidationErrors ? 'border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-[#0077B6]'}`} />
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800">Authors</h3>
                      <button onClick={addAuthor} className="bg-[#0077B6] hover:bg-[#005F92] text-white px-4 py-2 rounded-xl text-xs shadow-sm">+ Add Author</button>
                    </div>
                    {authorsList.map((author, index) => {
                      const isAuthorInvalid = !author.firstName.trim() || !author.lastName.trim() || !author.institution.trim() || !author.email.trim();
                      return (
                        <div key={index} className={`border rounded-3xl p-5 relative transition ${isAuthorInvalid && showValidationErrors ? 'border-red-300 bg-red-50/5' : 'border-slate-200 bg-slate-50/30'}`}>
                          {index !== 0 && <button onClick={() => removeAuthor(index)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 text-xs font-semibold">✕ Remove</button>}
                          <p className="mb-4 font-bold text-sm text-[#0077B6]">Author {index + 1} {index === 0 && <span className="text-xs text-slate-400 font-normal ml-1">(Corresponding)</span>}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="First Name *" value={author.firstName} onChange={(e) => handleAuthorChange(index, "firstName", e.target.value)} onBlur={() => syncAuthor(index)} className={`w-full border rounded-2xl px-4 py-3 text-sm outline-none ${!author.firstName.trim() && showValidationErrors ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'}`} />
                            <input type="text" placeholder="Last Name *" value={author.lastName} onChange={(e) => handleAuthorChange(index, "lastName", e.target.value)} onBlur={() => syncAuthor(index)} className={`w-full border rounded-2xl px-4 py-3 text-sm outline-none ${!author.lastName.trim() && showValidationErrors ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'}`} />
                            <input type="text" placeholder="Institution *" value={author.institution} onChange={(e) => handleAuthorChange(index, "institution", e.target.value)} onBlur={() => syncAuthor(index)} className={`w-full border rounded-2xl px-4 py-3 text-sm outline-none ${!author.institution.trim() && showValidationErrors ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'}`} />
                            <input type="text" placeholder="Email *" value={author.email} onChange={(e) => handleAuthorChange(index, "email", e.target.value)} onBlur={() => syncAuthor(index)} className={`w-full border rounded-2xl px-4 py-3 text-sm outline-none ${!author.email.trim() && showValidationErrors ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Open Access</h3>
                      <p className="text-gray-400 text-xs mt-1">Choose publication access type <span className="text-red-500">*</span></p>
                    </div>
                    <div className="space-y-4">
                      <label className="border border-slate-200 rounded-3xl p-5 flex items-start gap-4 cursor-pointer hover:border-[#0077B6] transition bg-slate-50/30">
                        <input type="radio" name="access" value="Open Access" checked={openAccess === "Open Access"} onChange={(e) => { setOpenAccess(e.target.value); processRemotePatch({ open_access: true }); }} className="mt-1 accent-[#0077B6]" />
                        <div><p className="font-bold text-sm text-slate-800">Open Access</p><p className="text-gray-400 text-xs mt-1">Freely accessible to all readers.</p></div>
                      </label>
                      <label className="border border-slate-200 rounded-3xl p-5 flex items-start gap-4 cursor-pointer hover:border-[#0077B6] transition bg-slate-50/30">
                        <input type="radio" name="access" value="Subscription Access" checked={openAccess === "Subscription Access"} onChange={(e) => { setOpenAccess(e.target.value); processRemotePatch({ open_access: false }); }} className="mt-1 accent-[#0077B6]" />
                        <div><p className="font-bold text-sm text-slate-800">Subscription Access</p><p className="text-gray-400 text-xs mt-1">Accessible only to subscribers.</p></div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 6 */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Research Categories</h3>
                      <p className="text-gray-400 text-xs mt-1">Select applicable research areas <span className="text-red-500">*</span></p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {backendCategories.map((category) => (
                        <label key={category.id} className="border border-slate-200/60 rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition bg-white shadow-sm">
                          <input type="checkbox" checked={selectedCategoryIds.includes(category.id)} className="accent-[#0077B6]" onChange={(e) => {
                            const updatedIds = e.target.checked ? [...selectedCategoryIds, category.id] : selectedCategoryIds.filter(id => id !== category.id);
                            setSelectedCategoryIds(updatedIds);
                            // ✅ FIX: Only patch when 4+ selected — backend rejects fewer than 4 in draft mode
                            if (updatedIds.length >= 4) processRemotePatch({ classification_ids: updatedIds });
                          }} />
                          <span className="text-slate-700 font-semibold text-xs">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 7 */}
                {step === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Additional Information</h3>
                      <p className="text-gray-400 text-xs mt-1">Optional editorial notes and funding details <span className="text-red-500">*</span></p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Comments for Editor</label>
                      <textarea rows={3} placeholder="Comments for Editor" value={comments} onChange={(e) => { setComments(e.target.value); processRemotePatch({ additional_notes: e.target.value.trim() || "None Provided" }); }} className={`w-full border text-sm rounded-2xl px-4 py-3 outline-none resize-none focus:border-[#0077B6] ${!comments.trim() && !funding.trim() && showValidationErrors ? 'border-red-400 bg-red-50/5' : 'border-slate-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Funding Information</label>
                      <textarea rows={3} placeholder="Funding Information" value={funding} onChange={(e) => { setFunding(e.target.value); processRemotePatch({ funding_information: e.target.value.trim() || "None Provided" }); }} className={`w-full border text-sm rounded-2xl px-4 py-3 outline-none resize-none focus:border-[#0077B6] ${!comments.trim() && !funding.trim() && showValidationErrors ? 'border-red-400 bg-red-50/5' : 'border-slate-200'}`} />
                    </div>
                  </div>
                )}

                {/* STEP 8 */}
                {step === 8 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Review & Submit</h3>
                      <p className="text-gray-400 text-xs mt-1">Review your submission details</p>
                    </div>
                    <div className="border border-slate-200 rounded-3xl p-5 space-y-4 bg-[#FAFCFF]">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Article Type</p>
                          <p className={`font-bold text-xs mt-0.5 ${!articleType ? 'text-red-500' : 'text-slate-800'}`}>
                            {/* ✅ Matches the ID back to the dynamic name fetched from Django */}
                            {backendArticleTypes.find(t => String(t.id) === String(articleType))?.name || "Not Chosen"}
                          </p>
                        </div>
                        {!articleType && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">Missing</span>}
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Article Title</p>
                          <p className={`font-bold text-xs mt-0.5 max-w-[400px] truncate ${!title.trim() ? 'text-red-500' : 'text-slate-800'}`}>{title || "Missing parameter value"}</p>
                        </div>
                        {!title.trim() && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">Missing</span>}
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Manuscript</p>
                          <p className={`font-bold text-xs mt-0.5 ${!uploadedFile ? 'text-red-500' : 'text-slate-800'}`}>{fileName || "No file uploaded"}</p>
                        </div>
                        {!uploadedFile && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">Missing Link</span>}
                      </div>
                      {mediaFiles.length > 0 && (
                        <div className="flex flex-col border-b border-slate-100 pb-3.5">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Supplementary Files</p>
                          <div className="space-y-1">
                            {mediaFiles.map((file, idx) => (
                              <p key={idx} className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#0077B6] rounded-full"></span>
                                {file.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center pb-0.5">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Additional Information</p>
                          <p className={`font-bold text-xs mt-0.5 ${!comments.trim() && !funding.trim() ? 'text-red-500' : 'text-emerald-600'}`}>{!comments.trim() && !funding.trim() ? "Incomplete" : "Complete"}</p>
                        </div>
                        {!comments.trim() && !funding.trim() && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">Missing</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
                {step > 1 ? <button onClick={() => setStep(prev => prev - 1)} disabled={isSubmitting} style={{ border: "1px solid var(--border)", background: "#fff", padding: "7px 18px", borderRadius: "4px", fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)", color: "var(--text-secondary)", cursor: "pointer" }}>Previous</button> : <div />}
                {step < 8 ? (
                  <button onClick={() => setStep(prev => prev + 1)} style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: "4px", padding: "7px 22px", fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer" }}>Next</button>
                ) : (
                  <button onClick={handleSubmit} disabled={isSubmitting} style={{ background: "#1A7A38", color: "#fff", border: "none", borderRadius: "4px", padding: "7px 22px", fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)", cursor: "pointer", opacity: isSubmitting ? 0.6 : 1 }}>Submit</button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="bg-white rounded-sm border border-slate-200 shadow-sm" style={{ padding: "16px", height: "fit-content", position: "sticky", top: "100px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "12px", padding: "0 4px" }}>Submission Steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {tasks.map((task, index) => {
                const stepNumber = index + 1;
                const status = getStepStatus(stepNumber);
                const isActive = step === stepNumber;
                return (
                  <button
                    key={index}
                    onClick={() => setStep(stepNumber)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 10px", borderRadius: "4px", border: "none", textAlign: "left",
                      background: isActive ? "#E5F0FB" : "transparent",
                      cursor: "pointer", transition: "background .15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "4px", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? "var(--blue)" : "var(--bg-alt)",
                        color: isActive ? "#fff" : "var(--text-muted)",
                      }}><task.icon size={13} /></div>
                      <span style={{ fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-sans)", color: isActive ? "var(--blue)" : "var(--navy-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                    </div>
                    <div>
                      {status === "invalid" ? <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", color: "#B52626", flexShrink: 0 }}><X size={10} strokeWidth={3} /></div> : <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A7A38", flexShrink: 0 }}><Check size={10} strokeWidth={3} /></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}