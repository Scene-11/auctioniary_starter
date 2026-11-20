<template>
  <div>
    <!-- ===== Hero ===== -->
    <section class="hero">
      <div class="page">
        <div class="hero-banner">
          <div class="hero-text">
            <span class="hero-kicker">New Booster Series Just Added</span>
            <h1>Find Your Holographic Rare<br><em>Trading Card Auction House</em></h1>
            <p class="lead">SSP signed foils, SP rares and SR highlights — every card is condition checked, with open bidding you can trust.</p>
            <div class="hero-cta">
              <a class="btn" href="#market">Browse the auctions</a>
              <router-link class="btn ghost" to="/add-item">List a card</router-link>
            </div>
          </div>
          <div class="hero-cards" aria-hidden="true">
            <img class="c1" src="/cards/195px-BD-W95-030SSP.png" alt="">
            <img class="c2" src="/cards/195px-BD-W95-082SSP.png" alt="">
            <img class="c3" src="/cards/195px-BD-W63-027SSP.png" alt="">
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-chip"><b>{{ stats.live }}</b><span>Live card auctions</span></div>
          <div class="stat-chip"><b>{{ stats.ssp }}</b><span>SSP top foils</span></div>
          <div class="stat-chip"><b>100%</b><span>Condition checked</span></div>
          <div class="stat-chip"><b>Tracked</b><span>Shipping on every card</span></div>
        </div>
      </div>
    </section>

    <!-- ===== Live auctions (API data) ===== -->
    <section class="page" id="market">
      <div class="sec-head">
        <h2>Card <span>Auctions</span></h2>
        <p>Live and recently finished listings — open a card for its current bid and full bid history</p>
      </div>

      <form class="search-bar" @submit.prevent="runSearch">
        <input
          type="text"
          v-model="query"
          placeholder="Search by card number, name or series, e.g. W95-082…"
          class="search-input"
        />
        <select v-model.number="categoryFilter" class="cat-select" aria-label="Filter by rarity">
          <option :value="null">All rarities</option>
          <option v-for="cat in categories" :key="cat.category_id" :value="cat.category_id">{{ cat.name }}</option>
        </select>
        <select v-if="loggedIn" v-model="statusFilter" class="cat-select" aria-label="Filter by my auctions">
          <option value="">All auctions</option>
          <option value="OPEN">My open listings</option>
          <option value="BID">Auctions I'm bidding on</option>
          <option value="ARCHIVE">My ended listings</option>
        </select>
        <button class="btn blue" type="submit">Search</button>
      </form>

      <div class="results-bar" v-if="!loading && !error">
        <p class="result-count">
          {{ auctions.length }} card{{ auctions.length === 1 ? '' : 's' }} shown
          <span v-if="hasFilters">· filtered</span>
        </p>
        <button v-if="hasFilters" class="btn ghost" type="button" @click="clearFilters">Clear filters</button>
      </div>

      <div class="grid skeleton-grid" v-if="loading" aria-hidden="true">
        <div class="skel-card" v-for="n in 6" :key="n">
          <div class="skel-img"></div>
          <div class="skel-line"></div>
          <div class="skel-line short"></div>
        </div>
      </div>

      <div class="state err" v-else-if="error">{{ error }}</div>

      <div class="state empty" v-else-if="auctions.length === 0">
        <p>No cards match your search. Try different keywords.</p>
        <button v-if="hasFilters" class="btn ghost" type="button" @click="clearFilters">Clear filters</button>
      </div>

      <div class="grid" v-else>
        <AuctionCard v-for="item in auctions" :key="item.item_id" :item="item" />
      </div>

      <nav class="pager" v-if="!loading && !error && auctions.length" aria-label="Pagination">
        <button class="btn ghost" type="button" :disabled="page === 1" @click="goToPage(page - 1)">Previous</button>
        <span class="page-label">Page {{ page }}</span>
        <button class="btn ghost" type="button" :disabled="!hasMore" @click="goToPage(page + 1)">Next</button>
      </nav>
    </section>
  </div>
</template>

<script>
import AuctionCard from '../components/AuctionCard.vue'
import coreService from '../../services/core.service.js'
import session from '../../services/session.js'

