import type { Tile } from '../types/mahjong';

/**
 * 根据麻将牌获取对应的图片路径
 * @param tile 麻将牌对象
 * @returns 图片路径
 */
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

/**
 * 获取牌背图片路径
 */
export function getTileBackImagePath(): string {
  return '/assets/tiles/back.svg';
}
