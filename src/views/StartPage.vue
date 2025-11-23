<template>
  <div class="start-page" :style="{ backgroundImage: `url(${cover})` }">
    <div class="overlay">
      <button @click="startGame" class="btn-start">
        开始游戏
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import cover from '/assets/cover.png';

const router = useRouter();
const gameStore = useGameStore();

const bgm = new Audio('/background.mp3');
bgm.loop = true;
bgm.play();

const startGame = async () => {
  try {
    await bgm.play();
  } catch (e) {
    console.warn(e);
  }
  gameStore.startNewGame();
  router.push('/game');
};
</script>

<style scoped>
.start-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6vh;
  background: transparent;
}

.btn-start {
  padding: 22px 80px;
  font-size: 26px;
  font-weight: 800;
  color: #1a2332;
  background: linear-gradient(135deg, #ffd700 0%, #ffeb7a 50%, #ffc107 100%);
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.95);
  cursor: pointer;
  outline: none;
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(255, 215, 0, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.btn-start:hover {
  transform: translateY(-4px);
  filter: brightness(1.06);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.6),
    0 0 0 4px rgba(255, 215, 0, 0.45);
}

.btn-start:active {
  transform: translateY(-1px);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.55),
    0 0 0 3px rgba(255, 215, 0, 0.4);
}
</style>