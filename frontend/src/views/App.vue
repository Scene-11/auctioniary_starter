<template>
  <div class="app">
    <a class="skip-link" href="#main">Skip to content</a>

    <div class="stars" aria-hidden="true">
      <span class="star" v-for="s in stars" :key="s.id" :style="s.style" v-html="s.svg"></span>
    </div>

    <header class="topbar">
      <div class="topbar-inner">
        <router-link to="/" class="logo" aria-label="Auctionary home">
          <svg class="star-ic" viewBox="0 0 24 24"><path fill="#ff4fa3" d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/></svg>
          <span>Auctionary</span>
          <span class="logo-tag">Trading Cards</span>
        </router-link>

        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-controls="site-nav"
          @click="menuOpen = !menuOpen"
        >
          <span class="sr-only">{{ menuOpen ? 'Close menu' : 'Open menu' }}</span>
          <span class="menu-icon" :class="{ open: menuOpen }" aria-hidden="true"></span>
        </button>

        <nav id="site-nav" class="nav" :class="{ open: menuOpen }">
          <router-link to="/" @click="menuOpen = false">Auctions</router-link>
          <template v-if="loggedIn">
            <router-link to="/add-item" @click="menuOpen = false">List Item</router-link>
            <router-link to="/drafts" @click="menuOpen = false">Drafts</router-link>
            <router-link to="/profile" @click="menuOpen = false">Profile</router-link>
            <a href="#" class="logout-link" @click.prevent="handleLogout">Logout</a>
          </template>
          <template v-else>
            <router-link to="/login" class="login-pill" @click="menuOpen = false">Login</router-link>
            <router-link to="/register" class="register-pill" @click="menuOpen = false">Register</router-link>
          </template>
        </nav>
      </div>
    </header>

    <main id="main" class="main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <p class="footer-brand">
          <svg class="star-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="#ff4fa3" d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/></svg>
          <span><strong>Auctionary</strong> — trading card auctions</span>
        </p>
        <nav class="footer-links" aria-label="Footer">
          <router-link to="/">Browse auctions</router-link>
          <router-link to="/add-item">List a card</router-link>
          <router-link to="/drafts">Drafts</router-link>
          <router-link to="/profile">My profile</router-link>
        </nav>
        <p class="footer-note">Full-stack prototype · Vue 3 front end · Node/Express API</p>
      </div>
    </footer>
  </div>
</template>

<script>
import userService from '../services/user.service.js'
import session from '../services/session.js'

export default {
  data() {
    const colors = ['#ff4fa3', '#ffd83d', '#3aa0ff', '#4fd6a8', '#9b7bff']
    const stars = []
    for (let i = 0; i < 24; i++) {
      const size = 10 + Math.random() * 16
      stars.push({
        id: i,
        style: {
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's'
        },
        svg: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24"><path fill="' + colors[i % colors.length] + '" d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/></svg>'
      })
    }
    return {
      stars,
      menuOpen: false,
      loggedIn: session.isLoggedIn()
    }
  },
  watch: {
    // Signing in and out happens on other pages, so refresh the header whenever
    // the route changes (the header itself is not re-created between pages).
    $route() {
      this.loggedIn = session.isLoggedIn()
    }
  },
  methods: {
    handleLogout() {
      this.menuOpen = false
      userService.logout().then(() => {
        this.loggedIn = false
        this.$router.push('/')
      }).catch(() => {
        // Even if the server call fails, clear local state and go home
        session.endSession()
        this.loggedIn = false
        this.$router.push('/')
      })
    }
  }
}
</script>

