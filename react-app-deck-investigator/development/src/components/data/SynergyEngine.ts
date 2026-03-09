import { Card, cardInfo } from "./CardImporter";

export type SynergyCategory = "subtype" | "named" | "mechanic" | "triggered" | "redundancy" | "utility" | "role";

export type SynergyDirection = "forward" | "bidirectional" | "none";

export interface SynergyConnection {
  from: string;
  to: string;
  category: SynergyCategory;
  label: string;
  direction: SynergyDirection;
  highlightOnly?: boolean;  // if true, participates in layout but draws no visible line
  solid?: boolean;          // if true, renders as solid line/filled dot instead of dashed/hollow
  color?: string;           // user-overridden color; falls back to labelToColor(label) if unset
}

export const SYNERGY_COLORS: Record<SynergyCategory, string> = {
  subtype:    "#ff4444",
  named:      "#4488ff",
  mechanic:   "#44cc44",
  triggered:  "#ffcc00",
  redundancy: "#ff88ff",
  utility:    "#88ccff",
  role:       "#ff8833",
};

export const CATEGORY_LABELS: Record<SynergyCategory, string> = {
  subtype:    "Subtype / Tribal",
  named:      "Named Reference",
  mechanic:   "Mechanic Synergy",
  triggered:  "Triggered Pair",
  redundancy: "Redundancy",
  utility:    "Utility",
  role:       "Deck Role",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function allText(card: Card): string {
  if (!card.info || card.info.length === 0) return "";
  return card.info.map((f: cardInfo) => f.text).join(" ").toLowerCase();
}

function allNames(card: Card): string[] {
  if (!card.info || card.info.length === 0) return [];
  return card.info.map((f: cardInfo) => f.name.toLowerCase());
}

function getCardTypes(card: Card): string[] {
  return card.info?.[0]?.cardTypes ?? [];
}

function getSubTypes(card: Card): string[] {
  return card.info?.[0]?.subTypes ?? [];
}

function getCost(card: Card): number | null {
  return card.info?.[0]?.cost ?? null;
}

function getKeywords(card: Card): string[] {
  return card.info?.[0]?.keywords ?? [];
}

function isCreature(card: Card): boolean {
  return getCardTypes(card).some(t =>
    t.toLowerCase() === "creature" || t.toLowerCase() === "monster"
  );
}

function isLand(card: Card): boolean {
  return getCardTypes(card).some(t => t.toLowerCase() === "land");
}

function hasSubType(card: Card, subtype: string): boolean {
  const forms = subtypeForms(subtype);
  return getSubTypes(card).some(st => forms.includes(st.toLowerCase()));
}

function dedup(connections: SynergyConnection[]): SynergyConnection[] {
  const seen = new Set<string>();
  return connections.filter(c => {
    const key = [c.category, ...[c.from, c.to].sort()].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── MTG Subtype Matters ──────────────────────────────────────────────────────

const CREATURE_TYPES = [
  "angel","archer","artificer","assassin","barbarian","berserker","bird","cat",
  "centaur","cleric","construct","demon","devil","dinosaur","dragon","druid",
  "dwarf","elf","faerie","fungus","giant","goblin","golem","griffin","horror",
  "human","hydra","knight","merfolk","minotaur","monk","mutant","nightmare",
  "ogre","orc","phoenix","pirate","plant","rat","rogue","salamander","shaman",
  "skeleton","sliver","soldier","specter","sphinx","spirit","vampire","viashino",
  "warrior","wizard","wolf","zombie",
];

const LAND_TYPES = ["forest","island","mountain","plains","swamp"];
const ALL_SUBTYPES = [...CREATURE_TYPES, ...LAND_TYPES];

function subtypeForms(subtype: string): string[] {
  const irregular: Record<string, string[]> = {
    elf:      ["elf", "elves", "elvish", "elven"],
    wolf:     ["wolf", "wolves"],
    zombie:   ["zombie", "zombies"],
    sphinx:   ["sphinx", "sphinxes"],
    merfolk:  ["merfolk"],
    vampire:  ["vampire", "vampires", "vampiric"],
    dragon:   ["dragon", "dragons", "draconic"],
    goblin:   ["goblin", "goblins"],
    angel:    ["angel", "angels", "angelic"],
    demon:    ["demon", "demons", "demonic"],
    warrior:  ["warrior", "warriors"],
    wizard:   ["wizard", "wizards"],
    knight:   ["knight", "knights"],
    soldier:  ["soldier", "soldiers"],
    spirit:   ["spirit", "spirits"],
    faerie:   ["faerie", "faeries", "faery", "fairy", "fairies"],
    human:    ["human", "humans"],
    giant:    ["giant", "giants"],
    bird:     ["bird", "birds"],
    cat:      ["cat", "cats"],
    rat:      ["rat", "rats"],
    pirate:   ["pirate", "pirates"],
    druid:    ["druid", "druids"],
    shaman:   ["shaman", "shamans"],
    cleric:   ["cleric", "clerics"],
    rogue:    ["rogue", "rogues"],
    monk:     ["monk", "monks"],
    assassin: ["assassin", "assassins"],
    sliver:   ["sliver", "slivers"],
    beast:    ["beast", "beasts"],
    plant:    ["plant", "plants"],
    horror:   ["horror", "horrors"],
    ogre:     ["ogre", "ogres"],
    golem:    ["golem", "golems"],
  };
  return irregular[subtype] ?? [subtype, `${subtype}s`];
}

function detectSubtypeMatter(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  for (const source of cards) {
    const srcText = allText(source);

    for (const subtype of ALL_SUBTYPES) {
      const forms = subtypeForms(subtype);
      const alt = forms.join("|");
      const w = `(?:\\s+\\w+){0,2}`;

      const caresPatterns = [
        new RegExp(`\\bother (?:${alt})\\b`, "i"),
        new RegExp(`\\b(?:${alt})\\b${w}\\syou control`, "i"),
        new RegExp(`\\beach (?:${alt})\\b`, "i"),
        new RegExp(`\\bwhenever (?:a|an) (?:${alt})\\b`, "i"),
        new RegExp(`\\btarget (?:${alt})\\b`, "i"),
        new RegExp(`\\bnon-(?:${alt})\\b`, "i"),
        new RegExp(`\\b(?:${alt})\\b${w}\\s(?:get|have|gain)\\b`, "i"),
        new RegExp(`\\bnumber of (?:${alt})\\b`, "i"),
        new RegExp(`\\bfor each (?:${alt})\\b`, "i"),
        new RegExp(`\\bregenerate.*\\b(?:${alt})\\b`, "i"),
        new RegExp(`\\bbasic ${subtype}\\b`, "i"),
        new RegExp(`\\bswamp or ${subtype}\\b`, "i"),
        new RegExp(`\\b${subtype} or swamp\\b`, "i"),
        new RegExp(`\\bforest or ${subtype}\\b`, "i"),
        new RegExp(`\\b${subtype} or forest\\b`, "i"),
      ];

      if (!caresPatterns.some(p => p.test(srcText))) continue;

      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        if (hasSubType(target, subtype)) {
          connections.push({
            from: source.cardname,
            to: target.cardname,
            category: "subtype",
            label: `${subtype} synergy`,
            direction: "forward",
          });
        }
      }
    }
  }

  return connections;
}

// ─── Named References ─────────────────────────────────────────────────────────

function detectNamedReferences(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const namedPattern = /(?:card |a |an )?named "?([^".,\n]+)"?/gi;

  for (const source of cards) {
    const srcText = allText(source);
    let match: RegExpExecArray | null;
    while ((match = namedPattern.exec(srcText)) !== null) {
      const referencedName = match[1].trim().toLowerCase();
      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        const tgtNames = allNames(target);
        const charName = (target.info?.[0]?.characterName ?? "").toLowerCase();
        if (
          tgtNames.some(n => n === referencedName || n.startsWith(referencedName)) ||
          (charName && charName === referencedName)
        ) {
          connections.push({
            from: source.cardname,
            to: target.cardname,
            category: "named",
            label: `references "${target.cardname}"`,
            direction: "forward",
          });
        }
      }
    }
  }

  return connections;
}

