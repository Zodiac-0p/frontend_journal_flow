// src/components/ResubmitModal.jsx

import { useState } from "react";
import { X, UploadCloud, Loader2, FileText } from "lucide-react";
import submissionService from "../services/submissionService";

export default function ResubmitModal({ article, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a revised manuscript file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Build the payload exactly as Endpoint 64 requires
    const formData = new FormData();
    formData.append("manuscript_file", file);
    formData.append("revision_notes", notes);

    try {
      await submissionService.resubmitArticle(article.id, formData);
      onSuccess(); // Close modal and refresh data on success
    } catch (err) {
      console.error("Resubmission error:", err);
      setError(
        err.response?.data?.detail || 
        "Failed to upload the revision. Please check your connection and try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8FBFF]">
          <h3 className="text-lg font-semibold text-[#24344D]">Upload Revision</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Target Article Banner */}
          <div className="bg-orange-50 border border-orange-100 text-orange-800 p-3 rounded-xl text-sm flex gap-3 items-start">
            <FileText className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-orange-900">Article #{article.id}</span>
              <span className="line-clamp-2">{article.title || "Untitled Manuscript"}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 text-[13px] p-3 rounded-xl border border-red-100 font-medium">
              {error}
            </div>
          )}

          {/* File Upload Area */}
          <div>
            <label className="block text-[14px] font-medium text-[#24344D] mb-2">
              Revised Manuscript (PDF/Word) <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-[#D9EAF7] rounded-xl p-6 text-center hover:bg-[#F8FBFF] hover:border-[#0077B6] transition cursor-pointer relative group">
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setError(null); // Clear error when they select a file
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
              <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2 group-hover:text-[#0077B6] transition" />
              {file ? (
                <div className="text-sm font-medium text-[#0077B6] break-words px-4">
                  {file.name}
                  <div className="text-xs text-gray-400 mt-1 font-normal">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-gray-500">
                  Click or drag your updated file here to upload
                </p>
              )}
            </div>
          </div>

          {/* Revision Notes Area */}
          <div>
            <label className="block text-[14px] font-medium text-[#24344D] mb-2">
              Revision Notes to Editor <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Briefly explain the changes you made based on the reviewer comments..."
              className="w-full border border-[#D9EAF7] rounded-xl p-3 text-[14px] text-[#24344D] focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none resize-none transition bg-[#FAFCFF] focus:bg-white"
            ></textarea>
          </div>

          {/* Actions Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-11 border border-[#D9EAF7] text-[#24344D] rounded-xl text-[14px] font-medium hover:bg-[#F8FBFF] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 bg-[#0077B6] hover:bg-[#005F91] text-white rounded-xl text-[14px] font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Submit Revision"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}