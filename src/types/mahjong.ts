// 麻将牌类型
export type TileType = 'man' | 'pin' | 'sou' | 'honor'; // 万、筒、索、字牌

// 麻将牌
export interface Tile {
  id: string;
  type: TileType;
  value: number; // 1-9 for man/pin/sou, 1-7 for honor (东南西北白发中)
  display: string;
}

// 玩家
export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  discards: Tile[];
  isDealer: boolean;
  hasDeclaredReady: boolean;
  score: number;
}

// 游戏阶段
export type GamePhase = 'initial' | 'playing' | 'can_declare_ready' | 'ready_declared' | 'guessing' | 'draw_four' | 'finished';

// 游戏状态
export interface GameState {
  phase: GamePhase;
  wall: Tile[];
  players: Player[];
  currentPlayerIndex: number;
  dealerIndex: number;
  readyPlayerIndex: number | null;
  guessedTiles: Tile[];
  drawnFourTiles: Tile[]; // 摸到的4张牌（用于显示）
  roundNumber: number;
  consecutiveDealerWins: number;
  hasDrawnThisTurn: boolean; // 当前回合是否已摸牌
  drawFourCount: number; // 摸4张牌的次数
  aiSelectingTileId: string | null; // AI正在选择的牌ID
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
