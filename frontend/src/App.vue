<template>
  <div id="app" class="app-container">
    <Navbar />
    
    <main class="main-content">
      <RouterView />
    </main>
    
    <Footer />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'InterVariable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.02em;
  background: #030807;
  color: #e4e4e7;
  overflow-x: hidden;
  min-height: 100vh;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

.app-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 50% 85%, rgba(67, 203, 156, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 20% 25%, rgba(67, 203, 156, 0.06) 0%, transparent 35%);
  pointer-events: none;
  z-index: 0;
}

.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

footer {
  position: relative;
  z-index: 1;
}

.main-content {
  flex: 1;
  padding: 132px 20px 40px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .main-content {
    padding: 108px 12px 20px;
  }
}
</style>

