import blessed from "blessed";

const CONTROL_HINTS = [
    "{bold}{yellow-fg}ENTER{/yellow-fg} = ROLL{/bold}",
    "{bold}{green-fg}B{/green-fg} = BUY{/bold}",
    "{bold}{red-fg}S{/red-fg} = SELL{/bold}",
    "{bold}{magenta-fg}T{/magenta-fg} = TAKEOVER{/bold}",
    "{bold}{cyan-fg}Q{/cyan-fg} = QUIT{/bold}",
];

const TEST_HINTS = [
    "{bold}{red-fg}^L{/red-fg} = TEST OFF{/bold}",
    "{bold}{red-fg}^G{/red-fg} = GOTO TILE{/bold}",
];

const CONTROL_HINT_SEPARATOR = "   │   ";

export class ActionMenu {
    public readonly box = blessed.box({
        label: " Controls ",
        border: { type: "line" },
        style: {
            border: { fg: "white" },
            label: { fg: "white", bold: true },
        },
        tags: true,
        align: "center" as const,
        valign: "middle" as const,
        content: CONTROL_HINTS.join(CONTROL_HINT_SEPARATOR),
    });

    public setTestMode(on: boolean): void {
        const hints = on ? [...CONTROL_HINTS, ...TEST_HINTS] : CONTROL_HINTS;
        this.box.setLabel(on ? " Controls [TEST MODE] " : " Controls ");
        this.box.setContent(hints.join(CONTROL_HINT_SEPARATOR));
        (this.box.style as any).border.fg = on ? "red" : "white";
    }
}

