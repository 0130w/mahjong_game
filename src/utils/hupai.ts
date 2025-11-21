import type { Tile, Meld, TileType } from "./define";

function checkQiDui(hand: Tile[]) : boolean {
    if (hand.length !== 14) {
        return false;
    }
    const tileCount: Record<string, number> = {};
    for (const tile of hand) {
        const key = tile.type + tile.value;
        tileCount[key] = (tileCount[key] || 0) + 1;
    }
    return Object.values(tileCount).every(count => count === 2);
}

// 将手牌和副露组合用来判胡，副露为杠只影响番数，可视为碰来判胡
function buildAllTiles(hand: Tile[], melds: Meld[]) : Tile[]
{
    const tiles : Tile[] = [...hand];
    for (const m of melds) {
        tiles.push(m.tile, m.tile, m.tile);
    }
    return tiles;
}

// 缺一门判断
function isQueYiMen(tiles: Tile[]) : boolean {
    const types = new Set<TileType>();
    tiles.forEach(tile => types.add(tile.type));
    return types.size <= 2;
}

function canCompleteSuit(counts: number[]) : boolean {
    const c = counts.slice();

    for (let i = 1; i <= 9; i++) {
        while (c[i]! > 0) {
            if (c[i]! >= 3) {
                c[i]! -= 3;
                continue;
            }

            if (i <= 7 && c[i + 1]! > 0 && c[i + 2]! > 0) {
                c[i]!--;
                c[i + 1]!--;
                c[i + 2]!--;
                continue;
            }

            return false;
        }
    }
    return true;
}

function allSuitsComplete(grouped: Record<TileType, number[]>) : boolean {
    return (
        canCompleteSuit(grouped.man) &&
        canCompleteSuit(grouped.pin) &&
        canCompleteSuit(grouped.sou)
    )
}

function checkMeldAndPair(tiles: Tile[]) : boolean {
    const n = tiles.length;
    if (n < 2 || (n - 2) % 3 !== 0) {
        return false;
    }

    const grouped: Record<TileType, number[]> = {
        man: Array(10).fill(0),
        pin: Array(10).fill(0),
        sou: Array(10).fill(0),
    };

    for (const t of tiles) {
        grouped[t.type]![t.value]!++;
    }

    const suits: TileType[] = ['man', 'pin', 'sou'];

    for (const suit of suits) {
        const counts = grouped[suit];
        for (let v = 1; v <= 9; v++) {
            if (counts[v]! >= 2) {
                const gCopy: Record<TileType, number[]> = {
                    man: grouped.man.slice(),
                    pin: grouped.pin.slice(),
                    sou: grouped.sou.slice(),
                };
                gCopy[suit]![v]! -= 2;
                if (allSuitsComplete(gCopy)) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function canHu(tiles: Tile[], melds: Meld[]) : boolean {
    if (checkQiDui(tiles)) {
        return true;
    }
    const allTiles = buildAllTiles(tiles, melds);
    if (!isQueYiMen(allTiles)) {
        return false;
    }
    // k个面子(0,1,2,3) + 1个对子
    return checkMeldAndPair(allTiles);
}

// 清一色
function isQingYiSe(tiles: Tile[]) : boolean {
    const types = new Set<TileType>();
    tiles.forEach(tile => types.add(tile.type));
    return types.size === 1;
}

// 断幺九
function isDuanYaoJiu(tiles: Tile[]) : boolean {
    return tiles.every(tile => tile.value >= 2 && tile.value <= 8);
}

// 计算根
function countGen(hand: Tile[], melds: Meld[]) : number {
    let gen = 0;

    for (const m of melds) {
        if (m.type === 'kan' || m.type === 'ankan') {
            gen += 1;
        }
    }

    // 四归一
    const tileCount : Record<string, number> = {};
    for (const tile of hand) {
        const key = tile.type + tile.value;
        tileCount[key] = (tileCount[key] || 0) + 1;
    }
    for (const count of Object.values(tileCount)) {
        if (count === 4) {
            gen += 1;
        }
    }
    return gen;
}

export interface FanResult {
    fan: number;
    fanTypes: string[];
};

export function calcFan(
    hand: Tile[],
    melds: Meld[],
    _opts?: {}
) : FanResult {
    const tiles = buildAllTiles(hand, melds);

    if (!canHu(hand, melds)) {
        return { fan: 0, fanTypes: [] };
    }

    let fan = 0;
    const fanTypes: string[] = [];

    if (checkQiDui(hand)) {
        fan += 2;
        fanTypes.push('七对');
    }

    if (isQingYiSe(tiles)) {
        fan += 2;
        fanTypes.push('清一色');
    }

    if (isDuanYaoJiu(tiles)) {
        fan += 1;
        fanTypes.push('断幺九');
    }

    const gen = countGen(hand, melds);
    if (gen > 0) {
        fan += gen;
        fanTypes.push(`根 ${gen}`);
    }

    // TODO: 对对和、杠上炮、金钩钓、抢杠、杠上花、海底、全带幺

    return { fan, fanTypes };
}

export function fanToPoints(fan: number) : number {
    const MAX_FAN = 8;  // 封顶
    const capped = Math.min(fan, MAX_FAN);
    return Math.pow(2, capped);
}