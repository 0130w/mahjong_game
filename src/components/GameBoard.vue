<template>
  <div class="game-board">
    <div v-if="gameStore.players.length >= 2" class="game-container">
      <!-- 对家副露区 - 左侧 -->
      <div class="meld-area meld-area-opponent">
        <OpponentMeldDisplay :melds="gameStore.players[PlayerID.PLAYER_1]!.melds" />
      </div>

      <!-- 玩家1 对家 - 上方 -->
      <div class="player-area player-top">
        <div class="player-section">
          <PlayerHand :player="gameStore.players[PlayerID.PLAYER_1]!"
            :isCurrentPlayer="gameStore.currentPlayerIndex === PlayerID.PLAYER_1" :showHand="false"
            :lastGetTile="gameStore.players[PlayerID.PLAYER_1]!.lastGetTile!" />
        </div>
        <div class="avatar-container opponent-avatar">
          <div class="avatar-frame">
            <img :src="opponentAvatar" alt="Opponent" />
          </div>
          <div class="avatar-name">{{ gameStore.players[PlayerID.PLAYER_1]!.name }}</div>
        </div>
      </div>

      <!-- 中间区域：舍牌池 -->
      <div class="center-area">
        <div class="table-surface">
          <div class="discard-pool-container">
            <div class="discard-section-main opponent-main">
              <div class="main-grid-tiles">
                <OpponentDiscardTile v-for="(tile, index) in opponentDiscardsMain" :key="`op-main-${index}`"
                  :tile="tile" :style="{ zIndex: 100 - index }" />
              </div>
            </div>
            <div class="table-middle-row">
              <div class="side-pool player-side">
                <PlayerDiscardTile v-for="(tile, index) in playerDiscardsSide" :key="`p0-side-${index}`" :tile="tile"
                  class="side-tile player-rotated" />
              </div>
              <div class="center-panel-wrapper">
                <GameInfoPanel :roundNumber="gameStore.roundNumber" :wallCount="gameStore.wall.length"
                  :playerName="humanPlayer.name" :playerScore="humanPlayer.score"
                  :opponentName="gameStore.players[PlayerID.PLAYER_1]!.name"
                  :opponentScore="gameStore.players[PlayerID.PLAYER_1]!.score" playerWind="東" opponentWind="南" />
              </div>
              <div class="side-pool opponent-side">
                <OpponentDiscardTile v-for="(tile, index) in opponentDiscardsSide" :key="`p1-side-${index}`"
                  :tile="tile" class="side-tile opponent-rotated" :style="{ zIndex: 100 - index }" />
              </div>
            </div>
            <div class="discard-section-main player-main">
              <div class="main-grid-tiles">
                <PlayerDiscardTile v-for="(tile, index) in playerDiscardsMain" :key="`p0-main-${index}`" :tile="tile" />
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
            <div class="avatar-container self-avatar">
              <div class="avatar-frame">
                <img :src="playerAvatar" alt="Me" />
              </div>
              <div class="avatar-name">{{ humanPlayer.name }}</div>
            </div>
            <PlayerHand :player="humanPlayer" :isCurrentPlayer="isHumanTurn" :showHand="true"
              :lastGetTile="humanPlayer.lastGetTile!" :selectedTile="selectedTile!" @tileClick="handleTileClick" />
            <div class="action-buttons">
              <!-- 展示切牌按钮 -->
              <div v-if="isHumanTurn && !humanPlayer.hasReaction()" class="discard-button"
                :class="{ disable: !selectedTile }" @click="handleDiscard">
                切牌
              </div>
              <!-- 展示碰按钮 -->
              <div v-if="isHumanTurn && humanPlayer.playerState.canPon" class="pon-button" @click="handlePon">
                碰
              </div>
              <!-- 展示杠按钮 -->
              <div v-if="isHumanTurn && humanPlayer.playerState.canKan" class="kan-button" @click="handleKan">
                杠
              </div>
              <!-- 展示暗杠按钮 -->
              <div v-if="isHumanTurn && humanPlayer.playerState.canAnKan
              " class="ankan-button" @click="handleAnKan">
                暗杠
              </div>
              <!-- 展示荣和按钮 -->
              <div v-if="isHumanTurn && humanPlayer.playerState.canRon" class="ron-button" @click="handleRon">
                和
              </div>
              <!-- 展示自摸按钮 -->
              <div v-if="isHumanTurn && humanPlayer.playerState.canTsumo" class="tsumo-button" @click="handleTsumo">
                自摸
              </div>
              <!-- 展示跳过按钮 -->
              <div v-if="isHumanTurn && humanPlayer.hasReaction()" class="skip-button" @click="handleSkip">
                跳过
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 局结算弹窗 -->
      <div v-if="gameStore.phase === 'finished' && gameStore.lastRoundResult" class="settlement-overlay">
        <div class="settlement-dialog">
          <h3> 第 {{ gameStore.roundNumber }} 局结算 </h3>
          <p v-if="gameStore.lastRoundResult.endType === 'ron'">
            {{ winnerName }} 荣和 {{ loserName }}
            <span>
              {{ gameStore.lastRoundResult.han }} 番
            </span>
          <ul v-if="gameStore.lastRoundResult.hanTypes && gameStore.lastRoundResult.hanTypes.length">
            <li v-for="hanType in gameStore.lastRoundResult.hanTypes" :key="hanType">
              {{ hanType }}
            </li>
          </ul>
          </p>

          <p v-else-if="gameStore.lastRoundResult.endType === 'tsumo'">
            {{ winnerName }} 自摸
            <span>
              {{ gameStore.lastRoundResult.han }} 番
            </span>
          <ul v-if="gameStore.lastRoundResult.hanTypes && gameStore.lastRoundResult.hanTypes.length">
            <li v-for="hanType in gameStore.lastRoundResult.hanTypes" :key="hanType">
              {{ hanType }}
            </li>
          </ul>

          </p>

          <p v-else-if="gameStore.lastRoundResult.endType === 'ryuukyoku'">
            流局
          </p>

          <button @click="handleNextRound"> 下一局 </button>
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
import GameInfoPanel from './GameInfoPanel.vue';

