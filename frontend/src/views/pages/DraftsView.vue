<template>
  <div class="page">
    <h1>Drafts</h1>
    <p class="sub">Unfinished listings saved in this browser</p>

    <p v-if="drafts.length === 0" class="empty">
      No drafts yet. Start a listing and choose <strong>Save Draft</strong>.
    </p>

    <ul v-else class="draft-list">
      <li v-for="d in drafts" :key="d.id" class="draft">
        <div class="draft-main">
          <h3>{{ d.name || 'Untitled card' }}</h3>
          <p class="when">Saved {{ formatDate(d.updatedAt) }}</p>
          <p class="preview">{{ d.description || 'No description yet.' }}</p>
        </div>
        <div class="draft-actions">
          <router-link class="btn blue" :to="{ path: '/add-item', query: { draft: d.id } }">Edit</router-link>
          <button class="btn ghost danger" type="button" @click="remove(d.id)">Delete</button>
        </div>
      </li>
    </ul>

    <p class="back-link"><router-link to="/">&larr; Back to auctions</router-link></p>
  </div>
</template>

<script>
import draftService from '../../services/draft.service.js'

export default {
  data() {
    return {
      drafts: []
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.drafts = draftService.listDrafts()
    },
    remove(id) {
      draftService.deleteDraft(id)
      this.refresh()
    },
    formatDate(ts) {
      return new Date(ts).toLocaleString('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.sub { color: var(--muted); font-size: 14px; margin: 4px 0 16px; font-weight: 700; }
.empty { color: var(--muted); font-weight: 700; }
.draft-list { list-style: none; padding: 0; margin-top: 18px; }
.draft {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 16px 18px;
  margin-bottom: 12px;
}
.draft-main h3 { margin: 0 0 2px; }
.when { color: var(--muted); font-size: 12px; margin: 0 0 6px; font-weight: 700; }
.preview { margin: 0; font-size: 14px; color: var(--ink); }
.draft-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.btn.ghost.danger { border-color: var(--danger); color: var(--danger); }
.btn.ghost.danger:hover { background: #ffe6f2; }
.back-link { margin-top: 16px; font-weight: 700; }
</style>
