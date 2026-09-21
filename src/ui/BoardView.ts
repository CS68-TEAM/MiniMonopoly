import blessed from "blessed";
import type { Board } from "../game/Board";
import type { Player } from "../game/Player";
import { PLAYER_COLORS } from "./PlayerView";
import { getLogoLines } from "./Logo";

export const WORLD_TILES = [

    { index: 0, type: "start", name: "GO" },

    { index: 1, type: "property", name: "Bangkok" },
    { index: 2, type: "property", name: "Hanoi" },
    { index: 3, type: "chance", name: "Chance" },
    { index: 4, type: "property", name: "Jakarta" },
    { index: 5, type: "property", name: "Manila" },
    { index: 6, type: "tax", name: "Tax" },
    { index: 7, type: "property", name: "Oslo" },
    { index: 8, type: "jail", name: "JAIL" },

    { index: 9, type: "property", name: "Tokyo" },
    { index: 10, type: "property", name: "Seoul" },
    { index: 11, type: "chance", name: "Chance" },
    { index: 12, type: "property", name: "Beijing" },
    { index: 13, type: "property", name: "Shanghai" },
    { index: 14, type: "property", name: "HongKong" },
    { index: 15, type: "property", name: "Taipei" },
    { index: 16, type: "parking", name: "FreePark" },

    { index: 17, type: "property", name: "Sydney" },
    { index: 18, type: "property", name: "Auckland" },
    { index: 19, type: "chance", name: "Chance" },
    { index: 20, type: "property", name: "Mumbai" },
    { index: 21, type: "property", name: "Delhi" },
    { index: 22, type: "property", name: "Dubai" },
    { index: 23, type: "property", name: "Istanbul" },
    { index: 24, type: "goToJail", name: "GoJail" },

    { index: 25, type: "property", name: "London" },
    { index: 26, type: "property", name: "Paris" },
    { index: 27, type: "chance", name: "Chance" },
    { index: 28, type: "property", name: "Berlin" },
    { index: 29, type: "property", name: "Rome" },
    { index: 30, type: "property", name: "Madrid" },
    { index: 31, type: "tax", name: "Tax" },
] as const;

const PROPERTY_BAR_COLORS: [string, string][] = [
    ["{cyan-fg}", "{/cyan-fg}"],
    ["{green-fg}", "{/green-fg}"],
    ["{yellow-fg}", "{/yellow-fg}"],
    ["{magenta-fg}", "{/magenta-fg}"],
    ["{red-fg}", "{/red-fg}"],
    ["{blue-fg}", "{/blue-fg}"],
    ["{white-fg}", "{/white-fg}"],
];

const TILE_SUBTEXT: Record<string, string> = {
    start: "+200$",
    tax: "-15%",
    parking: "FREE",
    jail: "",
    goToJail: "",
    chance: "?",
};

const CORNER_WIDTH = 17;
const TILE_WIDTH = 12;
const CENTER_HEIGHT = 7 * 3 + 6;
const TALL_ROW_LINES = 6;
const COMPACT_ROW_LINES = 4;
const TALL_BOARD_LINES = 31 + 2 * TALL_ROW_LINES; // 43


interface CornerSpec {
    readonly band: string;
    readonly title: string;
    readonly tall: { readonly bitmap: readonly string[]; readonly palette: Readonly<Record<string, string>> };
    readonly compact: { readonly bitmap: readonly string[]; readonly palette: Readonly<Record<string, string>>; readonly plate: readonly [string, string, string] };
}

