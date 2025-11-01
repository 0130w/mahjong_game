<template>
  <div class="game-board">
    <div class="game-container">
      <!-- 对家副露区 - 左侧 -->
      <div class="meld-area meld-area-opponent">
        <OpponentMeldDisplay :melds="gameStore.players[1]!.melds" />
      </div>

      <!-- 玩家2（对手）- 上方 -->
      <div class="player-area player-top">
        <div class="player-section">
          <PlayerHand 
            :player="gameStore.players[1]!" 
            :isCurrentPlayer="gameStore.currentPlayerIndex === 1"
            :showHand="false"
          />
        </div>
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

      <!-- 自家副露区 - 右侧 -->
      <div class="meld-area meld-area-self">
        <PlayerMeldDisplay :melds="gameStore.players[0]!.melds" />
      </div>

      <!-- 玩家1（你）- 下方 -->
      <div class="player-area player-bottom">
        <div class="player-section">
          <div class="player-with-controls">
            <PlayerHand 
              :player="gameStore.players[0]!" 
              :isCurrentPlayer="isPlayerHandClickable"
              :showHand="true"
              :highlightedTiles="availableTilesForMeld"
              :selectedTiles="selectedChiTileIds"
              @tileClick="handleTileClick"
            />
          
          <!-- 手牌右侧的操作按钮 -->
          <div class="hand-controls">
            <!-- 正常打牌阶段 -->
            <template v-if="gameStore.phase === 'playing' && gameStore.currentPlayerIndex === 0">
              <button 
                v-if="canPlayerDiscard && !gameStore.canDeclareReady"
                @click="discardSelectedTile" 
                class="btn-hand-action btn-discard"
                :disabled="!selectedTileId"
              >
                切
              </button>
              <button 
                v-if="gameStore.canDeclareReady"
                @click="declareReadyWithDiscard" 
                class="btn-hand-action btn-ready"
                :disabled="!selectedTileId"
              >
                听牌
              </button>
            </template>
            
            <!-- 副露选择阶段 -->
            <template v-if="gameStore.phase === 'waiting_meld' && playerMeldOptions.length > 0">
              <div class="meld-actions-container">
                <div v-if="selectedChiTileIds.length > 0" class="chi-hint">
                  已选 {{ selectedChiTileIds.length }}/2 张
                </div>
                <div class="meld-buttons-row">
                  <button
                    v-for="option in availableMeldActions"
                    :key="option.action"
                    @click="handleMeldAction(option.action)"
                    class="btn-hand-action btn-meld"
                    :class="[
                      `btn-meld-${option.action}`,
                      { 'is-active': option.action === 'chi' && canExecuteMeld('chi') }
                    ]"
                    :disabled="option.action === 'chi' && !canExecuteMeld(option.action)"
                  >
                    {{ option.label }}
                  </button>
                  <button
                    @click="handleMeldSkip"
                    class="btn-hand-action btn-skip-meld"
                  >
                    跳过
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- 移除弹窗式的副露选项 -->

    <!-- 游戏控制区（简化，只显示重要信息） -->
    <div class="game-controls" v-if="gameStore.phase !== 'playing' && gameStore.phase !== 'can_declare_ready' && gameStore.phase !== 'waiting_meld'">
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
import PlayerMeldDisplay from './PlayerMeldDisplay.vue';
import OpponentMeldDisplay from './OpponentMeldDisplay.vue';
import MeldOptions from './MeldOptions.vue';
import type { Tile } from '../types/mahjong';
import type { MeldOption } from '../types/mahjong';
import { createFullWall } from '../utils/tiles';

const router = useRouter();
const gameStore = useGameStore();
const selectedTileId = ref<string | null>(null);
const guessedTileIds = ref<string[]>([]);
const selectedChiTileIds = ref<string[]>([]); // 吃牌时选中的手牌ID列表

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
  // 如果在副露阶段,处理吃牌的多选逻辑
  if (gameStore.phase === 'waiting_meld') {
    const index = selectedChiTileIds.value.indexOf(tileId);
    if (index !== -1) {
      // 已选中,取消选择
      selectedChiTileIds.value.splice(index, 1);
    } else if (selectedChiTileIds.value.length < 2) {
      // 未选中且未达到2张,添加选择
      selectedChiTileIds.value.push(tileId);
    }
    return;
  }
  
  // 正常打牌阶段 - 只有当前玩家才能打牌
  if (gameStore.currentPlayerIndex !== 0) return;
  selectedTileId.value = tileId;
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

