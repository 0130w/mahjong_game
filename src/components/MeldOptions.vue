<template>
  <div v-if="options.length > 0" class="meld-options-overlay">
    <div class="meld-options-panel">
      <h3>选择操作</h3>
      <div class="options-list">
        <button
          v-for="(option, index) in options"
          :key="index"
          @click="selectOption(option)"
          class="option-btn"
          :class="`option-${option.action}`"
        >
          <div class="option-label">{{ getActionLabel(option.action) }}</div>
          <div class="option-tiles">
            <TileComponent
              v-for="tile in option.tiles.slice(0, 3)"
              :key="tile.id"
              :tile="tile"
              :clickable="false"
            />
          </div>
        </button>
      </div>
      <button @click="skip" class="skip-btn">跳过</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MeldOption } from '../types/mahjong';
import TileComponent from './TileComponent.vue';

defineProps<{
  options: MeldOption[];
}>();

const emit = defineEmits<{
  select: [option: MeldOption];
  skip: [];
}>();

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    ron: '荣和',
    kan: '杠',
    pon: '碰',
    chi: '吃'
  };
  return labels[action] || action;
}

function selectOption(option: MeldOption) {
  emit('select', option);
}

function skip() {
  emit('skip');
}
</script>

<style scoped>
.meld-options-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.meld-options-panel {
  background: linear-gradient(135deg, rgba(30, 35, 45, 0.98) 0%, rgba(20, 25, 35, 0.98) 100%);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 215, 0, 0.3);
  min-width: 400px;
}

.meld-options-panel h3 {
  color: #ffd700;
  text-align: center;
  margin-bottom: 20px;
  font-size: 20px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(46, 125, 50, 0.2) 100%);
  border: 2px solid rgba(76, 175, 80, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.option-btn:hover {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(46, 125, 50, 0.3) 100%);
  border-color: rgba(76, 175, 80, 0.6);
  transform: translateY(-2px);
}

.option-ron {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 87, 34, 0.2) 100%);
  border-color: rgba(255, 152, 0, 0.4);
}

.option-ron:hover {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.3) 0%, rgba(255, 87, 34, 0.3) 100%);
  border-color: rgba(255, 152, 0, 0.6);
}

.option-label {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  min-width: 60px;
}

.option-tiles {
  display: flex;
  gap: 4px;
}

.skip-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #607d8b 0%, #455a64 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.skip-btn:hover {
  background: linear-gradient(135deg, #455a64 0%, #37474f 100%);
  transform: translateY(-2px);
}
</style>