const CORNER_SPECS: Record<string, CornerSpec> = {
    start: {
        band: "green",
        title: "START  +$200",
        tall: {
            bitmap: [
                ".......GG....",
                ".......GGG...",
                "GGGGGGGGGGG..",
                "GGGGGGGGGGGGG",
                "GGGGGGGGGGGGG",
                "GGGGGGGGGGG..",
                ".......GGG...",
                ".......GG....",
            ],
            palette: { G: "10" },
        },
        compact: {
            bitmap: [".GG.....", ".GGGG...", ".GGGGGG.", ".GGGGGG.", ".GGGG...", ".GG....."],
            palette: { G: "2" },
            plate: ["", "GO", "+$200"],
        },
    },
    jail: {
        band: "magenta",
        title: "J A I L",
        tall: {
            bitmap: [
                "MMMMMMMMMMMMM",
                "M.w.w.w.w.w.M",
                "M.w.w.w.w.w.M",
                "M.w.w.w.w.w.M",
                "M.w.w.w.w.w.M",
                "M.w.w.w.w.w.M",
                "M.w.w.w.w.w.M",
                "MMMMMMMMMMMMM",
            ],
            palette: { M: "13", w: "15" },
        },
        compact: {
            bitmap: ["MMMMMMMM", "M.w.w.wM", "M.w.w.wM", "M.w.w.wM", "M.w.w.wM", "MMMMMMMM"],
            palette: { M: "5", w: "15" },
            plate: ["", "JAIL", ""],
        },
    },
    goToJail: {
        band: "red",
        title: "GO TO JAIL",
        tall: {
            bitmap: [
                "...RR..........",
                "...RRR..WWWWWWW",
                "RRRRRRR.W.w.w.W",
                "RRRRRRRRW.w.w.W",
                "RRRRRRRRW.w.w.W",
                "RRRRRRR.W.w.w.W",
                "...RRR..W.w.w.W",
                "...RR...WWWWWWW",
            ],
            palette: { R: "9", W: "7", w: "15" },
        },
        compact: {
            bitmap: ["RRRRRRRR", "R.w.w.wR", "R.w.w.wR", "R.w.w.wR", "R.w.w.wR", "RRRRRRRR"],
            palette: { R: "1", w: "15" },
            plate: ["GO", "TO", "JAIL"],
        },
    },
    parking: {
        band: "blue",
        title: "FREE PARKING",
        tall: {
            bitmap: [
                ".BBBBBBBBBBB.",
                "BBBBBBBBBBBBB",
                "BBBBwwwwBBBBB",
                "BBBBwBBBwBBBB",
                "BBBBwBBBwBBBB",
                "BBBBwwwwBBBBB",
                "BBBBwBBBBBBBB",
                "BBBBwBBBBBBBB",
            ],
            palette: { B: "12", w: "15" },
        },
        compact: {
            bitmap: [".BBBBBB.", "BBwwwBBB", "BBwBwBBB", "BBwwwBBB", "BBwBBBBB", ".BBBBBB."],
            palette: { B: "4", w: "15" },
            plate: ["FREE", "PARKING", ""],
        },
    },
};

function pixelRows(bitmap: readonly string[], palette: Readonly<Record<string, string>>): string[] {
    const rows: string[] = [];
    for (let y = 0; y < bitmap.length; y += 2) {
        const upper = bitmap[y]!;
        const lower = bitmap[y + 1] ?? "";
        const cells: { fg?: string; bg?: string; ch: string }[] = [];
        for (let x = 0; x < upper.length; x++) {
            const top = palette[upper[x]!];
            const bottom = palette[lower[x] ?? "."];
            if (top === undefined && bottom === undefined) cells.push({ ch: " " });
            else if (bottom === undefined) cells.push({ fg: top, ch: "▀" });
            else if (top === undefined) cells.push({ fg: bottom, ch: "▄" });
            else if (top === bottom) cells.push({ fg: top, ch: "█" });
            else cells.push({ fg: top, bg: bottom, ch: "▀" });
        }

        let out = "";
        for (let i = 0; i < cells.length;) {
            let j = i;
            while (j < cells.length && cells[j]!.fg === cells[i]!.fg && cells[j]!.bg === cells[i]!.bg && cells[j]!.ch === cells[i]!.ch) j++;
            const { fg, bg, ch } = cells[i]!;
            const text = ch.repeat(j - i);
            if (fg === undefined) out += text;
            else if (bg === undefined) out += `{${fg}-fg}${text}{/${fg}-fg}`;
            else out += `{${fg}-fg}{${bg}-bg}${text}{/${bg}-bg}{/${fg}-fg}`;
            i = j;
        }
        rows.push(out);
    }
    return rows;
}

