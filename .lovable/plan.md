## Goal
Enhance the PDF preview in the eCourts record dialog so users can either flip page-by-page (current) or scroll through the entire document with page headings.

## Changes (frontend only — `src/pages/ECourts.tsx`)

1. **View mode toggle**
   - Add a small segmented control above the PDF canvas with two options: "Single Page" (default, current behavior) and "Scroll All".
   - Store mode in local state inside `PdfCanvasPreview` (e.g. `viewMode: 'single' | 'scroll'`).

2. **Single Page mode (unchanged)**
   - Keeps existing Prev/Next buttons, page counter, and single `<canvas>` render.

3. **Scroll All mode (new)**
   - Renders every page sequentially in a vertically scrollable container.
   - Each page block shows a heading like `Page 1 of N` above its `<canvas>`.
   - Pages render lazily/progressively as the PDF document loads to avoid blocking the UI for large files.
   - Hides Prev/Next + single page counter while in this mode.

4. **Rendering logic**
   - Reuse the existing `pdfjsLib.getDocument` flow; instead of rendering only the current page, iterate `1..numPages` and render each into its own canvas ref.
   - Keep render tasks cancellable on mode switch / dialog close to prevent memory leaks.
   - Width fits the preview panel; maintain aspect ratio per page.

5. **Retry + error states**
   - Existing Retry button and error fallback continue to work for both modes.

## Out of scope
- No edge function, schema, or auth changes.
- No styling overhaul beyond the toggle and per-page headings (uses existing tokens).

## QA
- Open a multi-page judgment PDF; verify default Single Page mode still paginates.
- Switch to "Scroll All"; verify all pages render with "Page X of N" headings and smooth scrolling.
- Switch back to Single Page; verify Prev/Next resumes from page 1.
- Close dialog; verify blob URL revoked and no console errors.
