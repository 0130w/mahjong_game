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
}
// 定义游戏阶段
export type GamePhase = 'initial' | 'playing' | 'finished';

// 定义Player ID
export const PlayerID = {
  PLAYER_0 : 0, // 自己
  PLAYER_1 : 1  // 对家
}

export class Player {
  id! : number;
  name!: string;
  hand: Tile[];
  discards: Tile[];
  melds: Meld[];

  constructor(id: number, name: string, hand: Tile[]) {
    this.id = id;
    this.name = name;
    this.hand = hand; 
    this.discards = [];
    this.melds = [];
  }
};