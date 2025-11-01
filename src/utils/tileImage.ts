import type { Tile } from '../types/mahjong';

/**
 * 根据麻将牌获取对应的图片路径
 * @param tile 麻将牌对象
 * @returns 图片路径
 */
export function getTileImagePath(tile: Tile): string {
  const { type, value } = tile;
  
  // 数字牌 - 使用日文命名风格
  if (type === 'man') {
    return `/assets/tiles/man/Man${value}.svg`;
  }
  if (type === 'pin') {
    return `/assets/tiles/pin/Pin${value}.svg`;
  }
  if (type === 'sou') {
    return `/assets/tiles/sou/Sou${value}.svg`;
  }
  
  // 字牌 - 使用日文命名
  if (type === 'honor') {
    const honorMap: Record<number, string> = {
      1: 'Ton',    // 东
      2: 'Nan',    // 南
      3: 'Shaa',   // 西
      4: 'Pei',    // 北
      5: 'Haku',   // 白
      6: 'Hatsu',  // 发
      7: 'Chun'    // 中
    };
    return `/assets/tiles/honor/${honorMap[value]}.svg`;
  }
  
  return '';
}

/**
 * 获取牌背图片路径
 */
export function getTileBackImagePath(): string {
  return '/assets/tiles/back.svg';
}
