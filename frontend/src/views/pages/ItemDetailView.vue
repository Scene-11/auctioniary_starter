<template>
  <div class="page detail">
    <p><router-link to="/">&larr; Back to auctions</router-link></p>

    <div class="state" v-if="loading">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading card…</p>
    </div>

    <div class="state err" v-else-if="error">{{ error }}</div>

    <template v-else-if="item">
      <div class="detail-layout">
        <div class="detail-image">
          <img v-if="item.image" :src="item.image" :alt="item.name" />
          <div v-else class="card-back" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="cb-star"><path fill="#fff" d="M12 3l2.3 5.6L20 9.3l-4.5 3.9 1.4 6L12 16.2 7.1 19.2l1.4-6L4 9.3l5.7-.7z"/></svg>
          </div>
        </div>

        <div class="detail-main">
          <div class="item-title">
            <h1>{{ item.name }}</h1>
            <p class="seller">Seller: {{ item.first_name }} {{ item.last_name }}</p>
          </div>

          <p class="desc">{{ item.description }}</p>

          <p class="cat-line" v-if="item.categories && item.categories.length">
            <span class="cat-label">Rarity:&nbsp;</span>
            <span class="cat-tag" v-for="cat in item.categories" :key="cat.category_id">{{ cat.name }}</span>
          </p>

          <div class="bid-stats">
            <div class="stat">
              <span class="stat-label">Starting bid</span>
              <span class="stat-value">&pound;{{ item.starting_bid }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Current bid</span>
              <span class="stat-value accent">&pound;{{ item.current_bid }}</span>
            </div>
            <div class="stat" v-if="item.current_bid_holder">
              <span class="stat-label">Top bidder</span>
              <span class="stat-value">{{ item.current_bid_holder.first_name }} {{ item.current_bid_holder.last_name }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Listed</span>
              <span class="stat-value">{{ formatDate(item.start_date) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">{{ hasEnded ? 'Ended' : 'Ends' }}</span>
              <span class="stat-value">{{ formatDate(item.end_date) }}</span>
            </div>
          </div>

          <div class="bid-box" v-if="hasEnded">
            <h3>Auction ended</h3>
            <p class="hint">
              Bidding closed on {{ formatDate(item.end_date) }}.
              <template v-if="item.current_bid_holder">
                Won by {{ item.current_bid_holder.first_name }}
                {{ item.current_bid_holder.last_name }} for &pound;{{ item.current_bid }}.
              </template>
              <template v-else>It finished without any bids.</template>
            </p>
          </div>
          <div class="bid-box" v-else-if="showBidForm">
            <h3>Place a bid</h3>
            <!-- novalidate: the English amount validation below handles this -->
            <form novalidate @submit.prevent="handleBid">
              <div class="field">
                <label for="amount">Your offer (&pound;)</label>
                <input id="amount" v-model="amount" type="number" min="1" step="1" />
              </div>
              <button class="btn accent" type="submit">Place Bid</button>
              <div class="err" v-if="bidError">{{ bidError }}</div>
              <div class="ok-msg" v-if="bidSuccess">{{ bidSuccess }}</div>
            </form>
          </div>
          <p v-else-if="isCreator" class="hint">This is your own auction — you can't bid on it.</p>
          <p v-else class="hint"><router-link to="/login">Sign in</router-link> to place a bid.</p>
        </div>
      </div>

      <BidHistory :bids="bids" />

      <QuestionList
        :questions="questions"
        :item-id="item.item_id"
        :is-logged-in="isLoggedIn"
        :is-creator="isCreator"
        @refresh="refreshQuestions"
      />
    </template>
  </div>
</template>

<script>
import coreService from '../../services/core.service.js'
import session from '../../services/session.js'
import BidHistory from '../components/BidHistory.vue'
import QuestionList from '../components/QuestionList.vue'

export default {
  components: { BidHistory, QuestionList },
  data() {
    return {
      item: null,
      bids: [],
      questions: [],
      amount: '',
      loading: true,
      error: '',
      bidError: '',
      bidSuccess: ''
    }
  },
  computed: {
    hasEnded() {
      return !!this.item && this.item.end_date < Date.now()
    },
    isLoggedIn() {
      return session.isLoggedIn()
    },
    isCreator() {
      return this.item && String(this.item.creator_id) === String(session.getUserId())
    },
    showBidForm() {
      return this.isLoggedIn && !this.isCreator
    }
  },
  mounted() {
    this.loadAll()
  },
  methods: {
    loadAll() {
      this.loading = true
      this.error = ''
      const id = this.$route.params.id
      coreService.getItem(id).then((item) => {
        this.item = item
        this.loading = false
      }).catch((err) => {
        this.error = err
        this.loading = false
      })
      coreService.getBidHistory(id).then((bids) => {
        this.bids = bids
      }).catch(() => {
        this.bids = []
      })
      coreService.getQuestions(id).then((qs) => {
        this.questions = qs
      }).catch(() => {
        this.questions = []
      })
    },
    refreshQuestions() {
      coreService.getQuestions(this.$route.params.id).then((qs) => {
        this.questions = qs
      })
    },
    handleBid() {
      this.bidError = ''
      this.bidSuccess = ''
      const value = parseInt(this.amount, 10)
      if (isNaN(value) || value < 1) {
        this.bidError = 'Enter a whole amount of at least £1.'
        return
      }
      if (value <= this.item.current_bid) {
        this.bidError = 'Bid must be higher than the current bid (£' + this.item.current_bid + ').'
        return
      }
      coreService.placeBid(this.item.item_id, value).then(() => {
        this.bidSuccess = 'Bid placed!'
        this.amount = ''
        // Refresh item + bid history
        coreService.getItem(this.item.item_id).then((item) => {
          this.item = item
        })
        coreService.getBidHistory(this.item.item_id).then((bids) => {
          this.bids = bids
        })
      }).catch((err) => {
        this.bidError = err
      })
    },
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
/* Detail pages keep a comfortable reading width even on a wide monitor */
.page.detail { max-width: 1320px; }
.detail-layout { display: flex; gap: clamp(22px, 2.2vw, 46px); align-items: flex-start; }
.detail-image {
  width: clamp(240px, 19vw, 380px);
  flex-shrink: 0;
  border-radius: 18px;
  overflow: hidden;
  border: 4px solid #fff;
  outline: 3px solid var(--primary);
  box-shadow: 0 14px 30px rgba(224, 43, 126, .22);
  background: linear-gradient(150deg, #ffe9f4, #e2f1ff);
  position: sticky;
  top: 90px;
}
.detail-image img { width: 100%; display: block; }
.detail-image .card-back {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(150deg, #ff7fbd, #e02b7e);
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-main { flex: 1; min-width: 0; }
@media (max-width: 760px) {
  .detail-layout { flex-direction: column; }
  .detail-image { width: 220px; position: static; margin: 0 auto; }
}
.cb-star { width: 52px; height: 52px; }
.item-title h1 { margin: 0 0 4px; font-size: clamp(24px, 1.7vw, 34px); }
.seller { margin: 0; color: var(--muted); font-weight: 700; }
.desc { color: var(--ink); line-height: 1.7; margin-top: 8px; }
.bid-stats {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(18px, 1.6vw, 36px);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 16px 18px;
  margin: 16px 0;
}
.stat { display: flex; flex-direction: column; }
.stat-label { font-size: 12px; color: var(--muted); font-weight: 800; }
.stat-value { font-size: 16px; font-weight: 800; }
.stat-value.accent { color: var(--primary-dark); }
.bid-box {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 18px;
  max-width: 360px;
  margin-top: 10px;
}
.bid-box h3 { margin-top: 0; }
.hint { color: var(--muted); margin-top: 12px; font-weight: 700; }
.cat-line { margin: 8px 0 4px; }
.cat-label { color: var(--muted); font-size: 14px; margin-right: 2px; font-weight: 800; }
.cat-tag {
  display: inline-block;
  background: var(--yellow);
  color: var(--ink);
  border: 2px solid var(--yellow-dark);
  border-radius: 999px;
  padding: 2px 14px;
  font-size: 13px;
  font-weight: 800;
  margin-right: 6px;
}
.state { padding: 30px 0; color: var(--muted); font-weight: 700; }
.state.err { color: var(--danger); }
.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin-bottom: 10px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
