import type { Player } from "../game/Player";

const CONTENT_WIDTH = 96;
const STAT_BOX_INNER_WIDTH = 32;
const STAT_BOX_GAP = 3;

function visibleLength(taggedText: string): number {
    return taggedText.replace(/\{[^}]+\}/g, "").length;
}

function centerTagged(taggedText: string, width: number): string {
    const totalPadding = Math.max(0, width - visibleLength(taggedText));
    const left = Math.floor(totalPadding / 2);
    const right = totalPadding - left;
    return " ".repeat(left) + taggedText + " ".repeat(right);
}

// ไอคอนขนาด 6 แถว x 11 ตัวอักษร (ความกว้างเท่ากันทุกแถว)
const COIN_ICON: readonly string[] = [
    "   ▄▄▄▄▄   ",
    "  █▀▀▀▀▀█  ",
    "  █  $  █  ",
    "  █▄▄▄▄▄█  ",
    " █▀▀▀▀▀▀▀█ ",
    " ▀▀▀▀▀▀▀▀▀ ",
];

const HOUSE_ICON: readonly string[] = [
    "     ▲     ",
    "    ▲ ▲    ",
    "   ▲▲▲▲▲   ",
    "  █▀▀▀▀▀█  ",
    "  █ ▄▄▄ █  ",
    "  █▄█ █▄█  ",
];

const CHART_ICON: readonly string[] = [
    "           ",
    "      ▄█   ",
    "    ▄██    ",
    "  ▄███     ",
    "▄██████    ",
    "▀▀▀▀▀▀▀▀▀  ",
];

function statBox(icon: readonly string[], label: string, value: string, innerWidth: number, color: string): string[] {
    const bar = "═".repeat(innerWidth);
    const top = `{${color}-fg}╔${bar}╗{/${color}-fg}`;
    const bottom = `{${color}-fg}╚${bar}╝{/${color}-fg}`;
    const side = (inner: string) => `{${color}-fg}║{/${color}-fg}${inner}{${color}-fg}║{/${color}-fg}`;

    const iconWidth = icon[0]!.length;
    const textWidth = innerWidth - iconWidth - 1;
    const rowCount = icon.length;
    const labelRowIndex = Math.floor(rowCount / 2) - 1;
    const valueRowIndex = Math.floor(rowCount / 2);

    const rows: string[] = [];
    for (let i = 0; i < rowCount; i++) {
        let textCell: string;
        if (i === labelRowIndex) {
            textCell = `{white-fg}{bold}${centerTagged(label, textWidth)}{/bold}{/white-fg}`;
        } else if (i === valueRowIndex) {
            textCell = `{bold}{${color}-fg}${centerTagged(value, textWidth)}{/${color}-fg}{/bold}`;
        } else {
            textCell = " ".repeat(textWidth);
        }
        rows.push(side(`{yellow-fg}{bold}${icon[i]}{/bold}{/yellow-fg} ${textCell}`));
    }

    return [top, ...rows, bottom];
}

function boxesRow(boxes: string[][], boxWidth: number, gap: number, totalWidth: number): string[] {
    const rowCount = Math.max(...boxes.map(b => b.length));
    const combinedWidth = boxWidth * boxes.length + gap * (boxes.length - 1);
    const outerPad = Math.max(0, Math.floor((totalWidth - combinedWidth) / 2));
    const lines: string[] = [];
    for (let i = 0; i < rowCount; i++) {
        let line = " ".repeat(outerPad);
        boxes.forEach((box, idx) => {
            line += box[i] ?? "";
            if (idx < boxes.length - 1) line += " ".repeat(gap);
        });
        lines.push(line);
    }
    return lines;
}

const TROPHY_ART: readonly string[] = [
    "   ▄▄▄▄▄▄▄▄▄▄▄   ",
    " ▄█▀▀▀▀▀▀▀▀▀▀▀█▄ ",
    "  █           █  ",
    "  ▀█▄▄▄▄▄▄▄▄▄█▀  ",
    "       ▄█▄       ",
    "       ▄█▄       ",
    "    ▄▄▄▄▄▄▄▄▄    ",
    "   ▀▀▀▀▀▀▀▀▀▀▀   ",
];

const SPARKLE_CHARS = ["*"];
const SPARKLE_COLORS = ["yellow", "cyan", "white"];

function sparkleCell(seed: number): string {
    const char = SPARKLE_CHARS[seed % SPARKLE_CHARS.length]!;
    const color = SPARKLE_COLORS[seed % SPARKLE_COLORS.length]!;
    return `{${color}-fg}${char}{/${color}-fg}`;
}

function scatterLine(width: number, columns: number[]): string {
    const cells: string[] = new Array(width).fill(" ");
    columns.forEach((col, i) => {
        if (col >= 0 && col < width) cells[col] = sparkleCell(i);
    });
    return cells.join("");
}

