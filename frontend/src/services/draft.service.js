// Extension 3: local draft box for item listings, stored in localStorage.
// A draft mirrors the Add Item form and can be listed, edited and deleted,
// similar to an email client's drafts folder.

const STORAGE_KEY = 'item_drafts'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(drafts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

// Return all drafts, most recently updated first.
function listDrafts() {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
}

// Get a single draft by id.
function getDraft(id) {
  return readAll().find((d) => String(d.id) === String(id)) || null
}

// Create or update a draft. Returns the saved draft.
function saveDraft(draft) {
  const drafts = readAll()
  const now = Date.now()

  if (draft.id) {
    const idx = drafts.findIndex((d) => String(d.id) === String(draft.id))
    if (idx !== -1) {
      drafts[idx] = Object.assign({}, drafts[idx], draft, { updatedAt: now })
      writeAll(drafts)
      return drafts[idx]
    }
  }

  const newDraft = Object.assign({}, draft, {
    id: now + '-' + Math.random().toString(36).slice(2, 8),
    updatedAt: now
  })
  drafts.push(newDraft)
  writeAll(drafts)
  return newDraft
}

// Delete a draft by id.
function deleteDraft(id) {
  const drafts = readAll().filter((d) => String(d.id) !== String(id))
  writeAll(drafts)
}

export default {
  listDrafts,
  getDraft,
  saveDraft,
  deleteDraft
}
