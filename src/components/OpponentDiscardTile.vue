<template>
  <div class="opponent-discard-tile">
    <div class="opponent-discard-tile-face">
      <!-- 图片模式 -->
      <img 
        v-if="useImage && !imageError"
        :src="tileImagePath" 
        class="tile-image"
        @error="handleImageError"
      />
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
/* 对家舍牌样式 - 翻转180度 */
.opponent-discard-tile {
  display: inline-block;
  width: 48px;
  height: 56px;
  margin: 0;
  position: relative;
  cursor: default;
  transform: rotateX(180deg);
}

/* 最底层白色层（翻转后在最上面） */
.opponent-discard-tile::after {
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
.opponent-discard-tile::before {
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

/* 最上层橙色面（翻转后在最下面） */
.opponent-discard-tile-face {
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

/* 图片样式 - 翻转180度以抵消父容器的翻转 */
.tile-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  user-select: none;
  pointer-events: none;
  transform: rotateX(180deg);
}
</style>
