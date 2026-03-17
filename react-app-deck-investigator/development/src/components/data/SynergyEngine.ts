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

// ─── Role Map ─────────────────────────────────────────────────────────────────
// Returns a flat map of { cardname → role label } for every card that matches
// at least one role rule. Used by ForceLayout to seed starting positions into
// functional canvas zones. A card gets the first matching role only — priority
// order is the same as ROLE_RULES.

export function buildRoleMap(cards: Card[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const card of cards) {
    for (const role of ROLE_RULES) {
      if (role.test(card)) {
        map[card.cardname] = role.label;
        break; // first match wins — a mana dork is mana, not a creature
      }
    }
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LORCANA ENGINE ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────────────────────

function lorText(card: Card): string {
  return card.info?.[0]?.text?.toLowerCase() ?? "";
}

function lorName(card: Card): string {
  return card.info?.[0]?.name ?? card.cardname;
}

function lorCharName(card: Card): string | null {
  return card.info?.[0]?.characterName ?? null;
}

function lorCost(card: Card): number | null {
  return card.info?.[0]?.cost ?? null;
}

function lorLore(card: Card): number | null {
  return card.info?.[0]?.lore ?? null;
}

function lorKeywords(card: Card): string[] {
  return card.info?.[0]?.keywords ?? [];
}

function lorCardType(card: Card): string {
  return card.info?.[0]?.cardTypes?.[0]?.toLowerCase() ?? "";
}

function lorSubTypes(card: Card): string[] {
  return card.info?.[0]?.subTypes?.map(s => s.toLowerCase()) ?? [];
}

function isSong(card: Card): boolean {
  return lorCardType(card) === "song" || lorSubTypes(card).includes("song");
}

function isCharacter(card: Card): boolean {
  return lorCardType(card) === "character";
}



// ── Named References ──────────────────────────────────────────────────────────
// Catches patterns like:
//   "chosen character named Simba"
//   "your characters named Moana"
//   "a character named Elsa"
// Connects the referencing card to every card whose characterName matches.

function detectLorNamedReferences(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const namedPattern = /characters? named ([A-Z][\w\s]+?)(?:[,.]|\b(?:gain|get|can|to|with|may|and|or|\s{2}))/gi;

  for (const source of cards) {
    const text = lorText(source);
    let match: RegExpExecArray | null;
    namedPattern.lastIndex = 0;
    while ((match = namedPattern.exec(text)) !== null) {
      const refName = match[1].trim().toLowerCase();
      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        const charName = lorCharName(target)?.toLowerCase();
        const fullName = lorName(target).toLowerCase();
        if (
          charName === refName ||
          fullName === refName ||
          fullName.startsWith(refName + " -")
        ) {
          connections.push({
            from: source.cardname,
            to: target.cardname,
            category: "named",
            label: `references "${match[1].trim()}"`,
            direction: "forward",
          });
        }
      }
    }
  }

  return connections;
}

// ── Shift ─────────────────────────────────────────────────────────────────────
// "Shift N (You may pay N ink to play this on top of one of your characters
//  named X)" — connects the Shift card to all cheaper versions of the same
// character (same base character name, lower or equal cost).

function detectLorShift(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  for (const source of cards) {
    if (!lorKeywords(source).includes("Shift")) continue;
    const srcCost    = lorCost(source);
    const srcChar    = lorCharName(source)?.toLowerCase();
    if (!srcChar) continue;

    for (const target of cards) {
      if (target.cardname === source.cardname) continue;
      const tgtChar = lorCharName(target)?.toLowerCase();
      if (tgtChar !== srcChar) continue;
      const tgtCost = lorCost(target);
      // Target must be cheaper — it's what you play the Shift card on top of
      if (tgtCost === null || srcCost === null) continue;
      if (tgtCost >= srcCost) continue;

      connections.push({
        from: source.cardname,
        to: target.cardname,
        category: "mechanic",
        label: `shift target (${srcChar})`,
        direction: "forward",
      });
    }
  }

  return connections;
}

// ── Singer / Song ─────────────────────────────────────────────────────────────
// Singer N characters can exert to pay for Songs that cost N or less.
// "Singer N" is a keyword: the N is parsed from the card text.
// Songs are identified by card type or subtype.

function detectLorSingerSong(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const singerPattern = /\bsinger\s+(\d+)\b/i;

  const songs = cards.filter(isSong);
  if (songs.length === 0) return [];

  for (const singer of cards) {
    if (!lorKeywords(singer).includes("Singer")) continue;
    const text = lorText(singer);
    const match = singerPattern.exec(text);
    const singerValue = match ? parseInt(match[1]) : lorCost(singer) ?? 0;

    for (const song of songs) {
      if (song.cardname === singer.cardname) continue;
      const songCost = lorCost(song) ?? 0;
      if (songCost <= singerValue) {
        connections.push({
          from: singer.cardname,
          to: song.cardname,
          category: "mechanic",
          label: "singer → song",
          direction: "forward",
        });
      }
    }
  }

  return connections;
}

// ── Keyword Granting ──────────────────────────────────────────────────────────
// Cards that grant keywords (Evasive, Rush, Challenger, etc.) to other characters.

const LOR_GRANTABLE_KEYWORDS = [
  "Evasive", "Rush", "Bodyguard", "Challenger", "Reckless",
  "Resist", "Support", "Ward",
];

function detectLorKeywordGranting(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  for (const source of cards) {
    const text = lorText(source);

    for (const kw of LOR_GRANTABLE_KEYWORDS) {
      const grants =
        new RegExp(`gains? ${kw}`, "i").test(text) ||
        new RegExp(`have ${kw}`, "i").test(text) ||
        new RegExp(`get ${kw}`, "i").test(text);
      if (!grants) continue;

      // Connect to all characters in the deck that benefit from this keyword
      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        if (!isCharacter(target)) continue;
        // Don't connect if target already has the keyword natively
        if (lorKeywords(target).includes(kw)) continue;

        connections.push({
          from: source.cardname,
          to: target.cardname,
          category: "utility",
          label: `grants ${kw.toLowerCase()}`,
          direction: "forward",
        });
      }
    }
  }

  return connections;
}

