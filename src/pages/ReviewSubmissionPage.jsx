import { useState } from "react";
import { ArrowLeft, FileText, ShieldCheck, Send, Loader2, Check } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layout/layout";
import reviewService from "../services/reviewService";

/* ==========================================
   RADIO GROUP COMPONENT
========================================== */
function RadioGroup({ title, value, setValue, options }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D9EAF7] p-5">
      <h3 className="text-lg font-semibold text-[#24344D] mb-5">{title}</h3>
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              checked={value === option}
              onChange={() => setValue(option)}
              className="w-4 h-4 accent-[#0077B6]"
            />
            <span className="text-sm text-[#24344D]">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ReviewSubmissionPage() {
  const navigate = useNavigate();
  const params = useParams(); 
  const location = useLocation();

  // 🟢 BULLETPROOF ID EXTRACTOR
  // This automatically checks all possible names your router might be using for the ID,
  // including hidden state variables passed from the previous page.
  const targetId = params.id || params.submissionId || params.assignmentId || location.state?.id || location.state?.submissionId;

  // ==========================================
  // STATES
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 

  const [reportComplete, setReportComplete] = useState("");
  const [transferReport, setTransferReport] = useState("");
  const [refereeConfidence, setRefereeConfidence] = useState("");
  const [suitability, setSuitability] = useState("");
  const [quality, setQuality] = useState("");
  const [value, setValue] = useState("");
  const [classification, setClassification] = useState("");
  const [finalDecision, setFinalDecision] = useState("");
  const [commentsToAuthor, setCommentsToAuthor] = useState("");
  const [confidentialComments, setConfidentialComments] = useState("");
  const [contentChecks, setContentChecks] = useState([]);
  const [presentationChecks, setPresentationChecks] = useState([]);

  // ==========================================
  // CHECKBOX HANDLER
  // ==========================================
  const toggleCheck = (itemValue, list, setter) => {
    if (list.includes(itemValue)) {
      setter(list.filter((item) => item !== itemValue));
    } else {
      setter([...list, itemValue]);
    }
  };

// ==========================================
  // SUBMIT REVIEW
  // ==========================================
const submitReview = async () => {
    // 1. Validation
    if (!reportComplete || !transferReport || !finalDecision) {
      toast.error("Please complete the required fields.");
      return;
    }

    if (!targetId) {
      toast.error("Error: Assignment ID is missing.");
      return;
    }

    // 2. Prepare payload
    const payload = {
      review_report_complete: reportComplete === "Yes",
      ready_to_transfer_to_editor: transferReport === "Yes",
      
      // Match Exact Enums
      recommendation: finalDecision.toLowerCase().replace(" ", "_"), // e.g. "minor_revision"
      paper_referee_confidence: refereeConfidence === "with confidence" ? "confident" : "not_able",
      referee_suitability_rating: suitability.replace("%", ""), // "100"
      paper_quality_rating: quality.toLowerCase().replace(/ /g, "_"), // "significant"
      
      // Complex Enum Mapping
      paper_value_rating: value === "Worth publishing" ? "worth_publishing" :
                          value === "Worth publishing when revised - minor modifications" ? "minor_modifications" :
                          value === "Worth publishing when revised - major modifications" ? "major_modifications" :
                          "not_worth_publishing",
      
      manuscript_classification: classification.toLowerCase().replace(" ", "_"), // "technical_note"

      // Text fields
      reviewer_comments_to_author: commentsToAuthor,
      confidential_comments_to_editor: confidentialComments,
      suitable_for_different_journal: false, // Defaulting to false as it's not in the UI

      // Flat Content Booleans
      content_original_work: contentChecks.includes("Original work"),
      content_well_organised: contentChecks.includes("Well organised"),
      content_abstract_adequate: contentChecks.includes("Abstract adequate"),
      content_technically_sound: contentChecks.includes("Technically sound"),
      content_practical_application: contentChecks.includes("Practical application"),
      content_references_adequate: contentChecks.includes("References adequate"),

      // Flat Presentation Booleans
      presentation_explains_clearly: presentationChecks.includes("Clear explanation"),
      presentation_methods_included: presentationChecks.includes("Sufficient method details"),
      presentation_demonstrates_value: presentationChecks.includes("Demonstrated value"),
      presentation_language_clear: presentationChecks.includes("Clear language"),
    };

try {
      setIsSubmitting(true);
      
      // 3. API Call
      await reviewService.submitReview(targetId, payload);
      
      // 4. Update UI State immediately
      setIsSubmitting(false);
      setIsSubmitted(true); // Button will now change to "Report Submitted"
      toast.success("Review submitted successfully!");
      
      // 5. Navigate after a slight delay to allow the user to see the success state
      setTimeout(() => {
        navigate("/revisions");
      }, 2000); // 2 seconds is enough time for the user to register the change
      
    } catch (error) {
      console.error("Submission failed:", error);
      const errorMsg = error.response?.data?.detail || "Failed to submit.";
      toast.error(errorMsg);
      setIsSubmitting(false); 
      setIsSubmitted(false); // Ensure button resets on error
    } 
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => navigate("/revisions")}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <ArrowLeft size={16} />
          Back to reviewer assignments
        </button>

        {/* HERO */}
        <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)", borderRadius: "8px", padding: "28px 36px", borderTop: "4px solid var(--primary)", marginBottom: "28px" }}>
          <h1 className="text-4xl font-bold">Reviewer Report</h1>
          <p className="mt-3 text-blue-100 leading-7 max-w-3xl">
            Please complete the confidential reviewer report for the submitted manuscript.
          </p>
        </div>

        <div className="space-y-6 mt-6">
          {/* COMPLETE */}
          <RadioGroup
            title="My reviewer report is complete"
            value={reportComplete}
            setValue={setReportComplete}
            options={["Yes", "No"]}
          />

          {/* TRANSFER */}
          <RadioGroup
            title="I am ready to transfer my reviewer report to the Editors"
            value={transferReport}
            setValue={setTransferReport}
            options={["Yes", "No"]}
          />

          {/* REFEREE */}
          <RadioGroup
            title="Paper is in a field which I can referee"
            value={refereeConfidence}
            setValue={setRefereeConfidence}
            options={[
              "with confidence",
              "I am not able to referee this manuscript",
            ]}
          />

          {/* SUITABILITY */}
          <RadioGroup
            title="Rate your suitability as a referee"
            value={suitability}
            setValue={setSuitability}
            options={["100%", "75%", "50%", "25%", "0%"]}
          />

          {/* QUALITY */}
          <RadioGroup
            title="Paper Quality"
            value={quality}
            setValue={setQuality}
            options={[
              "Excellent",
              "Significant",
              "Marginal",
              "Non Significant",
              "Erroneous or Trivial",
            ]}
          />

          {/* VALUE */}
          <RadioGroup
            title="Paper Value"
            value={value}
            setValue={setValue}
            options={[
              "Worth publishing",
              "Worth publishing when revised - minor modifications",
              "Worth publishing when revised - major modifications",
              "Not worth publishing",
            ]}
          />

          {/* CONTENT */}
          <div className="bg-white rounded-2xl border border-[#D9EAF7] p-5">
            <h3 className="text-lg font-semibold text-[#24344D] mb-5">
              Content Evaluation
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Original work",
                "Well organised",
                "Abstract adequate",
                "Technically sound",
                "Practical application",
                "References adequate",
              ].map((item) => (
                <label key={item} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={contentChecks.includes(item)}
                    onChange={() => toggleCheck(item, contentChecks, setContentChecks)}
                    className="w-4 h-4 accent-[#0077B6]"
                  />
                  <span className="text-sm text-[#24344D]">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* PRESENTATION */}
          <div className="bg-white rounded-2xl border border-[#D9EAF7] p-5">
            <h3 className="text-lg font-semibold text-[#24344D] mb-5">
              Presentation
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Clear explanation",
                "Sufficient method details",
                "Demonstrated value",
                "Clear language",
              ].map((item) => (
                <label key={item} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={presentationChecks.includes(item)}
                    onChange={() => toggleCheck(item, presentationChecks, setPresentationChecks)}
                    className="w-4 h-4 accent-[#0077B6]"
                  />
                  <span className="text-sm text-[#24344D]">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* CLASSIFICATION */}
          <RadioGroup
            title="Classification"
            value={classification}
            setValue={setClassification}
            options={[
              "Review",
              "Paper",
              "Communication",
              "Technical Note",
            ]}
          />

          {/* AUTHOR COMMENTS */}
          <div className="bg-white rounded-2xl border border-[#D9EAF7] p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-[#0077B6]" size={20} />
              <h3 className="text-lg font-semibold text-[#24344D]">
                Comments To Author
              </h3>
            </div>
            <textarea
              rows={8}
              value={commentsToAuthor}
              onChange={(e) => setCommentsToAuthor(e.target.value)}
              placeholder="Write comments visible to author..."
              className="w-full border border-[#D9EAF7] rounded-2xl px-4 py-4 outline-none resize-none focus:border-[#0077B6]"
            />
          </div>

          {/* CONFIDENTIAL */}
          <div className="bg-white rounded-2xl border border-[#D9EAF7] p-5">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-[#0077B6]" size={20} />
              <h3 className="text-lg font-semibold text-[#24344D]">
                Confidential Comments To Editor
              </h3>
            </div>
            <textarea
              rows={8}
              value={confidentialComments}
              onChange={(e) => setConfidentialComments(e.target.value)}
              placeholder="These comments are visible only to editor..."
              className="w-full border border-[#D9EAF7] rounded-2xl px-4 py-4 outline-none resize-none focus:border-[#0077B6]"
            />
          </div>

          {/* FINAL DECISION */}
          <RadioGroup
            title="Final Recommendation"
            value={finalDecision}
            setValue={setFinalDecision}
            options={[
              "Accept",
              "Minor Revision",
              "Major Revision",
              "Reject",
            ]}
          />

          {/* SUBMIT BUTTON */}
          <div className="sticky bottom-5 z-30">
            <button
              onClick={submitReview}
              disabled={isSubmitting || isSubmitted}
              className={`w-full h-14 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-xl transition-all duration-300 ${
                isSubmitted
                  ? "bg-emerald-600 hover:bg-emerald-600 cursor-default"
                  : "bg-[#0077B6] hover:bg-[#005F91] disabled:opacity-70 disabled:cursor-not-allowed"
              }`}
            >
              {isSubmitted ? (
                <>
                  <Check size={20} className="animate-in zoom-in duration-300" />
                  Report Submitted
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Reviewer Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}