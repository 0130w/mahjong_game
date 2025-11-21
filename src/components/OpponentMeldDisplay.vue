<script setup lang="ts">
import type { Meld } from '../utils/define';
import OpponentDiscardTile from './OpponentDiscardTile.vue';

defineProps<{
  melds: Meld[];
}>();
</script>

<template>
  <div class="opponent-meld-display">
    <div v-for="(meld, index) in melds" :key="index" class="meld-group">
      <div class="meld-tiles">
        <!-- id 仅用于展示，避免重复 -->
        <OpponentDiscardTile
          v-for="n in (meld.type === 'kan' || meld.type === 'ankan' ? 4 : 3)"
          :key="`${meld.tile.id}-${n}`"
          :tile="{ ...meld.tile, id: `${meld.tile.id}-${n}` }"
          :useImage="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.opponent-meld-display {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 0;
  background: transparent;
  min-height: 80px;
}

.meld-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 0;
  background: transparent;
}

.meld-tiles {
  display: flex;
  gap: 2px;
  align-items: center;
}
</style>