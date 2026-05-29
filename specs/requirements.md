# Bugging You – Requirements Specification

Derived from `README.md`. Describes expected behaviour in testable terms.

---

## Note Model

| Field       | Type     | Constraints                       |
|-------------|----------|-----------------------------------|
| `id`        | string   | Unique per note (UUID or similar) |
| `text`      | string   | 1–255 characters after trimming   |
| `createdAt` | number   | Unix timestamp (ms)               |

### Rules

- A note with an empty or whitespace-only text value **must not** be saved.
- Text is trimmed before saving.
- The input enforces a hard 255-character limit; typing stops at the limit.
- When the limit is reached, the character counter pulses red so the user knows immediately.
- Notes are always returned **newest-first** (descending `createdAt`).

---

## Create Note

**Given** the user types text in the input and presses Save (or Ctrl + Enter)  
**Then** a new note appears at the top of the list  
**And** the input is cleared

**Given** the input is empty  
**Then** Save does nothing

---

## Edit Note

**Given** the user clicks Edit on a note  
**Then** the note text is loaded into the input  
**And** the Save button label changes to "Update"  
**And** a Cancel button becomes visible  
**And** the note list item is visually marked as "being edited"

**Given** the user changes the text and presses Update  
**Then** the note is updated in place  
**And** the input is cleared and the form returns to Add mode

**Given** the user clicks Cancel  
**Then** the note is unchanged  
**And** the input is cleared and the form returns to Add mode

---

## Remove Note

**Given** the user clicks Remove on a note  
**Then** the note is immediately removed from the list and from storage

Removing a note has **no effect** on any OS notification that was already sent from it.

---

## Bug Me (Notification)

**Given** the user clicks Bug me for the first time (permission is `default`)  
**Then** the browser prompts for notification permission

**Given** permission is granted  
**Then** an OS notification is created immediately with the note text as the body

**Given** permission is denied  
**Then** no notification is sent and no error is shown to the user

**Given** the user clicks Bug me again on the same note  
**Then** another OS notification is created (duplicates are allowed)

---

## Persistence

- All notes survive a page reload (stored in `localStorage`).
- Notes survive clearing the browser cache (localStorage is not cache-storage).
- Corrupt `localStorage` data is silently discarded; the app starts empty.

---

## Progressive Web App

- The app shell loads and renders from cache after the first visit (offline-capable).
- The service worker caches all static assets at install time.
- The app is installable on supported browsers/OS combinations.
- The app icon is a bug.

---

## Accessibility (WCAG AA)

- All interactive elements have accessible names.
- The notes list is a `<ul>` with list items; each item's actions are labelled with the note text.
- The character counter is a live region (`aria-live="polite"`).
- Focus is moved to the textarea when Edit mode is activated.
- Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- All actions are keyboard-reachable with visible focus indicators.
