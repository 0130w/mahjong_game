// 麻将牌类型
export type TileType = 'man' | 'pin' | 'sou'; // 万、筒、索

// 麻将牌
export interface Tile {
  id: string;       // type-value-copy-id
  type: TileType;
  value: number;    // 1-9 for man/pin/sou
  display: string;  // 显示文本: 一万...
}

// 副露
export interface Meld {
  tiles: Tile[];
};

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

export class Player {
  id: number;
  name: string;
  hand: Tile[];
  discards: Tile[];
  melds: Meld[];
  playerState: PlayerState;
  lastDiscardTile: Tile | null;
  lastGetTile: Tile | null;

  constructor(id: number, name: string, hand: Tile[]) {
    this.id = id;
    this.name = name;
    this.hand = hand;
    this.discards = [];
    this.melds = [];
    this.playerState = new PlayerState();
    this.lastDiscardTile = null;
    this.lastGetTile = null;
  }

  // 摸牌后检查状态，只需检查
  // 杠、暗杠、自摸
  checkStateWithoutTile() {
  }

  // 对手打牌后检查状态，只需检查
  // 碰、杠、荣和
  checkStateWithTile(tile: Tile) {

  }

  resetState() {
    this.playerState = new PlayerState();
  }

  handleDiscard(tile: Tile) {
    this.discards.push(tile);
    this.hand = this.hand.filter(t => t.id !== tile.id);
  }

  handleKan(tile: Tile) {

  }

  handleAnKan() {

  }
};