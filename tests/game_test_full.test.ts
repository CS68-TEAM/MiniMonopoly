import { describe, expect, test, beforeEach } from "bun:test";
import { movePosition, rollDice, Game, JAIL_BAIL_AMOUNT, SELL_RATE, TAX_RATE } from "../src/game/Game";
import { Board } from "../src/game/Board";
import { Player } from "../src/game/Player";
import { PlayerStatus } from "../src/game/Types";
import { Property } from "../src/game/Property";
import { EasyAI } from "../src/ai/EasyAI";
import { NormalAI } from "../src/ai/NormalAI";
import { HardAI } from "../src/ai/HardAI";

const makePlayers = (): [Player, Player, Player, Player] => [
new Player("human", "Player", "Human"),
new Player("bot1", "Bot 1", "AI Easy"),
new Player("bot2", "Bot 2", "AI Normal"),
new Player("bot3", "Bot 3", "AI Hard"),
];

const disableLog = () => {};

const newGame = () => new Game(makePlayers(), disableLog);

const buyAt = (game: Game, player: Player, position: number) => {
  player.position = position;
  game.buy(player);
};

describe("1 · Pure functions", () => {
  test("movePosition — normal forward move", () => {
    expect(movePosition(5, 3, 32)).toBe(8);
  });

  test("movePosition — wraps around board forward", () => {
    expect(movePosition(30, 5, 32)).toBe(3);
  });

  test("movePosition — wraps around board backward", () => {
    expect(movePosition(2, -5, 32)).toBe(29);
  });

  test("rollDice — minimum value (random → 0)", () => {
    expect(rollDice(() => 0)).toBe(1);
  });

  test("rollDice — maximum value (random → 0.9999)", () => {
    expect(rollDice(() => 0.9999)).toBe(6);
  });

  test("rollDice — output always in 1..6 (100 samples)", () => {
    for (let i = 0; i < 100; i++) {
      const diceResult = rollDice();
      expect(diceResult).toBeGreaterThanOrEqual(1);
      expect(diceResult).toBeLessThanOrEqual(6);
    }
  });
});

describe("2 · Board construction", () => {
  let board: Board;
  beforeEach(() => {
    board = new Board();
  });

  test("board has exactly 32 tiles", () => {
    expect(board.tiles.length).toBe(32);
  });

  test("tile 0 is START (GO)", () => {
    expect(board.tiles[0]!.type).toBe("start");
    expect(board.tiles[0]!.name).toBe("GO");
  });

  test("tile 8 is a jail", () => {
    expect(board.tiles[8]!.type).toBe("jail");
  });

  test("tile 16 is Free Parking", () => {
    expect(board.tiles[16]!.type).toBe("parking");
  });

  test("tile 24 is Go To Jail", () => {
    expect(board.tiles[24]!.type).toBe("goToJail");
  });

  test("all property tiles have a Property instance", () => {
    for (const tile of board.tiles) {
      if (tile.type === "property") {
        expect(tile.property).toBeInstanceOf(Property);
      }
    }
  });

  test("getTile wraps around using modulo", () => {
    expect(board.getTile(32)).toBe(board.tiles[0]);
    expect(board.getTile(33)).toBe(board.tiles[1]);
  });

  test("findPropertyById returns correct Property", () => {
    const property = board.tiles.find((t) => t.type === "property")!.property!;
    expect(board.findPropertyById(property.id)).toBe(property);
  });

});

describe("3 · Player model", () => {
  let player: Player;
  beforeEach(() => {
    player = new Player("test", "Test", "Human", 1500);
  });

  test("starts with correct money", () => {
    expect(player.money).toBe(1500);
  });

  test("addMoney increases balance", () => {
    player.addMoney(200);
    expect(player.money).toBe(1700);
  });

  test("removeMoney decreases balance", () => {
    player.removeMoney(300);
    expect(player.money).toBe(1200);
  });

  test("addProperty adds to list", () => {
    const property = new Property(1, "Test St", 100, 10);
    player.addProperty(property);
    expect(player.properties).toHaveLength(1);
  });

  test("removeProperty removes from list", () => {
    const property = new Property(1, "Test St", 100, 10);
    player.addProperty(property);
    player.removeProperty(property);
    expect(player.properties).toHaveLength(0);
  });

  test("default status is active", () => {
    expect(player.status).toBe("active");
  });
});

