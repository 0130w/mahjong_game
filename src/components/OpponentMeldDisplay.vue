<template>
  <div v-if="melds.length > 0" class="opponent-meld-display">
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

.meld-label {
  font-size: 14px;
  color: #64b5f6;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  min-width: 40px;
  text-align: center;
  padding: 4px 8px;
  background: rgba(33, 150, 243, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.ankan-tile {
  opacity: 0.6;
}
</style>
