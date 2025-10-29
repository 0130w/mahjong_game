import type { Tile, TileType } from '../types/mahjong';

const TILE_DISPLAY: Record<TileType, string[]> = {
  man: ['一万', '二万', '三万', '四万', '五万', '六万', '七万', '八万', '九万'],
  pin: ['一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒'],
  sou: ['一索', '二索', '三索', '四索', '五索', '六索', '七索', '八索', '九索'],
  honor: ['东', '南', '西', '北', '白', '发', '中']
};

export function createFullWall(): Tile[] {
  const wall: Tile[] = [];
  let idCounter = 0;

  // 每种牌4张
  const types: TileType[] = ['man', 'pin', 'sou', 'honor'];
  
  types.forEach(type => {
    const maxValue = type === 'honor' ? 7 : 9;
    for (let value = 1; value <= maxValue; value++) {
      for (let copy = 0; copy < 4; copy++) {
        wall.push({
          id: `${type}-${value}-${copy}-${idCounter++}`,
          type,
          value,
          display: TILE_DISPLAY[type][value - 1]!
        });
      }
    }
  });

  return wall;
}

export function shuffleWall(wall: Tile[]): Tile[] {
  const shuffled = [...wall];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

export function dealTiles(wall: Tile[], count: number): { dealt: Tile[], remaining: Tile[] } {
  const dealt = wall.slice(0, count);
  const remaining = wall.slice(count);
  return { dealt, remaining };
}

export function sortHand(hand: Tile[]): Tile[] {
  const typeOrder: Record<TileType, number> = { man: 0, pin: 1, sou: 2, honor: 3 };
  
  return [...hand].sort((a, b) => {
    if (a.type !== b.type) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return a.value - b.value;
  });
}
