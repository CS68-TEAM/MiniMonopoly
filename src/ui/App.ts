import blessed from "blessed";
import { execSync } from "child_process";
import { Game, movePosition, TAKEOVER_MULTIPLIER, SELL_RATE, JAIL_BAIL_AMOUNT } from "../game/Game";
import { Player } from "../game/Player";
import type { ChanceCard, SaveData, SavedPlayerData } from "../game/Types";
import { EasyAI } from "../ai/EasyAI";
import { NormalAI } from "../ai/NormalAI";
import { HardAI } from "../ai/HardAI";
import { BoardView } from "./BoardView";
import { PlayerView } from "./PlayerView";
import { GameLog } from "./GameLog";
import { ActionMenu } from "./ActionMenu";
import { DiceView } from "./DiceView";
import { PropertyInfo } from "./PropertyInfo";
import { Property } from "../game/Property";
import { writeSave, readSave } from "../save";

const SAVE_FILE = "save.json";
const MOVE_STEP_DELAY_MS = 200;
const PAUSE_AFTER_DICE_MS = 300;
const AI_TURN_DELAY_MS = 600;

export class App {
    private readonly screen: blessed.Widgets.Screen;
    private readonly boardView: BoardView;
    private readonly playerView: PlayerView;
    private readonly gameLog: GameLog;
    private readonly actionMenu: ActionMenu;
    private readonly diceView: DiceView;
    private readonly propertyInfo: PropertyInfo;
    private game!: Game;
    private ais!: (EasyAI | NormalAI | HardAI)[];
    private busy = false;

    constructor() {
        App.resizeConsole(195, 46);
        this.screen = blessed.screen({ smartCSR: true, title: "Mini Monopoly TUI" });
        this.boardView = new BoardView();
        this.playerView = new PlayerView();
        this.gameLog = new GameLog();
        this.actionMenu = new ActionMenu();
        this.diceView = new DiceView();
        this.propertyInfo = new PropertyInfo();

        void this.init();
    }

    private async init(): Promise<void> {
        const save = await readSave(SAVE_FILE).catch(() => null);
        this.showStartMenu(save);
    }

    private static resizeConsole(cols: number, rows: number): void {
        try {
            if (process.platform === "win32") {
                execSync(`mode con: cols=${cols} lines=${rows}`);
            } else {
                process.stdout.write(`\x1b[8;${rows};${cols}t`);
            }
        } catch {
            
        }
    }

    public run(): void {
        this.screen.render();
    }

    private showStartMenu(save: SaveData | null): void {
        const hasSave = save !== null;

        const menuLines = ["", "{green-fg}{bold}1{/bold}  New Game{/green-fg}"];
        if (hasSave) {
            const savedAt = new Date(save!.savedAt).toLocaleString("th-TH");
            menuLines.push(`{cyan-fg}{bold}2{/bold}  Resume Game{/cyan-fg}   {white-fg}(${savedAt}){/white-fg}`);
        } else {
            menuLines.push("{gray-fg}2  Resume Game   (no saved game){/gray-fg}");
        }
        menuLines.push("");
        menuLines.push("{red-fg}{bold}Q{/bold} Quit{/red-fg}");

        const menuBox = blessed.box({
            top: "center",
            left: "center",
            width: 54,
            height: 15,
            border: { type: "line" },
            label: " Mini Monopoly ",
            tags: true,
            align: "left" as const,
            valign: "middle" as const,
            padding: { left: 3, right: 2, top: 0, bottom: 0 },
            style: { border: { fg: "cyan" }, label: { fg: "cyan", bold: true } },
            content: menuLines.join("\n"),
        });
        this.screen.append(menuBox);
        this.screen.render();

        const startNewGame = () => {
            this.screen.remove(menuBox);
            this.startGame();
        };
        this.screen.onceKey("1", startNewGame);

        if (hasSave) {
            const resumeGame = () => {
                this.screen.remove(menuBox);
                this.loadGame(save!);
            };
            this.screen.onceKey("2", resumeGame);
            this.screen.onceKey("r", resumeGame);
            this.screen.onceKey("c", resumeGame);
        }
        this.screen.key(["q", "C-c", "escape"], () => process.exit(0));
    }