// ── Lore Pump ─────────────────────────────────────────────────────────────────
// Cards that give other characters +lore or let them quest an additional time.

function detectLorLorePump(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const lorePumpPatterns = [
    /gets? \+\d+ lore/i,
    /gains? \+\d+ lore/i,
    /quest again/i,
    /ready and can quest/i,
  ];

  for (const source of cards) {
    const text = lorText(source);
    if (!lorePumpPatterns.some(p => p.test(text))) continue;

    for (const target of cards) {
      if (target.cardname === source.cardname) continue;
      if (!isCharacter(target)) continue;
      const lore = lorLore(target);
      // Prioritise connecting to characters that actually quest (lore > 0)
      if (!lore || lore <= 0) continue;

      connections.push({
        from: source.cardname,
        to: target.cardname,
        category: "mechanic",
        label: "lore acceleration",
        direction: "forward",
      });
    }
  }

  return connections;
}

// ── Banish Triggers ───────────────────────────────────────────────────────────
// Enablers: cards that banish opposing or friendly characters.
// Payoffs: cards that trigger when a character is banished or goes to discard.

function detectLorBanishSynergy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  const banishEnablerPatterns = [
    /banish chosen character/i,
    /banish target character/i,
    /deal \d+ damage/i,
    /deals? \d+ damage/i,
  ];

  const banishPayoffPatterns = [
    /whenever one of your characters is banished/i,
    /when this character is banished/i,
    /whenever a character is banished/i,
    /when.*goes to.*discard/i,
    /whenever.*leaves play/i,
  ];

  const enablers = cards.filter(c => banishEnablerPatterns.some(p => p.test(lorText(c))));
  const payoffs  = cards.filter(c => banishPayoffPatterns.some(p => p.test(lorText(c))));

  for (const enabler of enablers) {
    for (const payoff of payoffs) {
      if (enabler.cardname === payoff.cardname) continue;
      connections.push({
        from: enabler.cardname,
        to: payoff.cardname,
        category: "triggered",
        label: "banish trigger",
        direction: "bidirectional",
      });
    }
  }

  return connections;
}

// ── Stat Pump ─────────────────────────────────────────────────────────────────
// Cards that give other characters +strength or +willpower.
// Connects to characters that challenge (high strength is more useful there).

