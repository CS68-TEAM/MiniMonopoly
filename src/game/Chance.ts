import type { ChanceCard, RandomSource } from "./Types";

interface WeightedChanceEvent {
    readonly probability: number;
    readonly card: ChanceCard;
}

const CHANCE_EVENTS: WeightedChanceEvent[] = [
    {
        probability: 0.10,
        card: {
            title: "Forward +5", description: "The road ahead looks promising. Keep moving!", apply: (p, c) => {
                c.move(p, 5); return `${p.name} moved forward 5 spaces.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Lucky Day", description: "You found $100 bill what a lucky day.", apply: (p) => {
                p.addMoney(100); return `${p.name} received $100.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Medical Expenses", description: "A surprise trip to the doctor leaves your wallet feeling lighter.", apply: (p) => {
                p.removeMoney(100); return `${p.name} pay $100.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Go to Start", description: "You've had enough adventure. Head back home!.", apply: (p ,c) => {
                c.move(p, 32 - p.position); return `${p.name} moved to Start.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Speed Ticket", description: "You were going a little too fast. The police weren't impressed.", apply: (p) => {
                p.removeMoney(50); return `${p.name} Pay $50.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Property Inspection", description: "The inspector has arrived. Apparently, owning property isn't free.", apply: (p) => {
                p.removeMoney((p.properties.length + 1) * 50); return `${p.name} pay $${(p.properties.length + 1) * 50} for every property he own.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Market Boom", description: "Property prices are soaring! Your investments are looking great.", apply: (p) => {
                p.addMoney((p.properties.length + 1) * 50); return `${p.name} received $${(p.properties.length + 1) * 50} from every property he own.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Unexpected Bill", description: "Pay an unexpected bill of $150.", apply: (p, c) => {
                c.payTax(p, 150);
                return `${p.name} paid $150.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Lottery", description: "You won the lottery!.", apply: (p) => {
                p.addMoney(500); return `${p.name} won the lottery and received $500.`;
            }
        },
    },
    {
        probability: 0.07,
        card: {
            title: "Backward -3", description: "Sometimes the best way forward is to take a step back.", apply: (p, c) => {
                c.move(p, -3); return `${p.name} moved backward 3 spaces.`;
            }
        },
    },
];

export const pickChanceEvent = (random: RandomSource = Math.random): ChanceCard => {
    const roll = random();
    let cumulative = 0;
    for (const event of CHANCE_EVENTS) {
        cumulative += event.probability;
        if (roll < cumulative)
            return event.card;
    }
    return CHANCE_EVENTS[CHANCE_EVENTS.length - 1]!.card;
};
