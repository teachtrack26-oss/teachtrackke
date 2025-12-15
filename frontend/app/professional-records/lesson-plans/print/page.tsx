"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";

interface LessonPlan {
  id: number;
  learning_area: string;
  grade: string;
  date: string;
  time: string;
  roll: string;
  strand_theme_topic: string;
  sub_strand_sub_theme_sub_topic: string;
  specific_learning_outcomes: string;
  key_inquiry_questions: string;
  core_competences: string;
  values_to_be_developed: string;
  pcis_to_be_addressed: string;
  learning_resources: string;
  introduction: string;
  development: string;
  conclusion: string;
  summary: string;
  reflection_self_evaluation: string;
  status: string;
  week_number?: number;
  lesson_number?: number;
  lesson_duration_minutes?: number;
}

interface SchoolContext {
  school_name?: string;
  school_logo_url?: string;
  school_motto?: string;
  county?: string;
  sub_county?: string;
  is_school_linked?: boolean;
}

function PrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolContext, setSchoolContext] = useState<SchoolContext | null>(
    null
  );

  useEffect(() => {
    const fetchPlans = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        setLoading(false);
        return;
      }

      const ids = idsParam.split(",").map((id) => parseInt(id));
      const token = localStorage.getItem("accessToken");

      try {
        try {
          const contextRes = await axios.get("/api/v1/profile/school-context", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSchoolContext(contextRes.data);
        } catch (err) {
          console.log("No school context available");
        }

        const promises = ids.map((id) =>
          axios.get(`/api/v1/lesson-plans/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        const responses = await Promise.all(promises);
        const fetchedPlans = responses.map((res) => res.data);

        fetchedPlans.sort((a, b) => {
          if ((a.week_number || 0) !== (b.week_number || 0)) {
            return (a.week_number || 0) - (b.week_number || 0);
          }
          return (a.lesson_number || 0) - (b.lesson_number || 0);
        });

        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch lesson plans for printing", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Preparing print view...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return <div className="p-8 text-center">No lesson plans selected.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          nav,
          .no-print {
            display: none !important;
          }
          .print-preview-container {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            min-height: auto !important;
            border: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }

        /* Screen Preview Styles */
        .print-preview-container {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 20px auto;
          padding: 10mm;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          font-family: "Times New Roman", Times, serif;
          color: #000;
          font-size: 10pt;
          line-height: 1.2;
        }

        /* Header Styles */
        .school-header {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 5px;
          border-bottom: 0.8pt solid #000;
          padding-bottom: 2px;
          display: flex;
          align-items: flex-end;
        }
        .school-label {
          margin-right: 5px;
        }
        .school-value {
          flex-grow: 1;
          font-weight: bold;
          text-transform: uppercase;
        }

        .doc-title {
          text-align: center;
          font-weight: bold;
          font-size: 13pt;
          letter-spacing: 0.2px;
          margin: 6px 0 8px 0;
          text-transform: uppercase;
        }

        /* Top Table */
        .top-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          border: 0.6pt solid #000;
        }
        .top-table th,
        .top-table td {
          border: 0.6pt solid #000;
          padding: 4px 3px;
          text-align: center;
        }
        .top-table th {
          font-weight: bold;
          font-size: 9pt;
          text-transform: uppercase;
          background: transparent;
        }

        /* Premium Section Styles - Compact & Clean */
        .premium-section {
          margin-bottom: 6px;
        }

        .section-label {
          font-weight: bold;
          font-size: 10pt;
          margin-bottom: 2px;
          display: inline-block;
          margin-right: 5px;
        }

        .section-block-label {
          font-weight: bold;
          font-size: 10pt;
          margin-bottom: 2px;
          display: block;
          letter-spacing: 0.15px;
        }

        .section-content {
          font-size: 10pt;
          white-space: pre-wrap;
          text-align: justify;
          display: inline;
        }

        .section-block-content {
          font-size: 10pt;
          white-space: pre-wrap;
          text-align: justify;
          display: block;
        }

        .sub-label {
          font-style: italic;
          font-size: 9pt;
          margin-bottom: 2px;
          display: block;
        }

        /* Org Table */
        .org-header {
          text-align: center;
          font-weight: bold;
          margin: 10px 0 5px 0;
          font-size: 11pt;
          letter-spacing: 0.2px;
          text-transform: uppercase;
        }
        .org-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 2px;
          border: 0.6pt solid #000;
        }
        .org-table th,
        .org-table td {
          border: 0.6pt solid #000;
          padding: 4px 3px;
          vertical-align: top;
          text-align: left;
        }
        .org-table th {
          font-weight: bold;
          background: transparent;
          font-size: 9pt;
        }
      `}</style>

      {/* Print Controls */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/professional-records?tab=lessons")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            Print Preview ({plans.length} Plans)
          </h2>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
          <FiPrinter /> Print
        </button>
      </div>

      <div className="pt-20">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`print-preview-container ${
              index < plans.length - 1 ? "page-break" : ""
            }`}
          >
            {/* School Header */}
            <div className="school-header">
              <span className="school-label">SCHOOL:</span>
              <span className="school-value">
                {schoolContext?.school_name ||
                  "_________________________________"}
              </span>
            </div>

            {/* Title */}
            <div className="doc-title">Lesson Plan</div>

            {/* Top Table */}
            <table className="top-table">
              <thead>
                <tr>
                  <th>LEARNING AREA</th>
                  <th>GRADE</th>
                  <th>DATE</th>
                  <th>TIME</th>
                  <th>ROLL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{plan.learning_area}</td>
                  <td>{plan.grade}</td>
                  <td>
                    {plan.date ? new Date(plan.date).toLocaleDateString() : ""}
                  </td>
                  <td>{plan.time}</td>
                  <td>{plan.roll}</td>
                </tr>
              </tbody>
            </table>

            {/* Strand / Sub-strand - Inline for compactness */}
            <div className="premium-section">
              <div>
                <span className="section-label">Strand/Theme/Topic:</span>
                <span className="section-content">
                  {plan.strand_theme_topic}
                </span>
              </div>
              <div style={{ marginTop: "2px" }}>
                <span className="section-label">Sub-strand:</span>
                <span className="section-content">
                  {plan.sub_strand_sub_theme_sub_topic}
                </span>
              </div>
            </div>

            {/* Specific Learning Outcomes */}
            <div className="premium-section">
              <span className="section-block-label">
                Specific Learning Outcomes:
              </span>
              <span className="sub-label">
                By the end of the sub-strand, the learner should be able to:
              </span>
              <div className="section-block-content">
                {plan.specific_learning_outcomes}
              </div>
            </div>

            {/* Key Inquiry Question */}
            <div className="premium-section">
              <span className="section-block-label">Key Inquiry Question:</span>
              <div className="section-block-content">
                {plan.key_inquiry_questions}
              </div>
            </div>

            {/* Core Competences */}
            <div className="premium-section">
              <span className="section-block-label">Core Competences:</span>
              <div className="section-block-content">
                {plan.core_competences}
              </div>
            </div>

            {/* Values */}
            <div className="premium-section">
              <span className="section-block-label">Values:</span>
              <div className="section-block-content">
                {plan.values_to_be_developed}
              </div>
            </div>

            {/* PCIs */}
            <div className="premium-section">
              <span className="section-block-label">
                Pertinent & Contemporary Issues (PCIs):
              </span>
              <div className="section-block-content">
                {plan.pcis_to_be_addressed}
              </div>
            </div>

            {/* Learning Resources */}
            <div className="premium-section">
              <span className="section-block-label">Learning Resources:</span>
              <div className="section-block-content">
                {plan.learning_resources}
              </div>
            </div>

            {/* Organization of Learning */}
            <div className="org-header">Organization of Learning</div>
            <table className="org-table">
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>Stage</th>
                  <th style={{ width: "10%" }}>Time</th>
                  <th style={{ width: "75%" }}>Activity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Introduction</td>
                  <td>5 min</td>
                  <td className="whitespace-pre-wrap">{plan.introduction}</td>
                </tr>
                <tr>
                  <td>Development</td>
                  <td>{(plan.lesson_duration_minutes || 40) - 10} min</td>
                  <td className="whitespace-pre-wrap">{plan.development}</td>
                </tr>
                <tr>
                  <td>Conclusion</td>
                  <td>5 min</td>
                  <td className="whitespace-pre-wrap">{plan.conclusion}</td>
                </tr>
                <tr>
                  <td>Summary</td>
                  <td>-</td>
                  <td className="whitespace-pre-wrap">{plan.summary}</td>
                </tr>
              </tbody>
            </table>

            {/* Reflection */}
            <div className="premium-section" style={{ marginTop: "10px" }}>
              <span className="section-block-label">Reflection:</span>
              <div
                className="section-block-content"
                style={{ minHeight: "30px", borderBottom: "0.6pt solid #000" }}
              >
                {plan.reflection_self_evaluation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BulkPrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}