// ─── Mechanic Synergies ───────────────────────────────────────────────────────

interface MechanicRule {
  mechanic: string;
  label: string;
  enablerPatterns: RegExp[];
  payoffPatterns: RegExp[];
}

const MECHANIC_RULES: MechanicRule[] = [
  {
    mechanic: "graveyard",
    label: "graveyard synergy",
    enablerPatterns: [
      /put.*card.*(?:your|a|the) graveyard/i,
      /discard/i,
      /mill/i,
      /exile.*graveyard/i,
      /sacrifice.*creature/i,
    ],
    payoffPatterns: [
      /from (?:your|a|the) graveyard/i,
      /cards? in (?:your|a|the) graveyard/i,
      /return.*from.*graveyard/i,
      /flashback/i, /unearth/i, /dredge/i, /escape/i, /delve/i,
    ],
  },
  {
    mechanic: "counters",
    label: "+1/+1 counter synergy",
    enablerPatterns: [
      /put.*\+1\/\+1 counter/i,
      /proliferate/i,
    ],
    payoffPatterns: [
      /\+1\/\+1 counter on it/i,
      /for each \+1\/\+1 counter/i,
      /with a \+1\/\+1 counter/i,
      /remove.*counter/i,
    ],
  },
  {
    mechanic: "tokens",
    label: "token synergy",
    enablerPatterns: [/create.*token/i, /put.*token/i],
    payoffPatterns: [
      /tokens? you control/i,
      /whenever.*token/i,
      /for each token/i,
      /number of tokens/i,
    ],
  },
  {
    mechanic: "lifegain",
    label: "lifegain synergy",
    enablerPatterns: [/you gain.*life/i, /gain \d+ life/i, /lifelink/i],
    payoffPatterns: [
      /whenever you gain life/i,
      /each time you gain life/i,
      /you've gained life/i,
    ],
  },
  {
    mechanic: "draw",
    label: "card draw synergy",
    enablerPatterns: [/draw.*card/i],
    payoffPatterns: [/whenever you draw/i, /each time you draw/i, /if you drew/i],
  },
  {
    mechanic: "sacrifice",
    label: "sacrifice synergy",
    enablerPatterns: [/sacrifice (a|an|another|target)/i],
    payoffPatterns: [
      /whenever you sacrifice/i,
      /when.*sacrificed/i,
      /whenever a.*you control.*dies/i,
    ],
  },
];

