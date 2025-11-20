import { defineStore } from 'pinia';
import type { Tile } from '../utils/define';
import { Player, PlayerID } from '../utils/define';
import { createFullWall, shuffleWall, dealTiles, sortHand } from '../utils/tiles';
import { ref } from 'vue';
import type { GamePhase } from '../utils/define';

export const useGameStore = defineStore('game', () => {

  const phase = ref<GamePhase>('initial');
  const wall = ref<Tile[]>([]);
  const currentPlayerIndex = ref(0);
  const roundNumber = ref(1);
  const players = ref<Player[]>([]);
  const discardOnly = ref<boolean>(false);

  // 开始新游戏 
  function startNewGame() {
    phase.value = 'playing';
    wall.value = shuffleWall(createFullWall());
    currentPlayerIndex.value = 0;
    roundNumber.value = 1;
    let player_0 = new Player(PlayerID.PLAYER_0, '我', []);
    // TODO: 初始情况下，连摸13张的逻辑需要更换为轮流摸一张，摸13轮
    {
      const { dealt, remaining } = dealTiles(wall.value, 13);
      player_0.hand = sortHand(dealt);
      wall.value = remaining;
    }
    let player_1 = new Player(PlayerID.PLAYER_1, '对手', []);
    {
      const { dealt, remaining } = dealTiles(wall.value, 13);
      player_1.hand = sortHand(dealt);
      wall.value = remaining;
    }

    players.value = [
      player_0,
      player_1
    ];
  }

  function waitForPlayerAction(player: Player, timeoutMs: number): Promise<string | null> {
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
        gameSettlement();
        return;
      }
      const { dealt, remaining } = dealTiles(wall.value, 1);
      player.getTile(dealt[0]!);
      wall.value = remaining;
      player.checkStateWithoutTile();
    }

    const action = await waitForPlayerAction(player, 20000);

    if (!action) {
      // 超时逻辑：随机打牌
      const idx = Math.floor(Math.random() * player.hand.length);
      const tile = player.hand[idx]!;
      player.handleDiscard(tile);
      player.hand = sortHand(player.hand);
      await doAction('discard', player, opponent);
    } else {
      await doAction(action, player, opponent);
    }
  }

  async function doAction(action: string | null, player: Player, opponent: Player) {
    resetPlayersState();
    switch (action) {
      case 'discard': {
        const discardTile = player.lastDiscardTile!;
        opponent.checkStateWithTile(discardTile);
        if (!opponent.hasReaction()) {
          currentPlayerIndex.value = opponent.id;
          return;
        }
        currentPlayerIndex.value = opponent.id;
        const opAction = await waitForPlayerAction(opponent, 20000);

        return await doAction(opAction, opponent, player);
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
        break;
      }
      case 'ron':
        break;
      case 'tsumo':
        break;
      default: {
        currentPlayerIndex.value = opponent.id;
        break;
      }
    }
  }

  async function playLogic() {
    while (true) {
      if (wall.value.length === 0) {
        return gameSettlement();
      }

      const player = players.value[currentPlayerIndex.value]!;
      const opponent = players.value[(currentPlayerIndex.value + 1) % players.value.length]!;

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

  function gameSettlement() {
  }

  function nextRound() {
    // TODO: implement
  }


  return {
    phase,
    wall,
    currentPlayerIndex,
    roundNumber,
    players,
    startNewGame,
    startPlaying,
  }
})