<template>
  <div class="game-page">
    <GameBoard />
  </div>
</template>

<script setup lang="ts">
import GameBoard from '../components/GameBoard.vue';
</script>

<style scoped>
.game-page {
  width: 100%;
  min-height: 100vh;
}
</style>
