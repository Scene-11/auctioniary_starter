<template>
  <div class="bid-history">
    <h3>Bid History</h3>
    <p v-if="bids.length === 0" class="empty">No bids yet — be the first to bid.</p>
    <ul v-else>
      <li v-for="bid in bids" :key="bid.item_id + '-' + bid.amount + '-' + bid.timestamp">
        <span class="who">{{ bid.first_name }} {{ bid.last_name }}</span>
        <span class="amount">&pound;{{ bid.amount }}</span>
        <span class="when">{{ formatDate(bid.timestamp) }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    bids: {
      type: Array,
      required: true
    }
  },
  methods: {
    formatDate(ts) {
      return new Date(ts).toLocaleString('en-GB', {
        year: 'numeric',
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
.bid-history {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 16px 18px;
  margin-top: 20px;
}
.bid-history h3 { margin-top: 0; }
.bid-history ul { list-style: none; margin: 0; padding: 0; }
.bid-history li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  flex-wrap: wrap;
}
.bid-history li:last-child { border-bottom: none; }
.amount { color: var(--primary-dark); font-weight: 800; }
.when { color: var(--muted); }
.empty { color: var(--muted); font-weight: 700; }
</style>
