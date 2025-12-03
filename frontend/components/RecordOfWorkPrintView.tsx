import React from "react";

interface RecordEntry {
  id: number;
  week_number: number;
  strand: string;
  topic: string;
  learning_outcome_a: string;
  learning_outcome_b: string;
  learning_outcome_c: string;
  learning_outcome_d: string;
  reflection: string;
  signature: string;
  date_taught: string;
  status: string;
}

interface RecordOfWork {
  id: number;
  school_name: string;
  teacher_name: string;
  learning_area: string;
  grade: string;
  term: string;
  year: number;
  entries: RecordEntry[];
}

interface RecordOfWorkPrintViewProps {
  record: RecordOfWork;
  isEditing?: boolean;
  onUpdateEntry?: (entryId: number, field: string, value: string) => void;
  weekFilter?: number | null; // Optional: if provided, only show this week
}

export const RecordOfWorkPrintView = React.forwardRef<
  HTMLDivElement,
  RecordOfWorkPrintViewProps
>(({ record, isEditing = false, onUpdateEntry, weekFilter = null }, ref) => {
  // Helper to calculate rowspans for a specific week's entries
  const calculateRowSpans = (entries: RecordEntry[]) => {
    const strandSpans: number[] = new Array(entries.length).fill(0);
    const topicSpans: number[] = new Array(entries.length).fill(0);

    let currentStrandIndex = 0;
    let currentTopicIndex = 0;

    for (let i = 0; i < entries.length; i++) {
      // Strand Logic
      if (i > 0 && entries[i].strand === entries[i - 1].strand) {
        strandSpans[currentStrandIndex]++;
      } else {
        currentStrandIndex = i;
        strandSpans[i] = 1;
      }

      // Topic Logic (merge if topic AND strand are same)
      if (
        i > 0 &&
        entries[i].topic === entries[i - 1].topic &&
        entries[i].strand === entries[i - 1].strand
      ) {
        topicSpans[currentTopicIndex]++;
      } else {
        currentTopicIndex = i;
        topicSpans[i] = 1;
      }
    }
    return { strandSpans, topicSpans };
  };

  // Filter entries if weekFilter is provided
  const filteredEntries = weekFilter
    ? record.entries.filter((e) => e.week_number === weekFilter)
    : record.entries;

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.week_number]) {
      acc[entry.week_number] = [];
    }
    acc[entry.week_number].push(entry);
    return acc;
  }, {} as Record<number, RecordEntry[]>);

  const sortedWeeks = Object.keys(groupedEntries)
    .map(Number)
    .sort((a, b) => a - b);

  if (sortedWeeks.length === 0) {
    return (
      <div ref={ref} className="p-8 text-center text-gray-500">
        No entries found for this selection.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-white shadow-lg p-8 print:shadow-none print:p-0 print:break-after-page mb-8 last:mb-0"
    >
      {/* Document Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-center uppercase mb-6">
          Records of Work Covered {weekFilter ? `- Week ${weekFilter}` : ""}
        </h1>
        <div className="flex justify-between text-sm font-bold uppercase border border-gray-300 p-4 rounded-lg">
          <div className="space-y-2">
            <p>
              <span className="w-32 inline-block text-gray-600">SCHOOL:</span>
              {record.school_name}
            </p>
            <p>
              <span className="w-32 inline-block text-gray-600">
                LEARNING AREA:
              </span>
              {record.learning_area}
            </p>
            <p>
              <span className="w-32 inline-block text-gray-600">TEACHER:</span>
              {record.teacher_name}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <p>
              <span className="w-20 inline-block text-left text-gray-600">
                GRADE:
              </span>
              {record.grade}
            </p>
            <p>
              <span className="w-20 inline-block text-left text-gray-600">
                TERM:
              </span>
              {record.term}
            </p>
            <p>
              <span className="w-20 inline-block text-left text-gray-600">
                YEAR:
              </span>
              {record.year}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-gray-800 text-sm">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-100">
            <th className="border border-gray-800 p-2 w-16 text-center">
              WEEK
            </th>
            <th className="border border-gray-800 p-2 w-1/4 text-left">
              STRAND
            </th>
            <th className="border border-gray-800 p-2 w-1/3 text-left">
              WORK COVERED
            </th>
            <th className="border border-gray-800 p-2 text-left">REFLECTION</th>
            <th className="border border-gray-800 p-2 w-24 text-center">
              SIGN
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedWeeks.map((weekNum) => {
            const weekEntries = groupedEntries[weekNum];
            const { strandSpans, topicSpans } = calculateRowSpans(weekEntries);

            return weekEntries.map((entry, index) => (
              <tr key={entry.id} className="break-inside-avoid">
                {/* Show Week Number only on first row of the week */}
                {index === 0 && (
                  <td
                    className="border border-gray-800 p-2 text-center font-bold align-top"
                    rowSpan={weekEntries.length}
                  >
                    {weekNum}
                  </td>
                )}

                {/* Strand Column with RowSpan */}
                {strandSpans[index] > 0 && (
                  <td
                    className="border border-gray-800 p-2 align-top"
                    rowSpan={strandSpans[index]}
                  >
                    <div className="font-semibold">{entry.strand}</div>
                  </td>
                )}

                {/* Work Covered Column - Merged Topic if applicable */}
                <td className="border border-gray-800 p-2 align-top">
                  {/* Only show topic if it's the start of a topic span */}
                  {topicSpans[index] > 0 && (
                    <div className="font-bold mb-2 pb-1 border-b border-gray-200">
                      {entry.topic}
                    </div>
                  )}

                  <div className="pl-2 space-y-1 text-gray-700">
                    {entry.learning_outcome_a && (
                      <div>a) {entry.learning_outcome_a}</div>
                    )}
                    {entry.learning_outcome_b && (
                      <div>b) {entry.learning_outcome_b}</div>
                    )}
                    {entry.learning_outcome_c && (
                      <div>c) {entry.learning_outcome_c}</div>
                    )}
                    {entry.learning_outcome_d && (
                      <div>d) {entry.learning_outcome_d}</div>
                    )}
                  </div>
                </td>

                <td className="border border-gray-800 p-2 align-top">
                  {isEditing && onUpdateEntry ? (
                    <textarea
                      className="w-full h-full min-h-[60px] p-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                      placeholder="Enter reflection..."
                      value={entry.reflection || ""}
                      onChange={(e) =>
                        onUpdateEntry(entry.id, "reflection", e.target.value)
                      }
                    />
                  ) : (
                    <div className="whitespace-pre-wrap min-h-[60px]">
                      {entry.reflection}
                    </div>
                  )}
                </td>
                <td className="border border-gray-800 p-2 align-top text-center">
                  {isEditing && onUpdateEntry ? (
                    <input
                      type="text"
                      className="w-full text-center border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                      placeholder="Sign"
                      value={entry.signature || ""}
                      onChange={(e) =>
                        onUpdateEntry(entry.id, "signature", e.target.value)
                      }
                    />
                  ) : (
                    <div className="font-script text-lg min-h-[30px]">
                      {entry.signature}
                    </div>
                  )}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
});

RecordOfWorkPrintView.displayName = "RecordOfWorkPrintView";
