import type { TileDef, TileColor } from "../game/Types";

export const COLOR_TIERS: Record<TileColor, { readonly price: number; readonly rent: number }> = {
    cyan:    { price: 500,  rent: 175  },
    green:   { price: 1000, rent: 350  },
    yellow:  { price: 1500, rent: 525  },
    magenta: { price: 2000, rent: 700  },
    red:     { price: 2500, rent: 875  },
    blue:    { price: 3000, rent: 1050 },
};

const prop = (index: number, name: string, color: TileColor): TileDef => ({
    index, type: "property", name, color,
    price: COLOR_TIERS[color].price,
    rent: COLOR_TIERS[color].rent,
    isCorner: false,
});

export const BOARD_32: TileDef[] = [
    { index: 0,  type: "start", name: "GO", rent: 0, price: 0, isCorner: true },

    prop(1,  "Bangkok",  "cyan"),
    prop(2,  "Hanoi",    "yellow"),
    { index: 3,  type:   "chance",   name: "Chance", rent: 0, price: 0, isCorner: false },
    prop(4,  "Jakarta",  "magenta"),
    prop(5,  "Manila",   "green"),
    { index: 6,  type:   "tax", name: "Tax", rent: 0, price: 0, isCorner: false },
    prop(7,  "Oslo",     "blue"),

    { index: 8, type:    "jail", name: "JAIL", rent: 0, price: 0, isCorner: true },

    prop(9,  "Tokyo",    "red"),
    prop(10, "Seoul",    "blue"),
    { index: 11, type:   "chance",   name: "Chance",    rent: 0,    price: 0,    isCorner: false },
    prop(12, "Beijing",  "green"),
    prop(13, "Shanghai", "magenta"),
    prop(14, "HongKong", "cyan"),
    prop(15, "Taipei",   "yellow"),

    { index: 16, type:   "parking",  name: "Free Park", rent: 0,    price: 0,    isCorner: true },

    prop(17, "Sydney",   "cyan"),
    prop(18, "Auckland", "yellow"),
    { index: 19, type:   "chance",   name: "Chance",    rent: 0,    price: 0,    isCorner: false },
    prop(20, "Mumbai",   "magenta"),
    prop(21, "Delhi",    "green"),
    prop(22, "Dubai",    "blue"),
    prop(23, "Istanbul", "red"),

    { index: 24, type:   "goToJail", name: "Go Jail",   rent: 0,    price: 0,    isCorner: true },

    prop(25, "London",   "green"),
    prop(26, "Paris",    "magenta"),
    { index: 27, type:   "chance",   name: "Chance",    rent: 0,    price: 0,    isCorner: false },
    prop(28, "Berlin",   "cyan"),
    prop(29, "Rome",     "yellow"),
    prop(30, "Madrid",   "red"),
    { index: 31, type:   "tax",      name: "Tax",       rent: 0,    price: 0,    isCorner: false },
];

export const BOARD_SIZE = BOARD_32.length;
export const CORNERS = [0, 8, 16, 24] as const;
export const isCorner = (idx: number) => CORNERS.includes(idx as typeof CORNERS[number]);

