<template>
  <div class="player-discard-tile">
    <div class="player-discard-tile-face">
      <!-- 图片模式 -->
      <img v-if="useImage && !imageError" :src="tileImagePath" class="tile-image"
        @error="handleImageError" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Tile } from '../utils/define';
import { getTileImagePath } from '../utils/tileImage';

interface Props {
  tile: Tile;
  useImage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  useImage: true
});

const imageError = ref(false);

// 获取图片路径
const tileImagePath = computed(() => getTileImagePath(props.tile));

// 图片加载失败时的处理
const handleImageError = () => {
  imageError.value = true;
};
</script>

<style scoped>
/* 自家舍牌样式 */
.player-discard-tile {
  display: inline-block;
  width: 54px;
  height: 64px;
  margin: 0;
  position: relative;
  cursor: default;
}

/* 最底层橙色层 */
.player-discard-tile::after {
  content: '';
  position: absolute;
  top: 9px;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #e69b4e;
  z-index: -1;
}

/* 中间灰色层 */
.player-discard-tile::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #bfbfbf;
  z-index: 0;
}

/* 最上层白色面（牌面） */
.player-discard-tile-face {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片样式 */
.tile-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  user-select: none;
  pointer-events: none;
}
</style>
