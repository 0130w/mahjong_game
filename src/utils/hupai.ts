import type { Tile, Meld, TileType } from "./define";

function getHandCounts(hand: Tile[]): Record<TileType, number[]> {
  const counts: Record<TileType, number[]> = {
    man: Array(10).fill(0),
    pin: Array(10).fill(0),
    sou: Array(10).fill(0),
  };
  for (const t of hand) {
    if (t.value >= 1 && t.value <= 9) {
      counts[t.type]![t.value]!++;
    }
  }
  return counts;
}

function getAllTiles(hand: Tile[], melds: Meld[]): Tile[] {
  const tiles = [...hand];
  for (const m of melds) {
    const count = (m.type === 'kan' || m.type === 'ankan') ? 4 : 3;
    for (let i = 0; i < count; i++) {
      tiles.push(m.tile);
    }
  }
  return tiles;
}

function canDecompose(counts: number[]): boolean {
  let i = 1;
  while (i <= 9 && counts[i] === 0) i++;

  if (i > 9) return true;

  if (counts[i]! >= 3) {
    counts[i]! -= 3;
    if (canDecompose(counts)) return true;
    counts[i]! += 3;
  }

  if (i <= 7 && counts[i + 1]! > 0 && counts[i + 2]! > 0) {
    counts[i]!--;
    counts[i + 1]!--;
    counts[i + 2]!--;
    if (canDecompose(counts)) return true;
    counts[i]!++;
    counts[i + 1]!++;
    counts[i + 2]!++;
  }

  return false;
}

function checkStandardHu(hand: Tile[]): boolean {
  if (hand.length % 3 !== 2) return false;

  const counts = getHandCounts(hand);
  const suits: TileType[] = ['man', 'pin', 'sou'];

  for (const suit of suits) {
    for (let v = 1; v <= 9; v++) {
      if (counts[suit]![v]! >= 2) {
        counts[suit]![v]! -= 2;

        let allSuitsValid = true;
        for (const s of suits) {
          const remainingCount = counts[s].reduce((a, b) => a + b, 0);
          if (remainingCount % 3 !== 0) {
            allSuitsValid = false;
            break;
          }
          
          if (!canDecompose([...counts[s]])) {
            allSuitsValid = false;
            break;
          }
        }

        counts[suit]![v]! += 2;

        if (allSuitsValid) {
          return true;
        }
      }
    }
  }

  return false;
}

function checkQiDui(hand: Tile[], melds: Meld[]): boolean {
  if (melds.length > 0) return false;
  if (hand.length !== 14) return false;

  const counts = getHandCounts(hand);
  let pairCount = 0;

  for (const suit of ['man', 'pin', 'sou'] as TileType[]) {
    for (let v = 1; v <= 9; v++) {
      const c = counts[suit][v];
      if (c === 0) continue;
      if (c! % 2 !== 0) return false;
      pairCount += c! / 2;
    }
  }
  return pairCount === 7;
}

function isQueYiMen(allTiles: Tile[]): boolean {
  const typeSet = new Set<TileType>();
  allTiles.forEach(t => typeSet.add(t.type));
  return typeSet.size <= 2;
}

function isQingYiSe(allTiles: Tile[]): boolean {
  const typeSet = new Set<TileType>();
  allTiles.forEach(t => typeSet.add(t.type));
  return typeSet.size === 1;
}

function isDuanYaoJiu(allTiles: Tile[]): boolean {
  return allTiles.every(t => t.value >= 2 && t.value <= 8);
}

export interface FanResult {
  fan: number;
  fanTypes: string[];
}

export function canHu(hand: Tile[], melds: Meld[]): boolean {
  const allTiles = getAllTiles(hand, melds);
  
  if (!isQueYiMen(allTiles)) {
    return false;
  }

  if (checkQiDui(hand, melds)) return true;

  if (checkStandardHu(hand)) return true;

  return false;
}

export function calcFan(hand: Tile[], melds: Meld[]): FanResult {
  if (!canHu(hand, melds)) {
    return { fan: 0, fanTypes: [] };
  }

  let fan = 0;
  const fanTypes: string[] = [];
  const allTiles = getAllTiles(hand, melds);

  if (checkQiDui(hand, melds)) {
    fan += 2;
    fanTypes.push('七对');
  }

  if (isQingYiSe(allTiles)) {
    fan += 2;
    fanTypes.push('清一色');
  }

  if (isDuanYaoJiu(allTiles)) {
    fan += 1;
    fanTypes.push('断幺九');
  }

  let genCount = 0;
  const counts = getHandCounts(allTiles);
  (['man', 'pin', 'sou'] as TileType[]).forEach((suit) => {
    counts[suit].forEach((count: number) => {
      if (count === 4) {
        genCount++;
      }
    });
  });

  if (genCount > 0) {
    fan += genCount;
    fanTypes.push(`根 x${genCount}`);
  }

  // TODO: 碰碰胡、金钩钓 等其他番型可在此扩展
  
  return { fan, fanTypes };
}

export function fanToPoints(fan: number): number {
  const MAX_FAN = 8;
  const effectiveFan = Math.min(fan, MAX_FAN);
  return 5 * Math.pow(2, effectiveFan);
}