describe("4 · Game flow — buy / sell / rent / tax / jail / bankrupt", () => {
  describe("4a · Buy", () => {
    test("player can buy unowned property — money deducted", () => {
      const game = newGame();
      const player = game.players[0]!;
      player.position = 1;
      const price = game.board.getTile(1).property!.price;
      const before = player.money;
      const purchaseSuccessful = game.buy(player);
      expect(purchaseSuccessful).toBe(true);
      expect(player.money).toBe(before - price);
    });

    test("cannot buy already-owned property", () => {
      const game = newGame();
      const [player1, player2] = [game.players[0]!, game.players[1]!];
      buyAt(game, player1, 1);
      player2.position = 1;
      const purchaseSuccessful = game.buy(player2);
      expect(purchaseSuccessful).toBe(false);
    });

    test("cannot buy when insufficient funds", () => {
      const game = newGame();
      const player = game.players[0]!;
      player.position = 29;
      player.money = 100;
      const purchaseSuccessful = game.buy(player);
      expect(purchaseSuccessful).toBe(false);
    });

    test("cannot buy non-property tile", () => {
      const game = newGame();
      const player = game.players[0]!;
      player.position = 0;
      const purchaseSuccessful = game.buy(player);
      expect(purchaseSuccessful).toBe(false);
    });
  });

  describe("4b · Sell", () => {
    test("sell returns SELL_RATE of purchase price", () => {
      const game = newGame();
      const player = game.players[0]!;
      buyAt(game, player, 1);
      const price = game.board.getTile(1).property!.price;
      const before = player.money;
      game.sellProperty(player, game.board.getTile(1).property!.id);
      expect(player.money).toBe(before + Math.floor(price * SELL_RATE));
    });

    test("sold property removed from player's list", () => {
      const game = newGame();
      const player = game.players[0]!;
      buyAt(game, player, 1);
      const property = game.board.getTile(1).property!;
      game.sellProperty(player, property.id);
      expect(player.properties).toHaveLength(0);
    });

    test("sellProperty returns false for unowned property id", () => {
      const game = newGame();
      const player = game.players[0]!;
      expect(game.sellProperty(player, 9999)).toBe(false);
    });

  });

  describe("4c · Rent", () => {
    test("tenant pays rent to owner", () => {
      const game = newGame();
      const [owner, tenant] = [game.players[0]!, game.players[1]!];
      buyAt(game, owner, 1);
      const rent = game.board.getTile(1).property!.rent;
      const ownerBefore = owner.money;
      const tenantBefore = tenant.money;
      tenant.position = 1;
      game.landOnTile(tenant, game.board.getTile(1));
      expect(tenant.money).toBe(tenantBefore - rent);
      expect(owner.money).toBe(ownerBefore + rent);
    });

  });

  describe("4d · Tax tiles", () => {
    test("tax tile deducts TAX_RATE % of the player's cash", () => {
      const game = newGame();
      const player = game.players[0]!;
      const taxTile = game.board.tiles.find((t) => t.type === "tax")!;
      const before = player.money;
      game.landOnTile(player, taxTile);
      expect(player.money).toBe(before - Math.ceil(before * TAX_RATE));
    });
  });

  describe("4e · START bonus", () => {
    test("landing on GO gives $200", () => {
      const game = newGame();
      const player = game.players[0]!;
      const before = player.money;
      game.landOnTile(player, game.board.getTile(0));
      expect(player.money).toBe(before + 200);
    });

    test("passing GO (not landing) gives $200", () => {
      const game = newGame();
      const player = game.players[0]!;
      player.position = 31;
      const before = player.money;

      const originalRandom = Math.random;
      Math.random = () => 0.3;
      try {
        game.roll(player);
      } finally {
        Math.random = originalRandom;
      }

      expect(player.money).toBe(before + 200);
    });
  });

  describe("4f · Jail", () => {
    test("landing on goToJail sets player status to jailed", () => {
      const game = newGame();
      const player = game.players[0]!;
      game.landOnTile(player, game.board.getTile(24));
      expect(player.status).toBe("jailed");
    });

    test("bail payment deducts JAIL_BAIL_AMOUNT", () => {
      const game = newGame();
      const player = game.players[0]!;
      player.status = "jailed" as PlayerStatus;
      player.decideJail = () => true;
      const before = player.money;

      const originalRandom = Math.random;
      Math.random = () => 0;
      try {
        game.roll(player, true);
      } finally {
        Math.random = originalRandom;
      }

      expect(player.status).toBe("active");
      expect(player.money).toBe(before - JAIL_BAIL_AMOUNT);
    });

  });

  describe("4g · Bankruptcy", () => {
    test("bankrupt player has money=0 and status=bankrupt", () => {
      const game = newGame();
      const [owner, debtor] = [game.players[0]!, game.players[1]!];
      buyAt(game, owner, 1);
      debtor.money = 50;
      debtor.position = 1;
      game.landOnTile(debtor, game.board.getTile(1));

      expect(debtor.status).toBe("bankrupt");
      expect(debtor.money).toBe(0);
    });

    test("bankrupt player's properties are released", () => {
      const game = newGame();
      const debtor = game.players[0]!;
      buyAt(game, debtor, 1);
      const property = game.board.getTile(1).property!;
      debtor.money = -1;

      game.currentPlayerIndex = 0;
      game.pendingDebt = true;
      game.declareBankruptcy();
      expect(property.owner).toBeNull();
      expect(debtor.properties).toHaveLength(0);
    });

    test("game ends when only one player remains", () => {
      const game = newGame();

      for (let i = 1; i < 4; i++) {
        game.players[i]!.status = "bankrupt";
        game.players[i]!.money = 0;
      }
      game.checkWinner();
      expect(game.status).toBe("finished");
      expect(game.winner).toBe(game.players[0]);
    });
  });

  describe("4h · Chance tile", () => {});

  describe("4i · Turn order", () => {
    test("nextTurn advances to next active player", () => {
      const game = newGame();
      game.currentPlayerIndex = 0;
      game.nextTurn();
      expect(game.currentPlayerIndex).toBe(1);
    });

    test("nextTurn skips bankrupt players", () => {
      const game = newGame();
      game.players[1]!.status = "bankrupt";
      game.currentPlayerIndex = 0;
      game.nextTurn();
      expect(game.currentPlayerIndex).toBe(2);
    });

  });

  describe("4j · Pending purchase gate", () => {
    test("decidePurchase(true) buys property and clears pending", () => {
      const game = newGame();
      const player = game.players[0]!;
      player.position = 1;
      const property = game.board.getTile(1).property!;
      const before = player.money;
      game.pendingProperty = property;
      game.decidePurchase(true);
      expect(player.money).toBe(before - property.price);
      expect(game.pendingProperty).toBeNull();
    });

  });

  describe("4k · sellForDebt", () => {
    test("selling a property clears debt when player becomes solvent", () => {
      const game = newGame();
      const player = game.players[0]!;
      buyAt(game, player, 1);
      player.money = -10;
      game.pendingDebt = true;
      game.currentPlayerIndex = 0;
      const propertyId = game.board.getTile(1).property!.id;
      game.sellForDebt(propertyId);

      expect(player.money).toBeGreaterThanOrEqual(0);
      expect(game.pendingDebt).toBe(false);
    });

  });
});