function detectMechanicSynergies(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const rule of MECHANIC_RULES) {
    const enablers = cards.filter(c => rule.enablerPatterns.some(p => p.test(allText(c))));
    const payoffs  = cards.filter(c => rule.payoffPatterns.some(p => p.test(allText(c))));
    for (const enabler of enablers) {
      for (const payoff of payoffs) {
        if (enabler.cardname === payoff.cardname) continue;
        connections.push({ from: enabler.cardname, to: payoff.cardname,
                           category: "mechanic", label: rule.label,
                           direction: "bidirectional" });
      }
    }
  }
  return connections;
}

// ─── Triggered Pairs ──────────────────────────────────────────────────────────

interface TriggerRule {
  label: string;
  enablerPatterns: RegExp[];
  triggerPatterns: RegExp[];
}

const TRIGGER_RULES: TriggerRule[] = [
  {
    label: "sac outlet + death trigger",
    enablerPatterns: [/sacrifice (a|an|another|target) creature/i, /\: sacrifice/i],
    triggerPatterns: [/whenever.*creature.*dies/i, /when.*dies/i, /whenever.*you sacrifice/i],
  },
  {
    label: "blink + ETB trigger",
    enablerPatterns: [/exile.*return.*battlefield/i, /flicker/i, /blink/i],
    triggerPatterns: [
      /when(?:ever)?\s+(?:this\s+\w+|\w+)\s+enters/i,
      /when.*enters the battlefield/i,
      /when.*comes into play/i,
    ],
  },
  {
    label: "tap outlet + untap synergy",
    enablerPatterns: [/\: tap target/i, /tap.*creature/i],
    triggerPatterns: [/untap/i, /whenever.*becomes untapped/i],
  },
  {
    label: "attack trigger",
    enablerPatterns: [/whenever.*attacks/i, /when.*attacks/i],
    triggerPatterns: [/whenever.*creature.*attacks/i, /at the beginning of combat/i],
  },
  {
    label: "ETB + bounce synergy",
    enablerPatterns: [/return.*creature.*to.*hand/i, /return.*permanent.*to.*hand/i],
    triggerPatterns: [
      /when(?:ever)?\s+(?:this\s+\w+|\w+)\s+enters/i,
      /when.*enters the battlefield/i,
    ],
  },
];

