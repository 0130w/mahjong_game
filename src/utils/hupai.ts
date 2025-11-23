import type { Tile, Meld, TileType } from "./define";

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

// --- 核心算法：拆解手牌 ---

/**
 * 递归拆解手牌，判断是否能组成 4面子 + 1雀头
 * @param allowSequence 是否允许顺子（判断对对胡时设为 false）
 */
function canDecompose(counts: number[], allowSequence: boolean = true): boolean {
  let i = 1;
  while (i <= 9 && counts[i] === 0) i++;

  if (i > 9) return true;

  // 1. 刻子 (AAA)
  if (counts[i]! >= 3) {
    counts[i]! -= 3;
    if (canDecompose(counts, allowSequence)) return true;
    counts[i]! += 3;
  }

  // 2. 顺子 (ABC)
  if (allowSequence && i <= 7 && counts[i + 1]! > 0 && counts[i + 2]! > 0) {
    counts[i]!--;
    counts[i + 1]!--;
    counts[i + 2]!--;
    if (canDecompose(counts, allowSequence)) return true;
    counts[i]!++;
    counts[i + 1]!++;
    counts[i + 2]!++;
  }

  return false;
}

/**
 * 检查标准胡牌 (3n + 2)
 */
function checkStandardHu(tiles: Tile[]): boolean {
  if (tiles.length % 3 !== 2) return false;

  const counts = getHandCounts(tiles);
  const suits: TileType[] = ['man', 'pin', 'sou'];

  for (const suit of suits) {
    for (let v = 1; v <= 9; v++) {
      if (counts[suit][v]! >= 2) {
        // 尝试做雀头
        counts[suit][v]! -= 2;

        let valid = true;
        for (const s of suits) {
          const remainingCount = counts[s].reduce((a, b) => a + b, 0);
          if (remainingCount % 3 !== 0) {
            valid = false;
            break;
          }
          // 允许顺子
          if (!canDecompose([...counts[s]], true)) {
            valid = false;
            break;
          }
        }
        counts[suit][v]! += 2; // 回溯
        if (valid) return true;
      }
    }
  }
  return false;
}

/**
 * 判断是否为对对胡（大对子）：4个刻子 + 1个雀头
 * 前提：已经符合 checkStandardHu，且没有顺子
 */
function isDuiDuiHu(hand: Tile[], winningTile?: Tile): boolean {

  const checkHand = [...hand];
  if (winningTile) checkHand.push(winningTile);
  
  const counts = getHandCounts(checkHand);
  const suits: TileType[] = ['man', 'pin', 'sou'];

  for (const suit of suits) {
    for (let v = 1; v <= 9; v++) {
      if (counts[suit][v]! >= 2) {
        counts[suit][v]! -= 2;
        let valid = true;
        for (const s of suits) {
          if (!canDecompose([...counts[s]], false)) { 
            valid = false;
            break;
          }
        }
        counts[suit][v]! += 2;
        if (valid) return true;
      }
    }
  }
  return false;
}

/**
 * 全带幺：每组面子（刻子、顺子、杠）和雀头都必须包含 1 或 9
 * 这是一个比较复杂的判断，因为同一个牌型可能有多种拆解方式。
 * 简单起见，这里使用简化的验证逻辑：
 * 1. 所有的 Meld 必须带 1/9
 * 2. 手牌部分如果去掉了符合条件的雀头，剩下的必须能分解成带 1/9 的组
 */
function isQuanDaiYao(hand: Tile[], melds: Meld[], winningTile?: Tile): boolean {
  const allMeldsValid = melds.every(m => {
    // 杠/碰必须是 1 或 9
    const val = m.tile.value;
    // 如果是顺子 (chi)，判断是否有 123 (1) 或 789 (9)
    // 这里假设 m.tile 是代表牌。如果暂时没吃，先只看碰杠
    if (m.type === 'pon' || m.type === 'kan' || m.type === 'ankan') {
      return val === 1 || val === 9;
    }
    return false; // 如果有顺子逻辑需要额外判断
  });
  if (!allMeldsValid) return false;

  const checkHand = [...hand];
  if (winningTile) checkHand.push(winningTile);
  
  // 快速过滤：如果手牌里有 4, 5, 6，绝对组不成全带幺 (123, 789, 111, 999 都不含 456)
  if (checkHand.some(t => t.value >= 4 && t.value <= 6)) return false;

  const counts = getHandCounts(checkHand);
  const suits: TileType[] = ['man', 'pin', 'sou'];

  // 辅助：检查这一堆牌能否拆成全带幺的组
  const checkGroup = (c: number[]): boolean => {
    let i = 1;
    while (i <= 9 && c[i] === 0) i++;
    if (i > 9) return true; // 空了

    // 1. 必须优先拆带幺的刻子 (111, 999)
    if ((i === 1 || i === 9) && c[i]! >= 3) {
      c[i]! -= 3;
      if (checkGroup(c)) return true;
      c[i]! += 3;
    }

    // 2. 拆带幺的顺子 (123, 789)
    // 123
    if (i === 1 && c[1]! > 0 && c[2]! > 0 && c[3]! > 0) {
      c[1]!--; c[2]!--; c[3]!--;
      if (checkGroup(c)) return true;
      c[1]!++; c[2]!++; c[3]!++;
    }
    // 789 (i 此时可能是 7)
    if (i === 7 && c[7]! > 0 && c[8]! > 0 && c[9]! > 0) {
      c[7]!--; c[8]!--; c[9]!--;
      if (checkGroup(c)) return true;
      c[7]!++; c[8]!++; c[9]!++;
    }

    return false;
  };

  for (const suit of suits) {
    for (let v of [1, 9]) { // 雀头也必须是 1 或 9
      if (counts[suit][v]! >= 2) {
        counts[suit][v]! -= 2;
        let valid = true;
        for (const s of suits) {
          if (!checkGroup([...counts[s]])) {
            valid = false;
            break;
          }
        }
        counts[suit][v]! += 2;
        if (valid) return true;
      }
    }
  }

  return false;
}

