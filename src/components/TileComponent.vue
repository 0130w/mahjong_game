<template>
  <div class="tile" :class="{ 'selected': isSelected, 'clickable': clickable }" @click="handleClick">
    <div class="tile-face">
      <img :src="tileImagePath" class="tile-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Tile } from '../utils/define';
import { getTileImagePath } from '../utils/tileImage';

interface Props {
  tile: Tile;
  isSelected?: boolean;
  clickable?: boolean;
  isLastGetTile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  clickable: false,
  isLastGetTile: false,
});

const emit = defineEmits<{
  click: [tile: Tile]
}>();

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.tile);
  }
};

// 获取图片路径
const tileImagePath = computed(() => getTileImagePath(props.tile));

</script>

<style scoped>
/* 麻将容器（麻将桌背景） */
.tiles-container {
  background: radial-gradient(circle at center, #146b41 0%, #0e5230 80%);
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.tile {
  display: inline-block;
  width: 64px;
  height: 88px;
  margin: 0;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

/* 最底层橙色层 */
.tile::after {
  content: '';
  position: absolute;
  top: -8px;
  /* 比灰色更高一点 */
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #e69b4e;
  /* 温暖的雀魂橙色 */
  z-index: -1;
}

/* 中间灰色层 */
.tile::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #bfbfbf;
  z-index: 0;
}

/* 最上层白色面（牌面） */
.tile-face {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* hover 时轻轻抬起 */
.tile.clickable:hover {
  transform: translateY(-6px);
}

/* 选中状态（更高） */
.tile.selected {
  transform: translateY(-10px);
}

/* 图片样式 */
.tile-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  pointer-events: none;
}
</style>
