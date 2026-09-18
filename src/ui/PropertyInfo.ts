import blessed from "blessed";
import type { Board } from "../game/Board";
import type { Player } from "../game/Player";
import { PLAYER_COLORS } from "./PlayerView";
import { MAX_PROPERTIES, MAX_DIRECT_PURCHASES, TAKEOVER_LIMIT, SELL_RATE, TAX_RATE } from "../game/Game";

function visibleWidth(taggedText: string): number {
    const plainText = taggedText.replace(/\{[^}]+\}/g, "");
    let width = 0;
    for (const ch of plainText) width += ch.codePointAt(0)! > 0x2e80 ? 2 : 1;
    return width;
}

function padTagged(taggedText: string, width: number): string {
    return taggedText + " ".repeat(Math.max(0, width - visibleWidth(taggedText)));
}

export class PropertyInfo {
    public readonly box = blessed.box({
        label: " Property Info ",
        border: { type: "line" },
        style: {
            border: { fg: "yellow" },
            label: { fg: "yellow", bold: true },
        },
        tags: true,
        wrap: false,
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
    });

    private contentWidth(): number {
        const boxWidth = typeof this.box.width === "number" ? this.box.width : 40;
        return Math.max(24, boxWidth - 4);
    }

    public render(board: Board, players: Player[], humanId = "human"): void {
        const human = players.find(player => player.id === humanId);

        const totalWidth = this.contentWidth();
        const divider = " {white-fg}│{/white-fg} ";
        const dividerWidth = 3;
        const leftWidth = Math.floor((totalWidth - dividerWidth) / 2);
        const rightWidth = totalWidth - dividerWidth - leftWidth;

        const leftLines = this.buildTileLines(board, players, human, humanId, leftWidth);
        const rightLines = this.buildPortfolioLines(human, rightWidth);

        const rowCount = Math.max(leftLines.length, rightLines.length);
        const lines: string[] = [];
        for (let i = 0; i < rowCount; i++) {
            const leftCell = padTagged(leftLines[i] ?? "", leftWidth);
            const rightCell = rightLines[i] ?? "";
            lines.push(`${leftCell}${divider}${rightCell}`);
        }

        this.box.setContent(lines.join("\n"));
    }

