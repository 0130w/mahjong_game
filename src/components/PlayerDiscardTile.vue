<template>
  <div class="player-discard-tile">
    <div class="player-discard-tile-face">
      <span class="player-discard-tile-icon" :class="getTileColorClass(tile)">{{ getTileIcon(tile) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tile } from '../types/mahjong';

interface Props {
  tile: Tile;
}

defineProps<Props>();

// 将麻将牌转换为显示文字
const getTileIcon = (tile: Tile): string => {
  return tile.display;
};

// 根据牌的类型返回颜色类名
const getTileColorClass = (tile: Tile): string => {
  if (tile.type === 'man') return 'tile-man';
  if (tile.type === 'pin') return 'tile-pin';
  if (tile.type === 'sou') return 'tile-sou';
  if (tile.type === 'honor') {
    if (tile.value === 5) return 'tile-honor-red';
    if (tile.value === 6) return 'tile-honor-green';
    return 'tile-honor';
  }
  return '';
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

/* 字体样式 */
.player-discard-tile-icon {
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