function detectLorStatPump(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const pumpPatterns = [
    /gets? \+\d+\/\+\d+/i,
    /gains? \+\d+ strength/i,
    /gains? \+\d+ willpower/i,
    /your characters get \+/i,
  ];

  for (const source of cards) {
    const text = lorText(source);
    if (!pumpPatterns.some(p => p.test(text))) continue;

    for (const target of cards) {
      if (target.cardname === source.cardname) continue;
      if (!isCharacter(target)) continue;
      // Prefer connecting to Challenger characters or high-strength characters
      const hasChal    = lorKeywords(target).includes("Challenger");
      const strength   = target.info?.[0]?.power ?? 0;
      if (!hasChal && (strength === null || strength < 2)) continue;

      connections.push({
        from: source.cardname,
        to: target.cardname,
        category: "utility",
        label: "stat pump",
        direction: "forward",
      });
    }
  }

  return connections;
}

// ── Redundancy ────────────────────────────────────────────────────────────────
// Cards doing the same functional job in the deck.

const LOR_REDUNDANCY_ROLES = [
  {
    label: "card draw",
    patterns: [/draw (a|\d+) cards?/i, /look at the top.*draw/i],
  },
  {
    label: "board removal",
    patterns: [/banish chosen/i, /banish all/i, /return.*character.*hand/i],
  },
  {
    label: "ink acceleration",
    patterns: [/you may put.*into your inkwell/i, /gain \d+ ink/i],
  },
  {
    label: "character bounce",
    patterns: [/return (chosen|target|a) character.*to (their|its|your|opponent) hand/i],
  },
];

function detectLorRedundancy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const role of LOR_REDUNDANCY_ROLES) {
    const matches = cards.filter(c => role.patterns.some(p => p.test(lorText(c))));
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        connections.push({
          from: matches[i].cardname, to: matches[j].cardname,
          category: "redundancy", label: `redundancy: ${role.label}`,
          direction: "none",
        });
      }
    }
  }
  return connections;
}

// ── Role Detection (highlight-only, used for layout zones) ───────────────────

interface LorRoleRule {
  label: string;
  test: (card: Card) => boolean;
}

const LOR_ROLE_RULES: LorRoleRule[] = [
  {
    label: "role: song",
    test: card => isSong(card),
  },
  {
    label: "role: quester",
    test: card => {
      if (!isCharacter(card)) return false;
      const lore = lorLore(card);
      return lore !== null && lore >= 2 && !lorKeywords(card).includes("Reckless");
    },
  },
  {
    label: "role: challenger",
    test: card => isCharacter(card) && lorKeywords(card).includes("Challenger"),
  },
  {
    label: "role: bodyguard",
    test: card => isCharacter(card) && lorKeywords(card).includes("Bodyguard"),
  },
  {
    label: "role: support",
    test: card => {
      const text = lorText(card);
      return (
        isCharacter(card) && lorKeywords(card).includes("Support")
      ) || (
        !isCharacter(card) &&
        (/draw.*card/i.test(text) || /gain.*ink/i.test(text) || /look at the top/i.test(text))
      );
    },
  },
  {
    label: "role: removal",
    test: card => {
      const text = lorText(card);
      return /banish chosen/i.test(text) || /return.*character.*hand/i.test(text);
    },
  },
  {
    label: "role: rush",
    test: card => isCharacter(card) && lorKeywords(card).includes("Rush"),
  },
];

function detectLorRoleConnections(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const role of LOR_ROLE_RULES) {
    const matches = cards.filter(role.test);
    if (matches.length < 2) continue;
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        connections.push({
          from: matches[i].cardname, to: matches[j].cardname,
          category: "role", label: role.label,
          direction: "none", highlightOnly: true,
        });
      }
    }
  }
  return connections;
}

// ── Lorcana role map (for ForceLayout zone seeding) ──────────────────────────

export function buildLorRoleMap(cards: Card[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const card of cards) {
    for (const role of LOR_ROLE_RULES) {
      if (role.test(card)) {
        map[card.cardname] = role.label;
        break;
      }
    }
  }
  return map;
}

// ── Main Lorcana export ───────────────────────────────────────────────────────