function detectTriggeredPairs(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const rule of TRIGGER_RULES) {
    const enablers = cards.filter(c => rule.enablerPatterns.some(p => p.test(allText(c))));
    const triggers = cards.filter(c => rule.triggerPatterns.some(p => p.test(allText(c))));
    for (const enabler of enablers) {
      for (const trigger of triggers) {
        if (enabler.cardname === trigger.cardname) continue;
        connections.push({ from: enabler.cardname, to: trigger.cardname,
                           category: "triggered", label: rule.label,
                           direction: "bidirectional" });
      }
    }
  }
  return connections;
}

// ─── Redundancy ───────────────────────────────────────────────────────────────

interface RedundancyRole {
  label: string;
  patterns: RegExp[];
}

const REDUNDANCY_ROLES: RedundancyRole[] = [
  {
    label: "go-wide finisher",
    patterns: [
      /creatures you control (?:get \+\d|\w+ \+\d).*trample/i,
      /creatures you control gain trample.*get \+/i,
    ],
  },
  {
    label: "removal",
    patterns: [
      /destroy target (?:creature|permanent|artifact|enchantment)/i,
      /exile target (?:creature|permanent)/i,
    ],
  },
  {
    label: "board wipe",
    patterns: [
      /destroy all creatures/i,
      /exile all creatures/i,
      /deals? \d+ damage to (all|each) creature/i,
    ],
  },
  {
    label: "reanimation",
    patterns: [
      /return target.*creature.*card.*from.*graveyard.*to the battlefield/i,
      /put.*creature.*card.*from.*graveyard.*onto the battlefield/i,
    ],
  },
  {
    label: "card advantage engine",
    patterns: [/draw (two|three|2|3) cards/i, /draw cards equal/i],
  },
];

function detectRedundancy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const role of REDUNDANCY_ROLES) {
    const matches = cards.filter(c => role.patterns.some(p => p.test(allText(c))));
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        connections.push({
          from: matches[i].cardname, to: matches[j].cardname,
          category: "redundancy", label: `redundancy: ${role.label}`,
          direction: "none" as const,
        });
      }
    }
  }
  return connections;
}

// ─── Utility Connections ──────────────────────────────────────────────────────

const BASIC_LAND_TYPES = ["forest", "island", "mountain", "plains", "swamp"];

function cardHasBasicLandType(card: Card, landType: string): boolean {
  if (!card.info || card.info.length === 0) return false;
  return getSubTypes(card).some(st => st.toLowerCase() === landType);
}

function detectUtilityConnections(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  for (const source of cards) {
    const srcText = allText(source);

    for (const landType of BASIC_LAND_TYPES) {
      const caresPatterns = [
        new RegExp(`search your library for (?:a |an )?(?:\\w+ or )?${landType}`, "i"),
        new RegExp(`search your library for (?:a |an )?${landType}(?: or \\w+)?`, "i"),
        new RegExp(`unless you control (?:a |an )?(?:\\w+ or (?:a |an )?)?${landType}`, "i"),
        new RegExp(`unless you control (?:a |an )?${landType}`, "i"),
        new RegExp(`target ${landType}`, "i"),
        new RegExp(`untap target ${landType}`, "i"),
        new RegExp(`${landType} you control`, "i"),
      ];

      if (!caresPatterns.some(p => p.test(srcText))) continue;

      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        if (cardHasBasicLandType(target, landType)) {
          connections.push({
            from: source.cardname, to: target.cardname,
            category: "utility", label: `cares about ${landType}s`,
            direction: "forward",
          });
        }
      }
    }
  }

  const creatureTutorPattern = /creature card(?:s)? with mana value (\d+) or less.*onto the battlefield|creature card.*onto the battlefield/i;

  for (const source of cards) {
    const srcText = allText(source);
    const match = creatureTutorPattern.exec(srcText);
    if (!match) continue;
    if (isLand(source)) continue;

    const threshold = match[1] ? parseInt(match[1]) : null;
    const label = threshold ? `creature tutor (≤${threshold} mana)` : "creature tutor";

    for (const target of cards) {
      if (target.cardname === source.cardname) continue;
      if (!isCreature(target)) continue;
      if (threshold !== null) {
        const cost = getCost(target);
        if (cost !== null && cost > threshold) continue;
      }

      connections.push({
        from: source.cardname, to: target.cardname,
        category: "utility", label,
        direction: "forward",
      });
    }
  }

  const GRANTABLE_KEYWORDS = ["Flying", "Trample", "Lifelink", "Deathtouch",
                               "Haste", "Vigilance", "First Strike", "Double Strike"];

  for (const source of cards) {
    const srcText = allText(source);

    for (const kw of GRANTABLE_KEYWORDS) {
      const grantsKw =
        new RegExp(`creatures you control (?:have|gain) ${kw}`, "i").test(srcText) ||
        new RegExp(`target creature gains ${kw}`, "i").test(srcText);
      if (!grantsKw) continue;

      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        if (!isCreature(target)) continue;
        connections.push({
          from: source.cardname, to: target.cardname,
          category: "utility", label: `grants ${kw.toLowerCase()}`,
          direction: "forward",
        });
      }
    }
  }

  return connections;
}

