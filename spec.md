# Homeopathy Clinic Manager

## Current State
Full clinic management system with 9 modules: Dashboard, Patients, Visits & Prescriptions, Billing, Medicines, Medicine Master, Vendors, Expenses, Reports, Settings. All data is mock-based via Zustand store. Existing WhatsApp support is only a basic wa.me deep link button on patient cards.

## Requested Changes (Diff)

### Add
1. **WhatsApp Templates Module** (new page `/whatsapp` accessible from sidebar)
   - Template Manager: Create, edit, delete message templates for 3 categories:
     - Due Payment Reminder (variables: patient name, amount due, clinic name, phone)
     - Follow-up Reminder (variables: patient name, follow-up date, clinic name)
     - Prescription (variables: patient name, medicines list, doctor name, clinic name)
   - Template editor with variable placeholders shown as chips (e.g. `{patient_name}`)
   - Preview pane showing rendered message with sample data
   - "Send via WhatsApp" button that opens wa.me link with the filled template
   - Prescription PDF send: generate prescription as PDF blob, show instructions to attach manually (wa.me doesn't support direct file attach — show a "Download PDF" then "Open WhatsApp" flow)
   - Bulk send: select multiple patients with due/follow-up status → send each via wa.me
   - Send log table showing: patient, template type, date sent, status (Sent/Pending)

2. **Patient Revisit Feature** (enhancement to Visits page and PatientDetail page)
   - In Visits list and PatientDetail, add "Revisit" button on each visit row
   - Clicking Revisit opens a new Visit modal pre-populated with:
     - Patient info (read-only)
     - Previous complaints, medical history, diagnosis (shown as read-only reference panel on the left/top)
     - Full visit history accordion: all past visits listed with date, chief complaints, diagnosis, medicines prescribed
     - New visit form on the right/bottom for entering fresh chief complaints, examination, new prescription
   - Visit modal has a "Previous History" tab showing all past visits in a timeline
   - On PatientDetail page, show complete medical history timeline with all past complaints, diagnoses, medicines

3. **Import Patients from Excel** (enhancement to Patients page)
   - "Import from Excel" button in Patients page header
   - Modal with: download template button (generates XLSX with correct column headers), file upload, preview table of parsed rows, validation errors highlighted, confirm import
   - Columns in template: Name, Age, DOB, Gender, Blood Group, Phone, Alt Phone, Email, Address, City, State, Pincode, Occupation, Referred By, Chief Complaints, Medical History, Family History, Allergies
   - Use xlsx/SheetJS library (already available or import via CDN-style dynamic import)
   - Show import results: X imported, Y errors with details

### Modify
- `Sidebar.tsx`: Add "WhatsApp" menu item with MessageCircle icon under Communication section
- `App.tsx`: Add `/whatsapp` route
- `Patients.tsx`: Add "Import from Excel" button, import modal
- `Visits.tsx` and `PatientDetail.tsx`: Add "Revisit" button, enhanced visit modal with history panel
- `mockData.ts`: Add whatsappTemplates and sendLog arrays to store; add revisit support

### Remove
- Nothing removed

## Implementation Plan
1. Add `WhatsApp` type definitions and state to mockData store (templates, sendLog)
2. Create `src/pages/WhatsApp.tsx` — full WhatsApp Templates module
3. Update `App.tsx` to add `/whatsapp` route
4. Update `Sidebar.tsx` to add WhatsApp nav item
5. Update `Visits.tsx` — add Revisit button, enhanced modal with Previous History tab
6. Update `PatientDetail.tsx` — add medical history timeline, Revisit button per visit
7. Update `Patients.tsx` — add Import from Excel button and modal with SheetJS