export function detectLorcanaSynergies(cards: Card[]): SynergyConnection[] {
  const raw = [
    ...detectLorNamedReferences(cards),
    ...detectLorShift(cards),
    ...detectLorSingerSong(cards),
    ...detectLorKeywordGranting(cards),
    ...detectLorLorePump(cards),
    ...detectLorBanishSynergy(cards),
    ...detectLorStatPump(cards),
    ...detectLorRedundancy(cards),
    ...detectLorRoleConnections(cards),
  ];
  const result = dedup(raw);
  console.log(`[SynergyEngine/Lorcana] Detected ${result.length} connections`);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── YUGIOH ENGINE ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────────────────────

function ygoText(card: Card): string {
  return card.info?.[0]?.text?.toLowerCase() ?? "";
}

function ygoName(card: Card): string {
  return (card.info?.[0]?.name ?? card.cardname).toLowerCase();
}

function ygoCardType(card: Card): string {
  return card.info?.[0]?.cardTypes?.[0]?.toLowerCase() ?? "";
}

function ygoSubTypes(card: Card): string[] {
  return card.info?.[0]?.subTypes?.map(s => s.toLowerCase()) ?? [];
}

function ygoLevel(card: Card): number | null {
  return card.info?.[0]?.cost ?? null;
}

function ygoAtk(card: Card): number | null {
  return card.info?.[0]?.power ?? null;
}

function isYgoMonster(card: Card): boolean {
  return ygoCardType(card) === "monster";
}



function isExtraDeckMonster(card: Card): boolean {
  const subs = ygoSubTypes(card);
  return ["fusion", "synchro", "xyz", "link"].some(t => subs.includes(t));
}

function isTuner(card: Card): boolean {
  return ygoSubTypes(card).includes("tuner") || /\btuner\b/.test(ygoText(card));
}

// ── Archetype Detection ───────────────────────────────────────────────────────
// YGO synergies are primarily archetype-based. Cards within an archetype
// reference their archetype name in their card text or card name.
// Strategy: find all archetype keywords that appear in 3+ cards in the deck,
// then connect cards that share or reference that keyword.

function extractArchetypeKeywords(cards: Card[]): string[] {
  // Words that appear in 3+ card names — likely archetype names.
  // Exclude generic words.
  const STOPWORDS = new Set([
    "the","of","a","an","in","to","and","or","with","for","from","by",
    "is","it","at","on","as","be","was","are","has","have","had","do",
    "did","not","no","so","if","but","all","can","will","would","could",
    "should","may","might","must","shall","dark","white","black","blue",
    "red","green","dragon","knight","warrior","mage","spirit","lord",
    "king","queen","god","evil","great","ancient","sacred","mighty",
    "true","new","old","young","small","big","giant","super","ultra",
  ]);

  const wordCount: Record<string, number> = {};
  for (const card of cards) {
    const words = ygoName(card).split(/[\s\-',.!?]+/).filter(w =>
      w.length >= 3 && !STOPWORDS.has(w)
    );
    const seen = new Set<string>();
    for (const word of words) {
      if (!seen.has(word)) {
        wordCount[word] = (wordCount[word] ?? 0) + 1;
        seen.add(word);
      }
    }
  }

  // Return words that appear in 3+ card names — these are archetypes
  return Object.entries(wordCount)
    .filter(([, count]) => count >= 3)
    .map(([word]) => word);
}

function detectYgoArchetypes(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const archetypes = extractArchetypeKeywords(cards);

  for (const archetype of archetypes) {
    // Cards that ARE in the archetype (name contains the keyword)
    const members = cards.filter(c => ygoName(c).includes(archetype));
    // Cards that SUPPORT the archetype (text references the keyword but
    // name doesn't contain it — e.g. spell/trap support cards)
    const supporters = cards.filter(c =>
      !ygoName(c).includes(archetype) &&
      ygoText(c).includes(archetype)
    );

    // member ↔ member
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        connections.push({
          from: members[i].cardname, to: members[j].cardname,
          category: "subtype", label: `${archetype} archetype`,
          direction: "none",
        });
      }
    }

    // supporter → member
    for (const sup of supporters) {
      for (const mem of members) {
        connections.push({
          from: sup.cardname, to: mem.cardname,
          category: "named", label: `${archetype} support`,
          direction: "forward",
        });
      }
    }
  }

  return connections;
}

