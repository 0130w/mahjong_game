import type { Tile } from '../../types/mahjong';

export interface TileGroup {
  key: string;
  type: string;
  value: number;
  count: number;
}

export type MeldType = 'shuntsu' | 'koutsu' | 'pair';

export interface Meld {
  type: MeldType;
  tiles: string[];
}

export interface WinningPattern {
  pair: string;
  melds: Meld[];
  isChiitoi: boolean;
  isKokushi: boolean;
}

export interface ReadyInfo {
  isReady: boolean;
  waitingTiles: Tile[];
  winningPatterns: WinningPattern[];
}