const gameStore = useGameStore();
const selectedTile = ref<Tile | null>(null);
const humanPlayer = computed(() => gameStore.players[PlayerID.PLAYER_0]!);
const isHumanTurn = computed(() => {
  return gameStore.currentPlayerIndex === PlayerID.PLAYER_0;
});
const currentPlayer = computed(() => {
  return gameStore.players[gameStore.currentPlayerIndex]!;
});
const MAIN_DISCARD_COUNT = 20;
const playerDiscardsMain = computed(() => {
  return (gameStore.players[0]?.discards || []).slice(0, MAIN_DISCARD_COUNT);
});
const playerDiscardsSide = computed(() => {
  return (gameStore.players[0]?.discards || []).slice(MAIN_DISCARD_COUNT);
});
const opponentDiscardsMain = computed(() => {
  return (gameStore.players[1]?.discards || []).slice(0, MAIN_DISCARD_COUNT);
});
const opponentDiscardsSide = computed(() => {
  return (gameStore.players[1]?.discards || []).slice(MAIN_DISCARD_COUNT);
});
const playerAvatar = computed(() => {
  return humanPlayer.value.avatar;
});
const opponentAvatar = computed(() => {
  return gameStore.players[PlayerID.PLAYER_1]!.avatar;
});

const handleTileClick = (tile: Tile) => {
  if (gameStore.currentPlayerIndex !== 0) return;
  selectedTile.value = tile;
};

const handleDiscard = () => {
  if (!isHumanTurn.value) {
    return;
  }
  if (!selectedTile.value) {
    return;
  }
  const tileDiscard = selectedTile.value;
  if (!tileDiscard) {
    return;
  }
  selectedTile.value = null;
  currentPlayer.value.emitAction({ type: 'discard', tile: tileDiscard });
}

const handlePon = () => {
  currentPlayer.value.emitAction({ type: 'pon' });
}

const handleKan = () => {
  const opponent = gameStore.players[PlayerID.PLAYER_1];
  const me = humanPlayer.value;

  if (opponent && opponent.lastDiscardTile) {
    currentPlayer.value.emitAction({ 
      type: 'kan', 
      tile: opponent.lastDiscardTile 
    });
    return;
  }

  let targetTile: Tile | null = null;

  if (selectedTile.value) {
    const canKanThis = me.melds.some(m => 
      m.type === 'pon' && m.tile.type === selectedTile.value!.type && m.tile.value === selectedTile.value!.value
    );
    
    if (canKanThis) {
      targetTile = selectedTile.value;
    }
  }

  if (!targetTile) {
    targetTile = me.hand.find(h => 
      me.melds.some(m => m.type === 'pon' && m.tile.type === h.type && m.tile.value === h.value)
    ) || null;
  }

  if (targetTile) {
    currentPlayer.value.emitAction({ type: 'kan', tile: targetTile });
    selectedTile.value = null; // 杠完清空选中状态
  } else {
    console.warn("未找到可以杠的牌，请先选中要杠的手牌");
  }
}

const handleAnKan = () => {
  currentPlayer.value.emitAction({ type: 'ankan' });
}

const handleRon = () => {
  currentPlayer.value.emitAction({ type: 'ron' });
}

const handleTsumo = () => {
  currentPlayer.value.emitAction({ type: 'tsumo' });
}

const handleSkip = () => {
  currentPlayer.value.emitAction({ type: 'skip' });
}

const winnerName = computed(() => {
  return gameStore.players[gameStore.lastRoundResult?.winnerId!]?.name;
});

const loserName = computed(() => {
  return gameStore.players[gameStore.lastRoundResult?.loserId!]?.name;
});

