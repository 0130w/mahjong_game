<template>
  <div class="player-hand" :class="{ 'is-opponent': !showHand }">
    <!-- 手牌区域 -->
    <div class="hand-area">
      <div class="hand-tiles" v-if="showHand">
        <TileComponent
          v-for="(tile, index) in player.hand"
          :key="tile.id"
          :tile="tile"
          :isSelected="selectedTiles.includes(tile.id)"
          :clickable="isCurrentPlayer"
          :class="{ 'is-drawn-tile': index === player.hand.length - 1 && player.hand.length === 14 }"
          @click="handleTileClick"
        />
      </div>
      <div class="hand-tiles-hidden" v-else>
        <div 
          v-for="(tile, index) in player.hand" 
          :key="`hidden-${index}`"
          class="tile-back"
          :class="{ 
            'is-drawn-tile-back': index === player.hand.length - 1 && player.hand.length === 14,
            'ai-selecting': tile.id === gameStore.aiSelectingTileId
          }"
        >
          <div class="tile-back-pattern"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../stores/gameStore';
import type { Player, Tile } from '../types/mahjong';
import TileComponent from './TileComponent.vue';

interface Props {
  player: Player;
  isCurrentPlayer: boolean;
  showHand?: boolean; // 是否显示手牌
}

const props = withDefaults(defineProps<Props>(), {
  showHand: true
});

const emit = defineEmits<{
  tileClick: [tileId: string]
}>();

const gameStore = useGameStore();
const selectedTiles = ref<string[]>([]);

const handleTileClick = (tile: Tile) => {
  emit('tileClick', tile.id);
};
</script>

<style scoped>
.player-hand {
  position: relative;
  padding: 0;
  margin: 5px 0;
}

.player-hand.is-opponent {
  transform: rotateX(180deg);
}

.player-hand.is-opponent .hand-area {
  transform: rotateX(180deg);
}


/* 手牌区域 */
.hand-area {
  padding: 8px;
  background: transparent;
  perspective: 1000px; /* 为3D变换设置透视 */
}

.hand-tiles {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  flex-wrap: nowrap;
  gap: 1px;
  min-height: 90px; /* 增加最小高度以容纳3D效果 */
  overflow-x: auto;
  overflow-y: visible; /* 允许Y轴溢出以显示抬起效果 */
  padding-top: 20px; /* 增加顶部空间以防遮挡 */
  padding-bottom: 10px;
}

.hand-tiles-hidden {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  flex-wrap: nowrap;
  gap: 1px;
  min-height: 90px;
  overflow-x: auto;
  overflow-y: visible; /* 允许Y轴溢出以显示抬起效果 */
  padding-top: 20px; /* 增加顶部空间以防遮挡 */
  padding-bottom: 10px;
}

/* 新摸的牌增加左边距 */
.hand-tiles .is-drawn-tile {
  margin-left: 8px;
}

/* 对家的新摸牌在最左边，增加右边距 */
.is-opponent .hand-tiles-hidden .is-drawn-tile-back {
  order: -1;
  margin-right: 8px;
}

.tile-back {
  width: 42px;
  height: 54px;
  margin: 0;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* AI 打牌时的抬起效果 */
.tile-back.ai-selecting {
  transform: translateY(-15px) scale(1.05);
  filter: brightness(1.1);
  z-index: 10;
}

/* 对家区域翻转后，抬起方向需要反过来 */
.is-opponent .tile-back.ai-selecting {
  transform: translateY(15px) scale(1.05);
}

/* 最底层白色层（对家翻转后在最上面） */
.tile-back::after {
  content: '';
  position: absolute;
  top: -16px;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #ffffff;
  z-index: -1;
}

/* 中间灰色层 */
.tile-back::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #e29547;
  z-index: 0;
}

/* 最上层橙色面（牌背面，对家翻转后在最下面） */
.tile-back-pattern {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #df8d3c;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
