import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/pages/HomeView.vue'
import LoginView from '../views/pages/LoginView.vue'
import RegisterView from '../views/pages/RegisterView.vue'
import ItemDetailView from '../views/pages/ItemDetailView.vue'
import ProfileView from '../views/pages/ProfileView.vue'
import AddItemView from '../views/pages/AddItemView.vue'
import DraftsView from '../views/pages/DraftsView.vue'
import NotFoundView from '../views/pages/NotFoundView.vue'

// Auth guard: redirect to /login if no session token in localStorage
function requireAuth(to, from, next) {
  if (!localStorage.getItem('session_token')) {
    next({ name: 'login' })
  } else {
    next()
  }
}

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView, meta: { title: 'Sign in' } },
  { path: '/register', name: 'register', component: RegisterView, meta: { title: 'Create account' } },
  { path: '/item/:id', name: 'item-detail', component: ItemDetailView, meta: { title: 'Item' } },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    beforeEnter: requireAuth,
    meta: { title: 'My profile' }
  },
  {
    path: '/add-item',
    name: 'add-item',
    component: AddItemView,
    beforeEnter: requireAuth,
    meta: { title: 'List an item' }
  },
  {
    path: '/drafts',
    name: 'drafts',
    component: DraftsView,
    beforeEnter: requireAuth,
    meta: { title: 'Drafts' }
  },
  // Catch-all 404 route; it must stay last so the other routes match first.
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Page not found' } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Open every page at the top, but restore the old position on "back".
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

// Keep the browser tab in sync with the page the user is on.
const SITE_NAME = 'Auctionary'
router.afterEach((to) => {
  document.title = to.meta && to.meta.title
    ? to.meta.title + ' — ' + SITE_NAME
    : SITE_NAME + ' — Trading Card Auctions'
})

export default router