const playerMeldOptions = computed(() => {
  return gameStore.availableMeldOptions.filter(opt => opt.playerIndex === 0);
});

const canPlayerDiscard = computed(() => {
  const player = gameStore.players[0]!;
  const expectedAfterDraw = gameStore.expectedHandCountAfterDraw(0);
  const expectedBeforeDraw = gameStore.expectedHandCountBeforeDraw(0);
  return player.hand.length === expectedAfterDraw || player.hand.length === expectedBeforeDraw;
});

// 玩家手牌是否可点击（正常回合或副露阶段都可以点击）
const isPlayerHandClickable = computed(() => {
  return gameStore.currentPlayerIndex === 0 || gameStore.phase === 'waiting_meld';
});

// 获取可用的副露动作（去重）
const availableMeldActions = computed(() => {
  const actions = new Set<string>();
  const actionLabels: Record<string, string> = {
    ron: '荣和',
    kan: '杠',
    pon: '碰',
    chi: '吃'
  };
  
  playerMeldOptions.value.forEach(opt => {
    actions.add(opt.action);
  });
  
  return Array.from(actions).map(action => ({
    action,
    label: actionLabels[action] || action
  }));
});

// 当前选择的副露动作
const selectedMeldAction = ref<string | null>(null);

// 获取可用于"吃"的手牌（只有吃需要选择）
const availableTilesForMeld = computed(() => {
  // 在副露阶段，如果有吃的选项，高亮所有可能用于吃的手牌
  if (gameStore.phase !== 'waiting_meld') return new Set<string>();
  
  // 收集所有可能用于吃的牌的类型和数值
  const tileKeys = new Set<string>();
  playerMeldOptions.value
    .filter(opt => opt.action === 'chi')
    .forEach(opt => {
      opt.tiles.forEach(tile => {
        if (tile.id !== gameStore.lastDiscardedTile?.id) {
          tileKeys.add(`${tile.type}-${tile.value}`);
        }
      });
    });
  
  // 找到玩家手牌中所有匹配的牌的ID
  const tileIds = new Set<string>();
  const player = gameStore.players[0];
  if (player) {
    player.hand.forEach(tile => {
      const key = `${tile.type}-${tile.value}`;
      if (tileKeys.has(key)) {
        tileIds.add(tile.id);
      }
    });
  }
  
  return tileIds;
});

// 获取吃的所有可能组合（用于显示选项）
const chiOptions = computed(() => {
  return playerMeldOptions.value.filter(opt => opt.action === 'chi');
});

// 检查是否可以执行副露
const canExecuteMeld = (action: string) => {
  // 碰、杠、荣和不需要选牌，直接可以执行
  if (action === 'pon' || action === 'kan' || action === 'ron') {
    return true;
  }
  
  // 吃需要选择2张手牌
  if (action === 'chi') {
    if (selectedChiTileIds.value.length !== 2) {
      return false;
    }
    
    // 检查选中的2张牌加上对家打出的牌是否能组成顺子
    const discardedTile = gameStore.lastDiscardedTile;
    if (!discardedTile) {
      return false;
    }
    
    // 获取选中的2张牌
    const player = gameStore.players[0];
    if (!player) return false;
    
    const selectedTiles = selectedChiTileIds.value
      .map(id => player.hand.find(t => t.id === id))
      .filter(t => t !== undefined);
    
    if (selectedTiles.length !== 2) return false;
    
    // 检查3张牌（2张手牌 + 1张对家打出的牌）能否组成顺子
    const allThreeTiles = [...selectedTiles, discardedTile];
    
    // 必须是同一种花色
    const types = new Set(allThreeTiles.map(t => t.type));
    if (types.size !== 1) {
      return false;
    }
    
    const tileType = allThreeTiles[0]!.type;
    
    // 字牌不能吃
    if (tileType === 'honor') {
      return false;
    }
    
    // 获取数值并排序
    const values = allThreeTiles.map(t => t.value).sort((a, b) => a - b);
    
    // 检查是否是连续的3个数字
    const isSequence = values[1] === values[0] + 1 && values[2] === values[1] + 1;
    
    return isSequence;
  }
  
  return false;
};

