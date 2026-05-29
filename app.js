/**
 * @module app
 *
 * Main UI controller.  Wires the DOM to the note store and the
 * notification service.  Not exported – nothing outside this page needs it.
 *
 * Rendering is done imperatively: the list is rebuilt from scratch whenever
 * notes change.  At the scale of this app (a handful of short strings) this
 * is simpler and more reliable than a diffing approach.  See docs/architecture.md.
 */

import { makeNoteStore, MAX_NOTE_LENGTH } from './notes.js';
import { bugMe } from './notifications.js';

/** @typedef {import('./notes.js').Note} Note */

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const store = makeNoteStore(window.localStorage);

// ---------------------------------------------------------------------------
// Runtime state
// ---------------------------------------------------------------------------

/**
 * The only piece of mutable state that isn't derived from the DOM or storage.
 * `editingId` is null when the form is in "Add" mode and holds a note id when
 * the form is in "Edit" mode.
 */
const state = { editingId: /** @type {string | null} */ (null) };

// ---------------------------------------------------------------------------
// DOM references  (resolved once, reused everywhere)
// ---------------------------------------------------------------------------

const form = /** @type {HTMLFormElement} */ (document.getElementById('note-form'));
const input = /** @type {HTMLTextAreaElement} */ (document.getElementById('note-input'));
const saveBtn = /** @type {HTMLButtonElement} */ (document.getElementById('save-btn'));
const cancelBtn = /** @type {HTMLButtonElement} */ (document.getElementById('cancel-btn'));
const charCount = /** @type {HTMLElement} */ (document.getElementById('char-count'));
const notesList = /** @type {HTMLUListElement} */ (document.getElementById('notes-list'));
const emptyState = /** @type {HTMLParagraphElement} */ (document.getElementById('empty-state'));

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Rebuilds the visible notes list from storage.
 * Called after every mutation so the UI is always in sync with the store.
 */
