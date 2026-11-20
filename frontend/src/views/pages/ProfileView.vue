<template>
  <div class="page">
    <h1>My Profile</h1>

    <div class="state" v-if="loading">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading your cards…</p>
    </div>

    <div class="state err" v-else-if="error">{{ error }}</div>

    <template v-else-if="user">
      <div class="user-bar">
        <span class="full-name">{{ user.first_name }} {{ user.last_name }}</span>
        <button class="btn" @click="handleLogout">Log out</button>
      </div>

      <section class="section">
        <h2>Selling</h2>
        <p v-if="user.selling.length === 0" class="empty">You aren't selling anything yet.</p>
        <div class="grid" v-else>
          <AuctionCard v-for="item in user.selling" :key="item.item_id" :item="item" />
        </div>
      </section>

      <section class="section">
        <h2>Bidding On</h2>
        <p v-if="user.bidding_on.length === 0" class="empty">You haven't bid on anything yet.</p>
        <div class="grid" v-else>
          <AuctionCard v-for="item in user.bidding_on" :key="item.item_id" :item="item" />
        </div>
      </section>

      <section class="section">
        <h2>Ended Auctions</h2>
        <p v-if="user.auctions_ended.length === 0" class="empty">None of your auctions have ended yet.</p>
        <div class="grid" v-else>
          <AuctionCard v-for="item in user.auctions_ended" :key="item.item_id" :item="item" />
        </div>
      </section>
    </template>
  </div>
</template>

<script>
import AuctionCard from '../components/AuctionCard.vue'
import userService from '../../services/user.service.js'
import session from '../../services/session.js'

export default {
  components: { AuctionCard },
  data() {
    return {
      user: null,
      loading: true,
      error: ''
    }
  },
  mounted() {
    const id = session.getUserId()
    if (!id) {
      this.error = 'You must be logged in.'
      this.loading = false
      return
    }
    userService.getUser(id).then((user) => {
      this.user = user
      this.loading = false
    }).catch((err) => {
      this.error = err
      this.loading = false
    })
  },
  methods: {
    handleLogout() {
      userService.logout().then(() => {
        this.$router.push('/')
      }).catch(() => {
        session.endSession()
        this.$router.push('/')
      })
    }
  }
}
</script>

<style scoped>
.user-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 14px 18px;
  margin-bottom: 8px;
}
.full-name { font-size: 18px; font-weight: 800; }
.section { margin-top: 28px; }
.section h2 { font-size: 20px; border-bottom: 2px solid var(--border); padding-bottom: 6px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(200px, 13vw, 240px), 1fr));
  gap: clamp(14px, 1.2vw, 26px);
  margin-top: 12px;
}
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
.empty { color: var(--muted); font-weight: 700; }
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
