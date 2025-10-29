<template>
  <div 
    class="tile" 
    :class="{ 'selected': isSelected, 'clickable': clickable, 'small': small }"
    @click="handleClick"
  >
    <div class="tile-face">
      <span class="tile-icon" :class="getTileColorClass(tile)">{{ getTileIcon(tile) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tile } from '../types/mahjong';

interface Props {
  tile: Tile;
  isSelected?: boolean;
  clickable?: boolean;
  small?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  clickable: false,
  small: false
});

const emit = defineEmits<{
  click: [tile: Tile]
}>();

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.tile);
  }
};

// 将麻将牌转换为显示文字
const getTileIcon = (tile: Tile): string => {
  // 直接使用 tile.display，它已经包含了正确的中文显示
  return tile.display;
};

// 根据牌的类型返回颜色类名
const getTileColorClass = (tile: Tile): string => {
  if (tile.type === 'man') return 'tile-man'; // 万子 - 蓝色
  if (tile.type === 'pin') return 'tile-pin'; // 饼子 - 红色
  if (tile.type === 'sou') return 'tile-sou'; // 索子 - 绿色
  if (tile.type === 'honor') {
    // 字牌 - 根据具体牌区分颜色
    if (tile.value === 5) return 'tile-honor-red'; // 中 - 红色
    if (tile.value === 6) return 'tile-honor-green'; // 发 - 绿色
    return 'tile-honor'; // 其他字牌 - 黑色
  }
  return '';
};
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
  top: -8px; /* 比灰色更高一点 */
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #e69b4e; /* 温暖的雀魂橙色 */
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

/* 字体样式 */
.tile-icon {
  font-size: 28px;
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


/* small 样式保留用于其他可能的用途 */
.tile.small {
  animation: none;
}
</style>
