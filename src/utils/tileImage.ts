import type { Tile, TileType } from '../utils/define';

export function getTileImagePath(tile: Tile): string {
  const { type, value } = tile;
  
  if (type === 'man') {
    return `/assets/tiles/man/Man${value}.svg`;
  }
  if (type === 'pin') {
    return `/assets/tiles/pin/Pin${value}.svg`;
  }
  if (type === 'sou') {
    return `/assets/tiles/sou/Sou${value}.svg`;
  }
  
  return '';
}

export function getTileBackImagePath(): string {
  return '/assets/tiles/back.svg';
}

export function preloadTileImages() {
  const types: TileType[] = ['man', 'pin', 'sou'];
  types.forEach((type) => {
    for (let value = 1; value <= 9; value++) {
      const img = new Image();
      img.src = getTileImagePath({ id: `${type}-${value}`,type, value } as any);
    }
  });
}