// ── GY Synergy ────────────────────────────────────────────────────────────────
// Enablers send cards to GY; payoffs benefit from cards being in or sent to GY.

function detectYgoGYSynergy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  const gyEnablerPatterns = [
    /send.*to.*gy/i,
    /send.*to.*graveyard/i,
    /discard.*hand/i,
    /mill/i,
    /excavate/i,
    /place.*in.*graveyard/i,
    /send.*from.*deck.*to.*grave/i,
  ];

  const gyPayoffPatterns = [
    /if.*this card is in.*gy/i,
    /while.*in.*gy/i,
    /when.*sent to.*gy/i,
    /from.*gy.*special summon/i,
    /banish.*from.*gy/i,
    /graveyard.*activate/i,
    /when.*this card.*destroyed.*graveyard/i,
    /you can banish this card from your gy/i,
    /add.*from.*gy.*hand/i,
    /return.*from.*gy/i,
  ];

  const enablers = cards.filter(c => gyEnablerPatterns.some(p => p.test(ygoText(c))));
  const payoffs  = cards.filter(c => gyPayoffPatterns.some(p => p.test(ygoText(c))));

  for (const enabler of enablers) {
    for (const payoff of payoffs) {
      if (enabler.cardname === payoff.cardname) continue;
      connections.push({
        from: enabler.cardname, to: payoff.cardname,
        category: "mechanic", label: "GY synergy",
        direction: "bidirectional",
      });
    }
  }

  return connections;
}

// ── Special Summon Chains ─────────────────────────────────────────────────────
// Cards that special summon other monsters pair with monsters that can be
// special summoned under specific conditions.

function detectYgoSpecialSummonSynergy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  const specialSummonEnablerPatterns = [
    /special summon.*from.*hand/i,
    /special summon.*from.*deck/i,
    /special summon.*from.*gy/i,
    /you can special summon/i,
    /special summon 1 monster/i,
  ];

  const specialSummonPayoffPatterns = [
    /cannot be normal summoned/i,
    /must.*special summon.*this way/i,
    /can only be special summoned/i,
    /when.*special summoned/i,
    /if.*special summoned/i,
  ];

  const enablers = cards.filter(c =>
    isYgoMonster(c) && specialSummonEnablerPatterns.some(p => p.test(ygoText(c)))
  );
  const payoffs = cards.filter(c =>
    isYgoMonster(c) && specialSummonPayoffPatterns.some(p => p.test(ygoText(c)))
  );

  for (const enabler of enablers) {
    for (const payoff of payoffs) {
      if (enabler.cardname === payoff.cardname) continue;
      connections.push({
        from: enabler.cardname, to: payoff.cardname,
        category: "triggered", label: "special summon chain",
        direction: "forward",
      });
    }
  }

  return connections;
}

// ── Tuner + Synchro ───────────────────────────────────────────────────────────

function detectYgoSynchroPairs(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const tuners    = cards.filter(isTuner);
  const nonTuners = cards.filter(c => isYgoMonster(c) && !isTuner(c) && !isExtraDeckMonster(c));
  const synchros  = cards.filter(c => ygoSubTypes(c).includes("synchro"));

  // Tuner ↔ non-tuner (they pair to make synchros)
  for (const tuner of tuners) {
    for (const nonTuner of nonTuners) {
      if (tuner.cardname === nonTuner.cardname) continue;
      connections.push({
        from: tuner.cardname, to: nonTuner.cardname,
        category: "mechanic", label: "synchro material",
        direction: "none",
      });
    }
  }

  // Tuner → Synchro (tuners enable synchro plays)
  for (const tuner of tuners) {
    for (const synchro of synchros) {
      connections.push({
        from: tuner.cardname, to: synchro.cardname,
        category: "mechanic", label: "synchro summon",
        direction: "forward",
      });
    }
  }

  return connections;
}

// ── Tribute / High-Level Monsters ─────────────────────────────────────────────
// Cards that reduce tribute requirements or search high-level monsters
// connect to monsters that require tribute summons (level 5+).

