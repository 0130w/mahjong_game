import type { Tile } from '../../types/mahjong';
import { groupTiles } from './win-checker';

export interface YakuChecker {
  name: string;
  han: number;
  check: (hand: Tile[], winTile: Tile, context: YakuContext) => boolean;
}

export interface YakuContext {
  isTsumo: boolean;
  isDealer: boolean;
  isRiichi: boolean;
  isMenzen: boolean;
}

export const checkRiichi: YakuChecker = {
  name: '立直',
  han: 1,
  check: (hand, winTile, context) => {
    return context.isRiichi;
  }
};

export const checkMenzenTsumo: YakuChecker = {
  name: '门前清自摸和',
  han: 1,
  check: (hand, winTile, context) => {
    return context.isTsumo && context.isMenzen;
  }
};

export const checkTanyao: YakuChecker = {
  name: '断幺九',
  han: 1,
  check: (hand, winTile, context) => {
    const allTiles = [...hand, winTile];
    return allTiles.every(tile => {
      if (tile.type === 'honor') return false;
      return tile.value >= 2 && tile.value <= 8;
    });
  }
};

export const checkPinfu: YakuChecker = {
  name: '平和',
  han: 1,
  check: (hand, winTile, context) => {
    if (!context.isMenzen) return false;
    
    const allTiles = [...hand, winTile];
    return allTiles.every(tile => tile.type !== 'honor');
  }
};

export const checkIipeikou: YakuChecker = {
  name: '一杯口',
  han: 1,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkChiitoi: YakuChecker = {
  name: '七对子',
  han: 2,
  check: (hand, winTile, context) => {
    const allTiles = [...hand, winTile];
    if (allTiles.length !== 14) return false;
    
    const grouped = groupTiles(allTiles);
    const counts = Array.from(grouped.values()).map(g => g.count);
    
    return counts.length === 7 && counts.every(c => c === 2);
  }
};

export const checkToitoi: YakuChecker = {
  name: '对对和',
  han: 2,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkSanankou: YakuChecker = {
  name: '三暗刻',
  han: 2,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkChanta: YakuChecker = {
  name: '混全带幺九',
  han: 2,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkSanshoku: YakuChecker = {
  name: '三色同顺',
  han: 2,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkIttsu: YakuChecker = {
  name: '一气通贯',
  han: 2,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkHonitsu: YakuChecker = {
  name: '混一色',
  han: 3,
  check: (hand, winTile, context) => {
    const allTiles = [...hand, winTile];
    const types = new Set(allTiles.map(t => t.type));
    
    if (types.size === 1) return false;
    if (types.size > 2) return false;
    
    return types.has('honor') && types.size === 2;
  }
};

export const checkJunchan: YakuChecker = {
  name: '纯全带幺九',
  han: 3,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkRyanpeikou: YakuChecker = {
  name: '二杯口',
  han: 3,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkChinitsu: YakuChecker = {
  name: '清一色',
  han: 6,
  check: (hand, winTile, context) => {
    const allTiles = [...hand, winTile];
    const types = new Set(allTiles.map(t => t.type));
    return types.size === 1 && !types.has('honor');
  }
};

export const checkKokushi: YakuChecker = {
  name: '国士无双',
  han: 13,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkSuuankou: YakuChecker = {
  name: '四暗刻',
  han: 13,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const checkDaisangen: YakuChecker = {
  name: '大三元',
  han: 13,
  check: (hand, winTile, context) => {
    return false;
  }
};

export const ALL_YAKU_CHECKERS: YakuChecker[] = [
  checkRiichi,
  checkMenzenTsumo,
  checkTanyao,
  checkPinfu,
  checkIipeikou,
  checkChiitoi,
  checkToitoi,
  checkSanankou,
  checkChanta,
  checkSanshoku,
  checkIttsu,
  checkHonitsu,
  checkJunchan,
  checkRyanpeikou,
  checkChinitsu,
  checkKokushi,
  checkSuuankou,
  checkDaisangen,
];

export function getYakuChecker(name: string): YakuChecker | undefined {
  return ALL_YAKU_CHECKERS.find(checker => checker.name === name);
}
