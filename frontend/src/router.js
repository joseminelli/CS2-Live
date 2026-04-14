import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './components/Dashboard.vue'
import LiveMatches from './components/LiveMatches.vue'
import UpcomingMatches from './components/UpcomingMatches.vue'
import RecentMatches from './components/RecentMatches.vue'
import Tournaments from './components/Tournaments.vue'

const routes = [
  { path: '/', redirect: { name: 'dashboard' } },
  { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
  { path: '/ao-vivo', alias: ['/live'], name: 'live', component: LiveMatches, meta: { title: 'Ao Vivo' } },
  { path: '/proximos', alias: ['/upcoming'], name: 'upcoming', component: UpcomingMatches, meta: { title: 'Proximos Jogos' } },
  { path: '/resultados', alias: ['/recent'], name: 'recent', component: RecentMatches, meta: { title: 'Resultados' } },
  { path: '/torneios', alias: ['/tournaments'], name: 'tournaments', component: Tournaments, meta: { title: 'Torneios' } },
  { path: '/times', redirect: { name: 'tournaments' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: { name: 'dashboard' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 90,
        behavior: 'smooth'
      }
    }

    return { top: 0, behavior: 'smooth' }
  }
})

router.afterEach((to) => {
  const pageTitle = to.meta?.title ? `${to.meta.title} | CS2 Live` : 'CS2 Live'
  document.title = pageTitle
})

export default router