import { defineStore } from 'pinia';
import type { GameState, Player, Tile, MeldGroup, MeldOption, MeldAction } from '../types/mahjong';
import { createFullWall, shuffleWall, dealTiles, sortHand } from '../utils/tiles';
import { checkReady, checkWin, getWaitingTiles } from '../utils/mahjong';
import { calculateScore } from '../utils/mahjong';
import { canPon, canKan, canChi, canAnkan, getPonTiles, getKanTiles, canRon } from '../utils/mahjong/meld-checker';

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    phase: 'initial',
    wall: [],
    players: [
      { id: 0, name: '我', hand: [], discards: [], melds: [], isDealer: false, hasDeclaredReady: false, score: 25000, lastDrawnTileId: undefined },
      { id: 1, name: 'AI', hand: [], discards: [], melds: [], isDealer: false, hasDeclaredReady: false, score: 25000, lastDrawnTileId: undefined }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    readyPlayerIndex: null,
    guessedTiles: [],
    drawnFourTiles: [],
    roundNumber: 1,
    consecutiveDealerWins: 0,
    hasDrawnThisTurn: false,
    drawFourCount: 0,
    aiSelectingTileId: null as string | null,
    lastDiscardedTile: null,
    lastDiscardPlayerIndex: null,
    availableMeldOptions: []
  }),

  getters: {
    currentPlayer: (state): Player => state.players[state.currentPlayerIndex]!,
    dealer: (state): Player => state.players[state.dealerIndex]!,
    readyPlayer: (state): Player | null => 
      state.readyPlayerIndex !== null ? state.players[state.readyPlayerIndex]! : null,
    opponentIndex: (state): number => state.currentPlayerIndex === 0 ? 1 : 0,
    opponent: (state): Player => state.players[state.currentPlayerIndex === 0 ? 1 : 0]!,
    
    // 计算玩家应有的手牌数量（摸牌后）
    // 基础13张 - 副露组数×3 + 1（刚摸的牌）
    expectedHandCountAfterDraw: (state) => (playerIndex: number): number => {
      const player = state.players[playerIndex]!;
      return 13 - player.melds.length * 3 + 1;
    },
    
    // 计算玩家应有的手牌数量（打牌前，即副露后）
    // 基础13张 - 副露组数×3
    expectedHandCountBeforeDraw: (state) => (playerIndex: number): number => {
      const player = state.players[playerIndex]!;
      return 13 - player.melds.length * 3;
    },
    
    // 检查当前玩家是否可以听牌（存在可打出的牌能让玩家进入听牌状态）
    canDeclareReady: (state): boolean => {
      if (state.readyPlayerIndex !== null) return false; // 已有人听牌
      
      const player = state.players[state.currentPlayerIndex]!;
      // 计算摸牌后应有的手牌数
      const expectedCount = 13 - player.melds.length * 3 + 1;
      if (player.hand.length !== expectedCount) return false;
      
      // 遍历手牌，检查打出某张牌后是否能形成听牌状态
      for (const tile of player.hand) {
        const testHand = player.hand.filter(t => t.id !== tile.id);
        if (checkReady(testHand)) {
          return true;
        }
      }
      
      return false;
    }
  },

  actions: {
    // 开始新游戏
    startNewGame() {
      this.phase = 'initial';
      this.wall = shuffleWall(createFullWall());
      this.dealerIndex = Math.floor(Math.random() * 2);
      this.currentPlayerIndex = this.dealerIndex;
      this.readyPlayerIndex = null;
      this.guessedTiles = [];
      this.drawnFourTiles = [];
      this.roundNumber = 1;
      this.consecutiveDealerWins = 0;
      this.hasDrawnThisTurn = false;
      this.drawFourCount = 0;
      this.aiSelectingTileId = null;
      
      this.players.forEach(player => {
        player.hand = [];
        player.discards = [];
        player.isDealer = false;
        player.hasDeclaredReady = false;
        player.score = 25000;
      });
      
      this.players[this.dealerIndex]!.isDealer = true;
      
      this.dealInitialHands();
    },

    // 发初始手牌
    dealInitialHands() {
      this.players.forEach(player => {
        const { dealt, remaining } = dealTiles(this.wall, 13);
        player.hand = sortHand(dealt);
        this.wall = remaining;
      });
      
      this.phase = 'playing';
      this.hasDrawnThisTurn = false;
      
      // 开始第一回合（庄家先摸牌）
      this.startNewTurn();
    },
    
    // 开始新回合（自动摸牌）
    startNewTurn() {
      this.hasDrawnThisTurn = false;
      // 自动摸牌
      this.drawTile(this.currentPlayerIndex);
      this.hasDrawnThisTurn = true;
      
      // 如果是对手回合，自动打牌
      if (this.currentPlayerIndex === 1) {
        setTimeout(() => {
          this.opponentAutoPlay();
        }, 1000); // 延迟1秒模拟思考
      }
    },

    // 摸牌
    drawTile(playerIndex: number): Tile | null {
      if (this.wall.length === 0) {
        this.handleDraw();
        return null;
      }
      
      const { dealt, remaining } = dealTiles(this.wall, 1);
      this.wall = remaining;
      
      if (dealt.length > 0) {
        const tile = dealt[0]!;
        const player = this.players[playerIndex]!;
        // 摸到的牌直接放在最右边，不排序
        player.hand.push(tile);
        // 标记最后摸的牌
        player.lastDrawnTileId = tile.id;
        return tile;
      }
      
      return null;
    },

    // 打牌
    discardTile(playerIndex: number, tileId: string) {
      const player = this.players[playerIndex]!;
      const tileIndex = player.hand.findIndex(t => t.id === tileId);
      
      if (tileIndex !== -1) {
        const [discarded] = player.hand.splice(tileIndex, 1);
        player.discards.push(discarded!);
        player.hand = sortHand(player.hand);
        
        // 清除最后摸的牌标记
        player.lastDrawnTileId = undefined;
        
        this.lastDiscardedTile = discarded!;
        this.lastDiscardPlayerIndex = playerIndex;
        
        this.checkMeldOptions();
        
        if (this.availableMeldOptions.length === 0) {
          this.currentPlayerIndex = this.opponentIndex;
          this.startNewTurn();
        } else {
          this.phase = 'waiting_meld';
          
          // 如果所有副露选项都是AI玩家的，让AI自动处理
          const hasPlayerOption = this.availableMeldOptions.some(opt => opt.playerIndex === 0);
          if (!hasPlayerOption) {
            // 只有AI有副露选项，让AI自动决策
            setTimeout(() => {
              this.aiHandleMeld();
            }, 1000);
          }
        }
      }
    },
    
    checkMeldOptions() {
      if (!this.lastDiscardedTile || this.lastDiscardPlayerIndex === null) {
        this.availableMeldOptions = [];
        return;
      }
      
      const options: MeldOption[] = [];
      const discardedTile = this.lastDiscardedTile;
      const discardPlayerIndex = this.lastDiscardPlayerIndex;
      
      for (let i = 0; i < this.players.length; i++) {
        if (i === discardPlayerIndex) continue;
        
        const player = this.players[i]!;
        
        if (canRon(player.hand, discardedTile, player.melds) && checkWin([...player.hand, discardedTile])) {
          options.push({
            action: 'ron',
            tiles: [discardedTile],
            playerIndex: i
          });
        }
        
        if (canKan(player.hand, discardedTile)) {
          const tiles = getKanTiles(player.hand, discardedTile);
          options.push({
            action: 'kan',
            tiles: [...tiles, discardedTile],
            playerIndex: i
          });
        }
        
        if (canPon(player.hand, discardedTile)) {
          const tiles = getPonTiles(player.hand, discardedTile);
          options.push({
            action: 'pon',
            tiles: [...tiles, discardedTile],
            playerIndex: i
          });
        }
        
        const nextPlayerIndex = (discardPlayerIndex + 1) % this.players.length;
        if (i === nextPlayerIndex) {
          const chiOptions = canChi(player.hand, discardedTile, i);
          chiOptions.forEach(opt => {
            options.push({
              action: 'chi',
              tiles: opt.tiles,
              playerIndex: i
            });
          });
        }
      }
      
      this.availableMeldOptions = options;
    },
    
    executeMeld(option: MeldOption) {
      if (!this.lastDiscardedTile) return;
      
      const player = this.players[option.playerIndex]!;
      const discardedTile = this.lastDiscardedTile;
      
      if (option.action === 'ron') {
        this.handleRon(option.playerIndex, discardedTile);
        return;
      }
      
      const tilesToRemove = option.tiles.filter(t => t.id !== discardedTile.id);
      tilesToRemove.forEach(tile => {
        const index = player.hand.findIndex(t => t.id === tile.id);
        if (index !== -1) {
          player.hand.splice(index, 1);
        }
      });
      
      const meld: MeldGroup = {
        type: option.action as 'pon' | 'kan' | 'chi',
        tiles: option.tiles,
        isOpen: true,
        fromPlayer: this.lastDiscardPlayerIndex!,
        calledTileId: discardedTile.id
      };
      
      player.melds.push(meld);
      
      if (this.lastDiscardPlayerIndex !== null) {
        const discardPlayer = this.players[this.lastDiscardPlayerIndex]!;
        const discardIndex = discardPlayer.discards.findIndex(t => t.id === discardedTile.id);
        if (discardIndex !== -1) {
          discardPlayer.discards.splice(discardIndex, 1);
        }
      }
      
      if (option.action === 'kan') {
        const tile = this.drawTile(option.playerIndex);
        if (tile) {
          player.hand.push(tile);
        }
      } else {
        // 吃或碰后，清除最后摸的牌标记（因为没有摸新牌）
        player.lastDrawnTileId = undefined;
      }
      
      this.currentPlayerIndex = option.playerIndex;
      this.phase = 'playing';
      this.lastDiscardedTile = null;
      this.lastDiscardPlayerIndex = null;
      this.availableMeldOptions = [];
      
      // 副露后，当前玩家需要打牌
      // 如果是AI，自动打牌
      if (this.currentPlayerIndex === 1) {
        setTimeout(() => {
          this.opponentAutoPlay();
        }, 1000);
      }
    },
    
    skipMeld() {
      this.phase = 'playing';
      this.lastDiscardedTile = null;
      this.lastDiscardPlayerIndex = null;
      this.availableMeldOptions = [];
      
      // 切换到下一个玩家并开始新回合
      this.currentPlayerIndex = this.opponentIndex;
      this.startNewTurn();
    },
    
    handleRon(playerIndex: number, winTile: Tile) {
      const winner = this.players[playerIndex]!;
      const result = calculateScore(winner.hand, winTile, winner.isDealer, false, true);
      
      const loserIndex = this.lastDiscardPlayerIndex!;
      const loser = this.players[loserIndex]!;
      
      winner.score += result.score;
      loser.score -= result.score;
      
      this.phase = 'finished';
    },
    
    declareAnkan(playerIndex: number, tileKey: string) {
      const player = this.players[playerIndex]!;
      const [type, value] = tileKey.split('-');
      
      const tiles = player.hand.filter(t => t.type === type && t.value === parseInt(value!));
      
      if (tiles.length === 4) {
        tiles.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id);
          if (index !== -1) {
            player.hand.splice(index, 1);
          }
        });
        
        const meld: MeldGroup = {
          type: 'ankan',
          tiles: tiles,
          isOpen: false
        };
        
        player.melds.push(meld);
        
        const tile = this.drawTile(playerIndex);
        if (tile) {
          player.hand.push(tile);
        }
      }
    },
    
    // 宣告听牌（打出指定牌后进入听牌状态）
    declareReadyWithDiscard(playerIndex: number, tileId: string): boolean {
      const player = this.players[playerIndex]!;
      
      // 检查是否已有人听牌
      if (this.readyPlayerIndex !== null) {
        return false;
      }
      
      // 检查手牌数量（必须是14张，刚摸牌后）
      if (player.hand.length !== 14) {
        return false;
      }
      
      // 找到要打出的牌
      const tileIndex = player.hand.findIndex(t => t.id === tileId);
      if (tileIndex === -1) {
        return false;
      }
      
      // 检查打出这张牌后是否能听牌
      const testHand = player.hand.filter(t => t.id !== tileId);
      if (!checkReady(testHand)) {
        return false;
      }
      
      // 打出这张牌
      const [discarded] = player.hand.splice(tileIndex, 1);
      player.discards.push(discarded!);
      player.hand = sortHand(player.hand);
      
      // 设置听牌状态
      player.hasDeclaredReady = true;
      this.readyPlayerIndex = playerIndex;
      this.guessedTiles = [];
      this.drawnFourTiles = [];
      this.drawFourCount = 0;
      
      // 听牌后，进入猜牌阶段（对手先猜牌）
      this.phase = 'ready_declared';
      
      // 如果是玩家听牌，对手自动猜牌
      if (playerIndex === 0) {
        setTimeout(() => {
          this.opponentAutoGuess();
        }, 1500);
      }
      
      return true;
    },

    // 猜牌
    guessTiles(tiles: Tile[]): boolean {
      if (this.readyPlayerIndex === null) return false;
      
      this.guessedTiles = tiles;
      const readyPlayer = this.players[this.readyPlayerIndex]!;
      const waitingTiles = getWaitingTiles(readyPlayer.hand);
      
      // 检查是否猜中
      const guessed = tiles.some(tile => 
        waitingTiles.some(wt => wt.type === tile.type && wt.value === tile.value)
      );
      
      if (guessed) {
        // 猜中，本局结束
        this.handleGuessSuccess();
        return true;
      } else {
        // 检查牌堆是否还有牌
        if (this.wall.length === 0) {
          // 牌堆已空，流局
          this.handleDraw();
          return false;
        }
        
        // 未猜中，听牌者再次摸牌（最多4张，如果不够就摸剩余的）
        this.phase = 'draw_four';
        // 清空之前摸的牌
        this.drawnFourTiles = [];
        return false;
      }
    },

    // 摸4张牌（如果牌堆不足4张，就摸剩余的所有牌）
    drawFourTiles(): Tile[] {
      if (this.readyPlayerIndex === null) return [];
      
      // 增加摸牌轮次的计数
      this.drawFourCount++;
      
      // 检查牌堆是否为空
      if (this.wall.length === 0) {
        // 牌堆已空，流局
        this.handleDraw();
        return [];
      }
      
      const readyPlayer = this.players[this.readyPlayerIndex]!;
      const drawnTiles: Tile[] = [];
      
      // 从牌山摸牌，最多4张，如果不够就摸剩余的所有牌
      const tilesToDraw = Math.min(4, this.wall.length);
      
      for (let i = 0; i < tilesToDraw; i++) {
        const { dealt, remaining } = dealTiles(this.wall, 1);
        this.wall = remaining;
        
        if (dealt.length > 0) {
          const tile = dealt[0]!;
          drawnTiles.push(tile);
          
          // 检查这张牌是否能让听牌者和牌（不加入手牌，只是测试）
          const testHand = [...readyPlayer.hand, tile];
          if (checkWin(testHand)) {
            // 自摸成功
            this.drawnFourTiles = drawnTiles;
            this.handleTsumo(tile);
            return drawnTiles;
          }
        }
      }
      
      // 保存摸到的牌用于显示
      this.drawnFourTiles = drawnTiles;
      
      // 这些牌都没有自摸，现在对手开始猜牌
      this.phase = 'ready_declared';
      this.guessedTiles = [];
      
      // 如果对手需要猜牌（玩家1听牌），让对手自动猜牌
      if (this.readyPlayerIndex === 0) {
        setTimeout(() => {
          this.opponentAutoGuess();
        }, 1500);
      }
      
      return drawnTiles;
    },

    // 处理自摸
    handleTsumo(winTile: Tile) {
      if (this.readyPlayerIndex === null) return;
      
      const winner = this.players[this.readyPlayerIndex]!;
      const result = calculateScore(winner.hand, winTile, winner.isDealer, true);
      
      const loserIndex = this.readyPlayerIndex === 0 ? 1 : 0;
      const loser = this.players[loserIndex]!;
      
      // 自摸：对手扣除点数（根据庄闲家规则）
      // 如果赢家是庄家，对手支付庄家自摸点数
      // 如果赢家是闲家，对手支付闲家自摸点数
      const pointsToTransfer = result.score;
      winner.score += pointsToTransfer;
      loser.score -= pointsToTransfer;
      
      // 连庄判断
      if (winner.isDealer) {
        this.consecutiveDealerWins++;
      } else {
        this.dealerIndex = this.readyPlayerIndex;
        this.consecutiveDealerWins = 0;
        this.roundNumber = 1; // 轮庄时重置为东1局
      }
      
      this.phase = 'finished';
      
      alert(`${winner.name} 自摸！\n役种：${result.yakuList.map(y => y.name).join('、')}\n${result.han}番${result.fu}符\n得点：${pointsToTransfer}点\n${loser.name} 支付 ${pointsToTransfer}点`);
    },

    // 处理猜中
    handleGuessSuccess() {
      if (this.readyPlayerIndex === null) return;
      
      const loserIndex = this.readyPlayerIndex;
      const winnerIndex = loserIndex === 0 ? 1 : 0;
      
      const winner = this.players[winnerIndex]!;
      const loser = this.players[loserIndex]!;
      
      // 猜中：本局不扣点，下一局再结算
      // 不进行点数转移
      
      // 轮庄
      this.dealerIndex = winnerIndex;
      this.consecutiveDealerWins = 0;
      this.roundNumber = 1; // 轮庄时重置为东1局
      
      this.phase = 'finished';
      
      alert(`${winner.name} 猜中！${loser.name} 听牌失败\n本局不扣点数，下一局继续`);
    },

    // 处理流局
    handleDraw() {
      // 检查庄家是否听牌
      const dealer = this.dealer;
      
      if (dealer.hasDeclaredReady) {
        // 庄家听牌，连庄
        this.consecutiveDealerWins++;
      } else {
        // 轮庄
        this.dealerIndex = this.dealerIndex === 0 ? 1 : 0;
        this.consecutiveDealerWins = 0;
        this.roundNumber = 1; // 轮庄时重置为东1局
      }
      
      this.phase = 'finished';
      alert('流局！');
    },

    // 对手自动打牌
    opponentAutoPlay() {
      if (this.currentPlayerIndex !== 1 || this.phase !== 'playing') return;
      
      const opponent = this.players[1]!;
      let tileToDiscard: Tile | null = null;
      let shouldDeclareReady = false;
      
      // 计算期望的手牌数量
      const expectedAfterDraw = this.expectedHandCountAfterDraw(1);
      const expectedBeforeDraw = this.expectedHandCountBeforeDraw(1);
      
      // 检查手牌数量是否正确（摸牌后或副露后）
      const canDiscard = opponent.hand.length === expectedAfterDraw || opponent.hand.length === expectedBeforeDraw;
      
      if (!canDiscard) {
        console.warn('AI手牌数量异常:', opponent.hand.length, '期望:', expectedAfterDraw, '或', expectedBeforeDraw);
        return;
      }
      
      // 检查是否可以听牌（只在摸牌后检查）
      if (this.readyPlayerIndex === null && opponent.hand.length === expectedAfterDraw) {
        // 遍历手牌，找到打出后能听牌的牌
        for (const tile of opponent.hand) {
          const testHand = opponent.hand.filter(t => t.id !== tile.id);
          if (checkReady(testHand)) {
            // 找到了可以听牌的牌
            tileToDiscard = tile;
            shouldDeclareReady = true;
            break;
          }
        }
        
        // 没有可以听牌的牌，正常打牌
        if (!tileToDiscard) {
          tileToDiscard = opponent.hand[opponent.hand.length - 1]!;
        }
      } else {
        // 简单AI：打出最后一张牌
        tileToDiscard = opponent.hand[opponent.hand.length - 1]!;
      }
      
      if (tileToDiscard) {
        // 先标记要打的牌（显示抬起效果）
        this.aiSelectingTileId = tileToDiscard.id;
        
        // 延迟后打出
        setTimeout(() => {
          this.aiSelectingTileId = null;
          if (shouldDeclareReady) {
            this.declareReadyWithDiscard(1, tileToDiscard!.id);
          } else {
            this.discardTile(1, tileToDiscard!.id);
          }
        }, 500); // 抬起效果持续500ms
      }
    },
    
    // AI处理副露选项
    aiHandleMeld() {
      const aiOptions = this.availableMeldOptions.filter(opt => opt.playerIndex === 1);
      
      if (aiOptions.length === 0) {
        this.skipMeld();
        return;
      }
      
      // 简单AI策略：优先荣和 > 杠 > 碰 > 吃 > 跳过
      const ronOption = aiOptions.find(opt => opt.action === 'ron');
      if (ronOption) {
        this.executeMeld(ronOption);
        return;
      }
      
      const kanOption = aiOptions.find(opt => opt.action === 'kan');
      if (kanOption) {
        this.executeMeld(kanOption);
        return;
      }
      
      const ponOption = aiOptions.find(opt => opt.action === 'pon');
      if (ponOption) {
        this.executeMeld(ponOption);
        return;
      }
      
      // 吃牌的概率较低（30%）
      const chiOptions = aiOptions.filter(opt => opt.action === 'chi');
      if (chiOptions.length > 0 && Math.random() < 0.3) {
        const randomChi = chiOptions[Math.floor(Math.random() * chiOptions.length)]!;
        this.executeMeld(randomChi);
        return;
      }
      
      // 默认跳过
      this.skipMeld();
    },
    
    // 对手自动猜牌
    opponentAutoGuess() {
      if (this.readyPlayerIndex !== 0 || this.phase !== 'ready_declared') return;
      
      // 简单AI：从所有可能的牌中随机选择2张
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
      
      // 随机选择2张牌
      const shuffled = [...uniqueTiles].sort(() => Math.random() - 0.5);
      const guessedTiles = shuffled.slice(0, 2);
      
      this.guessTiles(guessedTiles);
    },

    // 开始下一局
    nextRound() {
      this.roundNumber++;
      this.wall = shuffleWall(createFullWall());
      this.currentPlayerIndex = this.dealerIndex;
      this.readyPlayerIndex = null;
      this.guessedTiles = [];
      this.drawnFourTiles = [];
      this.hasDrawnThisTurn = false;
      this.drawFourCount = 0;
      this.aiSelectingTileId = null;
      
      this.players.forEach(player => {
        player.hand = [];
        player.discards = [];
        player.isDealer = player.id === this.dealerIndex;
        player.hasDeclaredReady = false;
      });
      
      this.dealInitialHands();
    }
  }
});
