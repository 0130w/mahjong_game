<template>
  <div class="game-info-panel">
    <!-- 上方：对家信息 -->
    <div class="info-row info-row-top">
      <div class="name-score">
        <span class="name-text">{{ opponentName }}</span>
        <span class="score-value">{{ opponentScore }}</span>
      </div>
      <div v-if="opponentWind" class="wind-box" :class="{ 'is-dealer': opponentWind === '東' }">
        {{ opponentWind }}
      </div>
    </div>

    <div class="info-divider"></div>

    <!-- 中间：局数 + 余牌 -->
    <div class="center-info">
      <div class="round-info">
        <span class="round-text">东 {{ roundNumber }} 局</span>
      </div>
      <div class="wall-info">
        <span class="wall-label">余牌</span>
        <span class="wall-count">{{ wallCount }}</span>
      </div>
    </div>

    <div class="info-divider"></div>

    <!-- 下方：自家信息 -->
    <div class="info-row info-row-bottom">
      <div v-if="playerWind" class="wind-box" :class="{ 'is-dealer': playerWind === '東' }">
        {{ playerWind }}
      </div>
      <div class="name-score">
        <span class="name-text">{{ playerName }}</span>
        <span class="score-value">{{ playerScore }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  roundNumber: number;
  wallCount: number;
  playerName: string;
  playerScore: number;
  opponentName: string;
  opponentScore: number;
  playerWind: string;
  opponentWind: string;
}>();
</script>

<style scoped>
.game-info-panel {
  width: 260px;
  background: linear-gradient(135deg, rgba(30, 35, 45, 0.96) 0%, rgba(20, 25, 35, 0.96) 100%);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 2px solid rgba(255, 215, 0, 0.5);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(255, 215, 0, 0.25);
}

/* 上下两行：对家 / 自家 */
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name-score {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.score-value {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.wind-box {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  background: rgba(255, 255, 255, 0.06);
}

.wind-box.is-dealer {
  background: rgba(139, 0, 0, 0.85);
  border-color: rgba(220, 20, 60, 0.7);
}

.info-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.5) 50%, transparent 100%);
}

/* 中间区域：局数 + 余牌 */
.center-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.round-info {
  padding: 4px 10px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.18) 0%, rgba(255, 152, 0, 0.2) 100%);
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.round-text {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  letter-spacing: 2px;
}

.wall-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.wall-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

.wall-count {
  font-size: 16px;
  font-weight: bold;
  color: #4caf50;
  text-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}
</style>