const handleNextRound = () => {
  gameStore.nextRound();
};
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 20px;
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

.meld-area {
  position: absolute;
  z-index: 15;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.meld-area-opponent {
  left: 20px;
  top: 50%;
  transform: translateY(-50%) rotate(180deg);
}

.meld-area-self {
  right: 20px;
  bottom: 140px;
}

.player-area {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.player-top {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.player-bottom {
  position: relative;
  bottom: auto;
  left: auto;
  transform: none;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 20;
}

.center-area {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  z-index: 5;
  padding: 10px 0;
}

.table-surface {
  transform: scale(0.9);
  width: auto;
}

@media (min-height: 950px) {
  .table-surface {
    transform: scale(1);
  }
}

.discard-pool-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.discard-section-main {
  display: flex;
  justify-content: center;
  width: 100%;
}

.main-grid-tiles {
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 2px;
  justify-content: center;
}

.opponent-main {
  transform: rotate(180deg);
  z-index: 1;
}

.table-middle-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  height: 260px;
  align-items: center;
  gap: 0;
  width: 100%;
}

.center-panel-wrapper {
  grid-column: 2;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 50px;
}

.side-pool {
  display: grid;
  grid-template-rows: repeat(5, auto);
  grid-auto-flow: column;
  gap: 0px 10px;
  align-content: center;
  height: 100%;
  width: 100%;
}

.player-side {
  grid-column: 1;
  direction: rtl;
  justify-content: end;
}

.opponent-side {
  grid-column: 3;
  direction: ltr;
  justify-content: start;
}

:deep(.player-rotated),
.player-rotated {
  transform: rotate(90deg);
  transform-origin: center center;
  margin: -4px 0;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  display: block;
  position: relative;
}

:deep(.opponent-rotated),
.opponent-rotated {
  transform: rotate(-90deg) scaleY(-1);
  transform-origin: center center;
  margin: -4px 0;
  box-shadow: -2px 2px 5px rgba(0, 0, 0, 0.2);
  display: block;
  position: relative;
}

@media screen and (max-height: 900px) {
  .table-middle-row {
    height: 200px;
  }

  .center-panel-wrapper {
    padding: 0 30px;
  }
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

.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding-top: 4px;
  min-width: 72px;
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

.discard-button.disable {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: none;
}

.discard-button,
.pon-button,
.kan-button,
.ankan-button,
.ron-button,
.tsumo-button,
.skip-button {
  width: 90px;
  height: 36px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}

.discard-button:hover,
.pon-button:hover,
.kan-button:hover,
.ankan-button:hover,
.ron-button:hover,
.tsumo-button:hover,
.skip-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
  filter: brightness(1.05);
}

.discard-button {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

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

.skip-button {
  background: linear-gradient(135deg, #9e9e9e 0%, #616161 100%);
}

.settlement-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settlement-dialog {
  background: #222;
  color: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  min-width: 260px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.settlement-dialog button {
  margin-top: 16px;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background: #4caf50;
  color: #fff;
  cursor: pointer;
}

/* 对家布局：横向排列，垂直居中 */
.opponent-layout {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* 这里的对齐方式决定了头像是和手牌顶部对齐还是居中 */
  gap: 20px;
}

/* 调整自家控制区布局，防止头像挤压手牌 */
.player-with-controls {
  /* 原有样式保持，flex-direction 默认是 row */
  align-items: flex-end;
  /* 让头像底部和手牌底部对齐，或者用 center */
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 30;
  width: 100px;
  /* 头像区域宽度 */
}

/* 自家头像微调 */
.self-avatar {
  margin-right: 15px;
  margin-bottom: 5px;
  /* 稍微抬高一点 */
}

/* 对家头像微调 */
.opponent-avatar {
  margin-left: 15px;
  margin-top: 5px;
}

.avatar-frame {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  /* 圆角矩形，也可以用 50% 变成圆形 */
  background: rgba(20, 30, 40, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

/* 图片样式 */
.avatar-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 名字标签 */
.avatar-name {
  margin-top: 5px;
  font-size: 14px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 8px;
  border-radius: 4px;
}

/* --- 动态效果 --- */

/* 当前轮到自己时，头像框发蓝光 */
.player-bottom .avatar-frame {
  border-color: rgba(33, 150, 243, 0.6);
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.3);
}

/* 当前轮到对家时，对家头像框发红/橙光 */
/* 这里假设你能通过 class 或 store 判断对家回合，
   如果没有专门的类，这只是个静态样式，你可以通过 :class 动态绑定 */
.player-top .avatar-frame {
  border-color: rgba(255, 87, 34, 0.6);
  box-shadow: 0 0 15px rgba(255, 87, 34, 0.3);
}

/* 简单的呼吸灯动画，让头像框看起来是活的 */
@keyframes avatar-pulse {
  0% {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }

  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }

  100% {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }
}

.avatar-frame:hover {
  transform: scale(1.05);
  border-color: #fff;
}
</style>