    private loadGame(save: SaveData): void {
        const savedPlayers = save.players as SavedPlayerData[];
        const players = savedPlayers.map(savedPlayer => {
            const player = new Player(savedPlayer.id, savedPlayer.name, savedPlayer.kind, savedPlayer.money);
            player.position = savedPlayer.position;
            player.status = savedPlayer.status;
            player.purchaseCount = savedPlayer.purchaseCount ?? 0;
            player.takeoverCount = savedPlayer.takeoverCount ?? 0;
            return player;
        });

        this.game = new Game(players, message => this.gameLog.add(message));
        this.game.onChance = (player, card) => this.showChancePopup(player.name, card);

        const savedCurrentIndex = players.findIndex(player => player.id === save.currentPlayer);
        const humanIndex = players.findIndex(player => player.id === "human");
        this.game.currentPlayerIndex =
            savedCurrentIndex >= 0 && players[savedCurrentIndex]!.id === "human"
                ? savedCurrentIndex
                : humanIndex >= 0
                    ? humanIndex
                    : 0;

        for (const savedPlayer of savedPlayers) {
            const player = players.find(p => p.id === savedPlayer.id)!;
            for (const propertyId of savedPlayer.properties) {
                const property = this.game.board.findPropertyById(propertyId);
                if (!property) continue;
                property.owner = { id: player.id, name: player.name };
                player.addProperty(property);
            }
        }

        this.ais = [];
        for (const player of players) {
            if (player.id === "human")
                continue;
            if (player.kind === "AI Easy")
                this.ais.push(new EasyAI(player));
            else if (player.kind === "AI Normal")
                this.ais.push(new NormalAI(player));
            else
                this.ais.push(new HardAI(player));
        }

        this.layout();
        this.bindKeys();
        this.render();
        this.screen.render();
    }

    private startGame(): void {
        const players = [
            new Player("human", "Player", "Human"),
            new Player("easy", "Bot ( Easy )", "AI Easy"),
            new Player("normal", "Bot ( Normal )", "AI Normal"),
            new Player("hard", "Bot ( Hard )", "AI Hard"),
        ];

        this.game = new Game(players, message => this.gameLog.add(message));
        this.game.onChance = (player, card) => this.showChancePopup(player.name, card);
        this.ais = [
            new EasyAI(players[1]!),
            new NormalAI(players[2]!),
            new HardAI(players[3]!),
        ];

        this.layout();
        this.bindKeys();
        this.render();
        this.screen.render();
    }

    private layout(): void {
        this.boardView.box.top = 0;
        this.boardView.box.left = 0;
        this.boardView.box.width = "72%";
        this.boardView.box.height = "92%";

        this.playerView.box.top = 0;
        this.playerView.box.left = "72%";
        this.playerView.box.width = "28%";
        this.playerView.box.height = "18%";

        this.propertyInfo.box.top = "18%";
        this.propertyInfo.box.left = "72%";
        this.propertyInfo.box.width = "28%";
        this.propertyInfo.box.height = "20%";

        this.gameLog.box.top = "38%";
        this.gameLog.box.left = "72%";
        this.gameLog.box.width = "28%";
        this.gameLog.box.height = "26%";

        this.diceView.box.top = "64%";
        this.diceView.box.left = "72%";
        this.diceView.box.width = "28%";
        this.diceView.box.height = "36%";

        this.actionMenu.box.top = "92%";
        this.actionMenu.box.left = 0;
        this.actionMenu.box.width = "72%";
        this.actionMenu.box.height = "8%";

        this.screen.append(this.boardView.box);
        this.screen.append(this.playerView.box);
        this.screen.append(this.propertyInfo.box);
        this.screen.append(this.gameLog.box);
        this.screen.append(this.diceView.box);
        this.screen.append(this.actionMenu.box);
    }

