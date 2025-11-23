import type { Tile, Meld, TileType } from "./define";

// 辅助：统计手牌张数
function getHandCounts(tiles: Tile[]): Record<TileType, number[]> {
  const counts: Record<TileType, number[]> = {
    man: Array(10).fill(0),
    pin: Array(10).fill(0),
    sou: Array(10).fill(0),
  };
  for (const t of tiles) {
    if (t.value >= 1 && t.value <= 9) {
      counts[t.type]![t.value]!++;
    }
  }
  return counts;
}

// 辅助：获取包含点炮牌在内的所有牌（用于判断清一色、缺一门）
function getAllTiles(hand: Tile[], melds: Meld[], winningTile?: Tile): Tile[] {
  const tiles = [...hand];
  if (winningTile) {
    tiles.push(winningTile);
  }
  for (const m of melds) {
    const count = (m.type === 'kan' || m.type === 'ankan') ? 4 : 3;
    for (let i = 0; i < count; i++) {
      tiles.push(m.tile);
    }
  }
  return tiles;
}

/**
 * 核心算法：递归判断是否可以全部分解为刻子（AAA）
 * 注意：四川麻将没有顺子（ABC），所以去掉了顺子判断逻辑
 */
function canDecompose(counts: number[]): boolean {
  // 找到第一个还有剩余牌的位置
  let i = 1;
  while (i <= 9 && counts[i] === 0) i++;

  // 如果都检查完了，说明全部分解成功
  if (i > 9) return true;

  // 尝试拆刻子 (AAA)
  if (counts[i]! >= 3) {
    counts[i]! -= 3;
    if (canDecompose(counts)) return true;
    counts[i]! += 3; // 回溯
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

/**
 * 检查基本胡牌型 (4面子 + 1雀头)
 * tiles: 必须是已经包含点炮牌的 14 张（或 11、8、5、2 张）手牌
 */
function checkStandardHu(tiles: Tile[]): boolean {
  // 标准胡牌手牌数一定是 3n + 2
  if (tiles.length % 3 !== 2) return false;

  const counts = getHandCounts(tiles);
  const suits: TileType[] = ['man', 'pin', 'sou'];

  // 1. 尝试定将（雀头）
  for (const suit of suits) {
    for (let v = 1; v <= 9; v++) {
      if (counts[suit][v]! >= 2) {
        // 假设这个是雀头，移除它
        counts[suit][v]! -= 2;

        // 2. 检查剩下的牌能否全部拆解为刻子
        let valid = true;
        for (const s of suits) {
          // 这一色的牌总数必须是 3 的倍数（因为去掉了对子）
          const remainingCount = counts[s].reduce((a, b) => a + b, 0);
          if (remainingCount % 3 !== 0) {
            valid = false;
            break;
          }
          // 递归检查这一色
          if (!canDecompose([...counts[s]])) {
            valid = false;
            break;
          }
        }

        // 还原计数（回溯），以便尝试下一对雀头
        counts[suit][v]! += 2;

        if (valid) return true;
      }
    }
  }

  return false;
}

/**
 * 检查七对子
 * 前提：必须没有副露（门清），且手牌为 14 张
 */
function checkQiDui(tiles: Tile[], melds: Meld[]): boolean {
  if (melds.length > 0) return false;
  if (tiles.length !== 14) return false;

  const counts = getHandCounts(tiles);
  let pairCount = 0;

  for (const suit of ['man', 'pin', 'sou'] as TileType[]) {
    for (let v = 1; v <= 9; v++) {
      const c = counts[suit][v];
      if (c === 0) continue;
      // 七对子必须全是成对的，不能有单张或 3 张（除了4张当2对算）
      if (c! % 2 !== 0) return false; 
      pairCount += c! / 2;
    }
  }
  // 实际上如果是 14 张且没有单张，必然是 7 对，但显式判断更安全
  return pairCount === 7;
}

// 缺一门：必须缺一门花色
function isQueYiMen(allTiles: Tile[]): boolean {
  const typeSet = new Set<TileType>();
  allTiles.forEach(t => typeSet.add(t.type));
  return typeSet.size <= 2;
}

// 清一色
function isQingYiSe(allTiles: Tile[]): boolean {
  const typeSet = new Set<TileType>();
  allTiles.forEach(t => typeSet.add(t.type));
  return typeSet.size === 1;
}

// 断幺九
function isDuanYaoJiu(allTiles: Tile[]): boolean {
  return allTiles.every(t => t.value >= 2 && t.value <= 8);
}

export interface FanResult {
  fan: number;
  fanTypes: string[];
}

/**
 * 统一判胡入口
 * @param hand 手中的牌（未包含点炮牌）
 * @param melds 已碰/杠的牌
 * @param winningTile 点炮的那张牌（如果是自摸，则不需要传，或者在 hand 里已经有了）
 */
export function canHu(hand: Tile[], melds: Meld[], winningTile?: Tile): boolean {
  // 构造完整的手牌用于判断（Hand + WinningTile）
  const checkHand = [...hand];
  if (winningTile) {
    checkHand.push(winningTile);
  }

  // 构造全场牌（Hand + WinningTile + Melds）用于判断缺一门等
  const allTiles = getAllTiles(hand, melds, winningTile);
  
  // 1. 硬性规则：必须缺一门
  if (!isQueYiMen(allTiles)) {
    return false;
  }

  // 2. 检查七对
  if (checkQiDui(checkHand, melds)) return true;

  // 3. 检查基本牌型 (碰碰胡逻辑包含在这里面，因为川麻只看刻子)
  if (checkStandardHu(checkHand)) return true;

  return false;
}

export function calcFan(hand: Tile[], melds: Meld[], winningTile?: Tile): FanResult {
  if (!canHu(hand, melds, winningTile)) {
    return { fan: 0, fanTypes: [] };
  }

  let fan = 0;
  const fanTypes: string[] = [];
  
  // 构造全场牌数据
  const checkHand = [...hand];
  if (winningTile) checkHand.push(winningTile);
  const allTiles = getAllTiles(hand, melds, winningTile);

  // --- 番型计算 ---

  // 清一色 (通常 2-4 番，这里按你的逻辑设为 2)
  if (isQingYiSe(allTiles)) {
    fan += 2;
    fanTypes.push('清一色');
  }

  // 七对 (通常 2-4 番)
  if (checkQiDui(checkHand, melds)) {
    fan += 2;
    fanTypes.push('七对');
  } else {
      // 如果不是七对，那就有可能是对对胡（碰碰胡）
      // 川麻中因为没有顺子，只要不是七对，能胡就基本是对应“碰碰胡”的牌型（全是刻子）
      // 但标准川麻“大对子”需要显式加番
      fan += 1;
      fanTypes.push('大对子');
  }

  // 断幺九
  if (isDuanYaoJiu(allTiles)) {
    fan += 1;
    fanTypes.push('断幺九');
  }

  // 根 (Root)：4张一样的牌（杠了算，手持4张未杠也算）
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
  
  return { fan, fanTypes };
}

export function fanToPoints(fan: number): number {
  const MAX_FAN = 8; // 封顶番数
  const effectiveFan = Math.min(fan, MAX_FAN);
  return 5 * Math.pow(2, effectiveFan); // 这里的底分计算依具体规则而定
}