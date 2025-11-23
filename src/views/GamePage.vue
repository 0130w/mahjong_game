<script setup lang="ts">
import GameBoard from '../components/GameBoard.vue';
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
const router = useRouter();

onMounted(() => {
  if (store.players.length === 0) {
    router.replace('/');
    return;
  }
});

onUnmounted(() => {
  console.log('Game view unmounted, resetting game state...');
  store.forceResetGame(); // 杀掉后台循环
});
</script>

<template>
  <div class="game-page">
    <GameBoard />
  </div>
</template>

<style scoped>
.game-page {
  width: 100%;
  height: 100%;
}
</style>
