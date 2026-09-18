import blessed from "blessed";
import type { Player } from "../game/Player";

export const PLAYER_COLORS: Record<string, [string, string]> = {
    human: ["{yellow-fg}", "{/yellow-fg}"],
    easy: ["{green-fg}", "{/green-fg}"],
    normal: ["{blue-fg}", "{/blue-fg}"],
    hard: ["{red-fg}", "{/red-fg}"],
};

function centerPad(text: string, width: number): string {
    const totalPadding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return " ".repeat(leftPadding) + text + " ".repeat(rightPadding);
}

export class PlayerView {
    public readonly box = blessed.box({
        label: " Players ",
        border: { type: "line" },
        style: {
            border: { fg: "white" },
            label: { fg: "white", bold: true },
        },
        tags: true,
        padding: { left: 1, right: 1 },
    });

    public render(players: Player[], currentPlayerId: string): void {
        const nameColumnWidth = Math.max("Name".length, ...players.map(p => p.name.length));
        const moneyColumnWidth = Math.max("Money".length, ...players.map(p => `$${p.money.toLocaleString()}`.length));
        const propertyColumnWidth = Math.max("Property".length, ...players.map(p => String(p.properties.length).length));

        const header = `  ${"Name".padEnd(nameColumnWidth)} | ${"Money".padEnd(moneyColumnWidth)} | ${centerPad("Property", propertyColumnWidth)} | Status`;

        const rows = players.map(player => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const [colorOpen, colorClose] = PLAYER_COLORS[player.id] ?? ["{red-fg}", "{/red-fg}"];
            const turnMarker = isCurrentPlayer ? `${colorOpen}{bold}>{/bold}${colorClose}` : " ";

            let statusBadge: string;
            if (player.status === "bankrupt") {
                statusBadge = "{red-fg}{bold}[BANKRUPT]{/bold}{/red-fg}";
            } else if (player.status === "jailed") {
                statusBadge = "{magenta-fg}{bold}[JAIL]{/bold}{/magenta-fg}";
            } else if (isCurrentPlayer) {
                statusBadge = `${colorOpen}{bold}[ACTIVE]{/bold}${colorClose}`;
            } else {
                statusBadge = "{white-fg}[WAITING]{/white-fg}";
            }

            const paddedName = player.name.padEnd(nameColumnWidth);
            const nameCell = `${colorOpen}${paddedName}${colorClose}`;

            const paddedMoney = `$${player.money.toLocaleString()}`.padEnd(moneyColumnWidth);
            const moneyCell = player.money < 0 ? `{red-fg}{bold}${paddedMoney}{/bold}{/red-fg}` : `{green-fg}${paddedMoney}{/green-fg}`;

            const paddedPropertyCount = centerPad(String(player.properties.length), propertyColumnWidth);
            const propertyCell = `{cyan-fg}${paddedPropertyCount}{/cyan-fg}`;

            return `${turnMarker} ${nameCell} | ${moneyCell} | ${propertyCell} | ${statusBadge}`;
        });

        this.box.setContent([header, ...rows].join("\n"));
    }
}