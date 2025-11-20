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
            :class="{ disable: !selectedTile }" @click="handleDiscard">
            切牌
          </div>
          <!-- 展示碰按钮 -->
          <div
            v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canPon"
            class="pon-button" @click="handlePon">
            碰
          </div>
          <!-- 展示杠按钮 -->
          <div
            v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canKan"
            class="kan-button" @click="handleKan">
          </div>
          <!-- 展示暗杠按钮 -->
          <div v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canAnKan
          " class="ankan-button" @click="handleAnKan">
          </div>
          <!-- 展示荣和按钮 -->
          <div
            v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canRon"
            class="ron-button" @click="handleRon"> </div>
          <!-- 展示自摸按钮 -->
          <div
            v-if="gameStore.currentPlayerIndex === PlayerID.PLAYER_0 && gameStore.players[PlayerID.PLAYER_0]?.playerState.canTsumo"
            class="tsumo-button" @click="handleTsumo"> </div>
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
import { sortHand } from '../utils/tiles';

const gameStore = useGameStore();
const selectedTile = ref<Tile | null>(null);

const handleTileClick = (tile: Tile) => {
  if (gameStore.currentPlayerIndex !== 0) return;
  selectedTile.value = tile;
};

const handleDiscard = () => {
  if (!selectedTile.value) return;
  const player = gameStore.players[gameStore.currentPlayerIndex]!;
  player.handleDiscard(selectedTile.value);
  player.hand = sortHand(player.hand);
  player.emitAction('discard');
  selectedTile.value = null;
}

const handlePon = () => {
  gameStore.players[gameStore.currentPlayerIndex]!.handlePon(
    gameStore.players[gameStore.currentPlayerIndex]!.lastDiscardTile!
  );
  gameStore.players[gameStore.currentPlayerIndex]!.emitAction('pon');
}

const handleKan = () => {
  gameStore.players[gameStore.currentPlayerIndex]!.handleKan(
    gameStore.players[gameStore.currentPlayerIndex]!.lastDiscardTile!
  );
  gameStore.players[gameStore.currentPlayerIndex]!.emitAction('kan');
}

const handleAnKan = () => {
  gameStore.players[gameStore.currentPlayerIndex]!.handleAnKan();
  gameStore.players[gameStore.currentPlayerIndex]!.emitAction('ankan');
}

const handleRon = () => {
  gameStore.players[gameStore.currentPlayerIndex]!.handleRon(
    gameStore.players[gameStore.currentPlayerIndex]!.lastDiscardTile!
  );
  gameStore.players[gameStore.currentPlayerIndex]!.emitAction('ron');
}

const handleTsumo = () => {
  gameStore.players[gameStore.currentPlayerIndex]!.handleTsumo();
  gameStore.players[gameStore.currentPlayerIndex]!.emitAction('tsumo');
}

const isPlayerHandClickable = computed(() => {
  return gameStore.currentPlayerIndex === PlayerID.PLAYER_0
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
.opponent-discards .discard-tiles> * {
  position: relative;
}

.table-center {
  order: 2;
  flex-shrink: 0;
  z-index: 1;
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

.discard-button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border: 3px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.discard-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(33, 150, 243, 0.8);
}

/* 禁用状态（selectedTile 为空时加的 disable class） */
.discard-button.disable {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.pon-button,
.kan-button,
.ankan-button,
.ron-button,
.tsumo-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 各自颜色： */
.pon-button {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.kan-button {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.ankan-button {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
}

.ron-button {
  background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
}

.tsumo-button {
  background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
}

/* 悬浮通用效果 */
.pon-button:hover,
.kan-button:hover,
.ankan-button:hover,
.ron-button:hover,
.tsumo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}
</style>
