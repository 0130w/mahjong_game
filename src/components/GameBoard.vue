<template>
  <div class="game-board">
    <div class="game-container">
      <!-- 对家副露区 - 左侧 -->
      <div class="meld-area meld-area-opponent">
        <OpponentMeldDisplay :melds="gameStore.players[PlayerID.PLAYER_1]!.melds" />
      </div>

      <!-- 玩家1 对家 - 上方 -->
      <div class="player-area player-top">
        <div class="player-section">
          <PlayerHand :player="gameStore.players[PlayerID.PLAYER_1]!"
            :isCurrentPlayer="gameStore.currentPlayerIndex === PlayerID.PLAYER_1" :showHand="false" />
        </div>
      </div>

      <!-- 中间区域：舍牌池 -->
      <div class="center-area">
        <div class="table-surface">
          <div class="discard-pool">
            <div class="discard-section opponent-discards">
              <div class="discard-tiles">
                <OpponentDiscardTile v-for="(tile, index) in gameStore.players[1]!.discards"
                  :key="`p1-discard-${index}`" :tile="tile" />
              </div>
            </div>

            <div class="table-center">
            </div>

            <div class="discard-section player-discards">
              <div class="discard-tiles">
                <PlayerDiscardTile v-for="(tile, index) in gameStore.players[0]!.discards" :key="`p0-discard-${index}`"
                  :tile="tile" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自家副露区 - 右侧 -->
      <div class="meld-area meld-area-self">
        <PlayerMeldDisplay :melds="gameStore.players[PlayerID.PLAYER_0]!.melds" />
      </div>

      <!-- 玩家1（你）- 下方 -->
      <div class="player-area player-bottom">
        <div class="player-section">
          <div class="player-with-controls">
            <PlayerHand :player="gameStore.players[PlayerID.PLAYER_0]!" :isCurrentPlayer="isPlayerHandClickable"
              :showHand="true" @tileClick="handleTileClick" />
          </div>
          <!-- 展示切牌按钮 -->
          <div v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0" class="discard-button"
            :class="{ disable: !selectedTile }" @click="handleDiscard"> </div>
          <!-- 展示碰按钮 -->
          <div
            v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canPon"
            class="pon-button" @click="handlePon">
          </div>
          <!-- 展示杠按钮 -->>
          <div
            v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canKan"
            class="kan-button" @click="handleKan">
          </div>
          <!-- 展示暗杠按钮 -->>
          <div v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canAnKan
          " class="ankan-button" @click="handleAnKan">
          </div>
          <!-- 展示荣和按钮 -->>
          <div v-if="gameStore.players[PlayerID.PLAYER_0]?.playerState.canRon"> </div>
          <!-- 展示自摸按钮 -->
          <div v-if="gameStore.players[PlayerID.PLAYER_0]?.playerState.canTsumo"> </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import PlayerHand from './PlayerHand.vue';
import PlayerDiscardTile from './PlayerDiscardTile.vue';
import OpponentDiscardTile from './OpponentDiscardTile.vue';
import PlayerMeldDisplay from './PlayerMeldDisplay.vue';
import OpponentMeldDisplay from './OpponentMeldDisplay.vue';
import type { Tile } from '../utils/define';
import { PlayerID } from '../utils/define';

const gameStore = useGameStore();
const selectedTile = ref<Tile>() || null;

const handleTileClick = (tile: Tile) => {
  if (gameStore.currentPlayerIndex !== 0) return;
  selectedTile.value = tile;
};

const handleDiscard = () => {
  if (!selectedTile.value) return;
  gameStore.players[gameStore.currentPlayerIndex]!.handleDiscard(selectedTile.value);
  selectedTile.value = undefined;
}

const handlePon = () => {
}

const handleKan = () => {
  // gameStore.players[gameStore.currentPlayerIndex]!.handleKan();
}

const handleAnKan = () => {
  gameStore.players[gameStore.currentPlayerIndex]!.handleAnKan();
}

const isPlayerHandClickable = computed(() => {
  return gameStore.currentPlayerIndex === 0
});

</script>

<style scoped>
.game-board {
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background:
    radial-gradient(ellipse at center, rgba(30, 40, 50, 1) 0%, rgba(15, 20, 25, 1) 100%),
    linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%);
  background-attachment: fixed;
  overflow: hidden;
  position: relative;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

