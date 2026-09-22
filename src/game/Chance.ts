<<<<<<< HEAD
import type { ChanceCard, RandomSource } from "./Types";

interface WeightedChanceEvent {
    readonly probability: number;
    readonly card: ChanceCard;
}

const CHANCE_EVENTS: WeightedChanceEvent[] = [
    {
        probability: 0.07,
        card: {
            title: "Forward +5", description: "The road ahead looks promising. Keep moving!", apply: (p, c) => {
                c.move(p, 5); return `${p.name} moved forward 5 spaces.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Lucky Day", description: "You found $100 bill what a lucky day.", apply: (p) => {
                p.addMoney(100); return `${p.name} received $100.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Investment Pays Off", description: "Your risky investment turned out to be a brilliant decision.", apply: (p) => {
                p.addMoney(200); return `${p.name} received $200.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Bank Error", description: "The bank made a mistake. For once, it's in your favor.", apply: (p) => {
                p.addMoney(100); return `${p.name} received $100.`;
            }
        },
    },
    {
        probability: 0.07,
        card: {
            title: "Found Money", description: "You found $50 bill.", apply: (p) => {
                p.addMoney(50); return `${p.name} received $50.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Pay Repair Bill", description: "Your car has decided that today is the perfect day to break down.", apply: (p) => {
                p.removeMoney(100); return `${p.name} pay $100.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Medical Expenses", description: "A surprise trip to the doctor leaves your wallet feeling lighter.", apply: (p) => {
                p.removeMoney(75); return `${p.name} pay $75.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Go to Start", description: "You've had enough adventure. Head back home!.", apply: (p ,c) => {
                c.move(p, 32 - p.position); return `${p.name} moved to Start.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Business Opportunity", description: "Your business idea is so good that everyone wants a piece of it.", apply: (p) => {
                p.addMoney(75); return `${p.name} Collect $25 from every player.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Generous Donation", description: "You decide to spread the wealth. How generous of you!.", apply: (p ) => {
                p.removeMoney(75); return `${p.name} Pay $25 to every player.`;
            }
        },
    },
    {
        probability: 0.07,
        card: {
            title: "Speed Ticket", description: "You were going a little too fast. The police weren't impressed.", apply: (p) => {
                p.removeMoney(50); return `${p.name} Pay $50.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Property Inspection", description: "The inspector has arrived. Apparently, owning property isn't free.", apply: (p) => {
                p.removeMoney((p.properties.length + 1) * 50); return `${p.name} pay $${(p.properties.length + 1) * 50} for every property he own.`;
            }
        },
    },
    {
        probability: 0.06,
        card: {
            title: "Market Boom", description: "Property prices are soaring! Your investments are looking great.", apply: (p) => {
                p.addMoney((p.properties.length + 1) * 50); return `${p.name} received $${(p.properties.length + 1) * 50} from every property he own.`;
            }
        },
    },
    {
        probability: 0.06,
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
                p.addMoney(300); return `${p.name} won the lottery and received $300.`;
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
=======
import type { ChanceCard, RandomSource } from "./Types";

interface WeightedChanceEvent {
    readonly probability: number;
    readonly card: ChanceCard;
}

const CHANCE_EVENTS: WeightedChanceEvent[] = [
    {
        probability: 0.20,
        card: {
            title: "Forward +5", description: "Move forward 5 spaces.", apply: (p, c) => {
                c.move(p, 5); return `${p.name} moved forward 5 spaces.`;
            }
        },
    },
    {
        probability: 0.15,
        card: {
            title: "+$100", description: "Bank gives you $100.", apply: (p) => {
                p.addMoney(100); return `${p.name} received $100.`;
            }
        },
    },
    {
        probability: 0.20,
        card: {
            title: "-$150", description: "Pay an unexpected bill of $150.", apply: (p, c) => {
                c.payTax(p, 150);
                return `${p.name} paid $150.`;
            }
        },
    },
    {
        probability: 0.20,
        card: {
            title: "+$50", description: "Bank gives you $50.", apply: (p) => {
                p.addMoney(50); return `${p.name} received $50.`;
            }
        },
    },
    {
        probability: 0.10,
        card: {
            title: "Lottery +$300", description: "You won the lottery! +$300.", apply: (p) => {
                p.addMoney(300); return `${p.name} won the lottery and received $300.`;
            }
        },
    },
    {
        probability: 0.15,
        card: {
            title: "Backward -3", description: "Move backward 3 spaces.", apply: (p, c) => {
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
>>>>>>> 1b694ba5f0220a50d6e0fe26e625962b94d8f040
};