import { defineStore } from 'pinia';
import type { PlayerAction, Tile } from '../utils/define';
import { Player, PlayerID } from '../utils/define';
import { createFullWall, shuffleWall, dealTiles, sortHand } from '../utils/tiles';
import { ref } from 'vue';
import type { GamePhase, RoundResult } from '../utils/define';
import { calcFan, fanToPoints } from '../utils/hupai';
import router from '../router';

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
      const off = player.registerActionListener((action) => {
        clearTimeout(timerId);
        off();
        resolve(action);
      });

      timerId = setTimeout(() => {
        off();
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

    if (player.hasReaction()) {
      if (isAIPlayer(player)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await doAction({ type: 'skip' }, player, opponent);
      } else {
        const action = await waitForPlayerAction(player, 20000);
        if (!action) {
          await doAction({ type: 'skip' }, player, opponent);
        } else {
          await doAction(action, player, opponent);
        }
      }
      return;
    }

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

    if (isAIPlayer(player)) {
      const idx = Math.floor(Math.random() * player.hand.length);
      const tile = player.hand[idx]!;
      await doAction({ type: 'discard', tile: tile }, player, opponent);
    } else {
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
          tile = opponent.lastDiscardTile ? opponent.lastDiscardTile! : player.lastGetTile!;
          if (opponent.lastDiscardTile) {
            opponent.lastDiscardTile = null;
            opponent.discards = opponent.discards.filter(t => t.id !== tile.id);
            isGangReplacementTurn.value = true;
          } else {
            isGangReplacementTurn.value = true;
          }
          player.handleKan(tile);
        } else {
          player.handleAnKan();
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
        const { fan } = calcFan(player.hand, player.melds, winningTile, options);
        gameSettlement({ endType: 'ron', winnerId: player.id, loserId: opponent.id, han: fan });
        return;
      }
      case 'tsumo': {
        const options = {
          isGangShangHua: isGangReplacementTurn.value, // 是否是杠后摸到的这张牌
          isLastTile: isLastTile                       // 海底捞月
        };
        const { fan } = calcFan(player.hand, player.melds, undefined, options);
        gameSettlement({ endType: 'tsumo', winnerId: player.id, han: fan });
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
    forceResetGame
  }
})