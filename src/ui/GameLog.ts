import blessed from "blessed";

const LOG_CATEGORIES: { match: RegExp; icon: string; color: string }[] = [
    { match: /wins the game/i, icon: "★", color: "yellow" },
    { match: /is BANKRUPT/i, icon: "X", color: "red" },
    { match: /rent/i, icon: "$", color: "yellow" },
    { match: /tax/i, icon: "%", color: "magenta" },
    { match: /bought/i, icon: ">", color: "green" },
    { match: /sold/i, icon: "<", color: "cyan" },
    { match: /sent to Jail|leaves Jail/i, icon: "!", color: "red" },
    { match: /Chance:/i, icon: "?", color: "blue" },
    { match: /rolled/i, icon: "*", color: "cyan" },
    { match: /passed START/i, icon: "+", color: "green" },
];
const DEFAULT_LOG_CATEGORY = { icon: "-", color: "white" };

const MAX_LOG_LINES = 80;
const LOG_ICON_PREFIX_WIDTH = 4;

export class GameLog {
    public readonly box = blessed.box({
        label: " Game Logs ",
        border: { type: "line" },
        style: {
            border: { fg: "white" },
            label: { fg: "white", bold: true },
        },
        tags: true,
        wrap: false,
        scrollable: true,
        alwaysScroll: true,
        keys: true,
        mouse: true,
        padding: { left: 1, right: 1 },
    });

    private readonly logLines: string[] = [];

    constructor() {
        this.box.on("attach", () => {
            const screen = this.box.screen;
            screen.key(["up"], () => this.scroll(-1));
            screen.key(["down"], () => this.scroll(1));
        });
    }

    private contentWidth(): number {
        const boxWidth = typeof this.box.width === "number" ? this.box.width : 40;
        return Math.max(10, boxWidth - 4);
    }

    public add(message: string): void {
        const category = LOG_CATEGORIES.find(c => c.match.test(message)) ?? DEFAULT_LOG_CATEGORY;
        const maxMessageWidth = Math.max(0, this.contentWidth() - LOG_ICON_PREFIX_WIDTH);
        const trimmedMessage = message.length > maxMessageWidth ? message.slice(0, Math.max(0, maxMessageWidth - 1)) + "…" : message;
        const line = `${category.icon} | {${category.color}-fg}${trimmedMessage}{/${category.color}-fg}`;

        this.logLines.push(line);
        if (this.logLines.length > MAX_LOG_LINES) this.logLines.shift();

        this.box.setContent(this.logLines.join("\n"));
        this.box.setScrollPerc(100);
    }

    public scroll(lineDelta: number): void {
        this.box.scroll(lineDelta);
        this.box.screen.render();
    }
}