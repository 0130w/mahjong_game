<template>
  <div v-if="melds.length > 0" class="player-meld-display">
    <div v-for="(meld, index) in melds" :key="index" class="meld-group">
      <div class="meld-tiles">
        <!-- 这里的id和tileID不一致，仅为了展示，对实际逻辑不影响 -->
        <PlayerDiscardTile v-for="n in (meld.type === 'kan' || meld.type === 'ankan' ? 4 : 3)"
          :key="`${meld.tile.id}-${n}`" :tile="{ ...meld.tile, id: `${meld.tile.id}-${n}` }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Meld } from '../utils/define';
import PlayerDiscardTile from './PlayerDiscardTile.vue';

defineProps<{
  melds: Meld[];
}>();
</script>

<style scoped>
.player-meld-display {
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

.ankan-tile {
  opacity: 0.6;
}

/* 被叫的牌横着放 */
.called-tile :deep(.player-discard-tile) {
  transform: rotate(90deg);
  margin: 0 5px;
}
</style>
