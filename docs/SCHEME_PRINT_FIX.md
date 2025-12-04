# Scheme of Work Printing Fix

## Issue

The user reported that printing the Scheme of Work resulted in a portrait format instead of the expected landscape format.

## Analysis

1.  The "Print" button on the Scheme of Work view page (`frontend/app/professional-records/schemes/[id]/page.tsx`) was using `window.print()`.
2.  While there were CSS `@page { size: A4 landscape; }` rules, browser support for this can be inconsistent, often resulting in portrait printing by default.
3.  A `handleDownloadPDF` function existed in the component but was unused.
4.  The backend endpoint `/api/v1/schemes/{id}/pdf` (called by `handleDownloadPDF`) explicitly generates a PDF in landscape mode using ReportLab.

## Fix

1.  Modified `frontend/app/professional-records/schemes/[id]/page.tsx`:
    - Replaced the `onClick` handler of the "Print" button from `window.print()` to `handleDownloadPDF`.
    - Renamed the button text from "Print" to "Download PDF" to accurately reflect the action.
    - Updated `handleDownloadPDF` to handle potential missing `subject_name` by falling back to `subject`.

## Result

Users will now download a professionally formatted landscape PDF of their Scheme of Work, which they can then print. This guarantees the correct orientation and layout.