const bandText = (text: string, band: string): string => `{${band}-bg}{15-fg}{bold}${text}{/bold}{/15-fg}{/${band}-bg}`;


function cornerCard(type: string, occupants: string, tall: boolean): string[] {
    const spec = CORNER_SPECS[type];
    const lineCount = tall ? TALL_ROW_LINES : COMPACT_ROW_LINES;
    if (!spec) return Array.from({ length: lineCount }, () => " ".repeat(CORNER_WIDTH));

    const occupantLine = centerTagged(occupants, CORNER_WIDTH);
    if (tall) {
        const picture = pixelRows(spec.tall.bitmap, spec.tall.palette).map(row => centerTagged(row, CORNER_WIDTH));
        return [...picture, bandText(centerPlain(spec.title, CORNER_WIDTH), spec.band), occupantLine];
    }

    const picture = pixelRows(spec.compact.bitmap, spec.compact.palette);
    const plateWidth = CORNER_WIDTH - 10;
    const rows = picture.map((row, i) => " " + row + " " + bandText(centerPlain(spec.compact.plate[i] ?? "", plateWidth), spec.band));
    return [...rows, occupantLine];
}

function padTagged(taggedText: string, width: number): string {
    const plainText = taggedText.replace(/\{[^}]+\}/g, "");
    let visibleWidth = 0;
    for (const ch of plainText) {
        visibleWidth += (ch.codePointAt(0)! > 0x2E80) ? 2 : 1;
    }
    return taggedText + " ".repeat(Math.max(0, width - visibleWidth));
}

function centerPlain(text: string, width: number): string {
    const totalPadding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return " ".repeat(leftPadding) + text.slice(0, width) + " ".repeat(rightPadding);
}

function centerTagged(taggedText: string, width: number): string {
    const plainText = taggedText.replace(/\{[^}]+\}/g, "");
    let visibleWidth = 0;
    for (const ch of plainText) {
        visibleWidth += (ch.codePointAt(0)! > 0x2E80) ? 2 : 1;
    }
    const totalPadding = Math.max(0, width - visibleWidth);
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return " ".repeat(leftPadding) + taggedText + " ".repeat(rightPadding);
}

function renderTileName( tile: { name: string; type: string; property?: { owner?: { id: string } | null } }, width: number,): string {
    const ownerId = tile.type === "property" ? tile.property?.owner?.id : undefined;
    if (!ownerId) return centerPlain(tile.name, width);
    const [colorOpen, colorClose] = PLAYER_COLORS[ownerId] ?? ["{white-fg}", "{/white-fg}"];
    return centerTagged(`${colorOpen}{bold}${tile.name}{/bold}${colorClose}`, width);
}

export class BoardView {
    public readonly box = blessed.box({ label: " WORLD MONOPOLY   ·   [?] Controls ", border: { type: "line" }, style: { border: { fg: "cyan" }, label: { fg: "cyan", bold: true } }, tags: true, align: "center" as const, valign: "middle" as const, padding: { left: 1, right: 1, top: 0, bottom: 0 },});

    private hasRoomForTallCorners(): boolean {
        try {
            const height = this.box.height;
            return typeof height === "number" && height - 2 >= TALL_BOARD_LINES;
        } catch {
            return false;
        }
    }

