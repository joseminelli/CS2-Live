import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './components/Dashboard.vue'
import LiveMatches from './components/LiveMatches.vue'
import UpcomingMatches from './components/UpcomingMatches.vue'
import RecentMatches from './components/RecentMatches.vue'
import Tournaments from './components/Tournaments.vue'
import Teams from './components/Teams.vue'

const routes = [
  { path: '/', redirect: { name: 'dashboard' } },
  { path: '/dashboard', name: 'dashboard', component: Dashboard },
  { path: '/ao-vivo', name: 'live', component: LiveMatches },
  { path: '/proximos', name: 'upcoming', component: UpcomingMatches },
  { path: '/resultados', name: 'recent', component: RecentMatches },
  { path: '/torneios', name: 'tournaments', component: Tournaments },
  { path: '/times', name: 'teams', component: Teams }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

export default router