    private bindKeys(): void {
        this.screen.key(["q", "C-c", "escape"], () => process.exit(0));
        this.screen.key(["enter", "r"], () => { void this.doRoll(); });

        this.screen.key(["b"], () => {
            if (!this.busy && this.game.currentPlayer.id === "human" && this.game.status === "playing") {
                this.game.buy(this.game.currentPlayer);
                this.render();
                void this.autoSave();
            }
        });

        this.screen.key(["s"], () => {
            if (!this.busy && this.game.currentPlayer.id === "human" && this.game.status === "playing") {
                this.sellCheapest();
                void this.autoSave();
            }
        });

        this.screen.key(["t"], () => {
            if (this.busy || this.game.currentPlayer.id !== "human" || this.game.status !== "playing") return;
            const tile = this.game.board.getTile(this.game.currentPlayer.position);
            if (tile.type !== "property" || !tile.property || !tile.property.owner || tile.property.owner.id === "human") return;
            if (this.game.startTakeover(tile.property.id)) {
                void this.showTakeoverPrompt(this.game.pendingTakeover!).then(() => this.autoSave());
            }
        });
    }

    private async doRoll(): Promise<void> {
        if (this.busy || this.game.status === "finished") return;
        if (this.game.currentPlayer.id !== "human") return;

        this.busy = true;

        const player = this.game.currentPlayer;
        const fromPos = player.position;

        let bailChoice: boolean | undefined;
        if (player.status === "jailed") {
            bailChoice = await this.showJailPrompt(player);
        }

        const dice = this.game.roll(player, bailChoice);
        await this.diceView.animateRoll(dice || 1, () => this.screen.render());
        if (dice > 0) {
            await new Promise(resolve => setTimeout(resolve, PAUSE_AFTER_DICE_MS));
            await this.animateMovement(player, fromPos, dice);
        }
        this.render();
        await this.autoSave();

        if (this.game.pendingDebt) {
            await this.showDebtPrompt();
            await this.autoSave();
        }

        if (this.game.pendingProperty) {
            await this.showPurchasePrompt(this.game.pendingProperty);
            await this.autoSave();
        }

        while (this.game.status === "playing" && this.game.currentPlayer.id !== "human") {
            const currentAi = this.ais.find(ai => ai.player.id === this.game.currentPlayer.id);
            if (!currentAi || currentAi.player.status === "bankrupt") {
                this.game.nextTurn();
                continue;
            }
            await new Promise(resolve => setTimeout(resolve, AI_TURN_DELAY_MS));

            const aiPlayer = currentAi.player;
            const aiFromPos = aiPlayer.position;

            const aiDice = currentAi.takeTurn(this.game);

            if (typeof aiDice === "number" && aiDice > 0) {
                await this.diceView.animateRoll(aiDice, () => this.screen.render());
                await new Promise(resolve => setTimeout(resolve, PAUSE_AFTER_DICE_MS));
                await this.animateMovement(aiPlayer, aiFromPos, aiDice);
            }
            this.render();
            await this.autoSave();
        }

        this.busy = false;
    }

    private async animateMovement(player: Player, fromPos: number, steps: number): Promise<void> {
        const boardSize = this.game.board.tiles.length;
        for (let step = 1; step <= steps; step++) {
            const intermediatePos = movePosition(fromPos, step, boardSize);
            this.boardView.render(this.game.board, this.game.players, { [player.id]: intermediatePos });
            this.playerView.render(this.game.players, this.game.currentPlayer.id);
            this.screen.render();
            await new Promise(resolve => setTimeout(resolve, MOVE_STEP_DELAY_MS));
        }
    }

    private async autoSave(): Promise<void> {
        await writeSave(SAVE_FILE, this.serialize()).catch(() => { });
    }

