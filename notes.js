/**
 * @module notes
 *
 * Pure note-data model and a factory for a localStorage-backed store.
 *
 * Keeping storage logic here (separate from the DOM) has one practical
 * benefit: the unit tests can inject a fake in-memory storage object so
 * they run without touching real browser storage.  See docs/architecture.md.
 */

/** @typedef {{ id: string, text: string, createdAt: number }} Note */

const STORAGE_KEY = 'bugging-you-notes';

/** Maximum allowed length for a note's text value. */
const MAX_NOTE_LENGTH = 255;

/**
 * Generates a collision-resistant unique ID.
 * Prefers `crypto.randomUUID` (all modern browsers) and falls back to a
 * Math.random + timestamp combination for environments that lack it.
 *
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Timestamp ensures monotonic uniqueness; random bits reduce collision risk
  // if two notes are created within the same millisecond.
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Constructs a new note object.  Text is trimmed.
 *
 * @param {string} text
 * @returns {Note}
 */
function createNote(text) {
  return {
    id: generateId(),
    text: text.trim(),
    createdAt: Date.now(),
  };
}

/**
 * Returns a note store backed by the supplied `storage` object.
 * Injecting `storage` makes the store testable with a plain in-memory
 * object instead of the real browser API.  See docs/architecture.md.
 *
 * @param {Pick<Storage, 'getItem' | 'setItem'>} storage
 */
function makeNoteStore(storage) {
  /** @returns {Note[]} */
  function load() {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Corrupt JSON is unrecoverable.  Starting fresh is safer than crashing
      // the whole app because of a stale or manually edited storage entry.
      return [];
    }
  }

  /** @param {Note[]} notes */
  function save(notes) {
    storage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  return {
    /**
     * Returns all notes sorted newest-first.
     *
     * @returns {Note[]}
     */
    getAll() {
      return load().sort((a, b) => b.createdAt - a.createdAt);
    },

    /**
     * Creates a note and persists it.
     *
     * @param {string} text
     * @returns {Note} the newly created note
     */
    add(text) {
      const notes = load();
      const note = createNote(text);
      notes.push(note);
      save(notes);
      return note;
    },

    /**
     * Updates the text of an existing note.
     * Returns the updated note, or `null` if no note with that id exists.
     *
     * @param {string} id
     * @param {string} newText
     * @returns {Note | null}
     */
    update(id, newText) {
      const notes = load();
      const note = notes.find((n) => n.id === id);
      if (!note) return null;
      note.text = newText.trim();
      save(notes);
      return note;
    },

    /**
     * Removes the note with the given id.  No-ops silently if not found.
     *
     * @param {string} id
     */
    remove(id) {
      save(load().filter((n) => n.id !== id));
    },
  };
}

export { createNote, makeNoteStore, MAX_NOTE_LENGTH, STORAGE_KEY };