    private computeTileWidth(): number {
        try {
            const boxWidth = this.box.width;
            if (typeof boxWidth !== "number") return TILE_WIDTH;
            const innerWidth = boxWidth - 4; 
            const fitted = Math.floor((innerWidth - 2 * CORNER_WIDTH - 10) / 7);
            return Math.max(TILE_WIDTH, fitted);
        } catch {
            return TILE_WIDTH;
        }
    }

    public render(board: Board, players: Player[], positionOverrides?: Record<string, number>): void {
        const tall = this.hasRoomForTallCorners();
        const rowLines = tall ? TALL_ROW_LINES : COMPACT_ROW_LINES;
        const tileWidth = this.computeTileWidth();
        const centerWidth = tileWidth * 7 + 6;
        const tiles = board.tiles.length >= 32 ? board.tiles : (WORLD_TILES as unknown as typeof board.tiles);
        const topLeftCorner = tiles[0]!;
        const topEdgeTiles = tiles.slice(1, 8);
        const topRightCorner = tiles[8]!;
        const rightEdgeTiles = tiles.slice(9, 16);
        const bottomRightCorner = tiles[16]!;
        const bottomEdgeTiles = [...tiles.slice(17, 24)].reverse();
        const bottomLeftCorner = tiles[24]!;
        const leftEdgeTiles = [...tiles.slice(25, 32)].reverse();

        const positionOf = (p: Player): number => positionOverrides?.[p.id] ?? p.position;
        const playersOnTile = (tileIndex: number): Player[] => players.filter(p => p.status !== "bankrupt" && positionOf(p) === tileIndex);
        const playerLabel = (player: Player): string => `P${players.indexOf(player) + 1}`;
        const playerColor = (player: Player): [string, string] => PLAYER_COLORS[player.id] ?? ["{white-fg}", "{/white-fg}"];

        const renderOccupants = (tileIndex: number, cellWidth: number): string => {
            const playersHere = playersOnTile(tileIndex);
            if (playersHere.length === 0) return "";

            if (playersHere.length === 1) {
                const [colorOpen, colorClose] = playerColor(playersHere[0]!);
                return `[${colorOpen}{bold}${playerLabel(playersHere[0]!)}{/bold}${colorClose}]`;
            }

            const joinedLabels = playersHere.map(playerLabel).join(",");
            if (joinedLabels.length <= cellWidth) {
                return playersHere.map(p => {
                    const [colorOpen, colorClose] = playerColor(p);
                    return `${colorOpen}{bold}${playerLabel(p)}{/bold}${colorClose}`;
                }).join(",");
            }

            const [colorOpen, colorClose] = playerColor(playersHere[0]!);
            return `${colorOpen}{bold}${playerLabel(playersHere[0]!)}{/bold}${colorClose}{white-fg}+${playersHere.length - 1}{/white-fg}`;
        };

        const renderOccupantCell = (tileIndex: number, width: number): string => {
            const occupantMark = renderOccupants(tileIndex, width);
            return occupantMark ? padTagged(occupantMark, width) : " ".repeat(width);
        };

        let propertyBarIndex = 0;
        const renderTopBottomSubtext = (tile: typeof tiles[0], width: number): string => {
            if (tile.type !== "property") return centerPlain(TILE_SUBTEXT[tile.type] ?? "", width);
            const dashLength = Math.max(3, width - 4);
            const [colorOpen, colorClose] = PROPERTY_BAR_COLORS[propertyBarIndex++ % PROPERTY_BAR_COLORS.length]!;
            return centerTagged(`${colorOpen}${"═".repeat(dashLength)}${colorClose}`, width);
        };

        const renderCorner = (tile: typeof tiles[0]): string[] => cornerCard(tile.type, renderOccupants(tile.index, CORNER_WIDTH - 4), tall);
        const blankTileCell = " ".repeat(tileWidth);
        const blankRow = Array(7).fill(blankTileCell).join("│");

        const buildEdgeRow = (leftCorner: typeof tiles[0], edgeTiles: typeof tiles, rightCorner: typeof tiles[0], occupantIndex: (i: number) => number): string[] => {
            const left = renderCorner(leftCorner);
            const right = renderCorner(rightCorner);
            const names = edgeTiles.map(t => renderTileName(t, tileWidth)).join("│");
            const bars = edgeTiles.map(t => renderTopBottomSubtext(t, tileWidth)).join("│");
            const occupantCells = edgeTiles.map((_t, i) => renderOccupantCell(occupantIndex(i), tileWidth)).join("│");
            return Array.from({ length: rowLines }, (_unused, r) => {
                const middle = r === 0 ? names : r === 1 ? bars : r === rowLines - 1 ? occupantCells : blankRow;
                return "│" + left[r] + "│" + middle + "│" + right[r] + "│";
            });
        };

        const cornerHorizontalLine = "─".repeat(CORNER_WIDTH);
        const tileHorizontalLine = "─".repeat(tileWidth);
        const topBorder = "┌" + cornerHorizontalLine + "┬" + Array(7).fill(tileHorizontalLine).join("┬") + "┬" + cornerHorizontalLine + "┐";
        const middleBorder = "├" + cornerHorizontalLine + "┼" + Array(7).fill(tileHorizontalLine).join("┼") + "┼" + cornerHorizontalLine + "┤";
        const bottomBorder = "└" + cornerHorizontalLine + "┴" + Array(7).fill(tileHorizontalLine).join("┴") + "┴" + cornerHorizontalLine + "┘";

        const colorDepth = (this.box.screen as unknown as { tput?: { colors?: number } } | undefined)?.tput?.colors ?? 8;
        const logoLines = getLogoLines(colorDepth);
        const logoTop = Math.max(0, Math.floor((CENTER_HEIGHT - logoLines.length) / 2));
        const centerLines: string[] = Array.from({ length: CENTER_HEIGHT }, (_unused, i) => {
            const logoLine = logoLines[i - logoTop];
            return logoLine !== undefined ? centerTagged(logoLine, centerWidth) : " ".repeat(centerWidth);
        });
        let centerRow = 0;
        const nextCenterLine = (): string => centerLines[centerRow++] ?? " ".repeat(centerWidth);

        const outputLines: string[] = [];

        outputLines.push(topBorder);
        outputLines.push(...buildEdgeRow(topLeftCorner, topEdgeTiles, topRightCorner, i => i + 1));
        outputLines.push(middleBorder);

        const sideRowSeparator = (center: string): string => "├" + cornerHorizontalLine + "│" + center + "│" + cornerHorizontalLine + "┤";
        for (let row = 0; row < 7; row++) {
            const leftTile = leftEdgeTiles[row]!;
            const rightTile = rightEdgeTiles[row]!;

            const leftNameCell = renderTileName(leftTile, CORNER_WIDTH);
            const leftSubtextCell = renderTopBottomSubtext(leftTile, CORNER_WIDTH);
            const rightNameCell = renderTileName(rightTile, CORNER_WIDTH);
            const rightSubtextCell = renderTopBottomSubtext(rightTile, CORNER_WIDTH);

            outputLines.push(`│${leftNameCell}│${nextCenterLine()}│${rightNameCell}│`);
            outputLines.push(`│${leftSubtextCell}│${nextCenterLine()}│${rightSubtextCell}│`);
            outputLines.push(`│${renderOccupantCell(31 - row, CORNER_WIDTH)}│${nextCenterLine()}│${renderOccupantCell(9 + row, CORNER_WIDTH)}│`);

            if (row < 6) outputLines.push(sideRowSeparator(nextCenterLine()));
        }

        outputLines.push(middleBorder);
        outputLines.push(...buildEdgeRow(bottomLeftCorner, bottomEdgeTiles, bottomRightCorner, i => 23 - i));
        outputLines.push(bottomBorder);

        this.box.setContent(outputLines.join("\n"));
    }
}