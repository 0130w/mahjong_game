import { defineStore } from 'pinia';
import type { Tile } from '../utils/define';
import { Player, PlayerID } from '../utils/define';
import { createFullWall, shuffleWall, dealTiles, sortHand, getTile } from '../utils/tiles';
import { ref } from 'vue';
import type { GamePhase } from '../utils/define';

export const useGameStore = defineStore('game', () => {

  const phase = ref<GamePhase>('initial');
  const wall = ref<Tile[]>([]);
  const currentPlayerIndex = ref(0);
  const roundNumber = ref(1);
  const players = ref<Player[]>([])

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

  function waitForPlayerAction(player: Player, timeoutMs: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
      }, timeoutMs);
    });
  }

  function resetPlayersState() {
    players.value.forEach(player => {
      player.resetState();
    });
  }

  async function playLogic() {
    while (true) {
      if (wall.value.length === 0) {
        return gameSettlement();
      }

      const player = players.value[currentPlayerIndex.value]!;
      const opponent = players.value[(currentPlayerIndex.value + 1) % players.value.length]!;

      getTile(player, wall.value)
      player.checkStateWithoutTile();

      const action = await waitForPlayerAction(player, 20000);

      switch (action) {
        case 'discard':
          ;
        case 'pon':
          ;
        default:
          break;
      }

      // TODO:
      // opponent?.checkStateWithTile();

      // switch player
      currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length;

      resetPlayersState();
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