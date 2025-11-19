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
  const players = ref<Player[]>([])

  // start new game, used in StartPage
  function startNewGame() {
    phase.value = 'playing';
    wall.value = shuffleWall(createFullWall());
    currentPlayerIndex.value = 0;
    roundNumber.value = 1;
    let player_0 = new Player(PlayerID.PLAYER_0, '我', []);
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

  function nextRound() {
    // TODO: implement
  }

  // call after startNewGame
  function discardSelectedTile(tile: Tile) {
    const player = players.value[currentPlayerIndex.value];
    if (player == undefined) {
      return;
    }
    player.discards.push(tile);
    player.hand = player.hand.filter(t => t.id !== tile.id);
  }

  return {
    phase,
    wall,
    currentPlayerIndex,
    roundNumber,
    players,
    startNewGame,
    discardSelectedTile
  }
})