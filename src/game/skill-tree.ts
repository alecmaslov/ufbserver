/**
 * Skill trees: the twelve elements, the draw that assigns three of them to a figurine, the gold
 * ladder, and what a bought node does.
 *
 * Everything here is pure and server-authoritative. The client renders the same tree data from
 * data/skill-trees.json, but it never decides what anything costs or whether a node is legal —
 * those answers come from this file, which is the only thing the buy endpoint trusts.
 *
 * Design source: Drive "UFB Skill Tree.docx", plus the decisions Alec signed off on 2026-09-23
 * (see easteregg.fun/docs/skill-tree-plan.md).
 */
import { readFileSync } from "fs";
import { join as pathJoin } from "path";

export type ElementSlug =
    | "fire" | "ice" | "water" | "plant" | "beast" | "rock"
    | "metal" | "wind" | "lightning" | "holy" | "void" | "plasma";

export const ELEMENTS: ElementSlug[] = [
    "fire", "ice", "water", "plant", "beast", "rock",
    "metal", "wind", "lightning", "holy", "void", "plasma",
];

/** Six families of two. Affinity is always within a family, opposition always across them. */
export const FAMILY: Record<ElementSlug, string> = {
    fire: "heat", plasma: "heat",
    ice: "frost", water: "frost",
    rock: "earth", metal: "earth",
    plant: "life", beast: "life",
    holy: "radiance", lightning: "radiance",
    void: "drift", wind: "drift",
};

/** Pairs that can never appear on the same figurine. */
export const OPPOSED: [ElementSlug, ElementSlug][] = [
    ["fire", "water"], ["fire", "ice"], ["plasma", "water"], ["plasma", "ice"],
    ["holy", "void"], ["metal", "plant"], ["rock", "lightning"], ["beast", "metal"],
];

/** How likely each element is to turn up at all. Wind is opposed to nothing, so no draw dead-ends. */
export const WEIGHT: Record<ElementSlug, number> = {
    fire: 10, water: 10, rock: 10, beast: 10, wind: 10, plant: 10,
    ice: 6, metal: 6, lightning: 6,
    holy: 3, void: 3,
    plasma: 1,
};

const DUP_SECOND = 0.12;    // weight multiplier for a second copy of an element you already hold
const DUP_THIRD = 0.10;     // ...and a third
const AFFINITY = 1.5;       // same-family elements are a little likelier than chance
const RARITY_K = 0.8;       // undoes the double punishment a rare element would otherwise take
const MAX_WEIGHT = 10;

const opposedTo = new Map<ElementSlug, Set<ElementSlug>>(
    ELEMENTS.map((e) => [e, new Set<ElementSlug>()]));
for (const [a, b] of OPPOSED) {
    opposedTo.get(a)!.add(b);
    opposedTo.get(b)!.add(a);
}

/** Can these three coexist? Used to validate anything that arrives from outside. */
export const legalDraw = (els: ElementSlug[]) =>
    els.length === 3 && els.every((e) => ELEMENTS.includes(e)) &&
    !els.some((a, i) => els.slice(i + 1).some((b) => opposedTo.get(a)!.has(b)));

/**
 * Roll a figurine's three elements. Permanent once written.
 *
 * Duplicates are rare but reachable: a pure triple lands at about 1 in 4,550 overall, and the
 * rarity compensation keeps triple Plasma near 1 in a million instead of 1 in 35 million, which
 * is what it would be if a low base weight and the duplicate penalty compounded unchecked.
 */
export function drawElements(rand: () => number = Math.random): ElementSlug[] {
    const drawn: ElementSlug[] = [];
    while (drawn.length < 3) {
        const pool: [ElementSlug, number][] = [];
        for (const e of ELEMENTS) {
            if (drawn.some((d) => opposedTo.get(d)!.has(e))) continue;
            const held = drawn.filter((d) => d === e).length;
            let m: number;
            if (held === 0) {
                m = drawn.some((d) => FAMILY[d] === FAMILY[e]) ? AFFINITY : 1;
            } else {
                m = (held === 1 ? DUP_SECOND : DUP_THIRD) * Math.pow(MAX_WEIGHT / WEIGHT[e], RARITY_K);
            }
            pool.push([e, WEIGHT[e] * m]);
        }
        const total = pool.reduce((s, [, w]) => s + w, 0);
        let roll = rand() * total;
        let picked: ElementSlug | null = null;
        for (const [e, w] of pool) {
            roll -= w;
            if (roll <= 0) { picked = e; break; }
        }
        // only a floating-point shortfall can leave nothing picked; fall back within this pool,
        // which is already filtered to what is legal beside everything drawn so far
        drawn.push(picked ?? pool[pool.length - 1][0]);
    }
    return drawn;
}

/**
 * Gold for your n-th node within one element, n starting at 1.
 *
 * The design doc's 33-step ladder with a multiplier ramped from x1 to x4 across it. Scaling by a
 * flat factor would have priced a new player out of their first node, which is the one thing the
 * original ladder gets exactly right; ramping leaves step one at 50 gold and lifts step 28 from
 * 6,000 to 21,200. One element costs 247,800 end to end, all three 743,400.
 */
