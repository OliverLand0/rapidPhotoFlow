# Improvements – Phase 2

This document tracks “second wave” improvements to the Rapid Photo Flow application. Phase 1 focused on core features (upload, review, events, bulk actions). Phase 2 focuses on polish, power-user productivity, and robustness.

---

## 1. Keyboard Shortcuts

### Goals

- Speed up common review actions for power users.
- Make it possible to triage large batches of photos with minimal mouse usage.

### Proposal

#### 1.1. Shortcut Map (Review Page)

- **Global on Review page**
  - `?` – Show shortcuts help overlay.
  - `↑ / ↓` – Move focus up/down photo list.
  - `Enter` – Open/close Photo Preview modal for the focused photo.
  - `Esc` – Close Photo Preview modal or clear focused state.

- **Actions on focused photo**
  - `A` – Approve focused photo.
  - `R` – Reject focused photo.
  - `T` – Retry focused photo.
  - `Space` – Toggle selection for focused photo.

- **Selection helpers**
  - `Ctrl + A` / `Cmd + A` – Select all photos in current filter/page.
  - `Shift + ↑ / ↓` – Extend selection range.

#### 1.2. Implementation Notes

- Implement a `useKeyboardShortcuts` hook scoped to the Review route.
- Maintain a notion of “focused photo id” in Review page state.
- Integrate with existing bulk selection and single-photo actions.
- Add a small “Keyboard shortcuts available (?)” hint near the filter bar.

---

## 2. Better Event Click-Through Behavior

### Goals

- Make it obvious which photo an event refers to.
- Tighten the loop between observability (event log) and action (review/approve/fix).

### Proposal

#### 2.1. Current Behavior (Baseline)

- Clicking on an event navigates to the Review page with a `photoId` hint (query param or state).
- The photo is visible somewhere in the list but not visually emphasized.

#### 2.2. Desired Behavior

When a user clicks an event:

1. Navigate to `/review?photoId=<id>&status=<optional>` if not already on Review.
2. On Review page:
   - Ensure filters are compatible so the photo appears (e.g., auto-clear conflicting filters or temporarily override them).
   - Scroll the photo card into view.
   - Apply a temporary highlight (e.g., glow border with subtle animation) for 1–3 seconds.
   - Optionally: auto-focus that photo for keyboard shortcuts.

#### 2.3. Implementation Notes

- Add a `highlightedPhotoId` to Review page state, derived from router state or query params.
- Use `useEffect` to:
  - Find DOM node for that photo card (via ref or `data-photo-id` attribute).
  - Call `scrollIntoView({ block: "center" })`.
  - Set a “highlight” CSS class that fades out after a timeout.
- Consider logging a UI event / metric (“event click-through -> photo highlight”) later.

---

## 3. Saved Filters / Views

### Goals

- Allow users to save commonly used filter combinations (status, sort, search, tag, etc.).
- Provide quick access to views like:
  - “Recent failures”
  - “All approved in last 24h”
  - “Untagged photos”

### Proposal

#### 3.1. Saved View Shape

```ts
type SavedView = {
  id: string;
  name: string;
  createdAt: string;
  filters: {
    search: string;
    status: "ALL" | "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED" | "APPROVED" | "REJECTED";
    sort: "newest" | "oldest" | "status";
    tag?: string | null;
    pageSize: number;
    // future: date ranges, owner, etc.
  };
};