// ─── Role Connections ─────────────────────────────────────────────────────────
// highlightOnly: true — these connections influence force layout clustering
// but draw no visible lines. The legend shows them as highlight groups instead.

interface RoleRule {
  label: string;
  test: (card: Card) => boolean;
}

const ROLE_RULES: RoleRule[] = [
  {
    label: "role: mana",
    test: card => isLand(card),
  },
  {
    label: "role: burn spell",
    test: card => {
      const text = allText(card);
      return (
        !isLand(card) &&
        (/deals? \d+ damage to (any target|target player|each opponent|you)/i.test(text) ||
         /deals? x damage/i.test(text))
      );
    },
  },
  {
    label: "role: mana dork",
    test: card => {
      const text = allText(card);
      return isCreature(card) && /\{t\}: add \{/i.test(text);
    },
  },
  {
    label: "role: aggressive creature",
    test: card => {
      if (!isCreature(card)) return false;
      const cost = getCost(card);
      const text = allText(card);
      return (
        cost !== null && cost <= 2 &&
        (getKeywords(card).some(k => ["Haste","First Strike","Double Strike","Menace"].includes(k)) ||
         /haste/i.test(text))
      );
    },
  },
  {
    label: "role: removal",
    test: card => {
      const text = allText(card);
      return (
        !isLand(card) &&
        (/destroy target (creature|permanent)/i.test(text) ||
         /exile target (creature|permanent)/i.test(text) ||
         /deals? \d+ damage to target creature/i.test(text))
      );
    },
  },
  {
    label: "role: card draw",
    test: card => {
      const text = allText(card);
      return !isLand(card) && /draw (a|two|three|\d+) cards?/i.test(text);
    },
  },
  {
    label: "role: counterspell",
    test: card => {
      const text = allText(card);
      return /counter target (spell|creature|instant|sorcery)/i.test(text);
    },
  },
  {
    label: "role: board wipe",
    test: card => {
      const text = allText(card);
      return /destroy all|exile all|damage to (all|each) creature/i.test(text);
    },
  },
];

function detectRoleConnections(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  for (const role of ROLE_RULES) {
    const matches = cards.filter(role.test);
    if (matches.length < 2) continue;
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        connections.push({
          from: matches[i].cardname,
          to: matches[j].cardname,
          category: "role",
          label: role.label,
          direction: "none",
          highlightOnly: true,  // clusters in layout, invisible in canvas
        });
      }
    }
  }

  return connections;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function detectSynergies(cards: Card[], game: string): SynergyConnection[] {
  if (game !== "MTG") return [];

  const raw = [
    ...detectSubtypeMatter(cards),
    ...detectNamedReferences(cards),
    ...detectMechanicSynergies(cards),
    ...detectTriggeredPairs(cards),
    ...detectRedundancy(cards),
    ...detectUtilityConnections(cards),
    ...detectRoleConnections(cards),
  ];

  const result = dedup(raw);
  console.log(`[SynergyEngine] Detected ${result.length} connections`);
  return result;
}
