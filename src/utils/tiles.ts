import type { Tile, TileType } from '../utils/define';

// 创建牌山
export function createFullWall(): Tile[] {
  const wall: Tile[] = [];
  let idCounter = 0;

  // 每种牌4张
  const types: TileType[] = ['man', 'pin', 'sou'];

  types.forEach(type => {
    const maxValue = 9;
    for (let value = 1; value <= maxValue; value++) {
      for (let copy = 0; copy < 4; copy++) {
        wall.push({
          id: `${type}-${value}-${copy}-${idCounter++}`,
          type,
          value,
        });
      }
    }
  });

  return wall;
}

// 洗牌逻辑
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

// 发牌逻辑，从牌山中取出count张牌
export function dealTiles(wall: Tile[], count: number): { dealt: Tile[], remaining: Tile[] } {
  const dealt = wall.slice(0, count);
  const remaining = wall.slice(count);
  return { dealt, remaining };
}

// 手牌排序
export function sortHand(hand: Tile[]): Tile[] {
  const typeOrder: Record<TileType, number> = { man: 0, pin: 1, sou: 2 };

  return [...hand].sort((a, b) => {
    if (a.type !== b.type) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return a.value - b.value;
  });
}