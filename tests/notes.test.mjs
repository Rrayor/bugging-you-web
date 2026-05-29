/**
 * Unit tests for notes.js using the built-in Node.js test runner (node:test).
 * No npm dependencies required – runs on Node 18+.
 *
 * Run: node --test tests/notes.test.mjs
 *      or: node --test   (discovers test files automatically with Node 21+)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNote, makeNoteStore, MAX_NOTE_LENGTH, STORAGE_KEY } from '../notes.js';

// ---------------------------------------------------------------------------
// Fake in-memory storage (mirrors the Storage interface we care about)
// ---------------------------------------------------------------------------

/** Returns a fresh fake storage instance for each test to prevent bleed. */
function makeFakeStorage() {
  const map = new Map();
  return {
    getItem:    (key) => map.get(key) ?? null,
    setItem:    (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

// ---------------------------------------------------------------------------
// createNote()
// ---------------------------------------------------------------------------

describe('createNote()', () => {
  it('returns an object with id, text, and createdAt', () => {
    const note = createNote('buy milk');
    assert.equal(typeof note.id, 'string');
    assert.equal(typeof note.text, 'string');
    assert.equal(typeof note.createdAt, 'number');
  });

  it('trims leading and trailing whitespace', () => {
    assert.equal(createNote('  hello world  ').text, 'hello world');
  });

  it('leaves text shorter than MAX_NOTE_LENGTH unchanged', () => {
    assert.equal(createNote('short').text, 'short');
  });

  it('generates unique ids for two notes created in sequence', () => {
    const a = createNote('a');
    const b = createNote('b');
    assert.notEqual(a.id, b.id);
  });

  it('createdAt is a recent timestamp', () => {
    const before = Date.now();
    const note = createNote('ts test');
    const after = Date.now();
    assert.ok(note.createdAt >= before);
    assert.ok(note.createdAt <= after);
  });
});

// ---------------------------------------------------------------------------
// makeNoteStore – getAll()
// ---------------------------------------------------------------------------

describe('makeNoteStore – getAll()', () => {
  it('returns an empty array when storage is empty', () => {
    const store = makeNoteStore(makeFakeStorage());
    assert.equal(store.getAll().length, 0);
  });

  it('returns notes in newest-first order', () => {
    const storage = makeFakeStorage();
    // Use explicit timestamps so the result is deterministic regardless of
    // clock resolution on the machine running the test.
    const raw = [
      { id: 'a', text: 'oldest', createdAt: 1000 },
      { id: 'b', text: 'middle', createdAt: 2000 },
      { id: 'c', text: 'newest', createdAt: 3000 },
    ];
    storage.setItem(STORAGE_KEY, JSON.stringify(raw));
    const store = makeNoteStore(storage);
    const notes = store.getAll();
    assert.equal(notes[0].text, 'newest');
    assert.equal(notes[1].text, 'middle');
    assert.equal(notes[2].text, 'oldest');
  });

  it('returns an empty array when storage contains corrupt JSON', () => {
    const storage = makeFakeStorage();
    storage.setItem(STORAGE_KEY, 'not-json{{{');
    const store = makeNoteStore(storage);
    assert.equal(store.getAll().length, 0);
  });
});

// ---------------------------------------------------------------------------
// makeNoteStore – add()
// ---------------------------------------------------------------------------

describe('makeNoteStore – add()', () => {
  it('returns the newly created note', () => {
    const store = makeNoteStore(makeFakeStorage());
    const note = store.add('hello');
    assert.ok(note);
    assert.equal(note.text, 'hello');
  });

  it('persists the note so getAll() finds it', () => {
    const store = makeNoteStore(makeFakeStorage());
    store.add('persisted');
    assert.equal(store.getAll().length, 1);
    assert.equal(store.getAll()[0].text, 'persisted');
  });

  it('accumulates multiple notes', () => {
    const store = makeNoteStore(makeFakeStorage());
    store.add('a');
    store.add('b');
    store.add('c');
    assert.equal(store.getAll().length, 3);
  });
});

// ---------------------------------------------------------------------------
// makeNoteStore – update()
// ---------------------------------------------------------------------------

describe('makeNoteStore – update()', () => {
  it('changes the text of an existing note', () => {
    const store = makeNoteStore(makeFakeStorage());
    const note = store.add('original');
    store.update(note.id, 'updated');
    const found = store.getAll().find((n) => n.id === note.id);
    assert.ok(found);
    assert.equal(found.text, 'updated');
  });

  it('returns the updated note', () => {
    const store = makeNoteStore(makeFakeStorage());
    const note = store.add('original');
    const updated = store.update(note.id, 'new text');
    assert.ok(updated);
    assert.equal(updated.text, 'new text');
  });

  it('returns null for an unknown id', () => {
    const store = makeNoteStore(makeFakeStorage());
    assert.equal(store.update('no-such-id', 'anything'), null);
  });
});

// ---------------------------------------------------------------------------
// makeNoteStore – remove()
// ---------------------------------------------------------------------------

describe('makeNoteStore – remove()', () => {
  it('deletes the note with the given id', () => {
    const store = makeNoteStore(makeFakeStorage());
    const note = store.add('to remove');
    store.remove(note.id);
    assert.equal(store.getAll().length, 0);
  });

  it('leaves other notes intact', () => {
    const store = makeNoteStore(makeFakeStorage());
    const a = store.add('keep me');
    const b = store.add('delete me');
    store.remove(b.id);
    const all = store.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].id, a.id);
  });

  it('is a no-op for an unknown id', () => {
    const store = makeNoteStore(makeFakeStorage());
    store.add('safe');
    store.remove('no-such-id');
    assert.equal(store.getAll().length, 1);
  });
});
