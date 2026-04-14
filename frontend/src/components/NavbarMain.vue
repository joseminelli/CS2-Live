<script setup lang="ts">
import { watch } from 'vue';
import { useNavbar } from '../composables/useNavbar';
import NavbarHome from '../components/navbars/NavbarHome.vue';
import NavbarProject from '../components/navbars/NavbarProject.vue';
import NavBarLabs from '../components/navbars/NavbarLabs.vue';
import NavbarAbout from '../components/navbars/NavbarAbout.vue';
import NavbarMobileMenu from '../components/navbars/NavbarMobileMenu.vue';

const { route, isScrolled, currentProject, accentColor, isOpen } = useNavbar();

watch(isOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});
</script>

<template>
  <div>
    <header
      class="fixed top-5 left-1/2 -translate-x-1/2 w-[92%] md:w-[90%] max-w-7xl z-50 rounded-2xl flex items-center p-2 md:p-3 transition-all duration-500 border header-enter-animation"
      :class="{
        'bg-black/80 backdrop-blur-xl shadow-2xl': isScrolled || route.name !== 'home',
        'bg-black/40 backdrop-blur-md border-white/10': !isScrolled && route.name === 'home'
      }" 
      :style="{
        boxShadow: `inset 0 0 20px ${accentColor}30`,
        borderColor: isScrolled || route.name !== 'home' ? `${accentColor}60` : 'rgba(255,255,255,0.1)'
      }">
      
      <transition name="nav-content-swap" mode="out-in">
        <NavbarProject v-if="currentProject" :key="currentProject.id" />
        <NavbarAbout v-else-if="route.name === 'about'" key="about-nav" />
        <NavBarLabs v-else-if="route.name === 'labs'" key="labs-nav" />
        <NavbarHome v-else key="home-nav" />
      </transition>
    </header>

    <NavbarMobileMenu />
  </div>
</template>

<style scoped>
header {
  opacity: 0;
  transform: translate(-50%, -100%); 
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-content-swap-enter-active,
.nav-content-swap-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-content-swap-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.nav-content-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(1.02);
}

@keyframes navbar-enter {
  from {
    opacity: 0;
    transform: translate(-50%, -120%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.header-enter-animation {
  animation: navbar-enter 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
}
</style>