const FLANK_BY_ROW: Record<number, { leftOffset: number; rightOffset: number; seed: number }> = {
    0: { leftOffset: 6, rightOffset: 6, seed: 0 },
    1: { leftOffset: 4, rightOffset: 4, seed: 1 },
    2: { leftOffset: 3, rightOffset: 3, seed: 2 },
    3: { leftOffset: 5, rightOffset: 5, seed: 3 },
    6: { leftOffset: 4, rightOffset: 4, seed: 0 },
};

function decoratedTrophyLines(width: number): string[] {
    const trophyWidth = TROPHY_ART[0]!.length;
    const leftPad = Math.floor((width - trophyWidth) / 2);

    const trophyRows = TROPHY_ART.map((row, i) => {
        const cells: string[] = new Array(width).fill(" ");
        for (let c = 0; c < trophyWidth; c++) cells[leftPad + c] = row[c]!;

        const flank = FLANK_BY_ROW[i];
        if (flank) {
            const leftCol = leftPad - flank.leftOffset;
            const rightCol = leftPad + trophyWidth - 1 + flank.rightOffset;
            if (leftCol >= 0) cells[leftCol] = sparkleCell(flank.seed);
            if (rightCol < width) cells[rightCol] = sparkleCell(flank.seed + 1);
        }

        return `{yellow-fg}{bold}${cells.join("")}{/bold}{/yellow-fg}`;
    });

    const topScatter = scatterLine(width, [leftPad - 12, leftPad - 2, leftPad + trophyWidth + 1, leftPad + trophyWidth + 11]);
    const bottomScatter = scatterLine(width, [leftPad - 8, leftPad + 4, leftPad + trophyWidth - 4, leftPad + trophyWidth + 7]);

    return [topScatter, ...trophyRows, bottomScatter];
}

export function buildWinnerContentLines(winner: Player, width = CONTENT_WIDTH): string[] {
    const lines: string[] = [];

    lines.push(...decoratedTrophyLines(width));
    lines.push(centerTagged("{yellow-fg}{bold}>>>  W I N N E R  <<<{/bold}{/yellow-fg}", width));
    lines.push(centerTagged("{cyan-fg}Congratulations!{/cyan-fg}", width));
    lines.push("");
    lines.push(centerTagged(`{bold}{white-fg}${winner.name.toUpperCase()}{/white-fg}{/bold}`, width));

    const congratsText = winner.id === "human"
        ? "You are the winner of MINI MONOPOLY"
        : `${winner.name} is the winner of MINI MONOPOLY`;
    lines.push(centerTagged(`{white-fg}${congratsText}{/white-fg}`, width));
    lines.push("");

    const netWorth = winner.money + winner.properties.reduce((sum, p) => sum + p.price, 0);
    const moneyBox = statBox(COIN_ICON, "FINAL BALANCE", `$ ${winner.money.toLocaleString()}`, STAT_BOX_INNER_WIDTH, "green");
    const propertyBox = statBox(HOUSE_ICON, "PROPERTIES OWNED", `${winner.properties.length}`, STAT_BOX_INNER_WIDTH, "yellow");
    const netWorthBox = statBox(CHART_ICON, "NET WORTH", `$ ${netWorth.toLocaleString()}`, STAT_BOX_INNER_WIDTH, "cyan");
    const boxWidth = STAT_BOX_INNER_WIDTH + 2;

    lines.push(...boxesRow([moneyBox, propertyBox, netWorthBox], boxWidth, STAT_BOX_GAP, width));

    return lines;
}

export function buildWinnerFooterContent(): string {
    return "{white-fg}Press {/white-fg}{bold}{cyan-fg}Enter{/cyan-fg}{/bold}{white-fg} to return to Main Menu...{/white-fg}";
}

export const FULLSCREEN_WIDTH = 150;
export const FULLSCREEN_HEIGHT = 38;

function backgroundRow(y: number, xStart: number, xEnd: number): string {
    let row = "";
    for (let x = xStart; x < xEnd; x++) {
        const hash = (x * 31 + y * 17 + 7) % 97;
        row += hash < 3 ? sparkleCell(x + y) : " ";
    }
    return row;
}

export function buildFullScreenLines(winner: Player, totalWidth = FULLSCREEN_WIDTH, totalHeight = FULLSCREEN_HEIGHT): string[] {
    const content = buildWinnerContentLines(winner, CONTENT_WIDTH);
    const leftMargin = Math.max(0, Math.floor((totalWidth - CONTENT_WIDTH) / 2));
    const rightStart = leftMargin + CONTENT_WIDTH;

    const topPad = Math.max(0, Math.floor((totalHeight - content.length) / 2));
    const bottomPad = Math.max(0, totalHeight - content.length - topPad);

    const lines: string[] = [];
    for (let y = 0; y < topPad; y++) lines.push(backgroundRow(y, 0, totalWidth));
    content.forEach((line, i) => {
        const y = topPad + i;
        lines.push(backgroundRow(y, 0, leftMargin) + line + backgroundRow(y, rightStart, totalWidth));
    });
    for (let y = 0; y < bottomPad; y++) lines.push(backgroundRow(topPad + content.length + y, 0, totalWidth));

    return lines;
}