    private showDebtPrompt(): Promise<void> {
        return new Promise(resolve => {
            const debtList = blessed.list({
                top: "center",
                left: "center",
                width: "50%",
                height: "50%",
                border: { type: "line" },
                label: " Not Enough Cash ",
                tags: true,
                keys: true,
                mouse: true,
                style: {
                    border: { fg: "red" },
                    label: { fg: "red", bold: true },
                    selected: { bg: "red", fg: "white", bold: true },
                } as any,
            });

            const refresh = () => {
                const player = this.game.currentPlayer;
                const owed = Math.max(0, -player.money);
                debtList.setLabel(` You owe $${owed} — sell a property `);
                const items = player.properties.map(property => `${property.name}  —  sell for $${Math.floor(property.price * SELL_RATE)}`);
                items.push("{red-fg}{bold}[ Declare Bankruptcy ]{/bold}{/red-fg}");
                debtList.setItems(items as any);
                this.screen.render();
            };

            this.screen.append(debtList);
            refresh();
            debtList.focus();
            this.screen.render();

            debtList.on("select", (_item: unknown, index: number) => {
                const player = this.game.currentPlayer;
                if (index >= player.properties.length) {
                    this.game.declareBankruptcy();
                } else {
                    const property = player.properties[index]!;
                    this.game.sellForDebt(property.id);
                }
                this.render();
                void this.autoSave();

                if (this.game.pendingDebt) {
                    refresh();
                } else {
                    this.screen.remove(debtList);
                    this.screen.render();
                    resolve();
                }
            });
        });
    }

    private showPurchasePrompt(property: Property): Promise<void> {
        return new Promise(resolve => {
            const purchaseBox = blessed.box({
                top: "center",
                left: "center",
                width: "40%",
                height: "30%",
                border: { type: "line" },
                label: " Buy Property? ",
                tags: true,
                align: "center" as const,
                valign: "middle" as const,
                style: { border: { fg: "yellow" }, label: { fg: "yellow", bold: true } },
                content: [
                    `{bold}Property: ${property.name}{/bold}`,
                    `Price: $${property.price}`,
                    `Rent: $${property.rent}`,
                    "",
                    "{green-fg}{bold}[B]{/bold}{/green-fg} Buy    {red-fg}{bold}[N]{/bold}{/red-fg} Skip",
                ].join("\n"),
            });
            this.screen.append(purchaseBox);
            this.screen.render();

            const finish = (buy: boolean) => {
                this.game.decidePurchase(buy);
                this.screen.remove(purchaseBox);
                this.render();
                this.screen.render();
                resolve();
            };
            this.screen.onceKey("b", () => finish(true));
            this.screen.onceKey("n", () => finish(false));
        });
    }

    private showTakeoverPrompt(property: import("../game/Property").Property): Promise<void> {
        return new Promise(resolve => {
            const offer = Math.ceil(property.price * TAKEOVER_MULTIPLIER);
            const offerPercent = Math.round(TAKEOVER_MULTIPLIER * 100);
            const takeoverBox = blessed.box({
                top: "center",
                left: "center",
                width: "44%",
                height: "32%",
                border: { type: "line" },
                label: " Take Over? ",
                tags: true,
                align: "center" as const,
                valign: "middle" as const,
                style: { border: { fg: "magenta" }, label: { fg: "magenta", bold: true } },
                content: [
                    `{bold}Property: ${property.name}{/bold}`,
                    `Current owner: ${property.owner!.name}`,
                    `Original price: $${property.price}`,
                    `Rent: $${property.rent}`,
                    "",
                    `{magenta-fg}{bold}Offer: $${offer} (${offerPercent}%){/bold}{/magenta-fg}`,
                    "",
                    "{green-fg}{bold}[T]{/bold}{/green-fg} Confirm    {red-fg}{bold}[N]{/bold}{/red-fg} Cancel",
                ].join("\n"),
            });
            this.screen.append(takeoverBox);
            this.screen.render();

            const finish = (confirm: boolean) => {
                this.game.decideTakeover(confirm);
                this.screen.remove(takeoverBox);
                this.render();
                this.screen.render();
                resolve();
            };
            this.screen.onceKey("t", () => finish(true));
            this.screen.onceKey("n", () => finish(false));
        });
    }