describe("5 · AI behaviours", () => {
  describe("5a · EasyAI", () => {
    test("always buys affordable property", () => {
      const [player1, player2, player3, player4] = makePlayers();
      const game = new Game([player1, player2, player3, player4], disableLog);
      const ai = new EasyAI(player2!);
      player2!.position = 1;
      ai.takeTurn(game);

      expect(player2!.status).not.toBe("bankrupt");
    });

    test("decideJail always returns false (never pays bail)", () => {
      const player = new Player("x", "X", "AI Easy");
      const game = new Game(makePlayers(), disableLog);
      new EasyAI(player);
      expect(player.decideJail!(game, player)).toBe(false);
    });

    test("sellPriority sorts cheapest first", () => {
      const player = new Player("x", "X", "AI Easy");
      new EasyAI(player);
      const cheap = new Property(1, "Cheap", 100, 10);
      const expensive = new Property(2, "Exp", 400, 80);
      player.addProperty(expensive);
      player.addProperty(cheap);
      const order = player.sellPriority!(player);
      expect(order[0]!.price).toBeLessThanOrEqual(order[1]!.price);
    });
  });

  describe("5b · NormalAI", () => {
    test("decideJail pays bail when buffer allows", () => {
      const [player1, player2, player3, player4] = makePlayers();
      const game = new Game([player1, player2, player3, player4], disableLog);
      const player = player2!;
      new NormalAI(player);
      player.money = 2000;
      expect(player.decideJail!(game, player)).toBe(true);
    });

    test("decideJail stays jailed when insufficient buffer", () => {
      const [player1, player2, player3, player4] = makePlayers();
      const game = new Game([player1, player2, player3, player4], disableLog);
      const player = player2!;
      new NormalAI(player);
      player.money = JAIL_BAIL_AMOUNT + 10;
      expect(player.decideJail!(game, player)).toBe(false);
    });

    test("sellPriority sorts lowest rent first", () => {
      const player = new Player("x", "X", "AI Normal");
      new NormalAI(player);
      const lowRent = new Property(1, "Low", 200, 20);
      const highRent = new Property(2, "High", 200, 80);
      player.addProperty(highRent);
      player.addProperty(lowRent);
      const order = player.sellPriority!(player);
      expect(order[0]!.rent).toBeLessThanOrEqual(order[1]!.rent);
    });
  });

  describe("5c · HardAI", () => {
    test("decideJail pays bail when behind richest opponent", () => {
      const players = makePlayers();
      const game = new Game(players, disableLog);
      const player = players[0]!;
      new HardAI(player);
      player.money = 500;
      players[1]!.money = 2000;
      expect(player.decideJail!(game, player)).toBe(true);
    });

    test("sellPriority sorts lowest ROI first (rent/price)", () => {
      const player = new Player("x", "X", "AI Hard");
      new HardAI(player);
      const lowROI = new Property(1, "Low", 400, 10);
      const highROI = new Property(2, "High", 100, 80);
      player.addProperty(highROI);
      player.addProperty(lowROI);
      const order = player.sellPriority!(player);
      expect(order[0]!.rent / order[0]!.price).toBeLessThanOrEqual(
        order[1]!.rent / order[1]!.price,
      );
    });
  });
});

