# Homeopathy Clinic Manager

## Current State
MedicineMaster page has a local `useState` for medicines initialized from `HOMEO_MEDICINES` constant. When user imports from Excel, `setMedicines` is called which updates local state — but this is lost on page refresh. The imported data is NOT persisted anywhere.

The table columns are: # | Medicine Name | Category | उपयोग/लक्षण | Potency | इकाई | कंपनी | Action

## Requested Changes (Diff)

### Add
- A Zustand store slice (or separate store) for medicine master list with `persist` middleware (localStorage key: `medicineMasterStore`) that stores the `HomeoMedicine[]` array and exposes `setMedicineMaster(medicines)` and `addMedicinesToMaster(newMeds)` actions.
- On app load, the store is initialized from localStorage if available, else from `HOMEO_MEDICINES`.

### Modify
- `MedicineMaster.tsx`: replace local `useState<HomeoMedicine[]>` with the persisted Zustand store. The `handleConfirmImport` should call `addMedicinesToMaster` from the store instead of local `setMedicines`.
- Update table columns to match user's uploaded image: S.No | Medicine Name | Category | Available Potency | Unit / Form | Company / Brand | Usage / Key Symptoms | Action
- Column header text update only (no structural changes needed beyond renaming).

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/store/medicineMasterStore.ts` — Zustand store with persist middleware, initialized from `HOMEO_MEDICINES` if localStorage is empty.
2. Update `MedicineMaster.tsx` to use the new store instead of local state for medicines list.
3. Update table column headers to: S.No, Medicine Name, Category, Available Potency, Unit / Form, Company / Brand, Usage / Key Symptoms.
4. Validate and build.
