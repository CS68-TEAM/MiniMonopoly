import blessed from "blessed";
import type { Player } from "../game/Player";

export const PLAYER_COLORS: Record<string, [string, string]> = {
    human: ["{yellow-fg}", "{/yellow-fg}"],
    easy: ["{green-fg}", "{/green-fg}"],
    normal: ["{blue-fg}", "{/blue-fg}"],
    hard: ["{red-fg}", "{/red-fg}"],
};

const NO_CHANGE_LABEL = "±0";
const FIRST_RENDER_LABEL = "--";

function centerPad(text: string, width: number): string {
    const totalPadding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return " ".repeat(leftPadding) + text + " ".repeat(rightPadding);
}

export class PlayerView {
    public readonly box = blessed.box({ label: " Players ", border: { type: "line" }, style: {border: { fg: "white" },label: { fg: "white", bold: true }}, tags: true, padding: { left: 1, right: 1 }});
    private readonly lastKnownMoney = new Map<string, number>();
    private readonly lastCashFlow = new Map<string, { label: string; color: "green" | "red" | "white" }>();

    private formatCashFlow(player: Player): { label: string; color: "green" | "red" | "white" } {
        const previous = this.lastKnownMoney.get(player.id);
        this.lastKnownMoney.set(player.id, player.money);

        if (previous === undefined) {
            const initial = { label: FIRST_RENDER_LABEL, color: "white" as const };
            this.lastCashFlow.set(player.id, initial);
            return initial;
        }

        const delta = player.money - previous;
        if (delta === 0) {
            return this.lastCashFlow.get(player.id) ?? { label: NO_CHANGE_LABEL, color: "white" };
        }

        const updated = delta > 0 ? { label: `+$${delta.toLocaleString()}`, color: "green" as const } : { label: `-$${Math.abs(delta).toLocaleString()}`, color: "red" as const };
        this.lastCashFlow.set(player.id, updated);
        return updated;
    }

    public render(players: Player[], currentPlayerId: string): void {
        const cashFlows = players.map(player => this.formatCashFlow(player));

        const Name_Width = Math.max("Name".length, ...players.map(p => p.name.length));
        const Money_Width = Math.max("Money".length, ...players.map(p => `$${p.money.toLocaleString()}`.length));
        const Property_Width = Math.max("Property".length, ...players.map(p => String(p.properties.length).length));
        const CashFlow_Width = Math.max("Flow".length, ...cashFlows.map(cf => cf.label.length));

        const header = `  ${"Name".padEnd(Name_Width)} | ${"Money".padEnd(Money_Width)} | ${centerPad("Property", Property_Width)} | ${centerPad("Flow", CashFlow_Width)} | Status`;

        const rows = players.map((player, i) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const [colorOpen, colorClose] = PLAYER_COLORS[player.id] ?? ["{red-fg}", "{/red-fg}"];
            const turnMarker = isCurrentPlayer ? `${colorOpen}{bold}>{/bold}${colorClose}` : " ";

            let statusBadge: string;
            if (player.status === "bankrupt") {
                statusBadge = "{red-fg}{bold}BANKRUPT{/bold}{/red-fg}";
            } else if (player.status === "jailed") {
                statusBadge = "{magenta-fg}{bold}JAIL{/bold}{/magenta-fg}";
            } else if (isCurrentPlayer) {
                statusBadge = `${colorOpen}{bold}ACTIVE{/bold}${colorClose}`;
            } else {
                statusBadge = "{white-fg}WAITING{/white-fg}";
            }

            const displayName = player.name.padEnd(Name_Width);
            const nameCell = `${colorOpen}${displayName}${colorClose}`;

            const displayMoney = `$${player.money.toLocaleString()}`.padEnd(Money_Width);
            const moneyCell = player.money < 0 ? `{red-fg}{bold}${displayMoney}{/bold}{/red-fg}` : `{green-fg}${displayMoney}{/green-fg}`;

            const displayPropertyCount = centerPad(String(player.properties.length), Property_Width);
            const propertyCell = `{cyan-fg}${displayPropertyCount}{/cyan-fg}`;

            const cashFlow = cashFlows[i]!;
            const displayCashFlow = centerPad(cashFlow.label, CashFlow_Width);
            const cashFlowCell = `{${cashFlow.color}-fg}${displayCashFlow}{/${cashFlow.color}-fg}`;

            return `${turnMarker} ${nameCell} | ${moneyCell} | ${propertyCell} | ${cashFlowCell} | ${statusBadge}`;
        });

        this.box.setContent([header, ...rows].join("\n"));
    }
}

