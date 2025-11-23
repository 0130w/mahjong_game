import type { Tile } from "./define";

export function tileToString(tile: Tile): string {
  const typeMap: Record<string, string> = {
    man: 'm',
    pin: 'p',
    sou: 's',
  };
  return `${tile.value}${typeMap[tile.type]}`;
}

export function tilesToString(tiles: Tile[]): string {
  return tiles.map(tileToString).join(', ');
}

export function stringToTile(str: string, sourceHand: Tile[]): Tile | undefined {
  if (!str) return undefined;
  const value = parseInt(str[0]!);
  const typeChar = str[1];
  const typeMap: Record<string, 'man' | 'pin' | 'sou'> = {
    'm': 'man',
    'p': 'pin',
    's': 'sou',
  };
  const type = typeMap[typeChar!];

  return sourceHand.find(t => t.type === type && t.value === value);
}