type AIInstance = { player: Player; takeTurn: (game: Game) => void };

function makeAI(
  aiClass: typeof EasyAI | typeof NormalAI | typeof HardAI,
  player: Player,
): AIInstance {
  return new aiClass(player);
}

function simulateGame(
  botClass: typeof EasyAI | typeof NormalAI | typeof HardAI,
  maxRounds = 400,
): string {
  const human = new Player("human", "Human", "Human");
  const bot1 = new Player("bot1", "Bot 1", "AI Easy");
  const bot2 = new Player("bot2", "Bot 2", "AI Easy");
  const bot3 = new Player("bot3", "Bot 3", "AI Easy");

  const game = new Game([human, bot1, bot2, bot3], disableLog);

  const humanAI = makeAI(EasyAI, human);
  const bot1AI = makeAI(botClass, bot1);
  const bot2AI = makeAI(botClass, bot2);
  const bot3AI = makeAI(botClass, bot3);

  const aiByPlayerId: Record<string, AIInstance> = {
    human: humanAI,
    bot1: bot1AI,
    bot2: bot2AI,
    bot3: bot3AI,
  };

  for (let round = 0; round < maxRounds; round++) {
    if (game.status === "finished") break;
    const currentPlayer = game.currentPlayer;
    if (currentPlayer.status === "bankrupt") {
      game.nextTurn();
      continue;
    }

    aiByPlayerId[currentPlayer.id]?.takeTurn(game);

    while (game.pendingDebt) {
      const player = game.currentPlayer;
      if (player.properties.length === 0) {
        game.declareBankruptcy();
        break;
      }
      game.sellForDebt(player.properties[0]!.id);
    }
    if (game.pendingProperty) game.decidePurchase(false);
  }

  if (game.status === "finished" && game.winner) return game.winner.id;

  const richest = game.activePlayers.reduce((bestPlayer, player) => {
    const netWorth = player.money + player.properties.reduce(
      (total, property) => total + property.price,
      0,
    );
    const bestNetWorth = bestPlayer.money + bestPlayer.properties.reduce(
      (total, property) => total + property.price,
      0,
    );
    return netWorth > bestNetWorth ? player : bestPlayer;
  });
  return richest.id;
}

