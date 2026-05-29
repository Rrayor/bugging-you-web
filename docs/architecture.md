# Architecture

## Guiding principles

The README explicitly asks for **no frameworks, no build tools, no backend**. Every decision below flows from that constraint plus the KISS and YAGNI principles stated in the task.

---

## Module layout

```
notes.js          – pure note data-model + localStorage store
notifications.js  – Web Notifications API wrapper
app.js            – UI controller; wires DOM ↔ store ↔ notifications
sw.js             – service worker (cache-first PWA shell)
```

### Why three separate JS files instead of one?

`notes.js` exposes pure functions and a factory (`makeNoteStore`) whose storage backend is injected as a parameter. This one decision is the only "pattern" used deliberately: **Dependency Injection** for the storage object. The reason is testability – the unit test suite passes a plain in-memory object instead of `window.localStorage`, so tests run without a browser storage quota, side-effects between tests, or any test-framework dependency.

`notifications.js` is isolated because the permission prompt is async and has distinct states (default / granted / denied). Keeping it separate makes the states easy to reason about without scrolling through DOM code.

`app.js` is the glue. It imports the other two modules and owns all DOM interaction. It does **not** export anything because nothing outside the page needs it.

No other patterns (MVC, observer, pub/sub, etc.) are used. The app is small enough that direct function calls and a single shared `state` object in `app.js` are perfectly readable without any abstraction overhead (YAGNI).

---

## State

All mutable runtime state lives in a single plain object at the top of `app.js`:

```js
const state = { editingId: null };
```

`editingId` tracks whether the form is in "Add" or "Edit" mode. It is the only piece of state that doesn't come directly from `localStorage` or the DOM.

---

## Rendering

The UI is re-rendered **imperatively** whenever the note list changes (add / update / remove). A full list re-render on every mutation is acceptable at this scale. Diffing (à la virtual DOM) would be YAGNI.

Each note list item is built by `buildNoteItem(note)` in `app.js`, which creates DOM nodes programmatically. Template strings with `innerHTML` are avoided to prevent accidental XSS; all user content is assigned to `textContent`.

---

## Storage

`makeNoteStore(storage)` in `notes.js` reads and writes a single JSON array under the key `bugging-you-notes`. The array is parsed on every call (no in-memory cache in the store itself) because:

1. The data set is small (a handful of short strings).
2. It avoids stale-read bugs if the store were ever called from multiple places.
3. It keeps the implementation trivially simple.

---

## No build step

Because there is no bundler, the modules use native ES module syntax (`import`/`export`) and the `<script type="module">` tag in `index.html`. This is supported by every browser that also supports the Notification API, so there is no compatibility gap.
