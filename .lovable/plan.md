## Problem found

The CNR lookup response already includes the data, but the frontend is reading the wrong field names.

For the tested CNR, the API returned:

```text
historyOfCaseHearings: 2 records
judgmentOrders: 1 PDF record with orderUrl: "order-1.pdf"
orderCount: 1
hearingCount: 2
judgmentCount: 1
```

But `src/pages/ECourts.tsx` currently renders only:

```text
cd.orders
cd.hearings
cd.judgments
cd.ias
```

Those arrays do not exist in the actual response, so the UI falls into:

```text
No order records available.
No hearing records available.
No judgment records available.
```

There is also a PDF-link mismatch: the API returns `orderUrl`, while the UI only checks `url` or `fileUrl`.

## Implementation plan

1. Normalize the eCourts response in `src/pages/ECourts.tsx`
   - Create derived arrays that support both old and actual API field names:
     - Orders/Judgments: `cd.orders`, `cd.judgments`, and `cd.judgmentOrders`
     - Hearings: `cd.hearings` and `cd.historyOfCaseHearings`
     - IAs: `cd.ias` and `cd.interlocutoryApplications`
   - This keeps compatibility if the API returns either naming style.

2. Fix PDF link detection
   - Recognize these possible PDF fields:
     - `url`
     - `fileUrl`
     - `orderUrl`
     - `judgmentUrl`
     - `documentUrl`
   - For relative API values like `order-1.pdf`, generate a valid PDF route through the existing backend function instead of linking to a broken relative app URL.

3. Add a backend proxy action for PDF viewing
   - Extend `supabase/functions/ecourts-track/index.ts` with a safe `document-url` or `document-proxy` action.
   - It will accept the CNR and file name/path, call the official eCourts document endpoint using the existing secret API key, and return either:
     - a usable signed/remote URL if the API supports it, or
     - the PDF bytes with the correct `application/pdf` content type.
   - This is needed because PDF files from eCourts often require authenticated partner API access and cannot be opened directly from the browser.

4. Update the tab panels
   - Orders tab: render `judgmentOrders` when separate `orders` is absent.
   - Hearings tab: render `historyOfCaseHearings`, using:
     - `businessOnDate`
     - `hearingDate`
     - `purposeOfListing`
     - `judge`
   - Judgments tab: render `judgmentOrders` as judgment/order records when no separate `judgments` array exists.
   - IAs tab: render `interlocutoryApplications` when `ias` is absent.

5. Improve empty-state messaging
   - Only show “No records available” when both the count and the normalized array are empty.
   - If the count says records exist but the array is missing, show a clearer message such as: “Records exist at source, but details were not included in this response. Try Refresh.”

6. Fix the React warning in the console
   - The console shows a ref warning around `Badge` and `AnimatePresence` in `ECourtsPage`.
   - I will remove Badge usage inside animated direct children where needed or wrap animated content in plain DOM elements so the warning stops.

## Files to change

- `src/pages/ECourts.tsx`
  - Add response normalization helpers.
  - Update orders/hearings/judgments/IAs rendering.
  - Add robust PDF link handling.
  - Improve empty states.

- `supabase/functions/ecourts-track/index.ts`
  - Add a backend action for secure document/PDF retrieval or URL resolution.
  - Keep the eCourts API key server-side only.

## Expected result

After a CNR lookup, clicking the chips will show the actual records from the API response:

- Hearings will list the two hearing history records.
- Orders/Judgments will show the returned PDF record.
- The PDF action will open/download the document through the backend instead of showing an empty state or broken link.