import type { Tile } from '../../types/mahjong';

export type MeldAction = 'pon' | 'kan' | 'chi' | 'ankan';

export interface MeldOption {
  action: MeldAction;
  tiles: Tile[];
  discardTile?: Tile;
}

export interface MeldGroup {
  type: MeldAction;
  tiles: Tile[];
  isOpen: boolean;
  fromPlayer?: number;
}

export function canPon(hand: Tile[], discardedTile: Tile): boolean {
  const matchingTiles = hand.filter(
    t => t.type === discardedTile.type && t.value === discardedTile.value
  );
  return matchingTiles.length >= 2;
}

export function canKan(hand: Tile[], discardedTile: Tile): boolean {
  const matchingTiles = hand.filter(
    t => t.type === discardedTile.type && t.value === discardedTile.value
  );
  return matchingTiles.length >= 3;
}

export function canAnkan(hand: Tile[]): Tile[] {
  const grouped = new Map<string, Tile[]>();
  
  hand.forEach(tile => {
    const key = `${tile.type}-${tile.value}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(tile);
  });
  
  const ankanTiles: Tile[] = [];
  for (const [_, tiles] of grouped) {
    if (tiles.length === 4) {
      ankanTiles.push(tiles[0]!);
    }
  }
  
  return ankanTiles;
}

export function canChi(hand: Tile[], discardedTile: Tile, position: number): MeldOption[] {
  if (discardedTile.type === 'honor') return [];
  
  const options: MeldOption[] = [];
  const value = discardedTile.value;
  
  if (value >= 3) {
    const tile1 = hand.find(t => t.type === discardedTile.type && t.value === value - 2);
    const tile2 = hand.find(t => t.type === discardedTile.type && t.value === value - 1);
    if (tile1 && tile2) {
      options.push({
        action: 'chi',
        tiles: [tile1, tile2, discardedTile]
      });
    }
  }
  
  if (value >= 2 && value <= 8) {
    const tile1 = hand.find(t => t.type === discardedTile.type && t.value === value - 1);
    const tile2 = hand.find(t => t.type === discardedTile.type && t.value === value + 1);
    if (tile1 && tile2) {
      options.push({
        action: 'chi',
        tiles: [tile1, discardedTile, tile2]
      });
    }
  }
  
  if (value <= 7) {
    const tile1 = hand.find(t => t.type === discardedTile.type && t.value === value + 1);
    const tile2 = hand.find(t => t.type === discardedTile.type && t.value === value + 2);
    if (tile1 && tile2) {
      options.push({
        action: 'chi',
        tiles: [discardedTile, tile1, tile2]
      });
    }
  }
  
  return options;
}

export function getPonTiles(hand: Tile[], discardedTile: Tile): Tile[] {
  const matchingTiles = hand.filter(
    t => t.type === discardedTile.type && t.value === discardedTile.value
  );
  return matchingTiles.slice(0, 2);
}

export function getKanTiles(hand: Tile[], discardedTile: Tile): Tile[] {
  const matchingTiles = hand.filter(
    t => t.type === discardedTile.type && t.value === discardedTile.value
  );
  return matchingTiles.slice(0, 3);
}

export function checkMeldPriority(actions: MeldAction[]): MeldAction {
  const priority: Record<MeldAction, number> = {
    kan: 4,
    pon: 3,
    chi: 2,
    ankan: 1
  };
  
  return actions.reduce((highest, action) => 
    priority[action] > priority[highest] ? action : highest
  );
}

export function canRon(hand: Tile[], discardedTile: Tile, melds: MeldGroup[]): boolean {
  const allTiles = [...hand, discardedTile];
  
  if (allTiles.length + melds.length * 3 !== 14) return false;
  
  return true;
}