// 处理副露动作点击
const handleMeldAction = (action: string) => {
  // 碰、杠、荣和：直接执行
  if (action === 'pon' || action === 'kan' || action === 'ron') {
    const option = playerMeldOptions.value.find(opt => opt.action === action);
    if (option) {
      gameStore.executeMeld(option);
      selectedTileId.value = null;
      selectedMeldAction.value = null;
      selectedChiTileIds.value = [];
    }
    return;
  }
  
  // 吃：需要选择2张手牌
  if (action === 'chi') {
    if (selectedChiTileIds.value.length !== 2) {
      return; // 必须选择2张牌
    }
    
    // 找到匹配的吃法并执行
    const discardedTile = gameStore.lastDiscardedTile;
    if (!discardedTile) return;
    
    const player = gameStore.players[0];
    if (!player) return;
    
    // 获取选中的2张牌
    const selectedTiles = selectedChiTileIds.value
      .map(id => player.hand.find(t => t.id === id))
      .filter(t => t !== undefined);
    
    if (selectedTiles.length !== 2) return;
    
    // 根据类型和数值找到匹配的吃法选项
    const selectedValues = selectedTiles.map(t => t.value).sort((a, b) => a - b);
    const discardedValue = discardedTile.value;
    const allValues = [...selectedValues, discardedValue].sort((a, b) => a - b);
    
    const matchingOption = chiOptions.value.find(opt => {
      const optionValues = opt.tiles.map(t => t.value).sort((a, b) => a - b);
      return optionValues.length === 3 &&
             optionValues[0] === allValues[0] &&
             optionValues[1] === allValues[1] &&
             optionValues[2] === allValues[2];
    });
    
    if (matchingOption) {
      // 创建一个新的选项，使用玩家实际选中的牌
      const newOption = {
        ...matchingOption,
        tiles: [...selectedTiles, discardedTile]
      };
      gameStore.executeMeld(newOption);
      selectedTileId.value = null;
      selectedMeldAction.value = null;
      selectedChiTileIds.value = [];
    }
  }
};

const handleMeldSelect = (option: MeldOption) => {
  gameStore.executeMeld(option);
};

const handleMeldSkip = () => {
  gameStore.skipMeld();
  selectedChiTileIds.value = [];
  selectedMeldAction.value = null;
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
.opponent-discards .discard-tiles > * {
  position: relative;
}

.opponent-discards .discard-tiles > *:nth-child(1) { z-index: 100; }
.opponent-discards .discard-tiles > *:nth-child(2) { z-index: 99; }
.opponent-discards .discard-tiles > *:nth-child(3) { z-index: 98; }
.opponent-discards .discard-tiles > *:nth-child(4) { z-index: 97; }
.opponent-discards .discard-tiles > *:nth-child(5) { z-index: 96; }
.opponent-discards .discard-tiles > *:nth-child(6) { z-index: 95; }
.opponent-discards .discard-tiles > *:nth-child(7) { z-index: 94; }
.opponent-discards .discard-tiles > *:nth-child(8) { z-index: 93; }
.opponent-discards .discard-tiles > *:nth-child(9) { z-index: 92; }
.opponent-discards .discard-tiles > *:nth-child(10) { z-index: 91; }
.opponent-discards .discard-tiles > *:nth-child(11) { z-index: 90; }
.opponent-discards .discard-tiles > *:nth-child(12) { z-index: 89; }
.opponent-discards .discard-tiles > *:nth-child(13) { z-index: 88; }
.opponent-discards .discard-tiles > *:nth-child(14) { z-index: 87; }
.opponent-discards .discard-tiles > *:nth-child(15) { z-index: 86; }
.opponent-discards .discard-tiles > *:nth-child(16) { z-index: 85; }
.opponent-discards .discard-tiles > *:nth-child(17) { z-index: 84; }
.opponent-discards .discard-tiles > *:nth-child(18) { z-index: 83; }
.opponent-discards .discard-tiles > *:nth-child(19) { z-index: 82; }
.opponent-discards .discard-tiles > *:nth-child(20) { z-index: 81; }

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
  0%, 100% {
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
  0%, 100% {
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
  0%, 100% {
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
