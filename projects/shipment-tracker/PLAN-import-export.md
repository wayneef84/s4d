# Import/Export System Overhaul Plan

**Priority:** TOP - Resume after context reset (Thursday 1/29 7pm)
**Status:** Planning
**Created:** 2026-01-28

---

## Overview

Redesign the import/export system to support full database operations, not just AWB additions. Support both CSV and JSON formats with document preservation. Also move Docs column to Actions as an icon button.

---

## Requirements

### 1. Docs Column → Actions Button

**Current:** Separate "Docs" column showing ✅/⚠️/🔋 icons

**New:** Move to Actions column as a button
- Icon shows compliance status (✅/⚠️/🔋) - same logic as before
- Clicking opens a **Documents Modal** (separate from detail panel)
- Modal allows:
  - View all attached documents
  - Open document in new window
  - Edit document URL
  - Remove document
  - Add new document
- Same functionality as detail panel documents section, but standalone modal

**Benefits:**
- Reduces table width
- Documents accessible without opening detail panel
- Consistent icon that changes based on status

### 2. Export Capabilities

#### CSV Export
- All tracking fields (existing)
- **NEW:** `documents` column containing JSON string of documents array
- **NEW:** Individual document columns for common types:
  - `doc_CI` (Commercial Invoice URL)
  - `doc_PL` (Packing List URL)
  - `doc_SLI` (SLI/AWB URL)
  - `doc_UN383` (UN38.3 URL)
  - `doc_MSDS` (MSDS URL)
  - `doc_OTHER` (Other documents as JSON string)
- User can delete columns they don't need

#### JSON Export
- Full database dump (already contains documents)
- No changes needed

### 3. Import Capabilities

#### CSV Import
- **UPDATE mode (default):** Match by AWB + Carrier
  - If match found: Update existing record, merge documents
  - If no match: Create new record
- Parse `documents` JSON column if present
- Parse individual `doc_*` columns and merge into documents array
- Smart date handling (use `saveSmartTracking` logic)

#### JSON Import
- **UPDATE mode:** Match by AWB + Carrier, update existing
- **REPLACE mode:** Clear all data, import fresh database
- Preserve documents array from import

### 4. Custom Carrier Support

- Add "Custom" to carrier dropdown
- Custom carrier trackings:
  - No API refresh (manual updates only)
  - No carrier tracking URL
  - Status managed manually via detail panel
- Detection: Skip auto-detect for unrecognized formats, prompt for carrier

---

## UI Changes

### Table Actions Column

**Current Actions:** Details 📋 | Refresh 🔄 | Delete 🗑️

**New Actions:** Docs [icon] | Details 📋 | Refresh 🔄 | Delete 🗑️

Docs button:
- Icon: ✅ (complete), ⚠️ (missing CI/PL), 🔋 (has UN38.3)
- Same icon logic as current Docs column
- Opens Documents Modal on click

### Documents Modal (New)

```
┌─────────────────────────────────────┐
│ Documents - AWB123456789            │
├─────────────────────────────────────┤
│ 🧾 Commercial Invoice    [↗️] [✏️] [🗑️] │
│ 📦 Packing List          [↗️] [✏️] [🗑️] │
│ 🔋 UN38.3 Test Summary   [↗️] [✏️] [🗑️] │
├─────────────────────────────────────┤
│ [+ Add Document]                    │
├─────────────────────────────────────┤
│                          [Close]    │
└─────────────────────────────────────┘
```

Actions per document:
- ↗️ Open in new window
- ✏️ Edit URL (inline or sub-modal)
- 🗑️ Remove document

Add Document: Same dropdown + URL input as current

### Data Management Modal

Current buttons:
- Export CSV
- Export JSON
- Import CSV
- Download Template

**Changes:**
1. Import section needs mode selector:
   - "Update existing records" (default)
   - "Replace all data" (JSON only, with confirmation)

2. Add warning text for Replace mode:
   > "This will DELETE all current data and replace with imported data."

### Add Tracking Form
- Add "Custom" option to carrier dropdown
- When Custom selected, hide auto-detect behavior

---

## Implementation Steps

