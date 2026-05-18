# Plan: Inline PDF preview + details dialog for Orders / Hearings / Judgments

## Problem
On the eCourts CNR result card, clicking "View PDF" inside the Orders, Hearings, and Judgments tabs immediately downloads the file and shows nothing on screen. Users expect to first see the record details and the PDF inline, with a separate Download button.

## Proposed Behavior
Clicking a row (or its primary button) opens a modal dialog that contains:
1. A details panel — all available metadata for that record (date, type/title, judge, purpose, business/outcome, party, IA number, etc.).
2. An inline PDF preview (rendered via an `<iframe>` pointing to a blob URL fetched through the existing `document-proxy` edge function).
3. A "Download PDF" button that saves the same blob to disk (current download behavior).
4. A graceful fallback message if no PDF is attached or the proxy returns the "not found" JSON fallback.

The current auto-download flow is removed from the row-level "View PDF" trigger; download remains available inside the dialog.

## Implementation (frontend only — `src/pages/ECourts.tsx`)

1. Add state:
   - `recordDialog: { open: boolean; record: any | null; kind: "order" | "hearing" | "judgment" | null }`
   - `pdfPreview: { loading: boolean; url: string | null; error: string | null; filename: string }`

2. Refactor `openDocProxy`:
   - Split into `fetchDocBlob(rec)` → returns `{ blob, filename }` or throws.
   - Keep a `downloadBlob(blob, filename)` helper using the existing anchor-click technique.

3. New `openRecordDialog(record, kind)`:
   - Sets `recordDialog` open and triggers `fetchDocBlob` if the record has a file reference; stores the resulting `URL.createObjectURL(blob)` in `pdfPreview.url`.
   - Revokes the object URL on dialog close / unmount.

4. Update the row buttons inside `orders`, `hearings`, `judgments` tab blocks:
   - Replace the "View PDF" button with a "View Details" button that calls `openRecordDialog`.
   - Hearings rows (which previously had no button) also become clickable to open details.

5. Add a `<Dialog>` (shadcn) at the end of the result card:
   - Header: record title + date.
   - Left/top panel: key/value details rendered from the normalized record fields (reuse `firstValue`).
   - Right/bottom panel: 
     - If `pdfPreview.loading`: spinner.
     - If `pdfPreview.url`: `<iframe src={pdfPreview.url} className="w-full h-[60vh]" title="PDF preview" />`.
     - If `pdfPreview.error` or no file: explanatory text.
   - Footer: "Download PDF" button (enabled only when blob is loaded) + Close.

6. Existing "Analyze with AI" button on orders stays in the row (or also moves into the dialog — keep in row for minimal disruption).

## Out of Scope
- No edge function changes (`ecourts-track` already streams the PDF via `document-proxy`).
- No backend, schema, or auth changes.
- No styling overhaul beyond the new dialog, which uses existing semantic tokens.

## QA
- CNR `DLCT110002062020`: open Orders tab → click a row → dialog shows details and embedded PDF; Download button saves the file; close revokes blob URL.
- Record without a PDF (e.g. a hearing) shows details with a "No PDF attached" message.
- Proxy fallback (404) shows the error message inside the preview panel without breaking the dialog.
