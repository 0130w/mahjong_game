import type { Tile } from '../../types/mahjong';
import type { TileGroup, WinningPattern, ReadyInfo } from './types';

export function groupTiles(hand: Tile[]): Map<string, TileGroup> {
  const map = new Map<string, TileGroup>();
  
  hand.forEach(tile => {
    const key = `${tile.type}-${tile.value}`;
    const existing = map.get(key);
    
    if (existing) {
      existing.count++;
    } else {
      map.set(key, {
        key,
        type: tile.type,
        value: tile.value,
        count: 1
      });
    }
  });
  
  return map;
}

export function checkWin(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  
  const grouped = groupTiles(hand);
  return canFormWinningHand(grouped);
}

function canFormWinningHand(tiles: Map<string, TileGroup>): boolean {
  const counts = Array.from(tiles.values()).map(g => g.count);
  
  if (counts.length === 7 && counts.every(c => c === 2)) {
    return true;
  }
  
  const totalTiles = counts.reduce((sum, c) => sum + c, 0);
  if (totalTiles === 14) {
    for (const [key, group] of tiles.entries()) {
      if (group.count >= 2) {
        const remaining = new Map(tiles);
        const newGroup = { ...group, count: group.count - 2 };
        
        if (newGroup.count === 0) {
          remaining.delete(key);
        } else {
          remaining.set(key, newGroup);
        }
        
        if (canFormMelds(remaining)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

function canFormMelds(tiles: Map<string, TileGroup>): boolean {
  const totalTiles = Array.from(tiles.values()).reduce((sum, g) => sum + g.count, 0);
  if (totalTiles === 0) return true;
  if (totalTiles % 3 !== 0) return false;
  
  const entries = Array.from(tiles.entries()).filter(([_, group]) => group.count > 0);
  if (entries.length === 0) return true;
  
  entries.sort((a, b) => {
    const groupA = a[1];
    const groupB = b[1];
    
    if (groupA.type !== groupB.type) {
      const typeOrder: Record<string, number> = { man: 0, pin: 1, sou: 2, honor: 3 };
      return (typeOrder[groupA.type] || 0) - (typeOrder[groupB.type] || 0);
    }
    return groupA.value - groupB.value;
  });
  
  const [firstKey, firstGroup] = entries[0]!;
  
  if (firstGroup.count >= 3) {
    const newTiles = new Map(tiles);
    const newGroup = { ...firstGroup, count: firstGroup.count - 3 };
    
    if (newGroup.count === 0) {
      newTiles.delete(firstKey);
    } else {
      newTiles.set(firstKey, newGroup);
    }
    
    if (canFormMelds(newTiles)) return true;
  }
  
  if (firstGroup.type !== 'honor' && firstGroup.value <= 7) {
    const key2 = `${firstGroup.type}-${firstGroup.value + 1}`;
    const key3 = `${firstGroup.type}-${firstGroup.value + 2}`;
    const group2 = tiles.get(key2);
    const group3 = tiles.get(key3);
    
    if (group2 && group2.count > 0 && group3 && group3.count > 0) {
      const newTiles = new Map(tiles);
      
      const newGroup1 = { ...firstGroup, count: firstGroup.count - 1 };
      const newGroup2 = { ...group2, count: group2.count - 1 };
      const newGroup3 = { ...group3, count: group3.count - 1 };
      
      if (newGroup1.count === 0) newTiles.delete(firstKey);
      else newTiles.set(firstKey, newGroup1);
      
      if (newGroup2.count === 0) newTiles.delete(key2);
      else newTiles.set(key2, newGroup2);
      
      if (newGroup3.count === 0) newTiles.delete(key3);
      else newTiles.set(key3, newGroup3);
      
      if (canFormMelds(newTiles)) return true;
    }
  }
  
  return false;
}

/**
 * 检查是否听牌
 * 听牌 = 手牌 + 任意1张牌 = 和牌
 * 和牌 = n个面子(0-4) + 1个对子
 * 所以听牌时手牌数量 = n×3 + 2 - 1 = n×3 + 1 张
 * 有效数量：1, 4, 7, 10, 13 张
 */
export function checkReady(hand: Tile[]): boolean {
  // 手牌数量必须是 1, 4, 7, 10, 13 张之一
  const validCounts = [1, 4, 7, 10, 13];
  if (!validCounts.includes(hand.length)) return false;
  
  const allPossibleTiles = createAllUniqueTiles();
  
  // 尝试每一张可能的牌，看加上后能否和牌
  for (const tile of allPossibleTiles) {
    if (checkWin([...hand, tile])) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取等待的牌（听哪些牌）
 */
export function getWaitingTiles(hand: Tile[]): Tile[] {
  // 手牌数量必须是 1, 4, 7, 10, 13 张之一
  const validCounts = [1, 4, 7, 10, 13];
  if (!validCounts.includes(hand.length)) return [];
  
  const allPossibleTiles = createAllUniqueTiles();
  const waitingTiles: Tile[] = [];
  
  // 尝试每一张可能的牌，看加上后能否和牌
  for (const tile of allPossibleTiles) {
    if (checkWin([...hand, tile])) {
      waitingTiles.push(tile);
    }
  }
  
  return waitingTiles;
}

export function getReadyInfo(hand: Tile[]): ReadyInfo {
  const waitingTiles = getWaitingTiles(hand);
  
  return {
    isReady: waitingTiles.length > 0,
    waitingTiles,
    winningPatterns: []
  };
}

function createAllUniqueTiles(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;
  
  for (let i = 1; i <= 9; i++) {
    tiles.push({
      id: `man-${i}-${id++}`,
      type: 'man',
      value: i,
      display: `${i}万`
    });
  }
  
  for (let i = 1; i <= 9; i++) {
    tiles.push({
      id: `pin-${i}-${id++}`,
      type: 'pin',
      value: i,
      display: `${i}筒`
    });
  }
  
  for (let i = 1; i <= 9; i++) {
    tiles.push({
      id: `sou-${i}-${id++}`,
      type: 'sou',
      value: i,
      display: `${i}索`
    });
  }
  
  const honors = ['东', '南', '西', '北', '白', '发', '中'];
  for (let i = 1; i <= 7; i++) {
    tiles.push({
      id: `honor-${i}-${id++}`,
      type: 'honor',
      value: i,
      display: honors[i - 1]!
    });
  }
  
  return tiles;
}

export function analyzeWinningPatterns(hand: Tile[]): WinningPattern[] {
  return [];
}
