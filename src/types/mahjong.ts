// 麻将牌类型
export type TileType = 'man' | 'pin' | 'sou' | 'honor'; // 万、筒、索、字牌

// 麻将牌
export interface Tile {
  id: string;
  type: TileType;
  value: number; // 1-9 for man/pin/sou, 1-7 for honor (东南西北白发中)
  display: string;
}

export interface MeldGroup {
  type: 'pon' | 'kan' | 'chi' | 'ankan';
  tiles: Tile[];
  isOpen: boolean;
  fromPlayer?: number;
  calledTileId?: string; // 从对手那里获得的牌的ID
}

export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  discards: Tile[];
  melds: MeldGroup[];
  isDealer: boolean;
  hasDeclaredReady: boolean;
  score: number;
  lastDrawnTileId?: string; // 最后摸的牌的ID，用于显示间隔
}

export type GamePhase = 'initial' | 'playing' | 'can_declare_ready' | 'ready_declared' | 'guessing' | 'draw_four' | 'finished' | 'waiting_meld';

export type MeldAction = 'pon' | 'kan' | 'chi' | 'ankan' | 'ron' | 'skip';

export interface MeldOption {
  action: MeldAction;
  tiles: Tile[];
  playerIndex: number;
}

export interface GameState {
  phase: GamePhase;
  wall: Tile[];
  players: Player[];
  currentPlayerIndex: number;
  dealerIndex: number;
  readyPlayerIndex: number | null;
  guessedTiles: Tile[];
  drawnFourTiles: Tile[];
  roundNumber: number;
  consecutiveDealerWins: number;
  hasDrawnThisTurn: boolean;
  drawFourCount: number;
  aiSelectingTileId: string | null;
  lastDiscardedTile: Tile | null;
  lastDiscardPlayerIndex: number | null;
  availableMeldOptions: MeldOption[];
}

// 役种（简化版日麻）
export interface Yaku {
  name: string;
  han: number;
}

// 和牌结果
export interface WinResult {
  isWin: boolean;
  yakuList: Yaku[];
  han: number;
  fu: number;
  score: number;
}
