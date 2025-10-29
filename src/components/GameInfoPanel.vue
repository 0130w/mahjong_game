<template>
  <div class="game-info-panel">
    <div class="info-container">
      <div class="info-row opponent-score">
        <span class="score-value">{{ opponentScore }}</span>
      </div>
      <div class="wind-box opponent-wind" :class="{ 'is-dealer': opponentWind === '東' }">{{ opponentWind }}</div>
    </div>
    <div class="info-divider"></div>
    <div class="info-row round-info">
      <span class="info-label">东{{ roundNumber }}局</span>
    </div>
    <div class="info-row wall-info">
      <span class="info-label">余牌</span>
      <span class="info-value">{{ wallCount }}</span>
    </div>
    <div class="info-divider"></div>
    <div class="info-container">
      <div class="wind-box player-wind" :class="{ 'is-dealer': playerWind === '東' }">{{ playerWind }}</div>
      <div class="info-row player-score">
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
  width: 300px;
  height: 260px;
  background: linear-gradient(135deg, rgba(30, 35, 45, 0.95) 0%, rgba(20, 25, 35, 0.95) 100%);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 4px solid rgba(255, 215, 0, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(255, 215, 0, 0.2),
    inset 0 2px 10px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);

  /* --- 关键新增行 --- */
  /* 这会创建3D透视效果并将面板向后倾斜 */
  transform: perspective(1000px) rotateX(45deg);
  /* ------------------- */
}
.info-container {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
}

.wind-box {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
  transition: background 0.3s ease;
}

.wind-box.is-dealer {
  background: rgba(139, 0, 0, 0.8);
  border-color: rgba(220, 20, 60, 0.6);
}

.opponent-wind {
  transform: rotateX(180deg);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  gap: 10px;
}

.info-row.round-info {
  justify-content: center;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%);
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.info-row.round-info .info-label {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
}

.info-row.wall-info {
  justify-content: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.info-row.wall-info .info-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.info-row.wall-info .info-value {
  font-size: 18px;
  font-weight: bold;
  color: #4caf50;
  text-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.info-divider {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%);
  margin: 2px 0;
}

.info-row.player-score,
.info-row.opponent-score {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: center;
  width: 100px;
}

.info-row.opponent-score {
  transform: rotateX(180deg);
}

.player-name {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.score-value {
  font-size: 17px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
