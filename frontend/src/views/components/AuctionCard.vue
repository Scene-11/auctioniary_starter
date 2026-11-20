<template>
  <router-link :to="'/item/' + item.item_id" class="card">
    <div class="card-img">
      <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
      <div v-else class="card-back" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="cb-star"><path fill="#fff" d="M12 3l2.3 5.6L20 9.3l-4.5 3.9 1.4 6L12 16.2 7.1 19.2l1.4-6L4 9.3l5.7-.7z"/></svg>
      </div>
      <span v-if="isEnded" class="ended-flag">Ended</span>
    </div>
    <div class="card-body">
      <h3>{{ item.name }}</h3>
      <p class="desc">{{ item.description }}</p>
      <div class="meta">
        <span class="bid">{{ bidLabel }}</span>
        <span class="ends" :class="{ over: isEnded }">
          {{ isEnded ? 'Ended' : 'Ends' }}: {{ formatDate(item.end_date) }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    isEnded() {
      return this.item.end_date < Date.now()
    },
    bidLabel() {
      if (this.item.current_bid !== undefined && this.item.current_bid !== null) {
        return 'Current bid: £' + this.item.current_bid
      }
      if (this.item.starting_bid !== undefined && this.item.starting_bid !== null) {
        return 'Starting bid: £' + this.item.starting_bid
      }
      return 'No bids yet'
    }
  },
  methods: {
    formatDate(ts) {
      return new Date(ts).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}
.card:hover {
  transform: translateY(-3px);
  border-color: var(--yellow);
  box-shadow: 0 10px 22px rgba(224, 43, 126, .16);
}

.card-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(150deg, #ffe9f4, #e2f1ff);
  margin-bottom: 10px;
}
.card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Flag for auctions that have already finished */
.ended-flag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(58, 44, 58, 0.85);
  color: #fff;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

/* Fallback card back for items without an image */
.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(150deg, #ff7fbd, #e02b7e);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cb-star { width: 46px; height: 46px; opacity: .9; }

.card-body { flex: 1; display: flex; flex-direction: column; }
.card-body h3 { margin: 0 0 6px; font-size: clamp(14px, 1vw, 17px); line-height: 1.35; }
.desc {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: clamp(12.5px, 0.85vw, 14px);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.meta { display: flex; flex-direction: column; gap: 2px; font-size: clamp(12.5px, 0.85vw, 14px); }
.bid { color: var(--primary-dark); font-weight: 800; }
.ends { color: var(--muted); }
.ends.over { color: var(--danger); font-weight: 800; }
</style>