    private showJailPrompt(player: Player): Promise<boolean> {
        return new Promise(resolve => {
            const canAffordBail = player.money >= JAIL_BAIL_AMOUNT;
            const jailBox = blessed.box({
                top: "center",
                left: "center",
                width: "42%",
                height: "30%",
                border: { type: "line" },
                label: " In Jail ",
                tags: true,
                align: "center" as const,
                valign: "middle" as const,
                style: { border: { fg: "magenta" }, label: { fg: "magenta", bold: true } },
                content: [
                    `{bold}{magenta-fg}You are in Jail!{/magenta-fg}{/bold}`,
                    "",
                    `Bail: {yellow-fg}{bold}$${JAIL_BAIL_AMOUNT}{/bold}{/yellow-fg}`,
                    canAffordBail ? "" : "{red-fg}Not enough cash to pay bail{/red-fg}",
                    "",
                    canAffordBail
                        ? "{green-fg}{bold}[B]{/bold}{/green-fg} Pay Bail    {red-fg}{bold}[N]{/bold}{/red-fg} Skip Turn"
                        : "{red-fg}{bold}[N]{/bold}{/red-fg} Skip Turn",
                ].join("\n"),
            });
            this.screen.append(jailBox);
            this.screen.render();

            const finish = (pay: boolean) => {
                this.screen.remove(jailBox);
                this.screen.render();
                resolve(pay);
            };
            if (canAffordBail) this.screen.onceKey("b", () => finish(true));
            this.screen.onceKey("n", () => finish(false));
        });
    }

    private showChancePopup(playerName: string, card: ChanceCard): void {
        const chanceBox = blessed.box({
            top: "center",
            left: "center",
            width: "38%",
            height: "28%",
            border: { type: "line" },
            label: " Chance ",
            tags: true,
            align: "center" as const,
            valign: "middle" as const,
            style: { border: { fg: "blue" }, label: { fg: "blue", bold: true } },
            content: [
                `{bold}{blue-fg}${playerName}{/blue-fg}{/bold}`,
                "",
                `{bold}{yellow-fg}${card.title}{/yellow-fg}{/bold}`,
                `${card.description}`,
            ].join("\n"),
        });
        this.screen.append(chanceBox);
        this.screen.render();

        const popupDurationMs = 1500 + Math.random() * 1500;
        setTimeout(() => {
            this.screen.remove(chanceBox);
            this.screen.render();
        }, popupDurationMs);
    }

    private sellCheapest(): void {
        const player = this.game.currentPlayer;
        if (player.properties.length === 0) return;
        const cheapestProperty = [...player.properties].sort((a, b) => a.price - b.price)[0]!;
        this.game.sellProperty(player, cheapestProperty.id);
        this.render();
    }

    private render(): void {
        this.boardView.render(this.game.board, this.game.players);
        this.playerView.render(this.game.players, this.game.currentPlayer.id);
        this.propertyInfo.render(this.game.board, this.game.players);
        this.screen.render();
    }

    private serialize(): SaveData {
        return {
            currentPlayer: this.game.currentPlayer.id,
            players: this.game.players.map((player): SavedPlayerData => ({
                id: player.id,
                name: player.name,
                kind: player.kind,
                money: player.money,
                position: player.position,
                status: player.status,
                properties: player.properties.map(property => property.id),
                purchaseCount: player.purchaseCount,
                takeoverCount: player.takeoverCount,
            })),
            savedAt: new Date().toISOString(),
        };
    }
}