function detectYgoTributeSynergy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];

  const tributeReducePatterns = [
    /can be used as 2 tributes/i,
    /requires 1 less tribute/i,
    /tribute summon.*without tributing/i,
    /you can tribute summon/i,
  ];

  const highLevelMonsters = cards.filter(c => {
    if (!isYgoMonster(c) || isExtraDeckMonster(c)) return false;
    const lvl = ygoLevel(c);
    return lvl !== null && lvl >= 5;
  });

  const tributeHelpers = cards.filter(c =>
    tributeReducePatterns.some(p => p.test(ygoText(c)))
  );

  for (const helper of tributeHelpers) {
    for (const monster of highLevelMonsters) {
      if (helper.cardname === monster.cardname) continue;
      connections.push({
        from: helper.cardname, to: monster.cardname,
        category: "utility", label: "tribute enabler",
        direction: "forward",
      });
    }
  }

  return connections;
}

// ── Searchers ─────────────────────────────────────────────────────────────────
// Cards that search (add from deck to hand) specific named cards.

function detectYgoSearchers(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  // Pattern: "add 1 [card name] from your deck to your hand"
  const searchPattern = /add (?:1 )?(?:"([^"]+)"|([a-z][\w\s\-']+?)) from (?:your )?deck to (?:your )?hand/gi;

  for (const source of cards) {
    const text = ygoText(source);
    searchPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = searchPattern.exec(text)) !== null) {
      const searchedName = (match[1] ?? match[2] ?? "").trim().toLowerCase();
      if (searchedName.length < 3) continue;

      for (const target of cards) {
        if (target.cardname === source.cardname) continue;
        if (ygoName(target).includes(searchedName) || searchedName.includes(ygoName(target))) {
          connections.push({
            from: source.cardname, to: target.cardname,
            category: "named", label: "searcher",
            direction: "forward",
          });
        }
      }
    }
  }

  return connections;
}

// ── Hand Traps ────────────────────────────────────────────────────────────────
// Hand traps are monsters activated from hand during opponent's turn.
// Group them as redundancy so their shared role is visible.

function detectYgoHandTraps(cards: Card[]): SynergyConnection[] {
  const handTrapPatterns = [
    /during (?:either player's|your opponent's) (?:main |battle )?phase.*(?:discard|send).*hand/i,
    /when your opponent.*activates.*you can.*hand.*negate/i,
    /discard this card.*negate/i,
    /you can discard this card.*when your opponent/i,
  ];

  const handTraps = cards.filter(c =>
    isYgoMonster(c) && handTrapPatterns.some(p => p.test(ygoText(c)))
  );

  const connections: SynergyConnection[] = [];
  for (let i = 0; i < handTraps.length; i++) {
    for (let j = i + 1; j < handTraps.length; j++) {
      connections.push({
        from: handTraps[i].cardname, to: handTraps[j].cardname,
        category: "redundancy", label: "redundancy: hand trap",
        direction: "none",
      });
    }
  }
  return connections;
}

// ── Floodgates ────────────────────────────────────────────────────────────────
// Continuous spells/traps that lock out mechanics.

function detectYgoFloodgates(cards: Card[]): SynergyConnection[] {
  const floodgatePatterns = [
    /monsters cannot be special summoned/i,
    /each player can only (control|have) 1 monster/i,
    /monster effects cannot be activated/i,
    /neither player can special summon/i,
    /spell.*cannot be activated/i,
    /trap.*cannot be activated/i,
    /effect monsters cannot activate their effects/i,
    /cannot special summon.*while.*face.up/i,
  ];

  const floodgates = cards.filter(c =>
    !isYgoMonster(c) && floodgatePatterns.some(p => p.test(ygoText(c)))
  );

  const connections: SynergyConnection[] = [];
  for (let i = 0; i < floodgates.length; i++) {
    for (let j = i + 1; j < floodgates.length; j++) {
      connections.push({
        from: floodgates[i].cardname, to: floodgates[j].cardname,
        category: "redundancy", label: "redundancy: floodgate",
        direction: "none",
      });
    }
  }
  return connections;
}

// ── Redundancy ────────────────────────────────────────────────────────────────

