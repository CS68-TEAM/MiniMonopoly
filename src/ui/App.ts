import blessed from "blessed";
import { execSync } from "child_process";
import { Player } from "../game/Player";

import { EasyAI } from "../ai/EasyAI";
import { NormalAI } from "../ai/NormalAI";
import { HardAI } from "../ai/HardAI";

import { BoardView } from "./BoardView";
import { PlayerView } from "./PlayerView";
import { GameLog } from "./GameLog";
import { ActionMenu } from "./ActionMenu";
import { DiceView } from "./DiceView";
import { Property } from "../game/Property";
import { PropertyInfo } from "./PropertyInfo";
import { writeSave, readSave } from "../save";
import { ChanceCard, SaveData, SavedPlayerData } from "../game/Types";
import { playSound, SOUNDS, closeSoundManager } from "../utils/SoundManager";
import { buildWinnerContentLines, buildWinnerFooterContent } from "./WinnerView";
import { Game, movePosition, TAKEOVER_MULTIPLIER, SELL_RATE, JAIL_BAIL_AMOUNT } from "../game/Game";

const SAVE_FILE = "save.json";
const MOVE_STEP_DELAY_MS = 200;
const PAUSE_AFTER_DICE_MS = 300;
const AI_TURN_DELAY_MS = 600;

