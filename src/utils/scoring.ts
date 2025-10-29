import type { Tile, Yaku, WinResult } from '../types/mahjong';

// 简化的日麻计分系统
export function calculateScore(hand: Tile[], winTile: Tile, isDealer: boolean, isTsumo: boolean): WinResult {
  const yakuList: Yaku[] = [];
  
  // 检查役种
  if (checkRiichi(hand)) {
    yakuList.push({ name: '立直', han: 1 });
  }
  
  if (checkTanyao(hand)) {
    yakuList.push({ name: '断幺九', han: 1 });
  }
  
  if (checkPinfu(hand)) {
    yakuList.push({ name: '平和', han: 1 });
  }
  
  if (checkChiitoi(hand)) {
    yakuList.push({ name: '七对子', han: 2 });
  }
  
  if (checkHonitsu(hand)) {
    yakuList.push({ name: '混一色', han: 3 });
  }
  
  if (checkChinitsu(hand)) {
    yakuList.push({ name: '清一色', han: 6 });
  }
  
  if (isTsumo) {
    yakuList.push({ name: '门前清自摸和', han: 1 });
  }
  
  // 计算总番数
  const totalHan = yakuList.reduce((sum, yaku) => sum + yaku.han, 0);
  
  // 计算符（简化为30符）
  const fu = 30;
  
  // 计算点数
  const score = calculatePoints(totalHan, fu, isDealer);
  
  return {
    isWin: yakuList.length > 0,
    yakuList,
    han: totalHan,
    fu,
    score
  };
}

// 计算点数
function calculatePoints(han: number, fu: number, isDealer: boolean): number {
  if (han >= 13) {
    return isDealer ? 48000 : 32000; // 役满
  } else if (han >= 11) {
    return isDealer ? 36000 : 24000; // 三倍满
  } else if (han >= 8) {
    return isDealer ? 24000 : 16000; // 倍满
  } else if (han >= 6) {
    return isDealer ? 18000 : 12000; // 跳满
  } else if (han >= 5) {
    return isDealer ? 12000 : 8000; // 满贯
  } else if (han >= 4) {
    return isDealer ? 12000 : 8000; // 满贯
  } else if (han >= 3) {
    const base = fu * Math.pow(2, 2 + han);
    return isDealer ? Math.ceil(base * 6 / 100) * 100 : Math.ceil(base * 4 / 100) * 100;
  } else {
    const base = fu * Math.pow(2, 2 + han);
    return isDealer ? Math.ceil(base * 6 / 100) * 100 : Math.ceil(base * 4 / 100) * 100;
  }
}

// 检查立直（简化：假设听牌即立直）
function checkRiichi(hand: Tile[]): boolean {
  return true; // 简化实现
}

// 检查断幺九
function checkTanyao(hand: Tile[]): boolean {
  return hand.every(tile => {
    if (tile.type === 'honor') return false;
    return tile.value >= 2 && tile.value <= 8;
  });
}

// 检查平和
function checkPinfu(hand: Tile[]): boolean {
  // 简化实现
  return hand.every(tile => tile.type !== 'honor');
}

// 检查七对子
function checkChiitoi(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  
  const grouped = groupTiles(hand);
  const counts = Array.from(grouped.values());
  
  return counts.length === 7 && counts.every(c => c === 2);
}

// 检查混一色
function checkHonitsu(hand: Tile[]): boolean {
  const types = new Set(hand.map(t => t.type));
  
  if (types.size === 1) return false; // 清一色
  if (types.size > 2) return false;
  
  return types.has('honor') && types.size === 2;
}

// 检查清一色
function checkChinitsu(hand: Tile[]): boolean {
  const types = new Set(hand.map(t => t.type));
  return types.size === 1 && !types.has('honor');
}

// 辅助函数：分组牌
function groupTiles(hand: Tile[]): Map<string, number> {
  const map = new Map<string, number>();
  hand.forEach(tile => {
    const key = `${tile.type}-${tile.value}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}