// Cards shown per page. The API supports limit/offset, so the grid only ever
// loads one page at a time.
const PAGE_SIZE = 24
// One request is enough to summarise the catalogue. If it comes back full the
// counts are shown as "n+" instead of pretending to know the exact total.
const STATS_LIMIT = 100

export default {
  components: { AuctionCard },
  data() {
    return {
      auctions: [],
      query: '',
      categoryFilter: null,
      statusFilter: '',
      categories: [],
      page: 1,
      hasMore: false,
      stats: { live: '—', ssp: '—' },
      // Guards the filter watchers while clearFilters() resets several fields.
      suspendWatch: false,
      loading: true,
      error: ''
    }
  },
  computed: {
    loggedIn() {
      return session.isLoggedIn()
    },
    hasFilters() {
      return !!(this.query.trim() || this.categoryFilter !== null || this.statusFilter)
    }
  },
  watch: {
    // Changing either filter re-runs the search from the first page.
    categoryFilter() {
      if (!this.suspendWatch) this.runSearch()
    },
    statusFilter() {
      if (!this.suspendWatch) this.runSearch()
    }
  },
  mounted() {
    coreService.getCategories().then((cats) => {
      this.categories = cats
    }).catch(() => {
      this.categories = []
    })
    this.loadStats()
    this.fetchItems('')
  },
  methods: {
    fetchItems(q) {
      this.loading = true
      this.error = ''
      // Status searches only work when signed in (the API needs a token), so
      // fall back to a normal public search if the session has gone.
      const status = session.isLoggedIn() ? this.statusFilter : ''
      const offset = (this.page - 1) * PAGE_SIZE
      coreService.searchItems(q, this.categoryFilter, status, PAGE_SIZE, offset).then((items) => {
        this.auctions = items
        this.hasMore = items.length === PAGE_SIZE
        this.loading = false
      }).catch((err) => {
        this.error = err
        this.loading = false
      })
    },
    // The headline numbers are read from the API instead of being hard coded.
    loadStats() {
      const now = Date.now()
      coreService.searchItems('', null, '', STATS_LIMIT, 0).then((items) => {
        const capped = items.length === STATS_LIMIT
        const live = items.filter((item) => item.end_date > now).length
        const ssp = items.filter((item) =>
          (item.categories || []).some((cat) => cat.name === 'SSP')
        ).length
        this.stats.live = capped ? live + '+' : String(live)
        this.stats.ssp = capped ? ssp + '+' : String(ssp)
      }).catch(() => {
        // Keep the placeholder dashes rather than inventing numbers.
        this.stats.live = '—'
        this.stats.ssp = '—'
      })
    },
    runSearch() {
      this.page = 1
      this.fetchItems(this.query.trim())
    },
    // Reset every filter with a single request.
    clearFilters() {
      this.suspendWatch = true
      this.query = ''
      this.categoryFilter = null
      this.statusFilter = ''
      this.page = 1
      this.fetchItems('')
      this.$nextTick(() => {
        this.suspendWatch = false
      })
    },
    goToPage(page) {
      if (page < 1 || (page > 1 && !this.hasMore)) return
      this.page = page
      this.fetchItems(this.query.trim())
    }
  }
}
</script>

