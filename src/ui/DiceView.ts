import blessed from "blessed";
import { playSound, SOUNDS } from "../utils/SoundManager";

const FACE_WIDTH = 13;
const INSET = 2;

const DOT = "{bold}{white-fg}●{/white-fg}{/bold}";
const BLANK_ROW = " ".repeat(FACE_WIDTH);
const LEFT_DOT_ROW = " ".repeat(INSET) + DOT + " ".repeat(FACE_WIDTH - INSET - 1);
const RIGHT_DOT_ROW = " ".repeat(FACE_WIDTH - INSET - 1) + DOT + " ".repeat(INSET);
const EDGE_DOTS_ROW = " ".repeat(INSET) + DOT + " ".repeat(FACE_WIDTH - 2 * INSET - 2) + DOT + " ".repeat(INSET);
const CENTER_DOT_ROW = " ".repeat((FACE_WIDTH - 1) / 2) + DOT + " ".repeat((FACE_WIDTH - 1) / 2);

const DIE_FACE_ROWS: Record<number, [string, string, string]> = {
    1: [BLANK_ROW, CENTER_DOT_ROW, BLANK_ROW],
    2: [LEFT_DOT_ROW, BLANK_ROW, RIGHT_DOT_ROW],
    3: [LEFT_DOT_ROW, CENTER_DOT_ROW, RIGHT_DOT_ROW],
    4: [EDGE_DOTS_ROW, BLANK_ROW, EDGE_DOTS_ROW],
    5: [EDGE_DOTS_ROW, CENTER_DOT_ROW, EDGE_DOTS_ROW],
    6: [EDGE_DOTS_ROW, EDGE_DOTS_ROW, EDGE_DOTS_ROW],
};

export class DiceView {
    public readonly box = blessed.box({
        label: " Dices ",
        border: { type: "line" },
        style: {
            border: { fg: "cyan" },
            label: { fg: "white", bold: true },
        },
        tags: true,
        align: "center" as const,
        valign: "middle" as const,
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
    });

    private dieValue = 0;
    private isSettled = true;

    public render(dieValue: number, isSettled = true): void {
        this.dieValue = dieValue;
        this.isSettled = isSettled;
        this.draw();
    }

    public async animateRoll(finalValue: number, onFrame?: () => void): Promise<void> {
        const frameDelaysMs = [80, 90, 110, 140, 170, 210, 260];
        for (const delay of frameDelaysMs) {
            const randomFace = Math.floor(Math.random() * 6) + 1;
            this.render(randomFace, false);
            onFrame?.();
            await new Promise(resolve => setTimeout(resolve, delay));
            playSound(SOUNDS.diceRoll)
        }
        this.render(finalValue, true);
        onFrame?.();
    }

    private draw(): void {
        if (this.dieValue === 0) {
            this.box.setContent("\n{white-fg}Roll to see dice{/white-fg}");
            return;
        }

        const [topRow, middleRow, bottomRow] = DIE_FACE_ROWS[this.dieValue] ?? DIE_FACE_ROWS[1]!;
        const horizontalLine = "═".repeat(FACE_WIDTH);
        const frameColor = this.isSettled ? "green" : "cyan";
        const frameTop = `{${frameColor}-fg}╔${horizontalLine}╗{/${frameColor}-fg}`;
        const frameBottom = `{${frameColor}-fg}╚${horizontalLine}╝{/${frameColor}-fg}`;

        const faceRows = [topRow, BLANK_ROW, middleRow, BLANK_ROW, bottomRow];
        const lines: string[] = [frameTop];
        for (const row of faceRows) {
            lines.push(`{${frameColor}-fg}║{/${frameColor}-fg}${row}{${frameColor}-fg}║{/${frameColor}-fg}`);
        }
        lines.push(frameBottom);
        lines.push("");
        lines.push(this.isSettled ? `{bold}{green-fg}+ Rolled : ${this.dieValue}{/green-fg}{/bold}` : `{white-fg}Rolling…{/white-fg}`,);
        this.box.setContent(lines.join("\n"));
    }
}
