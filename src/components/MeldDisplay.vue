<template>
  <div v-if="melds.length > 0" class="meld-display">
    <div v-for="(meld, index) in melds" :key="index" class="meld-group">
      <div class="meld-tiles">
        <TileComponent
          v-for="tile in meld.tiles"
          :key="tile.id"
          :tile="tile"
          :clickable="false"
          :class="{ 'ankan-tile': meld.type === 'ankan' && !meld.isOpen }"
        />
      </div>
      <div class="meld-label">{{ getMeldLabel(meld.type) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MeldGroup } from '../types/mahjong';
import TileComponent from './TileComponent.vue';

defineProps<{
  melds: MeldGroup[];
}>();

function getMeldLabel(type: string): string {
  const labels: Record<string, string> = {
    pon: '碰',
    kan: '杠',
    chi: '吃',
    ankan: '暗杠'
  };
  return labels[type] || '';
}
</script>

<style scoped>
.meld-display {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  min-height: 60px;
}

.meld-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.meld-tiles {
  display: flex;
  gap: 2px;
}

.meld-label {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.ankan-tile {
  opacity: 0.6;
}
</style>
