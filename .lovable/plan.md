## The problem

On the eCourts page, after a successful CNR lookup the case detail card shows three pill-shaped badges — **"1 Orders", "2 Hearings", "1 Judgments"** (and sometimes "IAs"). They look clickable, but in the current code they are static decorative `<Badge variant="outline">` elements with **no `onClick` handler and no associated content panel**. That's why nothing happens when you click them.

Source of the issue (`src/pages/ECourts.tsx` lines 259–262):

```tsx
{cd.orderCount > 0 && <Badge variant="outline">{cd.orderCount} Orders</Badge>}
{cd.hearingCount > 0 && <Badge variant="outline">{cd.hearingCount} Hearings</Badge>}
{cd.iaCount > 0 && <Badge variant="outline">{cd.iaCount} IAs</Badge>}
{cd.judgmentCount > 0 && <Badge variant="outline">{cd.judgmentCount} Judgments</Badge>}
```

The eCourts `/case/:cnr` API response already contains the full underlying lists (`orders`, `hearings`, `judgments`, `ias`) on the same `courtCaseData` object — we just aren't rendering them.

## The fix

Convert the four count badges into a real **tabbed drill-down panel** below the case detail card, so clicking a badge reveals that list.

### What gets built

1. **Interactive count chips**
   - Replace each static `Badge` with a button-styled chip (still pill-shaped, matching current look).
   - Clicking a chip sets an `activeDetailTab` state (`"orders" | "hearings" | "judgments" | "ias"`).
   - The active chip gets a highlighted style (filled secondary color); inactive chips stay outline.
   - Clicking the same chip again collapses the panel.

2. **Drill-down content panel** (renders directly under the case card when a chip is active)
   - **Orders tab** — list each order with date, order/judge name, and a "View Order" link that opens the PDF (`order.url` from API). If `order.filename` exists, also expose an "AI Summary" button that calls the existing `order-ai` action in the edge function.
   - **Hearings tab** — chronological list with hearing date, purpose, judge, and outcome/business notes.
   - **Judgments tab** — list judgments with date, judge, and a link to the judgment PDF.
   - **IAs tab** — list interlocutory applications with IA number, date filed, status.
   - Each row uses the same `bg-background/50 border-border/10` rounded styling as the existing Petitioner/Respondent cards for visual consistency.
   - Empty state per tab: muted "No records available" message.

3. **Defensive rendering**
   - Use optional chaining (`cd.orders?.map(...)`) since the API may return either an array or be absent.
   - Keep the existing `cd.{x}Count > 0` guard so chips only appear when there is data.

4. **Animations**
   - Wrap the drill-down panel in `AnimatePresence` + `motion.div` (matches the rest of the page) for a smooth open/close.

### Files to change

- `src/pages/ECourts.tsx` — the only file. Add `activeDetailTab` state, convert the four badges to clickable chips, and add the drill-down panel below them.

### What we are NOT changing

- No edge function changes. The `case-detail` action already returns the orders/hearings/judgments arrays in `courtCaseData`.
- No database / schema changes.
- No new dependencies.
- The CNR Lookup ↔ Case Search top-level tabs and the AI Case Analysis card stay exactly as they are.

## Result

Clicking **"1 Orders"**, **"2 Hearings"**, **"1 Judgments"**, or **"IAs"** will now expand a panel showing the actual records, with PDF links where the API provides them and an optional AI summary for orders.