    private buildTileLines(board: Board, players: Player[], human: Player | undefined, humanId: string, width: number): string[] {
        if (!human || human.status === "bankrupt") {
            return ["{white-fg}  --{/white-fg}"];
        }

        const tile = board.getTile(human.position);
        const lines: string[] = [];

        lines.push(`{bold}{white-fg} #${human.position}  ${tile.name}{/white-fg}{/bold}`);
        lines.push("{white-fg} " + "─".repeat(width - 1) + "{/white-fg}");

        switch (tile.type) {
            case "property": {
                const property = tile.property!;
                lines.push(` {white-fg}Price {/white-fg}  {yellow-fg}{bold}$${property.price}{/bold}{/yellow-fg}`);
                lines.push(` {white-fg}Rent  {/white-fg}  {green-fg}{bold}$${property.rent}{/bold}{/green-fg}`);
                lines.push("{white-fg} " + "─".repeat(width - 1) + "{/white-fg}");

                if (property.owner) {
                    const ownerPlayer = players.find(player => player.id === property.owner!.id);
                    const ownerIndex = ownerPlayer ? players.indexOf(ownerPlayer) + 1 : "?";
                    const [colorOpen, colorClose] = PLAYER_COLORS[property.owner.id] ?? ["{white-fg}", "{/white-fg}"];
                    if (property.owner.id === humanId) {
                        lines.push(` {white-fg}Owner {/white-fg}  ${colorOpen}{bold}You (P${ownerIndex}){/bold}${colorClose}`);
                    } else {
                        lines.push(` {white-fg}Owner {/white-fg}  ${colorOpen}{bold}${property.owner.name}{/bold}${colorClose}`);
                        lines.push(` {white-fg}Pay   {/white-fg}  {red-fg}{bold}$${property.rent}{/bold}{/red-fg}`);
                    }
                } else {
                    lines.push(` {white-fg}Owner {/white-fg}  {white-fg}none{/white-fg}`);
                    if (human.money >= property.price) {
                        lines.push(` {green-fg}[B] to buy{/green-fg}`);
                    } else {
                        lines.push(` {red-fg}Not enough cash{/red-fg}`);
                    }
                }
                break;
            }
            case "tax": {
                const fine = Math.ceil(human.money * TAX_RATE);
                lines.push(` {white-fg}Fine  {/white-fg}  {red-fg}{bold}$${fine} (${Math.round(TAX_RATE * 100)}%){/bold}{/red-fg}`);
                lines.push(` {white-fg}Pay on landing{/white-fg}`);
                break;
            }
            case "chance":
                lines.push(` {blue-fg}{bold}? Chance Card{/bold}{/blue-fg}`);
                lines.push(` {white-fg}Draw a random card{/white-fg}`);
                break;
            case "jail":
                lines.push(` {white-fg}Just visiting{/white-fg}`);
                lines.push(` {white-fg}No effect{/white-fg}`);
                break;
            case "goToJail":
                lines.push(` {red-fg}{bold}Go to Jail!{/bold}{/red-fg}`);
                lines.push(` {white-fg}Skip next turn{/white-fg}`);
                break;
            case "parking":
                lines.push(` {green-fg}{bold}Free Parking{/bold}{/green-fg}`);
                lines.push(` {white-fg}Safe effect{/white-fg}`);
                break;
            case "start":
                lines.push(` {green-fg}{bold}+ $200{/bold}{/green-fg}`);
                lines.push(` {white-fg}Collect on go{/white-fg}`);
                break;
        }

        return lines;
    }

    private buildPortfolioLines(human: Player | undefined, width: number): string[] {
        const lines: string[] = [];
        lines.push("{bold}{white-fg} Your Assets{/white-fg}{/bold}");
        lines.push("{white-fg} " + "─".repeat(width - 1) + "{/white-fg}");

        if (!human) {
            lines.push("{white-fg}  --{/white-fg}");
            return lines;
        }

        const netWorth = human.money + human.properties.reduce((sum, property) => sum + Math.floor(property.price * SELL_RATE), 0);

        const propertySlots = `${human.properties.length}/${MAX_PROPERTIES}`;
        const purchaseSlots = `${human.purchaseCount}/${MAX_DIRECT_PURCHASES}`;
        const takeoverSlots = `${human.takeoverCount}/${TAKEOVER_LIMIT}`;
        lines.push(` {white-fg}Cash    {/white-fg} {green-fg}{bold}$${human.money.toLocaleString()}{/bold}{/green-fg}`);
        lines.push(` {white-fg}Props   {/white-fg} {cyan-fg}{bold}${propertySlots}{/bold}{/cyan-fg}`);
        lines.push(` {white-fg}Buys    {/white-fg} {magenta-fg}{bold}${purchaseSlots}{/bold}{/magenta-fg}`);
        lines.push(` {white-fg}T.Overs {/white-fg} {magenta-fg}{bold}${takeoverSlots}{/bold}{/magenta-fg}`);
        lines.push(` {white-fg}Worth   {/white-fg} {yellow-fg}{bold}$${netWorth.toLocaleString()}{/bold}{/yellow-fg}`);

        if (human.properties.length > 0) {
            lines.push("{white-fg} " + "─".repeat(width - 1) + "{/white-fg}");
            lines.push(" {white-fg}Best rent{/white-fg}");
            const topProperties = [...human.properties].sort((a, b) => b.rent - a.rent).slice(0, 3);
            topProperties.forEach((property, i) => {
                lines.push(`  {white-fg}${i + 1}.{/white-fg} ${property.name}  {green-fg}$${property.rent}{/green-fg}`);
            });
        } else {
            lines.push(" {white-fg}No properties yet{/white-fg}");
        }

        return lines;
    }
}
