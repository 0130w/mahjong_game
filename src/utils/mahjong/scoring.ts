import type { Tile, Yaku, WinResult } from '../../types/mahjong';
import { ALL_YAKU_CHECKERS, type YakuContext } from './yaku-checker';

export function calculateScore(
  hand: Tile[],
  winTile: Tile,
  isDealer: boolean,
  isTsumo: boolean,
  isRiichi: boolean = true
): WinResult {
  const allTiles = [...hand, winTile];
  const yakuList: Yaku[] = [];
  
  const context: YakuContext = {
    isTsumo,
    isDealer,
    isRiichi,
    isMenzen: true,
  };
  
  for (const checker of ALL_YAKU_CHECKERS) {
    if (checker.check(allTiles, winTile, context)) {
      yakuList.push({
        name: checker.name,
        han: checker.han
      });
    }
  }
  
  const totalHan = yakuList.reduce((sum, yaku) => sum + yaku.han, 0);
  const fu = calculateFu(allTiles, winTile, context);
  const score = calculatePoints(totalHan, fu, isDealer, isTsumo);
  
  return {
    isWin: yakuList.length > 0,
    yakuList,
    han: totalHan,
    fu,
    score
  };
}

function calculateFu(hand: Tile[], winTile: Tile, context: YakuContext): number {
  let fu = 20;
  
  if (context.isMenzen && !context.isTsumo) {
    fu += 10;
  }
  
  if (context.isTsumo) {
    fu += 2;
  }
  
  return Math.ceil(fu / 10) * 10;
}

function calculatePoints(han: number, fu: number, isDealer: boolean, isTsumo: boolean): number {
  if (han >= 13) {
    const yakumanCount = Math.floor(han / 13);
    if (isTsumo) {
      return isDealer ? 16000 * yakumanCount : 8000 * yakumanCount;
    } else {
      return isDealer ? 48000 * yakumanCount : 32000 * yakumanCount;
    }
  }
  
  if (han >= 11) {
    return isDealer ? 36000 : 24000;
  }
  
  if (han >= 8) {
    return isDealer ? 24000 : 16000;
  }
  
  if (han >= 6) {
    return isDealer ? 18000 : 12000;
  }
  
  if (han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    return isDealer ? 12000 : 8000;
  }
  
  const basePoints = fu * Math.pow(2, 2 + han);
  
  if (isTsumo) {
    if (isDealer) {
      const perPlayer = Math.ceil(basePoints * 2 / 100) * 100;
      return perPlayer * 3;
    } else {
      const fromDealer = Math.ceil(basePoints * 2 / 100) * 100;
      const fromPlayer = Math.ceil(basePoints / 100) * 100;
      return fromDealer + fromPlayer * 2;
    }
  } else {
    if (isDealer) {
      return Math.ceil(basePoints * 6 / 100) * 100;
    } else {
      return Math.ceil(basePoints * 4 / 100) * 100;
    }
  }
}

export function hasYaku(hand: Tile[], winTile: Tile, context: YakuContext): boolean {
  const allTiles = [...hand, winTile];
  
  for (const checker of ALL_YAKU_CHECKERS) {
    if (checker.check(allTiles, winTile, context)) {
      return true;
    }
  }
  
  return false;
}

export function getYakuList(hand: Tile[], winTile: Tile, context: YakuContext): Yaku[] {
  const allTiles = [...hand, winTile];
  const yakuList: Yaku[] = [];
  
  for (const checker of ALL_YAKU_CHECKERS) {
    if (checker.check(allTiles, winTile, context)) {
      yakuList.push({
        name: checker.name,
        han: checker.han
      });
    }
  }
  
  return yakuList;
}
