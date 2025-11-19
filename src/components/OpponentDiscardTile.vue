<template>
  <div class="opponent-discard-tile">
    <div class="opponent-discard-tile-face">
      <!-- 图片模式 -->
      <img 
        v-if="useImage && !imageError"
        :src="tileImagePath" 
        :alt="tile.display"
        class="tile-image"
        @error="handleImageError"
      />
      <!-- 文字降级模式 -->
      <span 
        v-else
        class="opponent-discard-tile-icon" 
        :class="getTileColorClass(tile)"
      >
        {{ getTileIcon(tile) }}
      </span>
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

// 将麻将牌转换为显示文字（降级方案）
const getTileIcon = (tile: Tile): string => {
  return tile.display;
};

// 根据牌的类型返回颜色类名（降级方案）
const getTileColorClass = (tile: Tile): string => {
  if (tile.type === 'man') return 'tile-man';
  if (tile.type === 'pin') return 'tile-pin';
  if (tile.type === 'sou') return 'tile-sou';
  if (tile.type === 'honor') {
    if (tile.value === 7) return 'tile-honor-red';
    if (tile.value === 6) return 'tile-honor-green';
    return 'tile-honor';
  }
  return '';
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

/* 字体样式（降级方案） */
.opponent-discard-tile-icon {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif;
}

/* 颜色定义 */
.tile-man { color: #1976d2; }
.tile-pin { color: #d32f2f; }
.tile-sou { color: #388e3c; }
.tile-honor { color: #212121; }
.tile-honor-red { color: #d32f2f; }
.tile-honor-green { color: #388e3c; }
</style>