// 七对
function checkQiDui(tiles: Tile[], melds: Meld[]): boolean {
  if (melds.length > 0) return false;
  if (tiles.length !== 14) return false;
  const counts = getHandCounts(tiles);
  let pairCount = 0;
  for (const suit of ['man', 'pin', 'sou'] as TileType[]) {
    for (let v = 1; v <= 9; v++) {
      if (counts[suit][v]! % 2 !== 0) return false;
      pairCount += counts[suit][v]! / 2;
    }
  }
  return pairCount === 7;
}

// 缺一门
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


// --- 导出接口和计算 ---

export interface FanResult {
  fan: number;
  fanTypes: string[];
}

export interface CalcOptions {
  isTsumo?: boolean;         // 是否自摸
  isGang?: boolean;          // 是否杠
  isGangShangHua?: boolean;  // 杠上花
  isGangShangPao?: boolean;  // 杠上炮
  isQiangGang?: boolean;     // 抢杠
  isLastTile?: boolean;      // 海底捞月
  isJinGouDiao?: boolean;    // 金钩钓 (单吊)
}

export function canHu(hand: Tile[], melds: Meld[], winningTile?: Tile): boolean {
  const checkHand = [...hand];
  if (winningTile) checkHand.push(winningTile);
  const allTiles = getAllTiles(hand, melds, winningTile);
  
  // 1. 缺一门检查 (如果你的规则依然必须缺一门，请保留；如果变成了大众规则，请注释掉)
  if (!isQueYiMen(allTiles)) {
    // return false; // 这里暂时保留检查，如需改为大众规则请注释
  }

  // 2. 七对
  if (checkQiDui(checkHand, melds)) return true;

  // 3. 标准胡牌 (现在支持顺子了)
  if (checkStandardHu(checkHand)) return true;

  return false;
}

export function calcFan(hand: Tile[], melds: Meld[], winningTile?: Tile, options: CalcOptions = {}): FanResult {
  if (!canHu(hand, melds, winningTile)) {
    return { fan: 0, fanTypes: [] };
  }

  let fan = 0;
  const fanTypes: string[] = [];

  const checkHand = [...hand];
  if (winningTile) checkHand.push(winningTile);
  const allTiles = getAllTiles(hand, melds, winningTile);

  // --- 2番 役种 ---

  // 七对子 (2番)
  const is7Pairs = checkQiDui(checkHand, melds);
  if (is7Pairs) {
    fan += 2;
    fanTypes.push('七对子');
  }

  // 清一色 (2番)
  if (isQingYiSe(allTiles)) {
    fan += 2;
    fanTypes.push('清一色');
  }

  // 全带幺 (2番)
  if (!is7Pairs && isQuanDaiYao(hand, melds, winningTile)) {
    fan += 2;
    fanTypes.push('全带幺');
  }

  // --- 1番 役种 ---

  // 对对胡 (1番)
  if (!is7Pairs && isDuiDuiHu(hand, winningTile)) {
    fan += 1;
    fanTypes.push('对对胡');
  }

  // 断幺九 (1番)
  if (isDuanYaoJiu(allTiles)) {
    fan += 1;
    fanTypes.push('断幺九');
  }

  // 根 (Root) / 四归一 / 杠 (1番/个)
  // 统计所有牌，每有4张一样的就算1番
  const counts = getHandCounts(allTiles);
  let genCount = 0;
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

  // 杠上炮 (1番)
  if (options.isGangShangPao) {
    fan += 1;
    fanTypes.push('杠上炮');
  }

  // 杠上花 (1番)
  if (options.isGangShangHua) {
    fan += 1;
    fanTypes.push('杠上花');
  }

  // 抢杠 (1番)
  if (options.isQiangGang) {
    fan += 1;
    fanTypes.push('抢杠');
  }

  // 海底捞月 (1番)
  if (options.isLastTile) {
    fan += 1;
    fanTypes.push('海底捞月');
  }

  // 金钩钓 (1番)
  // 必须是碰/杠了4次，手牌只剩1张（单吊），且胡了
  // 逻辑：checkHand.length === 2 (1张手牌+1张胡牌) 且 melds.length === 4
  if (checkHand.length === 2 && melds.length === 4) {
    fan += 1;
    fanTypes.push('金钩钓');
  }
  
  if (fan === 0) {
      fanTypes.push('平和');
  }

  return { fan, fanTypes };
}

export function fanToPoints(fan: number): number {
  const effectiveFan = Math.min(fan, 8); // 封顶
  return 5 * Math.pow(2, effectiveFan);
}