interface PopupOptions {
    width: string;
    height: string;
    label: string;
    color: string;
    content: string;
}

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
    private popupWaits: Promise<void>[] = [];

    constructor() {
        App.resizeConsole(195, 48);
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
            execSync(`mode con: cols=${cols} lines=${rows}`);
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
            menuLines.push("{white-fg}2  Resume Game   (no saved game){/white-fg}");
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
        }
        this.screen.key(["q", "C-c"], () => { closeSoundManager(); process.exit(0); });
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
        this.game.currentPlayerIndex = savedCurrentIndex >= 0 && players[savedCurrentIndex]!.id === "human" ? savedCurrentIndex : humanIndex >= 0 ? humanIndex : 0;

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
            new Player("easy", "Ethan", "AI Easy"),
            new Player("normal", "Norman", "AI Normal"),
            new Player("hard", "Henry", "AI Hard"),

            // new Player("easy", "Bot ( Easy )", "AI Easy"),
            // new Player("normal", "Bot ( Normal )", "AI Normal"),
            // new Player("hard", "Bot ( Hard )", "AI Hard"),
        ];

        this.game = new Game(players, message => this.gameLog.add(message));
        this.game.onChance = (player, card) => this.showChancePopup(player.name, card);
        this.ais = [
            new EasyAI(players[1]!),
            new NormalAI(players[2]!),
            new HardAI(players[3]!),
        ];

        playSound(SOUNDS.gameStart);

        this.layout();
        this.bindKeys();
        this.render();
        this.screen.render();
    }

    private layout(): void {
        const MENU_HEIGHT = 3;
        
        this.boardView.box.top = 0;
        this.boardView.box.left = 0;
        this.boardView.box.width = "72%";
        this.boardView.box.height = `100%-${MENU_HEIGHT}`;

        this.layoutRightColumn();
        this.screen.on("resize", () => {
            this.layoutRightColumn();
            this.render();
        });

        this.actionMenu.box.top = `100%-${MENU_HEIGHT}`;
        this.actionMenu.box.left = 0;
        this.actionMenu.box.width = "72%";
        this.actionMenu.box.height = MENU_HEIGHT;

        this.screen.append(this.boardView.box);
        this.screen.append(this.playerView.box);
        this.screen.append(this.propertyInfo.box);
        this.screen.append(this.gameLog.box);
        this.screen.append(this.diceView.box);
        this.screen.append(this.actionMenu.box);
        this.diceView.render(0);
    }

    private layoutRightColumn(): void {
        const rows = Number(this.screen.height);
        const parts: [blessed.Widgets.BoxElement, number][] = [
            [this.playerView.box, 15],
            [this.propertyInfo.box, 20],
            [this.gameLog.box, 40],
            [this.diceView.box, 25],
        ];

        let top = 0;
        let accumulated = 0;
        for (const [box, weight] of parts) {
            accumulated += weight;
            const bottom = Math.round(rows * accumulated / 100);
            box.top = top;
            box.left = "72%";
            box.width = "28%";
            box.height = bottom - top;
            top = bottom;
        }
    }

    private bindKeys(): void {
        this.screen.key(["q", "C-c"], () => { closeSoundManager(); process.exit(0); });
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
                if (this.game.currentPlayer.properties.length === 0) return;
                void this.showSellPrompt();
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
        if (this.busy || this.game.status === "finished")
            return;
        if (this.game.currentPlayer.id !== "human")
            return;

        this.busy = true;

        const player = this.game.currentPlayer;
        const fromPos = player.position;

        let bailChoice: boolean | undefined;
        if (player.status === "jailed" && !player.stayinjailed) {
            bailChoice = await this.showJailPrompt(player);
        }

        const dice = this.game.move(player, bailChoice);
        if (dice > 0) {
            await this.diceView.animateRoll(dice, () => this.screen.render());
            playSound(SOUNDS.dice(dice));
            await new Promise(resolve => setTimeout(resolve, PAUSE_AFTER_DICE_MS));
            await this.animateMovement(player, fromPos, dice);
        }
        this.game.land();
        await this.waitForPopups();
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

            const aiDice = currentAi.move(this.game);

            if (aiDice > 0) {
                await this.diceView.animateRoll(aiDice, () => this.screen.render());
                playSound(SOUNDS.dice(aiDice));
                await new Promise(resolve => setTimeout(resolve, PAUSE_AFTER_DICE_MS));
                await this.animateMovement(aiPlayer, aiFromPos, aiDice);
                currentAi.resolve(this.game);
                await this.waitForPopups();
            }
            this.render();
            await this.autoSave();
        }

        if (this.game.winner) {
            await this.showWinnerScreen(this.game.winner);
            const save = await readSave(SAVE_FILE).catch(() => null);
            this.showStartMenu(save);
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
        await writeSave(SAVE_FILE, this.buildSaveData()).catch(() => { });
    }

    private createPopup(options: PopupOptions): blessed.Widgets.BoxElement {
        const box = blessed.box({ top: "center", left: "center", width: options.width, height: options.height, border: { type: "line" }, label: options.label, tags: true, align: "center" as const, valign: "middle" as const, style: { border: { fg: options.color }, label: { fg: options.color, bold: true } }, content: options.content });
        this.screen.append(box);
        this.screen.render();
        return box;
    }

    private closePopup(box: blessed.Widgets.BoxElement): void {
        this.screen.remove(box);
        this.screen.render();
    }

    private showDebtPrompt(): Promise<void> {
        return new Promise(resolve => {
            const debtList = blessed.list({ top: "center", left: "center", width: "50%", height: "50%", border: { type: "line" }, label: " Not Enough Cash ", tags: true, keys: true, mouse: true, style: {border: { fg: "red" },label: { fg: "red", bold: true },selected: { bg: "red", fg: "white", bold: true }, } as any,});
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
            const box = this.createPopup({ width: "40%", height: "30%", label: " Buy Property? ", color: "yellow", content: [ `{bold}Property: ${property.name}{/bold}`, `Price: $${property.price}`, `Rent: $${property.rent}`, "", "{green-fg}{bold}[B]{/bold}{/green-fg} Buy    {red-fg}{bold}[N]{/bold}{/red-fg} Skip",].join("\n")});

            const finish = (buy: boolean) => {
                this.game.decidePurchase(buy);
                this.closePopup(box);
                this.render();
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
            const box = this.createPopup({ width: "44%", height: "32%", label: " Take Over? ", color: "magenta", content: [ `{bold}Property : ${property.name}{/bold}`, `Current owner : ${property.owner!.name}`, `Original price : $${property.price}`, `Rent : $${property.rent}`, "", `{magenta-fg}{bold}Offer : $${offer} (${offerPercent}%){/bold}{/magenta-fg}`, "", "{green-fg}{bold}[T]{/bold}{/green-fg} Confirm    {red-fg}{bold}[N]{/bold}{/red-fg} Cancel"].join("\n")});
            
            const finish = (confirm: boolean) => {
                this.game.decideTakeover(confirm);
                this.closePopup(box);
                this.render();
                resolve();
            };
            this.screen.onceKey("t", () => finish(true));
            this.screen.onceKey("n", () => finish(false));
        });
    }

    private showJailPrompt(player: Player): Promise<boolean> {
        return new Promise(resolve => {
            const canAffordBail = player.money >= JAIL_BAIL_AMOUNT;
            const box = this.createPopup({ width: "42%", height: "30%", label: " In Jail ", color: "magenta", content: [ `{bold}{magenta-fg}You are in Jail!{/magenta-fg}{/bold}`, "", `Bail: {yellow-fg}{bold}$${JAIL_BAIL_AMOUNT}{/bold}{/yellow-fg}`, canAffordBail ? "" : "{red-fg}Not enough cash to pay bail{/red-fg}", "", canAffordBail ? "{green-fg}{bold}[B]{/bold}{/green-fg} Pay Bail    {red-fg}{bold}[N]{/bold}{/red-fg} Skip Turn" : "{red-fg}{bold}[N]{/bold}{/red-fg} Skip Turn"].join("\n")});

            const finish = (pay: boolean) => {
                this.closePopup(box);
                resolve(pay);
            };
            if (canAffordBail) 
                this.screen.onceKey("b", () => finish(true));
            this.screen.onceKey("n", () => finish(false));
        });
    }

    private hideGameViews(): void {
        for (const box of [this.boardView.box, this.playerView.box, this.gameLog.box, this.actionMenu.box, this.diceView.box, this.propertyInfo.box]) {
            this.screen.remove(box);
        }
    }

    private showWinnerScreen(winner: Player): Promise<void> {
        return new Promise(resolve => {
            this.hideGameViews();

            const main = blessed.box({
                top: 0, left: 0, width: "100%", height: "100%-3",
                tags: true, align: "center" as const, valign: "middle" as const,
                content: buildWinnerContentLines(winner).join("\n"),
            });

            const footer = blessed.box({
                bottom: 0, left: 0, width: "100%", height: 3,
                tags: true, align: "center" as const, valign: "middle" as const,
                content: buildWinnerFooterContent(),
            });

            this.screen.append(main);
            this.screen.append(footer);
            this.screen.render();

            const finish = () => {
                this.screen.remove(main);
                this.screen.remove(footer);
                this.screen.render();
                resolve();
            };
            this.screen.onceKey("enter", finish);
        });
    }

    private async waitForPopups(): Promise<void> {
        const waits = this.popupWaits;
        this.popupWaits = [];
        await Promise.all(waits);
    }

    private showChancePopup(playerName: string, card: ChanceCard): void {
        const box = this.createPopup({width: "38%",height: "28%",label: " Chance ",color: "blue",content: [`{bold}{blue-fg}${playerName}{/blue-fg}{/bold}`,"",`{bold}{yellow-fg}${card.title}{/yellow-fg}{/bold}`,`${card.description}`].join("\n"),});
        const popupDurationMs = 1500 + Math.random() * 1500;
        this.popupWaits.push(new Promise(resolve => setTimeout(() => {
            this.closePopup(box);
            resolve();
        }, popupDurationMs)));
    }

    private showSellPrompt(): Promise<void> {
        return new Promise(resolve => {
            this.busy = true;
            const player = this.game.currentPlayer;
            const items = player.properties.map(property => `{green-fg}${property.name}  —  sell for $${Math.floor(property.price * SELL_RATE)}{/green-fg}`);
            items.push("{red-fg}{bold}[ Cancel ]{/bold}{/red-fg}");

            const sellList = blessed.list({ top: "center", left: "center", width: "50%", height: "50%", border: { type: "line" }, label: " Sell Property ", tags: true, keys: true, mouse: true, style: { border: { fg: "green" }, label: { fg: "green", bold: true }, selected: { bg: "cyan", fg: "white" } } as any, items: items as any,});

            const finish = () => {
                this.screen.remove(sellList);
                this.busy = false;
                this.render();
                resolve();
            };

            this.screen.append(sellList);
            sellList.focus();
            this.screen.render();

            sellList.on("select", (_item: unknown, index: number) => {
                if (index < player.properties.length) {
                    const property = player.properties[index]!;
                    this.game.sellProperty(player, property.id);
                    void this.autoSave();
                }
                finish();
            });

            this.screen.onceKey("escape", finish);
        });
    }

    private render(): void {
        this.boardView.render(this.game.board, this.game.players);
        this.playerView.render(this.game.players, this.game.currentPlayer.id);
        this.propertyInfo.render(this.game.board, this.game.players);
        this.screen.render();
    }

    private buildSaveData(): SaveData {
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