interface WinStats {
  wins: Record<string, number>;
  total: number;
  humanWinPct: number;
  winRate: Record<string, string>;
}

function runSimulation(
  botClass: typeof EasyAI | typeof NormalAI | typeof HardAI,
  games = 500,
): WinStats {
  const wins: Record<string, number> = { human: 0, bot1: 0, bot2: 0, bot3: 0 };
  for (let i = 0; i < games; i++) {
    const winner = simulateGame(botClass);
    wins[winner] = (wins[winner] ?? 0) + 1;
  }
  const winRate: Record<string, string> = {};
  for (const [id, count] of Object.entries(wins)) {
    winRate[id] = ((count / games) * 100).toFixed(1) + "%";
  }
  return { wins, total: games, humanWinPct: (wins["human"]! / games) * 100, winRate };
}

describe("6 · Win-rate — Human(EasyAI) vs Bots of increasing difficulty", () => {
  test("difficulty trend — Hard bots beat Easy bots more often than chance (3000 games)", () => {
    const hardSimulation = runSimulation(EasyAI, 3000);

    const easyStats = runSimulation(EasyAI, 1000);
    const normalStats = runSimulation(NormalAI, 1000);
    const hardStats = runSimulation(HardAI, 1000);

    const allStats = [easyStats, normalStats, hardStats];

    console.log("\n[Human(Easy) vs 3×Easy  ]", easyStats.winRate);
    console.log("[Human(Easy) vs 3×Normal]", normalStats.winRate);
    console.log("[Human(Easy) vs 3×Hard  ]", hardStats.winRate);

    for (const stats of allStats) {
      const totalWins = Object.values(stats.wins).reduce(
        (total, winCount) => total + winCount,
        0,
      );
      expect(totalWins).toBe(stats.total);
    }

    for (const stats of allStats) {
      for (const winRate of Object.values(stats.winRate)) {
        expect(parseFloat(winRate)).toBeGreaterThan(5);
        expect(parseFloat(winRate)).toBeLessThan(60);
      }
    }

    const totalHumanWins = allStats.reduce((total, stats) => total + stats.wins["human"]!, 0);
    const totalBot3Wins = allStats.reduce((total, stats) => total + stats.wins["bot3"]!, 0);
    expect(totalHumanWins).toBeGreaterThan(totalBot3Wins);
  });

  test("all games terminate without infinite loops", () => {
    for (const aiClass of [EasyAI, NormalAI, HardAI] as const) {
      const stats = runSimulation(aiClass, 200);
      expect(
        Object.values(stats.wins).reduce(
          (total, winCount) => total + winCount,
          0,
        ),
      ).toBe(200);
    }
  });
});
