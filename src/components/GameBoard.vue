<template>
  <div class="game-board">
    <div class="game-container">
      <!-- 玩家2（对手）- 上方 -->
      <div class="player-area player-top">
        <PlayerHand 
          :player="gameStore.players[1]!" 
          :isCurrentPlayer="gameStore.currentPlayerIndex === 1"
          :showHand="false"
        />
      </div>

      <!-- 中间区域：舍牌池 -->
      <div class="center-area">
        <div class="table-surface">
          <div class="discard-pool">
            <div class="discard-section opponent-discards">
              <div class="discard-tiles">
                <OpponentDiscardTile
                  v-for="(tile, index) in gameStore.players[1]!.discards"
                  :key="`p1-discard-${index}`"
                  :tile="tile"
                />
              </div>
            </div>
            
            <div class="table-center">
              <GameInfoPanel
                :roundNumber="gameStore.roundNumber"
                :wallCount="gameStore.wall.length"
                :playerName="gameStore.players[0]?.name || '玩家'"
                :playerScore="gameStore.players[0]?.score || 0"
                :opponentName="gameStore.players[1]?.name || 'AI'"
                :opponentScore="gameStore.players[1]?.score || 0"
                :playerWind="gameStore.players[0]?.isDealer ? '東' : '南'"
                :opponentWind="gameStore.players[1]?.isDealer ? '東' : '南'"
              />
            </div>
            
            <div class="discard-section player-discards">
              <div class="discard-tiles">
                <PlayerDiscardTile
                  v-for="(tile, index) in gameStore.players[0]!.discards"
                  :key="`p0-discard-${index}`"
                  :tile="tile"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 玩家1（你）- 下方 -->
      <div class="player-area player-bottom">
        <div class="player-with-controls">
          <PlayerHand 
            :player="gameStore.players[0]!" 
            :isCurrentPlayer="gameStore.currentPlayerIndex === 0"
            :showHand="true"
            @tileClick="handleTileClick"
          />
          
          <!-- 手牌右侧的操作按钮 -->
          <div class="hand-controls" v-if="gameStore.currentPlayerIndex === 0">
            <button 
              v-if="gameStore.phase === 'playing' && gameStore.players[0]!.hand.length === 14 && !gameStore.canDeclareReady"
              @click="discardSelectedTile" 
              class="btn-hand-action btn-discard"
              :disabled="!selectedTileId"
            >
              切
            </button>
            <button 
              v-if="gameStore.phase === 'playing' && gameStore.canDeclareReady"
              @click="declareReadyWithDiscard" 
              class="btn-hand-action btn-ready"
              :disabled="!selectedTileId"
            >
              听牌
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏控制区（简化，只显示重要信息） -->
    <div class="game-controls" v-if="gameStore.phase !== 'playing' && gameStore.phase !== 'can_declare_ready'">
      <div v-if="gameStore.phase === 'draw_four'">
        <p class="info-text">对手猜牌失败！</p>
        <p class="hint-text">听牌者摸4张牌，检查是否自摸</p>
        
        <!-- 显示上一轮猜测的牌（如果有） -->
        <div v-if="gameStore.guessedTiles.length > 0" class="guessed-display">
          <p>上一轮猜测的牌：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in gameStore.guessedTiles"
              :key="tile.id"
              :tile="tile"
            />
          </div>
        </div>
        
        <!-- 显示上一轮摸到的4张牌（如果有） -->
        <div v-if="gameStore.drawnFourTiles.length > 0" class="drawn-display">
          <p>上一轮摸到的4张牌：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in gameStore.drawnFourTiles"
              :key="tile.id"
              :tile="tile"
            />
          </div>
        </div>
        
        <button 
          v-if="gameStore.readyPlayerIndex === 0" 
          @click="drawFourTiles" 
          class="btn btn-primary"
        >
          摸4张牌
        </button>
        <p v-else>等待对手摸牌...</p>
      </div>

      <div v-else-if="gameStore.phase === 'ready_declared'">
        <p class="info-text">{{ gameStore.readyPlayer?.name }} 已宣告听牌！</p>
        <p class="hint-text">{{ gameStore.readyPlayerIndex === 0 ? '等待对手猜牌...' : '请猜测听牌的牌型' }}</p>
        
        <!-- 显示摸到的4张牌 -->
        <div v-if="gameStore.drawnFourTiles.length > 0" class="drawn-display">
          <p>摸到的4张牌：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in gameStore.drawnFourTiles"
              :key="tile.id"
              :tile="tile"
            />
          </div>
        </div>
        
        <!-- 显示已猜测的牌 -->
        <div v-if="gameStore.guessedTiles.length > 0" class="guessed-display">
          <p>猜测的牌：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in gameStore.guessedTiles"
              :key="tile.id"
              :tile="tile"
            />
          </div>
        </div>
        
        <div v-if="gameStore.readyPlayerIndex === 1">
          <!-- 玩家2听牌，玩家1猜牌 -->
          <p>请选择2张牌进行猜测：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in availableTiles"
              :key="tile.id"
              :tile="tile"
              :isSelected="guessedTileIds.includes(tile.id)"
              :clickable="true"
              @click="toggleGuessTile(tile)"
            />
          </div>
          <button 
            @click="submitGuess" 
            class="btn btn-warning"
            :disabled="guessedTileIds.length !== 2"
          >
            确认猜测
          </button>
        </div>
        <div v-else>
          <!-- 玩家1听牌，等待AI猜牌 -->
          <p>等待对手猜牌...</p>
        </div>
      </div>

      <div v-else-if="gameStore.phase === 'finished'">
        <p class="info-text">本局结束</p>
        
        <!-- 显示猜测的牌（如果有） -->
        <div v-if="gameStore.guessedTiles.length > 0" class="guessed-display">
          <p>最后猜测的牌：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in gameStore.guessedTiles"
              :key="tile.id"
              :tile="tile"
            />
          </div>
        </div>
        
        <!-- 显示摸到的4张牌（如果有） -->
        <div v-if="gameStore.drawnFourTiles.length > 0" class="drawn-display">
          <p>摸到的4张牌：</p>
          <div class="guess-tiles">
            <TileComponent
              v-for="tile in gameStore.drawnFourTiles"
              :key="tile.id"
              :tile="tile"
            />
          </div>
        </div>
        
        <button @click="nextRound" class="btn btn-primary">下一局</button>
        <button @click="startGame" class="btn btn-secondary">重新开始</button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import PlayerHand from './PlayerHand.vue';
