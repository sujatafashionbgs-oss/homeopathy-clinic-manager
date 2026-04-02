# Homeopathy Clinic Manager

## Current State
- Patient revisit modal shows history panel but does NOT display previous medicines prescribed or symptoms/complaints clearly.
- Patient revisit search is only by name/code, NOT by mobile number.
- Print (invoice/prescription/report) pages are not constrained to portrait A4 — content overflows or does not fit.
- Reports page print/export-to-PDF does not work correctly (likely missing print styles or jsPDF call broken).
- No WhatsApp send option for prescription PDF from within Visits & Prescriptions.
- Visits & Prescriptions list has no search by patient name or mobile number.
- Visits & Prescriptions list has no paid/unpaid filter, no customer details print, no Excel export, no WhatsApp send for individual visit row.

## Requested Changes (Diff)

### Add
1. **Patient Revisit — Previous Medicines & Symptoms**: In the revisit modal/panel, display a timeline of previous visits showing: date, chief complaints/symptoms, and medicines prescribed (name, potency, dosage) for each visit.
2. **Patient Revisit — Mobile Search**: Add a mobile number search field in the revisit lookup (in addition to name/code), so staff can find a patient by typing their 10-digit mobile number.
3. **Visits & Prescriptions — Search by Name/Mobile**: Add a search input at the top of the visits list that filters by patient name OR mobile number in real time.
4. **Visits & Prescriptions — Paid/Unpaid Filter**: Add a filter dropdown (All / Paid / Unpaid / Partial) that filters visits based on associated bill payment status.
5. **Visits & Prescriptions — Per-Row Actions**: Add per-row action buttons: Print (customer detail card), Export Excel (visit+prescription row), WhatsApp (send prescription via WhatsApp deep link).
6. **Visits & Prescriptions — Bulk Export & Print**: Add toolbar buttons: "Print Selected" (customer details), "Export Excel" (all filtered visits), "WhatsApp Send" (bulk message via wa.me for selected patients).
7. **Prescription WhatsApp Send**: In the prescription print/view modal, add a "Send via WhatsApp" button that generates a text summary of the prescription and opens wa.me with pre-filled message to the patient's mobile.
8. **Print Portrait Fix**: Add `@media print` CSS that forces A4 portrait (210mm × 297mm), hides sidebar/topbar/buttons, and ensures prescription and invoice content fits within one page. Apply `@page { size: A4 portrait; margin: 10mm; }` globally.
9. **Reports Print/PDF Fix**: Fix the print and export-to-PDF in Reports page — ensure the print button triggers `window.print()` with correct print-only styles, and PDF export uses jsPDF/html2canvas correctly scoped to the report content area (not full page).

### Modify
- `src/frontend/src/pages/Visits.tsx`: Add search bar (name/mobile), paid/unpaid filter, per-row print/excel/WhatsApp actions, bulk export toolbar, WhatsApp prescription send in visit modal, portrait print styles.
- `src/frontend/src/pages/Patients.tsx` and `PatientDetail.tsx`: In revisit flow, show previous visit medicines & symptoms, add mobile number search.
- `src/frontend/src/pages/Reports.tsx`: Fix print and PDF export to work correctly with scoped content.
- `src/frontend/src/index.css` (or global styles): Add `@media print` and `@page` rules for A4 portrait.

### Remove
- Nothing removed.

## Implementation Plan
1. Update global CSS (`index.css`) with `@page { size: A4 portrait; margin: 10mm; }` and `@media print` rules hiding sidebar, topbar, action buttons; ensure `.print-area` class is full-width in print mode.
2. In `Visits.tsx`:
   a. Add `searchTerm` state, filter visits by patient name AND mobile number.
   b. Add `paymentFilter` state (All/Paid/Unpaid/Partial), derive payment status from mock bills by matching patientId.
   c. Add per-row: Print button (opens a small printable patient+visit card), Excel export (uses xlsx to write one row), WhatsApp button (opens wa.me with prescription summary).
   d. Add toolbar: Export All (xlsx), Print All (window.print scoped), Bulk WhatsApp.
   e. In visit detail/prescription modal: add "Send via WhatsApp" button generating prescription text → wa.me deep link.
3. In `PatientDetail.tsx` / revisit modal:
   a. Show previous visits as a timeline: date, complaints, medicines (name+potency+dosage) pulled from mock visits/prescriptions data.
   b. Add mobile number search in the patient lookup for revisit.
4. In `Reports.tsx`:
   a. Wrap report content in a `<div id="report-print-area">` ref.
   b. Fix Print button to call `window.print()` after setting body to only show that div.
   c. Fix PDF export to use `html2canvas` on the ref + `jsPDF` to add the canvas as image — import html2canvas if not present (add to package.json).
5. Verify build passes with no TypeScript errors.
