<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h4>CS2 Competitive Tracker</h4>
        <p>Acompanhe todos os jogos competitivos de Counter-Strike 2 em tempo real.</p>
      </div>
      
      <div class="footer-section">
        <h4>Links Rápidos</h4>
        <ul>
          <li><RouterLink to="/dashboard">Dashboard</RouterLink></li>
          <li><RouterLink to="/ao-vivo">Ao Vivo</RouterLink></li>
          <li><RouterLink to="/torneios">Torneios</RouterLink></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>Powered By</h4>
        <p><a href="https://pandascore.co" target="_blank">PandaScore API</a></p>
        <p>Dados de CS2 em tempo real</p>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; 2024 CS2 Tracker. Desenvolvido com ❤️ para a comunidade de esports.</p>
      <p class="system-status">SYSTEM_STATUS: ONLINE | VERSION: 1.0</p>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.footer {
  background: rgba(10, 14, 39, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(64, 224, 208, 0.15);
  padding: 60px 40px 30px;
  margin-top: 100px;
  position: relative;
  z-index: 0;
}

.footer-content {
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #40e0d0;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-section p {
  font-size: 14px;
  color: rgba(228, 228, 231, 0.7);
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin: 8px 0;
}

.footer-section a {
  color: rgba(64, 224, 208, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 14px;
}

.footer-section a:hover {
  color: #40e0d0;
  padding-left: 4px;
}

.footer-bottom {
  border-top: 1px solid rgba(64, 224, 208, 0.1);
  padding-top: 30px;
  text-align: center;
  font-size: 12px;
  color: rgba(228, 228, 231, 0.5);
}

.system-status {
  font-family: 'Courier New', monospace;
  margin-top: 10px;
  color: rgba(64, 224, 208, 0.6);
}

@media (max-width: 768px) {
  .footer {
    padding: 40px 20px 20px;
  }
  
  .footer-content {
    gap: 30px;
  }
}
</style>