/* 星空背景效果 */
.game-board::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 80% 10%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(2px 2px at 90% 60%, rgba(255, 255, 255, 0.2), transparent);
  background-size: 200% 200%;
  animation: stars 20s linear infinite;
  pointer-events: none;
  opacity: 0.5;
}

@keyframes stars {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 100% 100%;
  }
}

/* 游戏容器 */
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 牌布铺满整个游戏区域 */
.game-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, #1a4d2e 0%, #0f2818 100%);
  box-shadow:
    inset 0 0 100px rgba(0, 0, 0, 0.4);
  z-index: 0;
}

/* 牌布纹理 */
.game-container::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 2px,
      transparent 4px),
    repeating-linear-gradient(90deg,
      transparent 0px,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 2px,
      transparent 4px);
  pointer-events: none;
  z-index: 0;
}

/* 副露区域 - 独立定位 */
.meld-area {
  position: absolute;
  z-index: 15;
  top: 50%;
  transform: translateY(-50%);
}

.meld-area-opponent {
  left: 20px;
}

.meld-area-self {
  right: 20px;
  bottom: 140px;
  top: auto;
  transform: none;
}

.player-area {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.player-top {
  position: absolute;
  top: 20px;
  left: 60%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
}

.player-bottom {
  position: absolute;
  bottom: 20px;
  left: 40%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
}

/* 中间桌面区域 - 舍牌池 */
.center-area {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 900px;
  z-index: 5;
}

.table-surface {
  width: 100%;
  height: auto;
  min-height: 300px;
  background: transparent;
  position: relative;
}

.discard-pool {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
  position: relative;
  min-height: 300px;
  gap: 0;
}

.discard-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 100%;
}

.opponent-discards {
  order: 1;
  transform: rotate(180deg);
}

.player-discards {
  order: 3;
}

.discard-tiles {
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 2px;
  justify-content: center;
  align-content: flex-start;
  width: auto;
  max-width: 700px;
  padding: 0px;
  background: transparent;
  min-height: 80px;
}

/* 对手舍牌区 - 反转z-index，让上面的行覆盖下面的行 */
.opponent-discards .discard-tiles>* {
  position: relative;
}

.opponent-discards .discard-tiles>*:nth-child(1) {
  z-index: 100;
}

.opponent-discards .discard-tiles>*:nth-child(2) {
  z-index: 99;
}

.opponent-discards .discard-tiles>*:nth-child(3) {
  z-index: 98;
}

.opponent-discards .discard-tiles>*:nth-child(4) {
  z-index: 97;
}

.opponent-discards .discard-tiles>*:nth-child(5) {
  z-index: 96;
}

.opponent-discards .discard-tiles>*:nth-child(6) {
  z-index: 95;
}

.opponent-discards .discard-tiles>*:nth-child(7) {
  z-index: 94;
}

.opponent-discards .discard-tiles>*:nth-child(8) {
  z-index: 93;
}

.opponent-discards .discard-tiles>*:nth-child(9) {
  z-index: 92;
}

.opponent-discards .discard-tiles>*:nth-child(10) {
  z-index: 91;
}

.opponent-discards .discard-tiles>*:nth-child(11) {
  z-index: 90;
}

.opponent-discards .discard-tiles>*:nth-child(12) {
  z-index: 89;
}

.opponent-discards .discard-tiles>*:nth-child(13) {
  z-index: 88;
}

.opponent-discards .discard-tiles>*:nth-child(14) {
  z-index: 87;
}

.opponent-discards .discard-tiles>*:nth-child(15) {
  z-index: 86;
}

.opponent-discards .discard-tiles>*:nth-child(16) {
  z-index: 85;
}

.opponent-discards .discard-tiles>*:nth-child(17) {
  z-index: 84;
}

.opponent-discards .discard-tiles>*:nth-child(18) {
  z-index: 83;
}

.opponent-discards .discard-tiles>*:nth-child(19) {
  z-index: 82;
}

.opponent-discards .discard-tiles>*:nth-child(20) {
  z-index: 81;
}

.table-center {
  order: 2;
  flex-shrink: 0;
  z-index: 1;
}