<style scoped>
/* Hero */
.hero { padding: 18px 0 4px; position: relative; z-index: 1; }
.hero-banner {
  position: relative;
  border-radius: 28px;
  padding: clamp(30px, 3.2vw, 66px) clamp(24px, 3vw, 60px);
  overflow: hidden;
  border: 5px solid var(--primary);
  background: linear-gradient(120deg, #ffe9f4 0%, #f3e8ff 45%, #e2f1ff 100%);
  box-shadow: 0 14px 34px rgba(224, 43, 126, .2);
}
.hero-banner::before { content: ''; position: absolute; right: -60px; top: -60px; width: 240px; height: 240px; border-radius: 50%; background: rgba(255, 216, 61, .35); }
.hero-banner::after { content: ''; position: absolute; left: -70px; bottom: -90px; width: 220px; height: 220px; border-radius: 50%; background: rgba(79, 214, 168, .3); }
.hero-text { position: relative; z-index: 2; max-width: clamp(460px, 34vw, 700px); }
.hero-kicker { display: inline-block; background: var(--yellow); border-radius: 999px; padding: 5px 14px; font-weight: 800; font-size: 13px; margin-bottom: 14px; }
.hero h1 { font-size: clamp(28px, 4.4vw, 44px); font-weight: 800; }
.hero h1 em { font-style: normal; color: var(--primary-dark); }
.lead { margin: 12px 0 22px; color: #6b556b; font-size: clamp(15px, 1vw, 17px); line-height: 1.7; }
.hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-cards {
  position: absolute;
  right: clamp(20px, 2.5vw, 70px);
  top: 50%;
  transform: translateY(-50%);
  width: clamp(270px, 21vw, 430px);
  height: clamp(270px, 21vw, 430px);
  z-index: 1;
}
.hero-cards img { position: absolute; width: clamp(140px, 10vw, 210px); border-radius: 12px; border: 3px solid #fff; box-shadow: 0 10px 22px rgba(58, 44, 58, .25); background: #fff; }
.hero-cards .c1 { left: 0; top: 7%; transform: rotate(-12deg); }
.hero-cards .c2 { left: 27%; top: 0; z-index: 2; }
.hero-cards .c3 { right: 0; top: 9%; transform: rotate(12deg); }
@media (max-width: 880px) { .hero-cards { display: none; } .hero-banner { padding: 30px 24px; } }
.hero-stats { display: flex; gap: clamp(10px, 1vw, 20px); margin-top: clamp(16px, 1.4vw, 26px); flex-wrap: wrap; }
.stat-chip { flex: 1; min-width: clamp(150px, 10vw, 220px); background: rgba(255, 255, 255, .9); border: 2px solid #ffd0e6; border-radius: 20px; padding: clamp(12px, 1vw, 20px) clamp(16px, 1.4vw, 26px); text-align: center; }
.stat-chip b { font-family: "Baloo 2"; font-size: clamp(21px, 1.5vw, 32px); color: var(--primary-dark); display: block; }
.stat-chip span { font-size: 12.5px; color: var(--muted); font-weight: 700; }

/* Section head */
.sec-head { margin-bottom: 18px; }
.sec-head h2 { font-size: clamp(22px, 3.2vw, 30px); font-weight: 800; }
.sec-head h2 span { color: var(--primary-dark); }
.sec-head p { color: var(--muted); font-size: 13.5px; font-weight: 700; margin-top: 2px; }

/* Search */
.search-bar { display: flex; gap: 10px; margin: 18px 0 6px; }
.search-input { flex: 1; padding: clamp(10px, 0.8vw, 14px) clamp(16px, 1.3vw, 22px); border: 2px solid var(--border); border-radius: 999px; background: var(--surface); font-size: clamp(15px, 1vw, 17px); }
.search-input:focus { outline: none; border-color: var(--blue); }
.cat-select { padding: clamp(10px, 0.8vw, 14px) clamp(14px, 1.1vw, 18px); border: 2px solid var(--border); border-radius: 999px; background: var(--surface); font-size: clamp(14px, 0.95vw, 16px); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(clamp(200px, 13vw, 240px), 1fr)); gap: clamp(14px, 1.2vw, 26px); margin-top: clamp(18px, 1.5vw, 28px); }
@media (max-width: 700px) { .search-bar { flex-direction: column; } }
.state { padding: 30px 0; color: var(--muted); font-weight: 700; }
.state.err { color: var(--danger); }
.state.empty { background: var(--surface); border: 2px dashed var(--border); border-radius: 18px; text-align: center; }

/* Results summary */
.results-bar { display: flex; align-items: center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
.result-count { margin: 0; color: var(--muted); font-size: 13.5px; font-weight: 800; }
.results-bar .btn { padding: 7px 16px; font-size: 13px; }

/* Loading placeholders, so the grid does not jump while data loads */
.skeleton-grid { margin-top: clamp(18px, 1.5vw, 28px); }
.skel-card { padding: 12px; border: 2px solid var(--border); border-radius: 18px; background: var(--surface); }
.skel-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  background: linear-gradient(100deg, #f4ecf4 30%, #fdf6fb 50%, #f4ecf4 70%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
.skel-line { height: 12px; margin-top: 10px; border-radius: 6px; background: #f0e4f0; }
.skel-line.short { width: 62%; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* Pagination */
.pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 24px; }
.page-label { color: var(--muted); font-size: 14px; font-weight: 800; }
.pager .btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pager .btn:disabled:hover { background: transparent; }
</style>
