import { canHu } from "./hupai";

// 麻将牌类型
export type TileType = 'man' | 'pin' | 'sou'; // 万、筒、索

// 麻将牌
export interface Tile {
  id: string;       // type-value-copy-id
  type: TileType;
  value: number;    // 1-9 for man/pin/sou
}

// 副露: 碰、杠、暗杠
export interface Meld {
  tile: Tile;
  type: 'pon' | 'kan' | 'ankan';
};

export type PlayerAction =
  | { type: 'discard', tile: Tile }
  | { type: 'pon' }
  | { type: 'kan' }
  | { type: 'ankan' }
  | { type: 'ron' }
  | { type: 'tsumo' }
  | { type: 'skip' }
  | { type: 'ryuukyoku' };

// 定义游戏阶段
export type GamePhase = 'initial' | 'playing' | 'finished';

class PlayerState {
  canPon!: boolean;
  canKan!: boolean;
  canAnKan!: boolean;
  canRon!: boolean;
  canTsumo!: boolean;

  constructor() {
    this.canPon = false;
    this.canKan = false;
    this.canAnKan = false;
    this.canRon = false;
    this.canTsumo = false;
  }
};

// 定义Player ID
export const PlayerID = {
  PLAYER_0: 0, // 自己
  PLAYER_1: 1  // 对家
}

type RoundEndType = 'ron' | 'tsumo' | 'ryuukyoku';

export interface RoundResult {
  endType: RoundEndType;
  winnerId?: number;
  loserId?: number;
  han?: number;
};

export class Player {
  id: number;
  name: string;
  hand: Tile[];
  discards: Tile[];
  melds: Meld[];
  playerState: PlayerState;
  lastDiscardTile: Tile | null;
  lastGetTile: Tile | null;
  actionListener: ((action: PlayerAction) => void) | null;
  score: number;

  constructor(id: number, name: string, hand: Tile[]) {
    this.id = id;
    this.name = name;
    this.hand = hand;
    this.discards = [];
    this.melds = [];
    this.playerState = new PlayerState();
    this.lastDiscardTile = null;
    this.lastGetTile = null;
    this.actionListener = null;
    this.score = 50;
  }

  getTile(tile: Tile) {
    this.hand.push(tile);
    this.lastGetTile = tile;
  }

  hasReaction() {
    return this.playerState.canPon || this.playerState.canKan || this.playerState.canRon;
  }

  // 摸牌后检查状态，只需检查
  // 杠、暗杠、自摸
  checkStateWithoutTile() {
    console.log("Start checkStateWithoutTile")
    this.playerState.canKan = this.melds.find(m => m.type === 'pon' && m.tile.value === this.lastGetTile?.value && m.tile.type === this.lastGetTile?.type) !== undefined;
    this.playerState.canAnKan = this.hand.some(t0 => this.hand.filter(t => t.type === t0.type && t.value === t0.value).length === 4);
    this.playerState.canTsumo = canHu(this.hand, this.melds);
    // print player state
    console.log("Player state: ", this.playerState);
  }

  // 对手打牌后检查状态，只需检查
  // 碰、杠、荣和
  checkStateWithTile(tile: Tile) {
    this.playerState.canPon = this.hand.filter(t => t.type === tile.type && t.value === tile.value).length == 2;
    this.playerState.canKan = this.hand.filter(t => t.type === tile.type && t.value === tile.value).length == 3;
    this.playerState.canRon = canHu([...this.hand, tile], this.melds);
  }

  resetState() {
    this.playerState = new PlayerState();
  }

  handleDiscard(tile: Tile) {
    this.discards.push(tile);
    this.hand = this.hand.filter(t => t.id !== tile.id);
    this.lastDiscardTile = tile;
  }

  handlePon(tile: Tile) {
    console.log("Handle pon")
    this.hand = this.hand.filter(t => t.type != tile.type || t.value != tile.value);
    this.melds.push({ tile, type: 'pon' });
  }

  handleKan(tile: Tile) {
    // 明杠有两种形式，一种是加杠，一种是直接杠
    const sameCount = this.hand.filter(t => t.type === tile.type && t.value === tile.value).length;
    if (sameCount === 3) {
      // 直接杠
      this.hand = this.hand.filter(t => t.type != tile.type || t.value != tile.value);
      this.melds.push({ tile, type: 'kan' });
    } else {
      // 加杠
      const ponIndex = this.melds.findIndex(m => m.type === 'pon' && m.tile.value === tile.value && m.tile.type === tile.type);
      if (ponIndex >= 0) {
        this.melds[ponIndex]!.type = 'kan';
      }
      this.hand = this.hand.filter(t => t.id !== tile.id)
    }
  }

  handleAnKan() {
    this.hand = this.hand.filter(t => t.type != this.lastGetTile?.type || t.value != this.lastGetTile?.value);
    this.melds.push({ tile: this.lastGetTile!, type: 'ankan' });
  }

  registerActionListener(listener: (action: PlayerAction) => void) {
    this.actionListener = listener;
    return () => {
      if (this.actionListener === listener) {
        this.actionListener = null;
      }
    }
  }

  emitAction(action: PlayerAction) {
    if (this.actionListener) {
      this.actionListener(action);
    }
  }
};