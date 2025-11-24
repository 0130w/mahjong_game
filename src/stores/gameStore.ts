import { defineStore } from 'pinia';
import type { PlayerAction, Tile } from '../utils/define';
import { Player, PlayerID } from '../utils/define';
import { createFullWall, shuffleWall, dealTiles, sortHand } from '../utils/tiles';
import { ref } from 'vue';
import type { GamePhase, RoundResult } from '../utils/define';
import { calcFan, canHu, fanToPoints } from '../utils/hupai';
import router from '../router';
import { getAIDecision } from '../service.ts/llm';
import { stringToTile } from '../utils/format';

export const useGameStore = defineStore('game', () => {

  const phase = ref<GamePhase>('initial');
  const wall = ref<Tile[]>([]);
  const currentPlayerIndex = ref(0);
  const roundNumber = ref(1);
  const players = ref<Player[]>([]);
  const discardOnly = ref<boolean>(false);
  const isAIPlayer = (player: Player) => player.id !== PlayerID.PLAYER_0;
  const lastRoundResult = ref<RoundResult | null>(null);
  // 标记是否强制停止
  const isDestroyed = ref(false);
  const isGangReplacementTurn = ref(false);
  const isGangDiscard = ref(false);
  const aiThought = ref<string>("");
  const turnTimeLimit = 20;
  const turnTimer = ref(0);
  let timerInterval: number | null = null;

  type OpponentInfo = {
    name: string;
    avatar: string;
  }

  const opponents: OpponentInfo[] = [
    {
      name: '墨兰',
      avatar: '/assets/avatar/molan.png',
    },
    {
      name: '钟老',
      avatar: '/assets/avatar/zhonglao.png',
    },
    {
      name: '小铃铛',
      avatar: '/assets/avatar/xiaolingdang.png',
    }
  ];

  const currentOpponentIndex = ref(0);
  const beatenOpponentCount = ref(0);
  const isGameOver = ref(false);
  const gameOverReason = ref<'lose' | 'winAll' | null>(null);

  function startTurnTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    turnTimer.value = turnTimeLimit;
    timerInterval = setInterval(() => {
      turnTimer.value -= 1;
      if (turnTimer.value <= 0) {
        clearInterval(timerInterval!);
        timerInterval = null;
        // 计时器归零，但实际超时逻辑由 waitForPlayerAction 的 setTimeout 负责触发
      }
    }, 1000) as unknown as number;
  }

  function stopTurnTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    turnTimer.value = 0;
  }

  function initRound() {
    wall.value = shuffleWall(createFullWall());
    currentPlayerIndex.value = 0;

    isGangReplacementTurn.value = false;
    isGangDiscard.value = false;

    if (players.value.length === 0) {
      const me = new Player(PlayerID.PLAYER_0, '我', [], '/assets/avatar/me.png');
      const oppInfo = opponents[currentOpponentIndex.value];
      const opp = new Player(PlayerID.PLAYER_1, oppInfo!.name, [], oppInfo!.avatar);
      players.value = [me, opp];
    } else {
      // 只更新对手的名字和头像（第一次之后切换对手时用）
      const oppInfo = opponents[currentOpponentIndex.value];
      const opp = players.value[PlayerID.PLAYER_1]!;
      opp.name = oppInfo!.name;
      opp.avatar = oppInfo!.avatar;
    }


    const player_0 = players.value[PlayerID.PLAYER_0]!;
    const player_1 = players.value[PlayerID.PLAYER_1]!;

    [player_0, player_1].forEach(player => {
      player.hand = [];
      player.discards = [];
      player.melds = [];
      player.lastDiscardTile = null;
      player.lastGetTile = null;
      player.resetState();
    });

    {
      const { dealt, remaining } = dealTiles(wall.value, 13);
      player_0.hand = sortHand(dealt);
      wall.value = remaining;
    }
    {
      const { dealt, remaining } = dealTiles(wall.value, 13);
      player_1.hand = sortHand(dealt);
      wall.value = remaining;
    }
  }

  function startNewGame() {
    initRound();
    startPlaying();
  }

  function waitForPlayerAction(player: Player, timeoutMs: number): Promise<PlayerAction | null> {
    return new Promise((resolve, _) => {
      let timerId: any;

      if (!isAIPlayer(player)) {
        startTurnTimer();
      }

      const off = player.registerActionListener((action) => {
        clearTimeout(timerId);
        stopTurnTimer();
        off();
        resolve(action);
      });

      timerId = setTimeout(() => {
        off();
        stopTurnTimer();
        resolve(null);
      }, timeoutMs);
    });
  }

  function resetPlayersState() {
    players.value.forEach(player => {
      player.resetState();
    });
  }

  async function runTurn(player: Player, opponent: Player, shouldDraw: boolean) {

    // --- 阶段一：处理吃/碰/杠/胡的反应 (Reaction) ---
    if (player.hasReaction()) {
      if (isAIPlayer(player)) {
        // AI 模拟思考延迟
        await new Promise(resolve => setTimeout(resolve, 800));

        const state = player.playerState;

        // 1. 优先判胡 (能胡必胡)
        if (state.canRon || state.canTsumo) {
          // 判断是自摸还是荣和
          const actionType = state.canTsumo ? 'tsumo' : 'ron';
          await doAction({ type: actionType }, player, opponent);
          return;
        }

        // 2. 碰/杠 决策 (这里使用简单概率，暂不调用 LLM，节省 Token)
        // 设定 40% 概率碰/杠
        const wantsToMeld = Math.random() > 0.6;

        if (state.canKan && wantsToMeld) {
          let tileToKan: Tile | undefined;

          tileToKan = player.hand.find(h =>
            player.melds.some(m => m.type === 'pon' && m.tile.type === h.type && m.tile.value === h.value)
          );

          if (tileToKan) {
            await doAction({ type: 'kan', tile: tileToKan }, player, opponent);
          } else {
            console.warn("AI has canKan state but no matching tile found in hand.");
            await doAction({ type: 'skip' }, player, opponent);
          }
          return;
        }

        if (state.canPon && wantsToMeld) {
          await doAction({ type: 'pon' }, player, opponent);
          return;
        }

        // 3. 都不选，则跳过
        await doAction({ type: 'skip' }, player, opponent);
      } else {
        // --- 人类玩家逻辑 ---
        const action = await waitForPlayerAction(player, 20000);
        if (!action) {
          await doAction({ type: 'skip' }, player, opponent);
        } else {
          await doAction(action, player, opponent);
        }
      }
      return;
    }

    // --- 阶段二：摸牌 (Draw) ---
    if (shouldDraw) {
      if (wall.value.length === 0) {
        await doAction({ type: 'ryuukyoku' }, player, opponent);
        return;
      }
      const { dealt, remaining } = dealTiles(wall.value, 1);
      player.getTile(dealt[0]!);
      wall.value = remaining;
      player.checkStateWithoutTile();
    }

    // --- 阶段三：出牌 (Discard) ---
    if (isAIPlayer(player)) {
      // 1. 再次检查自摸 (摸牌后可能胡牌)
      // 注意：calcFan 需要 options，这里简化调用 canHu 做预判
      if (canHu(player.hand, player.melds)) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 惊喜延迟
        await doAction({ type: 'tsumo' }, player, opponent);
        return;
      }

      const withProbability = <T>(probability: number, value: T, defaultValue: T): T => {
        return Math.random() < probability ? value : defaultValue;
      };

      // 使用
      aiThought.value = withProbability(0.4, "我想想...", "");

      let tileToDiscard: Tile | undefined;

      try {
        // 3. 调用 LLM API
        // 传入：手牌，副露，自己的弃牌流，对手的弃牌流
        const aiRes = await getAIDecision(
          player.hand,
          player.melds,
          player.discards,
          opponent.discards
        );

        // 4. 更新吐槽气泡
        aiThought.value = aiRes.reason;
        console.log(`[AI ${player.name}]`, aiRes.reason);

        tileToDiscard = stringToTile(aiRes.discard, player.hand);

      } catch (e) {
        console.warn("AI Offline/Timeout, using fallback.");
      }

      if (!tileToDiscard) {
        const idx = Math.floor(Math.random() * player.hand.length);
        tileToDiscard = player.hand[idx]!;

        // 如果气泡还是"思考中"或者空的，给个默认台词
        if (!aiThought.value || aiThought.value === "我想想...") {
          aiThought.value = "(犹豫) ...还是打这张吧。";
        }
      }

      // 7. 留给用户阅读气泡的时间
      await new Promise(resolve => setTimeout(resolve, 1500));

      await doAction({ type: 'discard', tile: tileToDiscard }, player, opponent);

      // 9. 3秒后清除气泡，避免一直挡着
      setTimeout(() => {
        if (aiThought.value.includes(tileToDiscard?.value + "")) {
          aiThought.value = "";
        } else {
          aiThought.value = "";
        }
      }, 4000);

    } else {
      // --- 人类玩家出牌 ---
      const action = await waitForPlayerAction(player, 20000);
      if (!action) {
        // 超时逻辑：随机打牌
        const idx = Math.floor(Math.random() * player.hand.length);
        const tile = player.hand[idx]!;
        await doAction({ type: 'discard', tile: tile }, player, opponent);
      } else {
        await doAction(action, player, opponent);
      }
    }
  }

  async function doAction(action: PlayerAction | null, player: Player, opponent: Player) {
    const isLastTile = wall.value.length === 0;
    switch (action?.type) {
      case 'skip': {
        currentPlayerIndex.value = player.id;
        resetPlayersState();
        isGangDiscard.value = false;
        return;
      }
      case 'discard': {
        const tile = action.tile;
        player.handleDiscard(tile);
        resetPlayersState();
        player.hand = sortHand(player.hand);

        const discardTile = player.lastDiscardTile!;
        opponent.checkStateWithTile(discardTile);
        currentPlayerIndex.value = opponent.id;

        if (isGangReplacementTurn.value) {
          isGangDiscard.value = true;
          isGangReplacementTurn.value = false;
        } else {
          isGangDiscard.value = false;
        }

        return;
      }
      case 'pon': {
        const tile = opponent.lastDiscardTile!;
        player.handlePon(tile);
        resetPlayersState();
        opponent.lastDiscardTile = null;
        discardOnly.value = true;
        opponent.discards = opponent.discards.filter(t => t.id !== tile.id);
        isGangDiscard.value = false;
        isGangReplacementTurn.value = false;
        return;
      }
      case 'kan':
      case 'ankan': {
        let tile: Tile;
        if (action.type === 'kan') {
          // 优先使用 action 中指定的 tile (用于加杠)
          if (action.tile) {
            tile = action.tile;

            // 如果是加杠（action.tile 存在），那么必然是自己摸牌后的操作，属于杠后回合
            // 除非这个 action.tile 是对应别人的 discard（大明杠）
            if (opponent.lastDiscardTile &&
              opponent.lastDiscardTile.type === tile.type &&
              opponent.lastDiscardTile.value === tile.value) {
              // 这是一个大明杠
              opponent.lastDiscardTile = null;
              opponent.discards = opponent.discards.filter(t => t.id !== tile.id);
              // 大明杠通常不算杠上花的前置条件，但看规则设定
            } else {
              // 加杠 (自己手里的牌)
              isGangReplacementTurn.value = true;
            }
          }
          // 兼容旧逻辑：如果没有传 tile，自动判断
          else {
            tile = opponent.lastDiscardTile ? opponent.lastDiscardTile! : player.lastGetTile!;
            if (opponent.lastDiscardTile) {
              opponent.lastDiscardTile = null;
              opponent.discards = opponent.discards.filter(t => t.id !== tile.id);
            } else {
              isGangReplacementTurn.value = true;
            }
          }

          player.handleKan(tile);
        } else {
          // 暗杠
          player.handleAnKan(); // 暗杠通常内部逻辑会找 4 张一样的，或者 action.tile 也可以传进去优化
          isGangReplacementTurn.value = true;
        }

        isGangDiscard.value = false;
        resetPlayersState();
        return;
      }
      case 'ron': {
        const winningTile = opponent.lastDiscardTile!;
        const options = {
          isGangShangPao: isGangDiscard.value,
          isLastTile: isLastTile,
          isQiangGang: (action as any).isQiangGang || false,
        };
        const { fan, fanTypes } = calcFan(player.hand, player.melds, winningTile, options);
        gameSettlement({ endType: 'ron', winnerId: player.id, loserId: opponent.id, han: fan, hanTypes: fanTypes });
        return;
      }
      case 'tsumo': {
        const options = {
          isGangShangHua: isGangReplacementTurn.value, // 是否是杠后摸到的这张牌
          isLastTile: isLastTile                       // 海底捞月
        };
        const { fan, fanTypes } = calcFan(player.hand, player.melds, undefined, options);
        gameSettlement({ endType: 'tsumo', winnerId: player.id, han: fan, hanTypes: fanTypes });
        return;
      }
      case 'ryuukyoku': {
        gameSettlement({ endType: 'ryuukyoku' });
        return;
      }
      default: {
        console.warn('Unknown action: ', action);
        currentPlayerIndex.value = opponent.id;
        resetPlayersState();
        return;
      }
    }
  }

  async function playLogic() {
    phase.value = 'playing';
    isDestroyed.value = false;

    while (phase.value == 'playing') {
      if (isDestroyed.value)
        break;
      const player = players.value[currentPlayerIndex.value]!;
      const opponent = players.value[(currentPlayerIndex.value + 1) % players.value.length]!;
      if (wall.value.length === 0) {
        await doAction({ type: 'ryuukyoku' }, player, opponent);
        continue;
      }
      const shouldDraw = !discardOnly.value && !player.hasReaction();
      if (discardOnly.value) {
        discardOnly.value = false;
      }
      await runTurn(player, opponent, shouldDraw);
      if (isDestroyed.value)
        break;
    }
  }

  function startPlaying() {
    const loop = () => {
      requestAnimationFrame(loop);
    };
    playLogic();
    requestAnimationFrame(loop);
  }

  function gameSettlement(result: RoundResult) {
    lastRoundResult.value = result;

    // 结算分数

    if (result.endType === 'ron') {
      const score = fanToPoints(result.han!);
      players.value[result.winnerId!]!.score += score;
      players.value[result.loserId!]!.score -= score;
    }

    // 双人对战，自摸等于对方扣分
    if (result.endType === 'tsumo') {
      const score = fanToPoints(result.han!);
      const loserId = result.winnerId === PlayerID.PLAYER_0 ? PlayerID.PLAYER_1 : PlayerID.PLAYER_0;
      players.value[result.winnerId!]!.score += score;
      players.value[loserId!]!.score -= score;
    }

    const me = players.value[PlayerID.PLAYER_0]!;
    const opp = players.value[PlayerID.PLAYER_1]!;

    if (me.score < 0) {
      isGameOver.value = true;
      gameOverReason.value = 'lose';
      phase.value = 'finished';
      return;
    }

    if (opp.score < 0) {
      beatenOpponentCount.value += 1;

      if (beatenOpponentCount.value >= opponents.length) {
        isGameOver.value = true;
        gameOverReason.value = 'winAll';
        phase.value = 'finished';
        // 还有下一个对手：切换到下一位
        currentOpponentIndex.value += 1;

        // 给下一位对手初始化分数，例如 50 分
        const nextOppInfo = opponents[currentOpponentIndex.value];
        opp.name = nextOppInfo!.name;
        opp.avatar = nextOppInfo!.avatar;
        opp.score = 50;

        // 这里本局结束，点击“下一局”就会进入下一位对手
        phase.value = 'finished';
        return;
      }
    }

    phase.value = 'finished';
  }

  function nextRound() {
    if (isGameOver.value) {
      router.push('/');
      return;
    }
    roundNumber.value += 1;
    lastRoundResult.value = null;
    phase.value = 'initial';
    initRound();
    startPlaying();
  }

  function forceResetGame() {
    isDestroyed.value = true;
    phase.value = 'initial';
    wall.value = [];
    players.value = [];
    lastRoundResult.value = null;
  };

  return {
    phase,
    wall,
    currentPlayerIndex,
    roundNumber,
    players,
    startNewGame,
    lastRoundResult,
    nextRound,
    forceResetGame,
    aiThought,
    turnTimer,
  }
})