<style scoped>
.stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.star { position: absolute; opacity: .8; animation: twinkle 3s ease-in-out infinite; }
.star svg { display: block; }
@keyframes twinkle {
  0%, 100% { transform: scale(1) rotate(0); }
  50% { transform: scale(1.25) rotate(20deg); }
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  padding: clamp(10px, 0.8vw, 18px) clamp(16px, 2.6vw, 56px);
}
.topbar-inner {
  display: flex;
  align-items: center;
  gap: 18px;
  max-width: 1680px;
  margin: 0 auto;
  background: rgba(255, 255, 255, .88);
  backdrop-filter: blur(8px);
  border: 2px solid #ffd0e6;
  border-radius: 999px;
  padding: 8px 12px 8px 20px;
  box-shadow: 0 6px 20px rgba(224, 43, 126, .12);
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Baloo 2", sans-serif;
  font-weight: 800;
  font-size: 20px;
  color: var(--primary-dark);
}
.logo-tag {
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  background: var(--primary);
  border-radius: 999px;
  padding: 2px 9px;
  letter-spacing: 0.02em;
}
.star-ic { width: 26px; height: 26px; }
.nav { display: flex; gap: 4px; margin-left: auto; align-items: center; }
.nav a {
  padding: 8px 15px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
}
.nav a:hover { background: #ffe6f2; color: var(--primary-dark); }
.nav a.router-link-exact-active { background: #ffe6f2; color: var(--primary-dark); }
.nav .login-pill { background: var(--primary); color: #fff; box-shadow: 0 3px 0 var(--primary-dark); }
.nav .login-pill:hover { background: var(--primary-dark); color: #fff; }
.nav .register-pill { background: var(--yellow); color: var(--ink); box-shadow: 0 3px 0 var(--yellow-dark); }
.nav .register-pill:hover { background: var(--yellow-dark); }

/* Keyboard users can jump straight to the page content */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: 10px 18px;
  border-radius: 0 0 14px 0;
  background: #fff;
  color: var(--primary-dark);
  font-weight: 800;
}
.skip-link:focus { left: 0; }

.main { position: relative; z-index: 1; }

/* Route transition */
.page-enter-active,
.page-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-6px); }

/* Hamburger, only shown on narrow screens */
.menu-toggle {
  display: none;
  margin-left: auto;
  width: 46px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffd0e6;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}
.menu-icon {
  position: relative;
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--ink);
  transition: background 0.15s ease;
}
.menu-icon::before,
.menu-icon::after {
  content: '';
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--ink);
  transition: transform 0.15s ease;
}
.menu-icon::before { top: -6px; }
.menu-icon::after { top: 6px; }
.menu-icon.open { background: transparent; }
.menu-icon.open::before { transform: translateY(6px) rotate(45deg); }
.menu-icon.open::after { transform: translateY(-6px) rotate(-45deg); }

/* Footer */
.footer {
  position: relative;
  z-index: 1;
  margin-top: clamp(30px, 3vw, 60px);
  border-top: 2px solid var(--border);
  background: rgba(255, 255, 255, 0.7);
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: clamp(12px, 1.4vw, 26px);
  max-width: 1680px;
  margin: 0 auto;
  padding: clamp(20px, 1.8vw, 34px) clamp(16px, 2.6vw, 56px);
}
.footer-brand { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 800; }
.footer-links { display: flex; flex-wrap: wrap; gap: 4px; margin-left: auto; }
.footer-links a { padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 800; color: var(--ink); }
.footer-links a:hover { background: #ffe6f2; color: var(--primary-dark); }
.footer-note { width: 100%; margin: 0; color: var(--muted); font-size: 12.5px; font-weight: 700; }

@media (max-width: 820px) {
  .menu-toggle { display: inline-flex; }
  .logo { font-size: 16px; }
  .logo-tag { display: none; }
  .topbar-inner { position: relative; }
  .nav {
    display: none;
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 10px;
    border: 2px solid #ffd0e6;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 14px 28px rgba(224, 43, 126, 0.18);
  }
  .nav.open { display: flex; }
  .nav a { display: block; padding: 10px 14px; font-size: 15px; text-align: center; }
}

/* Roomier header on large desktop screens */
@media (min-width: 1600px) {
  .topbar-inner { padding: 10px 16px 10px 26px; }
  .logo { font-size: 22px; }
  .nav a { font-size: 15px; padding: 9px 18px; }
}
</style>