.game-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(30, 35, 45, 0.98) 0%, rgba(20, 25, 35, 0.98) 100%);
  padding: 15px 30px;
  border-radius: 16px;
  text-align: center;
  max-width: 700px;
  width: 90%;
  max-height: 200px;
  overflow-y: auto;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 215, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  z-index: 999;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.info-text {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
}

.hint-text {
  font-size: 14px;
  color: #4caf50;
  margin-bottom: 10px;
  font-weight: 600;
  background: rgba(76, 175, 80, 0.15);
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid rgba(76, 175, 80, 0.4);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
}

.turn-indicator {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 10px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%);
  border-radius: 10px;
  border: 2px solid rgba(255, 193, 7, 0.5);
  box-shadow:
    0 4px 15px rgba(255, 193, 7, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: pulse-glow 2s infinite;
  text-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

@keyframes pulse-glow {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  50% {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(255, 193, 7, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
}

.guessed-display,
.drawn-display {
  margin: 15px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(46, 125, 50, 0.15) 100%);
  border-radius: 16px;
  border: 2px solid rgba(76, 175, 80, 0.4);
  box-shadow:
    0 4px 20px rgba(76, 175, 80, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.guessed-display p,
.drawn-display p {
  margin: 0 0 12px 0;
  font-weight: bold;
  font-size: 16px;
  color: #4caf50;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.guess-tiles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 20px 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin: 5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(33, 150, 243, 0.5);
}

.btn-secondary {
  background: linear-gradient(135deg, #607d8b 0%, #455a64 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #455a64 0%, #37474f 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(96, 125, 139, 0.5);
}

.btn-success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.5);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-warning:hover:not(:disabled) {
  background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 152, 0, 0.5);
}

/* 玩家区域和手牌控制 */
.player-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.player-with-controls {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  position: relative;
}

.hand-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 25px;
  /* 对齐手牌区域 */
}

.btn-hand-action {
  min-width: 60px;
  padding: 12px 20px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  letter-spacing: 2px;
}

.btn-hand-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-discard {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-discard:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.6);
}

.btn-ready {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: pulse-ready 2s infinite;
}

@keyframes pulse-ready {

  0%,
  100% {
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }

  50% {
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.8);
  }
}

.btn-ready:hover:not(:disabled) {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  transform: translateY(-2px);
}

.btn-skip {
  background: linear-gradient(135deg, #607d8b 0%, #455a64 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-size: 14px;
  padding: 8px 16px;
}

.btn-skip:hover:not(:disabled) {
  background: linear-gradient(135deg, #455a64 0%, #37474f 100%);
  transform: translateY(-2px);
}

/* 最后打出的牌高亮效果 */
:deep(.last-discarded) {
  animation: highlight-discard 0.8s ease-in-out;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4) !important;
  border: 2px solid rgba(255, 215, 0, 0.8) !important;
  transform: scale(1.1);
  z-index: 10;
  position: relative;
}

@keyframes highlight-discard {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4);
  }

  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.6);
  }
}

/* 副露动作区域 */
.meld-actions-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideInRight 0.3s ease-out;
}

.meld-buttons-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.chi-hint {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
  text-align: center;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 193, 7, 0.2) 100%);
  border-radius: 8px;
  border: 2px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.2);
}

.btn-meld {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-meld:hover:not(:disabled) {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.6);
}

.btn-meld:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: linear-gradient(135deg, #607d8b 0%, #455a64 100%);
}

.btn-meld.is-active {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
  border-color: rgba(76, 175, 80, 0.8);
  animation: pulse-active 1s infinite;
}

@keyframes pulse-active {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
  }

  50% {
    box-shadow: 0 0 30px rgba(76, 175, 80, 1);
  }
}

.btn-meld .hint-text {
  display: block;
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.9;
}

.btn-meld-ron {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%) !important;
  border-color: rgba(255, 152, 0, 0.5) !important;
  animation: pulse-ron 1.5s infinite;
}

@keyframes pulse-ron {

  0%,
  100% {
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
  }

  50% {
    box-shadow: 0 4px 20px rgba(255, 152, 0, 0.8);
  }
}

.btn-skip-meld {
  background: linear-gradient(135deg, #607d8b 0%, #455a64 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(96, 125, 139, 0.3);
}

.btn-skip-meld:hover {
  background: linear-gradient(135deg, #455a64 0%, #37474f 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(96, 125, 139, 0.5);
}
</style>
