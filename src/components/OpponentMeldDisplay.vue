<script setup lang="ts">
import type { Meld } from '../utils/define';
import TileComponent from './TileComponent.vue';

// 从父组件传递melds
defineProps<{
  melds: Meld[];
}>();
</script>

<template>
  <div class="opponent-meld-display">
    <div v-for="(meld, index) in melds" :key="index" class="meld-group">
      <div class="meld-tiles">
        <!-- TODO: 优化CSS样式 -->
        <TileComponent v-for="tile in meld.tiles" :key="tile.id" :tile="tile" :clickable="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.opponent-meld-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.3) 0%, rgba(21, 101, 192, 0.3) 100%);
  border-radius: 12px;
  border: 2px solid rgba(33, 150, 243, 0.3);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-height: 80px;
  backdrop-filter: blur(5px);
}

.meld-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(33, 150, 243, 0.2);
}

.meld-tiles {
  display: flex;
  gap: 3px;
}
</style>
