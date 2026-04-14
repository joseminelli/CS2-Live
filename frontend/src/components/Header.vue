<template>
  <header class="header">
    <div class="header-wrapper">
      <div class="header-top">
        <div class="logo-section">
          <div class="logo">
            <img src="/Cs2live.png" alt="CS2 Live Logo" class="logo-icon">
            <span class="logo-text">CS2 Live</span>
          </div>
          <span class="status-badge" :class="{ online: isOnline }">
            {{ isOnline ? '● ONLINE' : '● OFFLINE' }}
          </span>
        </div>
        
        <nav class="nav">
          <button 
            v-for="item in navItems" 
            :key="item.id"
            @click="emit('navigate', item.id)"
            class="nav-item"
            :class="{ active: item.id === 'dashboard' }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>
        
        <div class="header-info">
          <div class="system-info">
            <p class="info-small">v1.0</p>
          </div>
        </div>
      </div>
      
      <div class="header-bottom">
        <div class="breadcrumb">
          <span class="breadcrumb-item">SYS.ESPORTS</span>
          <span class="separator">/</span>
          <span class="breadcrumb-item active">{{ getCurrentViewName() }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { healthAPI } from '../api.js'

const emit = defineEmits(['navigate'])

const isOnline = ref(false)

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'live', icon: '🔴', label: 'Ao Vivo' },
  { id: 'upcoming', icon: '📅', label: 'Próximos' },
  { id: 'recent', icon: '📈', label: 'Recentes' },
  { id: 'tournaments', icon: '🏆', label: 'Torneios' }
]

const viewNames = {
  'dashboard': 'Dashboard',
  'live': 'Jogos Ao Vivo',
  'upcoming': 'Próximos Jogos',
  'recent': 'Resultados Recentes',
  'tournaments': 'Torneios CS2'
}

const getCurrentViewName = () => {
  return viewNames['dashboard'] || 'Dashboard'
}

onMounted(async () => {
  try {
    await healthAPI.check()
    isOnline.value = true
  } catch (error) {
    isOnline.value = false
  }
})
</script>

<style scoped>
.header {
  background: linear-gradient(180deg, rgba(10, 14, 39, 0.95) 0%, rgba(26, 31, 58, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(64, 224, 208, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.header-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 40px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100px;
  gap: 30px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

.logo-text {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #40e0d0 0%, #1e90ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
}

.status-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 14px;
  background: rgba(255, 0, 0, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}

.status-badge.online {
  background: rgba(64, 224, 208, 0.1);
  color: #40e0d0;
  border-color: rgba(64, 224, 208, 0.3);
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.2);
}

.nav {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(64, 224, 208, 0.08);
  border: 1px solid rgba(64, 224, 208, 0.2);
  color: rgba(228, 228, 231, 0.8);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(64, 224, 208, 0.1);
  transition: left 0.3s ease;
  z-index: -1;
}

.nav-item:hover {
  border-color: rgba(64, 224, 208, 0.4);
  color: #40e0d0;
  background: rgba(64, 224, 208, 0.1);
}

.nav-item:hover::before {
  left: 0;
}

.nav-item.active {
  background: rgba(64, 224, 208, 0.2);
  border-color: rgba(64, 224, 208, 0.6);
  color: #40e0d0;
  box-shadow: 0 0 20px rgba(64, 224, 208, 0.3), inset 0 0 10px rgba(64, 224, 208, 0.1);
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  display: none;
}

@media (min-width: 768px) {
  .nav-label {
    display: inline;
  }
}

.header-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.system-info {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.info-small {
  font-size: 13px;
  color: rgba(64, 224, 208, 0.8);
  margin: 0;
}

.header-bottom {
  padding: 12px 0;
  border-top: 1px solid rgba(64, 224, 208, 0.1);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: rgba(64, 224, 208, 0.7);
  letter-spacing: 0.05em;
}

.breadcrumb-item {
  text-transform: uppercase;
}

.breadcrumb-item.active {
  color: #40e0d0;
  font-weight: 600;
}

.separator {
  color: rgba(64, 224, 208, 0.4);
}

@media (max-width: 1200px) {
  .header-wrapper {
    padding: 0 20px;
  }
  
  .header-top {
    height: 70px;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .header-wrapper {
    padding: 0 15px;
  }
  
  .header-top {
    height: 60px;
    gap: 10px;
  }
  
  .logo-text {
    font-size: 14px;
  }
  
  .status-badge {
    display: none;
  }
  
  .header-info {
    display: none;
  }
  
  .nav {
    gap: 4px;
  }
  
  .nav-item {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .header-bottom {
    display: none;
  }
}
</style>