import TileComponent from './TileComponent.vue';
import PlayerDiscardTile from './PlayerDiscardTile.vue';
import OpponentDiscardTile from './OpponentDiscardTile.vue';
import GameInfoPanel from './GameInfoPanel.vue';
import type { Tile } from '../types/mahjong';
import { createFullWall } from '../utils/tiles';

const router = useRouter();
const gameStore = useGameStore();
const selectedTileId = ref<string | null>(null);
const guessedTileIds = ref<string[]>([]);

const backToStart = () => {
  router.push('/');
};

const isReadyPlayer = computed(() => gameStore.readyPlayerIndex === 0);

const phaseText = computed(() => {
  const phases: Record<string, string> = {
    initial: '未开始',
    playing: '进行中',
    can_declare_ready: '可宣告听牌',
    draw_four: '摸4张牌',
    ready_declared: '猜牌中',
    finished: '已结束'
  };
  return phases[gameStore.phase] || gameStore.phase;
});

const availableTiles = computed(() => {
  // 获取所有可能的牌（去重）
  const allTiles = createFullWall();
  const uniqueTiles: Tile[] = [];
  const seen = new Set<string>();
  
  for (const tile of allTiles) {
    const key = `${tile.type}-${tile.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTiles.push(tile);
    }
  }
  
  return uniqueTiles;
});

const startGame = () => {
  gameStore.startNewGame();
  selectedTileId.value = null;
  guessedTileIds.value = [];
};

// AI逻辑已经在 gameStore 的 opponentAutoPlay 中处理

// AI猜牌
const aiGuess = () => {
  if (gameStore.readyPlayerIndex === 0 && gameStore.phase === 'ready_declared') {
    // AI随机选择2张牌猜测
    setTimeout(() => {
      const tiles = availableTiles.value;
      const randomTiles = [];
      const usedIndices = new Set<number>();
      
      while (randomTiles.length < 2) {
        const randomIndex = Math.floor(Math.random() * tiles.length);
        if (!usedIndices.has(randomIndex)) {
          usedIndices.add(randomIndex);
          randomTiles.push(tiles[randomIndex]!);
        }
      }
      
      gameStore.guessTiles(randomTiles);
    }, 1000);
  }
};

// AI摸4张牌
const aiDrawFour = () => {
  if (gameStore.readyPlayerIndex === 1 && gameStore.phase === 'draw_four') {
    setTimeout(() => {
      gameStore.drawFourTiles();
    }, 1000);
  }
};

// 监听回合变化，触发AI操作
// AI 打牌逻辑已经在 gameStore.startNewTurn() 中自动触发

// 监听游戏阶段变化，触发AI操作
watch(() => gameStore.phase, (newPhase) => {
  if (newPhase === 'draw_four') {
    // 进入摸4张牌阶段
    if (gameStore.readyPlayerIndex === 1) {
      // AI听牌，自动摸4张牌
      aiDrawFour();
    }
    // 如果是玩家听牌，等待玩家点击按钮摸牌
  } else if (newPhase === 'ready_declared') {
    // 进入猜牌阶段
    if (gameStore.readyPlayerIndex === 1) {
      // 对手听牌，玩家需要猜牌（等待玩家操作）
    } else if (gameStore.readyPlayerIndex === 0) {
      // 玩家听牌，AI自动猜牌（已在 declareReadyWithDiscard 中触发）
    }
  }
});

const handleTileClick = (tileId: string) => {
  if (gameStore.currentPlayerIndex === 0) {
    selectedTileId.value = tileId;
  }
};

const discardSelectedTile = () => {
  if (selectedTileId.value && gameStore.currentPlayerIndex === 0) {
    gameStore.discardTile(0, selectedTileId.value);
    selectedTileId.value = null;
  }
};

const declareReadyWithDiscard = () => {
  if (!selectedTileId.value) {
    alert('请先选择要打出的牌！');
    return;
  }
  
  const success = gameStore.declareReadyWithDiscard(0, selectedTileId.value);
  if (!success) {
    alert('无法宣告听牌！请检查打出这张牌后是否能形成听牌状态。');
  } else {
    selectedTileId.value = null;
  }
};

const toggleGuessTile = (tile: Tile) => {
  const index = guessedTileIds.value.findIndex(id => id === tile.id);
  if (index !== -1) {
    guessedTileIds.value.splice(index, 1);
  } else if (guessedTileIds.value.length < 2) {
    guessedTileIds.value.push(tile.id);
  }
};

const submitGuess = () => {
  const tiles = guessedTileIds.value.map(id => 
    availableTiles.value.find(t => t.id === id)!
  );
  
  const success = gameStore.guessTiles(tiles);
  
  if (!success) {
    // 猜测失败，进入摸4张牌阶段
    guessedTileIds.value = [];
  }
};

const drawFourTiles = () => {
  gameStore.drawFourTiles();
  guessedTileIds.value = [];
};

const nextRound = () => {
  gameStore.nextRound();
  selectedTileId.value = null;
  guessedTileIds.value = [];
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
  from { background-position: 0 0; }
  to { background-position: 100% 100%; }
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
  padding: 20px;
  position: relative;
  min-height: 300px;
  gap: 1px;
}

.discard-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
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
  padding: 10px;
  background: transparent;
  min-height: 80px;
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
  0%, 100% { 
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
  padding-top: 25px; /* 对齐手牌区域 */
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
  0%, 100% {
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
</style>