const YGO_REDUNDANCY_ROLES = [
  {
    label: "spell/trap removal",
    patterns: [
      /destroy.*spell.*trap/i,
      /destroy.*set cards/i,
      /negate.*and destroy.*spell/i,
    ],
  },
  {
    label: "monster removal",
    patterns: [
      /destroy.*monster/i,
      /banish.*monster/i,
      /return.*monster.*hand/i,
    ],
  },
  {
    label: "draw power",
    patterns: [/draw \d+ cards?/i, /draw.*equal to/i],
  },
  {
    label: "counter trap",
    patterns: [/negate.*activation.*destroy/i, /negate.*summon/i],
  },
];

function detectYgoRedundancy(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const role of YGO_REDUNDANCY_ROLES) {
    const matches = cards.filter(c => role.patterns.some(p => p.test(ygoText(c))));
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        connections.push({
          from: matches[i].cardname, to: matches[j].cardname,
          category: "redundancy", label: `redundancy: ${role.label}`,
          direction: "none",
        });
      }
    }
  }
  return connections;
}

// ── Role Detection ────────────────────────────────────────────────────────────

interface YgoRoleRule {
  label: string;
  test: (card: Card) => boolean;
}

const YGO_ROLE_RULES: YgoRoleRule[] = [
  {
    label: "role: hand trap",
    test: card => isYgoMonster(card) && [
      /during (?:either player's|your opponent's).*(?:discard|send).*hand/i,
      /you can discard this card.*when your opponent/i,
      /discard this card.*negate/i,
    ].some(p => p.test(ygoText(card))),
  },
  {
    label: "role: floodgate",
    test: card => !isYgoMonster(card) && [
      /monsters cannot be special summoned/i,
      /neither player can special summon/i,
      /each player can only (control|have) 1 monster/i,
      /monster effects cannot be activated/i,
    ].some(p => p.test(ygoText(card))),
  },
  {
    label: "role: searcher",
    test: card => /add .* from (?:your )?deck to (?:your )?hand/i.test(ygoText(card)),
  },
  {
    label: "role: extender",
    test: card => isYgoMonster(card) && !isExtraDeckMonster(card) && [
      /you can special summon this card/i,
      /special summon this card from your hand/i,
      /if you control.*special summon/i,
    ].some(p => p.test(ygoText(card))),
  },
  {
    label: "role: boss monster",
    test: card => {
      if (!isYgoMonster(card)) return false;
      const atk = ygoAtk(card);
      return atk !== null && atk >= 2800 && !isExtraDeckMonster(card);
    },
  },
  {
    label: "role: removal",
    test: card => !isYgoMonster(card) && [
      /destroy target/i,
      /banish.*monster/i,
      /return.*to.*hand/i,
    ].some(p => p.test(ygoText(card))),
  },
  {
    label: "role: tuner",
    test: card => isTuner(card),
  },
  {
    label: "role: extra deck",
    test: card => isExtraDeckMonster(card),
  },
];

function detectYgoRoleConnections(cards: Card[]): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  for (const role of YGO_ROLE_RULES) {
    const matches = cards.filter(role.test);
    if (matches.length < 2) continue;
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        connections.push({
          from: matches[i].cardname, to: matches[j].cardname,
          category: "role", label: role.label,
          direction: "none", highlightOnly: true,
        });
      }
    }
  }
  return connections;
}

// ── YGO role map (for ForceLayout zone seeding) ───────────────────────────────

export function buildYgoRoleMap(cards: Card[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const card of cards) {
    for (const role of YGO_ROLE_RULES) {
      if (role.test(card)) {
        map[card.cardname] = role.label;
        break;
      }
    }
  }
  return map;
}

// ── Main YGO export ───────────────────────────────────────────────────────────

export function detectYgoSynergies(cards: Card[]): SynergyConnection[] {
  const raw = [
    ...detectYgoArchetypes(cards),
    ...detectYgoGYSynergy(cards),
    ...detectYgoSpecialSummonSynergy(cards),
    ...detectYgoSynchroPairs(cards),
    ...detectYgoTributeSynergy(cards),
    ...detectYgoSearchers(cards),
    ...detectYgoHandTraps(cards),
    ...detectYgoFloodgates(cards),
    ...detectYgoRedundancy(cards),
    ...detectYgoRoleConnections(cards),
  ];
  const result = dedup(raw);
  console.log(`[SynergyEngine/YGO] Detected ${result.length} connections`);
  return result;
}