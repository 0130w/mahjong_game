import { defineStore } from 'pinia';
import type { PlayerAction, Tile } from '../utils/define';
import { Player, PlayerID } from '../utils/define';
import { createFullWall, shuffleWall, dealTiles, sortHand } from '../utils/tiles';
import { ref } from 'vue';
import type { GamePhase, RoundResult } from '../utils/define';
import { calcFan, fanToPoints } from '../utils/hupai';

export const useGameStore = defineStore('game', () => {

  const phase = ref<GamePhase>('initial');
  const wall = ref<Tile[]>([]);
  const currentPlayerIndex = ref(0);
  const roundNumber = ref(1);
  const players = ref<Player[]>([]);
  const discardOnly = ref<boolean>(false);
  const isAIPlayer = (player: Player) => player.id !== PlayerID.PLAYER_0;
  const lastRoundResult = ref<RoundResult | null>(null);

  function initRound() {
    wall.value = shuffleWall(createFullWall());
    currentPlayerIndex.value = 0;

    if (players.value.length === 0) {
      const player_0 = new Player(PlayerID.PLAYER_0, '我', []);
      const player_1 = new Player(PlayerID.PLAYER_1, '对手', []);
      players.value = [player_0, player_1];
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
      const off = player.registerActionListener((action) => {
        off();
        resolve(action);
      });

      setTimeout(() => {
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
      return;
    }

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

  async function doAction(action: PlayerAction | null, player: Player, opponent: Player) {
    resetPlayersState();
    switch (action?.type) {
      case 'skip': {
        currentPlayerIndex.value = player.id;
        return;
      }
      case 'discard': {
        const tile = action.tile;
        player.handleDiscard(tile);
        player.hand = sortHand(player.hand);

        const discardTile = player.lastDiscardTile!;
        opponent.checkStateWithTile(discardTile);
        if (!opponent.hasReaction()) {
          currentPlayerIndex.value = opponent.id;
          return;
        }
        currentPlayerIndex.value = opponent.id;

        if (isAIPlayer(opponent)) {
          // TODO: 优化成真正的AI逻辑
          return await doAction({ type: 'skip' }, opponent, player);
        } else {
          const opAction = await waitForPlayerAction(opponent, 20000);
          return await doAction(opAction, opponent, player);
        }
      }
      case 'pon': {
        const tile = opponent.lastDiscardTile!;
        player.handlePon(tile);
        opponent.lastDiscardTile = null;
        opponent.discards = opponent.discards.filter(t => t.id !== tile.id);
        await runTurn(player, opponent, false);
        return;
      }
      case 'kan': {
        let tile: Tile;
        if (opponent.lastDiscardTile) {
          tile = opponent.lastDiscardTile!;
          opponent.lastDiscardTile = null;
          opponent.discards = opponent.discards.filter(t => t.id !== tile.id);
        } else {
          tile = player.lastGetTile!;
        }
        player.handleKan(tile);
        await runTurn(player, opponent, true);
        return;
      }
      case 'ankan': {
        player.handleAnKan();
        await runTurn(player, opponent, true);
        return;
      }
      case 'ron': {
        const { fan } = calcFan(player.hand, player.melds);
        gameSettlement({ endType: 'ron', winnerId: player.id, loserId: opponent.id, han: fan });
        return;
      }
      case 'tsumo': {
        const { fan } = calcFan(player.hand, player.melds);
        gameSettlement({ endType: 'tsumo', winnerId: player.id, han: fan });
        return;
      }
      case 'ryuukyoku': {
        gameSettlement({ endType: 'ryuukyoku' });
        return;
      }
      default: {
        currentPlayerIndex.value = opponent.id;
        return;
      }
    }
  }

  async function playLogic() {
    phase.value = 'playing';

    while (phase.value == 'playing') {
      const player = players.value[currentPlayerIndex.value]!;
      const opponent = players.value[(currentPlayerIndex.value + 1) % players.value.length]!;
      if (wall.value.length === 0) {
        await doAction({ type: 'ryuukyoku' }, player, opponent);
        continue;
      }
      const shouldDraw = !discardOnly.value;
      discardOnly.value = false;
      await runTurn(player, opponent, shouldDraw);
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

    // TODO:花猪

    phase.value = 'finished';
  }

  function nextRound() {
    roundNumber.value += 1;
    lastRoundResult.value = null;
    phase.value = 'initial';
    initRound();
    startPlaying();
  }

  return {
    phase,
    wall,
    currentPlayerIndex,
    roundNumber,
    players,
    startNewGame,
    lastRoundResult,
    nextRound
  }
})