function renderNotes() {
  const notes = store.getAll();

  // Wipe and refill rather than diff – see module-level comment above.
  notesList.innerHTML = '';

  if (notes.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  for (const note of notes) {
    notesList.appendChild(buildNoteItem(note));
  }
}

/**
 * Builds a single `<li>` for a note.
 * All user-supplied text is written via `textContent` to avoid XSS.
 *
 * @param {Note} note
 * @returns {HTMLLIElement}
 */
function buildNoteItem(note) {
  const li = document.createElement('li');
  li.className = 'note-item';
  li.dataset.id = note.id;

  if (state.editingId === note.id) {
    li.classList.add('note-item--editing');
    li.setAttribute('aria-label', `Editing: ${note.text}`);
  } else {
    li.setAttribute('aria-label', note.text);
  }

  const textEl = document.createElement('p');
  textEl.className = 'note-text';
  textEl.textContent = note.text;

  const actions = document.createElement('div');
  actions.className = 'note-actions';

  // "Bug me" sends an OS notification with this note's text.
  const bugBtn = makeButton(
    'bug-btn',
    '🔔',
    'Bug me',
    () => bugMe(note.text),
    `Bug me: ${note.text}`,
  );

  // "Edit" loads the note into the form for editing.
  const editBtn = makeButton(
    'edit-btn',
    '✏️',
    'Edit',
    () => startEdit(note),
    `Edit note: ${note.text}`,
  );

  // "Remove" deletes the note immediately with no undo – intentional,
  // consistent with the lightweight "quick reminders" product feel.
  const removeBtn = makeButton(
    'remove-btn',
    '🗑️',
    'Remove',
    () => removeNote(note.id),
    `Remove note: ${note.text}`,
  );

  // While this note is being edited, disable its own Edit button to avoid
  // confusing double-activation without shifting the button row layout.
  if (state.editingId === note.id) {
    editBtn.disabled = true;
  }

  actions.append(bugBtn, editBtn, removeBtn);
  li.append(textEl, actions);

  return li;
}

/**
 * Creates an icon-driven action button with a visible emoji and a
 * visually-hidden accessible label.  Using separate elements for icon and
 * label (rather than aria-label alone) lets screen readers announce the
 * emoji's name alongside the label for users who have emoji descriptions on.
 *
 * @param {string} className
 * @param {string} emoji
 * @param {string} label
 * @param {() => void} onClick
 * @param {string} [accessibleName]
 * @returns {HTMLButtonElement}
 */
function makeButton(className, emoji, label, onClick, accessibleName = label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `action-btn ${className}`;
  btn.setAttribute('aria-label', accessibleName);

  const icon = document.createElement('span');
  icon.className = 'btn-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = emoji;

  const text = document.createElement('span');
  text.className = 'btn-label';
  text.textContent = label;

  btn.append(icon, text);
  btn.addEventListener('click', onClick);
  return btn;
}

// ---------------------------------------------------------------------------
// Char counter
// ---------------------------------------------------------------------------

/** Updates the live character-count hint below the textarea. */
function updateCharCount() {
  const remaining = MAX_NOTE_LENGTH - input.value.length;
  charCount.textContent = `${remaining} character${remaining === 1 ? '' : 's'} remaining`;
  // Pulse red when the character limit is reached so the user knows immediately.
  charCount.classList.toggle('char-count--limit', remaining === 0);
  // Amber warning state kicks in earlier to give the user advance notice.
  charCount.classList.toggle('char-count--warn', remaining > 0 && remaining <= 20);
}

// ---------------------------------------------------------------------------
// Form mode helpers
// ---------------------------------------------------------------------------

/** Resets the form back to "Add new note" mode. */
function exitEditMode() {
  state.editingId = null;
  input.value = '';
  saveBtn.textContent = 'Save';
  saveBtn.setAttribute('aria-label', 'Save note');
  cancelBtn.hidden = true;
  form.removeAttribute('data-editing');
  updateCharCount();
  renderNotes();
}

/**
 * Switches the form into "Edit existing note" mode.
 *
 * @param {Note} note
 */
function startEdit(note) {
  state.editingId = note.id;
  input.value = note.text;
  saveBtn.textContent = 'Update';
  saveBtn.setAttribute('aria-label', 'Update note');
  cancelBtn.hidden = false;
  form.setAttribute('data-editing', 'true');
  updateCharCount();
  renderNotes();
  // Move focus to the textarea so keyboard users can immediately edit.
  input.focus();
}

// ---------------------------------------------------------------------------
// CRUD actions
// ---------------------------------------------------------------------------

/** Handles the form's submit event (both Add and Edit modes). */
function handleSubmit(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return; // Disallow empty notes.

  if (state.editingId) {
    store.update(state.editingId, text);
  } else {
    store.add(text);
  }

  exitEditMode();
}

/**
 * Removes a note and re-renders.
 *
 * @param {string} id
 */
function removeNote(id) {
  // Delete from storage first so the re-render triggered by exitEditMode (or
  // the explicit renderNotes below) reflects the removed note.
  store.remove(id);

  if (state.editingId === id) {
    // The note being removed was open for editing – clear the form too.
    exitEditMode();
    return; // exitEditMode calls renderNotes; no need to call it again.
  }

  renderNotes();
}

// ---------------------------------------------------------------------------
// Service worker registration
// ---------------------------------------------------------------------------

/** Registers the service worker if the browser supports it. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Deferred until after load so the SW registration doesn't compete with
  // initial page resources on the critical path.
  window.addEventListener('load', () => {
    // Registration failure is non-fatal; the app still works, just without
    // offline support.
    void navigator.serviceWorker.register('/sw.js');
  });
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', exitEditMode);
input.addEventListener('input', updateCharCount);

// Ctrl + Enter (or Cmd + Enter on Mac) submits the form without needing to
// reach the Save button – a common power-user shortcut for text inputs.
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    form.requestSubmit();
  }
});

registerServiceWorker();
updateCharCount();
renderNotes();