### Phase 1: Docs Button in Actions Column
1. Remove separate "Docs" `<th>` from table header
2. Remove compliance cell from `createTableRow()`
3. Add Docs button to Actions cell (before Details button)
4. Button shows compliance icon from `documentManager.getComplianceIcon()`
5. Button onclick opens Documents Modal

### Phase 2: Documents Modal
1. Create new modal HTML in index.html (similar to document modal but with list)
2. Create `showDocumentsModal(awb, carrier)` method
3. Create `renderDocumentsModalList(tracking)` method
4. Wire up Open/Edit/Remove/Add actions
5. On any change: save to DB, refresh modal list, refresh table row icon

### Phase 3: Custom Carrier
1. Add "Custom" to carrier options in HTML
2. Update `detectCarrier()` to return null for unrecognized (already does)
3. Skip API refresh for Custom carrier in `queryEngine()`
4. Return null for Custom in `getCarrierTrackingURL()`

### Phase 4: Export with Documents
1. Update `exportCSV()` in app.js:
   - Add `documents` JSON column
   - Add individual `doc_*` columns
   - Use `documentManager.serializeDocumentsForCSV()`
2. Update CSV template to include new columns

### Phase 5: Import with Documents
1. Update `handleImportFile()` for CSV:
   - Parse `documents` JSON column
   - Parse individual `doc_*` columns
   - Merge into documents array
   - Use `saveSmartTracking()` for updates
2. Update `handleImportFile()` for JSON:
   - Add mode parameter (update vs replace)
   - Replace mode: `clearAll()` then import
   - Update mode: Use `saveSmartTracking()` with document merge

### Phase 6: UI Updates
1. Add import mode selector to Data Management Modal
2. Add confirmation dialog for Replace mode
3. Update import template

### Phase 7: Document Merge Logic
Create `mergeDocuments(existing, incoming)` in document-manager.js:
- If same type exists: Incoming overwrites
- If type doesn't exist: Add from incoming
- Preserve types not in incoming

---

## CSV Column Spec

| Column | Type | Description |
|--------|------|-------------|
| awb | string | Tracking number (required) |
| carrier | string | DHL, FedEx, UPS, Custom (required) |
| status | string | Current status text |
| deliverySignal | string | DELIVERED, IN_TRANSIT, etc. |
| delivered | boolean | true/false |
| dateShipped | string | ISO date or empty |
| origin_city | string | Origin city |
| origin_state | string | Origin state |
| origin_country | string | Origin country |
| origin_postalCode | string | Origin postal |
| destination_city | string | Destination city |
| destination_state | string | Destination state |
| destination_country | string | Destination country |
| destination_postalCode | string | Destination postal |
| estimatedDelivery | string | ISO date or empty |
| lastUpdated | string | ISO datetime |
| lastChecked | string | ISO datetime |
| note | string | User notes |
| tags | string | JSON array of tags |
| documents | string | JSON array of all documents |
| doc_CI | string | Commercial Invoice URL |
| doc_PL | string | Packing List URL |
| doc_SLI | string | SLI/AWB URL |
| doc_UN383 | string | UN38.3 URL |
| doc_MSDS | string | MSDS URL |
| doc_OTHER | string | JSON array of other docs |

---

## Testing Checklist

- [ ] Docs button appears in Actions column
- [ ] Docs button shows correct compliance icon
- [ ] Documents Modal opens on Docs button click
- [ ] Documents Modal shows all attached documents
- [ ] Open in new window works
- [ ] Edit document URL works
- [ ] Remove document works
- [ ] Add new document works
- [ ] Table row icon updates after changes
- [ ] Export CSV includes documents JSON column
- [ ] Export CSV includes individual doc_* columns
- [ ] Import CSV parses documents JSON column
- [ ] Import CSV parses individual doc_* columns
- [ ] Import CSV update mode merges with existing
- [ ] Import JSON update mode merges with existing
- [ ] Import JSON replace mode clears and imports
- [ ] Custom carrier can be added
- [ ] Custom carrier skips API refresh
- [ ] Custom carrier has no tracking URL
- [ ] Round-trip: Export → Import preserves all data

---

## Notes

- `saveSmartTracking()` already exists in db.js (added by user)
- Document merge should be additive for different types, overwrite for same type
- Reuse existing document modal for Add, create list modal for management
- Detail panel documents section can remain for convenience, or be removed (user preference)