export const COSTS: number[] = [
    50, 110, 240, 260, 550, 590, 1100, 1150, 1750, 1850, 2700,
    2850, 3800, 4000, 5300, 5550, 5750, 5950, 8050, 11100, 8600,
    11900, 8600, 10700, 13000, 15700, 18600, 21200, 19600, 17500, 15200, 13300, 11200,
];
export const NODES_PER_TREE = COSTS.length;          // 33
export const MAX_LEVEL = NODES_PER_TREE * 3;         // 99
export const costOf = (boughtInThisTree: number) => COSTS[boughtInThisTree] ?? null;

// ---------------------------------------------------------------- the tree data

export interface TreeNode {
    x: number; y: number; r: number;
    role: "start" | "small" | "special" | "bigBonus" | "bonus";
    size: string; depth: number; type: string;
}
export interface Tree { nodes: TreeNode[]; edges: [number, number][]; frontier: number }

let cache: Record<ElementSlug, Tree> | null = null;

/** The generated layouts — one shape per element, all with matching reward depths. */
export function trees(): Record<ElementSlug, Tree> {
    if (!cache) {
        const raw = JSON.parse(readFileSync(pathJoin("data", "skill-trees.json"), "utf8"));
        cache = raw.trees;
    }
    return cache!;
}
export const treeFor = (element: ElementSlug): Tree => trees()[element];

/** Index of the free-standing START node, the only one with no prerequisite. */
export function startNode(element: ElementSlug): number {
    return treeFor(element).nodes.findIndex((n) => n.role === "start");
}

const neighbourCache = new Map<ElementSlug, number[][]>();
function neighbours(element: ElementSlug): number[][] {
    if (!neighbourCache.has(element)) {
        const t = treeFor(element);
        const adj: number[][] = t.nodes.map(() => []);
        for (const [a, b] of t.edges) { adj[a].push(b); adj[b].push(a); }
        neighbourCache.set(element, adj);
    }
    return neighbourCache.get(element)!;
}

/**
 * Which nodes can be bought next: START if nothing is owned yet, otherwise anything touching
 * something already owned. You choose the route; the ladder sets the price either way.
 */
export function buyable(element: ElementSlug, owned: number[]): number[] {
    const have = new Set(owned);
    if (!have.size) return [startNode(element)];
    const adj = neighbours(element);
    const out = new Set<number>();
    for (const n of owned) for (const m of adj[n]) if (!have.has(m)) out.add(m);
    return [...out].sort((a, b) => a - b);
}

export const canBuy = (element: ElementSlug, owned: number[], node: number) =>
    Number.isInteger(node) && node >= 0 && node < NODES_PER_TREE &&
    !owned.includes(node) && buyable(element, owned).includes(node);

// ---------------------------------------------------------------- what a node does

export interface SkillEffects {
    maxHealth: number;          // +1 HP nodes
    maxEnergy: number;          // +1 MP nodes — move points, not mana
    startingGold: number;       // +1 GOLD nodes pay into the gold you spawn with
    crystalsPerMatch: number;   // +1 CRYSTAL nodes
    ultimateReduction: number;  // +1 ULTIMATE shrinks the gauge, so it fills faster forever
    items: string[];            // granted at every spawn
    bonuses: string[];          // element bonus ids, resolved in combat
}

const EMPTY = (): SkillEffects => ({
    maxHealth: 0, maxEnergy: 0, startingGold: 0, crystalsPerMatch: 0,
    ultimateReduction: 0, items: [], bonuses: [],
});

const ULTIMATE_STEP = 5;
const ULTIMATE_FLOOR = 50;

/** Fold a figurine's purchases into the numbers the game applies when it spawns. */
export function effectsFor(owned: { element: ElementSlug; nodeIndex: number }[]): SkillEffects {
    const fx = EMPTY();
    for (const { element, nodeIndex } of owned) {
        const node = treeFor(element)?.nodes[nodeIndex];
        if (!node) continue;
        switch (node.type) {
            case "hp": fx.maxHealth += 1; break;
            case "mp": fx.maxEnergy += 1; break;
            case "gold": fx.startingGold += 1; break;
            case "crystal": fx.crystalsPerMatch += 1; break;
            case "ultimate": fx.ultimateReduction += ULTIMATE_STEP; break;
            case "start": break;
            default:
                if (node.type.startsWith("item")) fx.items.push(`${element}.${node.type}`);
                else fx.bonuses.push(`${element}.${node.type}`);
        }
    }
    return fx;
}

/** Clamp for the shrinking ultimate gauge, so it can never reach zero. */
export const ultimateMax = (base: number, fx: SkillEffects) =>
    Math.max(ULTIMATE_FLOOR, base - fx.ultimateReduction);

/** A figurine's level is simply how many nodes it has bought, shown as 1 until the first. */
export const levelFor = (purchases: number) => Math.min(MAX_LEVEL, Math.max(1, purchases));
