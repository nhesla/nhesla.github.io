export interface SampleDeck {
  name: string;
  game: "MTG" | "YGO" | "LOR";
  list: string;
}

export const SAMPLE_DECKS: SampleDeck[] = [

  // ── MTG ──────────────────────────────────────────────────────────────────

  {
    name: "Elf Ball",
    game: "MTG",
    list: `4x Llanowar Elves
4x Elvish Mystic
4x Elvish Archdruid
3x Ezuri, Renegade Leader
3x Imperious Perfect
3x Reclamation Sage
3x Elvish Visionary
4x Collected Company
3x Chord of Calling
3x Eternal Witness
2x Craterhoof Behemoth
2x Ezuri's Predation
1x Woodland Cemetery
4x Overgrown Tomb
4x Forest
4x Verdant Catacombs
3x Blooming Marsh
2x Nykthos, Shrine to Nyx`,
  },

  {
    name: "Burn",
    game: "MTG",
    list: `4x Lightning Bolt
4x Lava Spike
4x Rift Bolt
4x Shard Volley
4x Skullcrack
4x Light Up the Stage
4x Goblin Guide
4x Monastery Swiftspear
4x Eidolon of the Great Revel
3x Inspiring Vantage
3x Sacred Foundry
2x Sunbaked Canyon
2x Fiery Islet
8x Mountain
4x Searing Blaze
4x Searing Blood`,
  },

  {
    name: "Zombies",
    game: "MTG",
    list: `4x Gravecrawler
4x Carrion Feeder
4x Cryptbreaker
4x Diregraf Ghoul
3x Death Baron
3x Lord of the Undead
3x Undead Augur
3x Graveyard Marshal
2x Geralf's Messenger
2x Liliana, Untouched By Death
4x Thoughtseize
3x Fatal Push
4x Concealed Courtyard
4x Godless Shrine
4x Marsh Flats
4x Swamp
2x Plains`,
  },

  {
    name: "Auras",
    game: "MTG",
    list: `4x Slippery Bogle
4x Gladecover Scout
4x Kor Spiritdancer
4x Ethereal Armor
4x Spirit Mantle
4x Hyena Umbra
4x Spider Umbra
3x Rancor
3x Keen Sense
3x Daybreak Coronet
3x Utopia Sprawl
2x Silhana Ledgewalker
4x Horizon Canopy
4x Razorverge Thicket
4x Temple Garden
4x Forest
2x Plains`,
  },

  {
    name: "Death and Taxes",
    game: "MTG",
    list: `4x Thalia, Guardian of Thraben
4x Leonin Arbiter
4x Flickerwisp
4x Restoration Angel
3x Recruiter of the Guard
3x Blade Splicer
3x Skyclave Apparition
2x Mirran Crusader
2x Phyrexian Revoker
2x Giver of Runes
2x Palace Jailer
1x Brimaz, King of Oreskos
4x AEther Vial
3x Swords to Plowshares
4x Rishadan Port
4x Karakas
8x Plains
3x Shefet Dunes`,
  },

  // ── YGO ──────────────────────────────────────────────────────────────────

  {
    name: "Masked Beast",
    game: "YGO",
    list: `3x The Masked Beast
3x Relinquished
3x Des Guardius
3x Grand Tiki Elder
3x Melchid the Four-Face Beast
3x Kuriboh
3x Sangan
2x Mystic Tomato
2x Witch of the Black Forest
1x Sorcerer of Dark Magic
3x Mask of Darkness
3x Mask of Restrict
2x Mask of the Accursed
2x Mask of Brutality
1x Mask of Dispel
2x Dark Hole
1x Raigeki
1x Monster Reborn
1x Harpie's Feather Duster`,
  },

  {
    name: "Blue-Eyes White Dragon",
    game: "YGO",
    list: `3x Blue-Eyes White Dragon
3x Blue-Eyes Alternative White Dragon
3x Sage with Eyes of Blue
3x The White Stone of Ancients
3x The White Stone of Legend
2x Maiden with Eyes of Blue
2x Dragon Spirit of White
1x Blue-Eyes Chaos MAX Dragon
3x Cards of Consonance
3x Return of the Dragon Lords
3x Trade-In
2x Melody of Awakening Dragon
2x Silver's Cry
1x One for One
1x Monster Reborn
3x Infinite Impermanence
2x Solemn Judgment`,
  },

  {
    name: "Dark Magician",
    game: "YGO",
    list: `3x Dark Magician
3x Dark Magician Girl
3x Magician's Rod
3x Magician of Dark Illusion
2x Apprentice Illusion Magician
2x Dark Magician the Dragon Knight
1x Skilled Dark Magician
3x Dark Magical Circle
3x Illusion Magic
3x The Dark Illusion
2x Magician Navigation
2x Eternal Soul
2x Dark Magic Attack
1x Dark Magic Inheritance
1x Monster Reborn
3x Infinite Impermanence
2x Solemn Strike`,
  },

  {
    name: "Eldlich",
    game: "YGO",
    list: `3x Eldlich the Golden Lord
3x Conquistador of the Golden Land
3x Huaquero of the Golden Land
3x Cursed Eldland
3x Golden Land Forever!
3x Eldlixir of Scarlet Sanguine
3x Eldlixir of White Destiny
2x Eldlixir of Black Awakening
3x Skill Drain
3x There Can Be Only One
2x Solemn Judgment
2x Solemn Strike
2x Dimensional Barrier
1x Red Reboot
3x Pot of Extravagance`,
  },

  // ── Lorcana ───────────────────────────────────────────────────────────────

  {
    name: "Amber Amethyst Aggro",
    game: "LOR",
    list: `4x Simba - Rightful Heir
4x Moana - Of Motunui
4x Goofy - Musketeer
4x Hercules - Hero in Training
4x Maui - Hero to All
3x Elsa - Snow Queen
3x Mickey Mouse - Brave Little Tailor
3x Rapunzel - Gifted with Healing
2x Cinderella - Stouthearted
2x Belle - Strange but Special
4x Be Our Guest
4x Hakuna Matata
3x Grab Your Sword
3x Friends on the Other Side`,
  },

  {
    name: "Steel Ruby Control",
    game: "LOR",
    list: `4x Maleficent - Monstrous Dragon
4x Gaston - Arrogant Hunter
4x The Queen - Wicked and Vain
3x Hades - King of Olympus
3x Scar - Mastermind
3x Ursula - Sea Witch Queen
2x Cruella De Vil - Miserable as Usual
2x Jafar - Wicked Sorcerer
4x Be Prepared
4x Smash
4x Fire the Cannons
3x Let the Storm Rage On
3x Dragon Fire
2x Grab Your Sword`,
  },

  {
    name: "Emerald Ruby Ramp",
    game: "LOR",
    list: `4x Elsa - Spirit of Winter
4x Moana - Wayfinder
4x Stitch - Carefree Surfer
4x Tinker Bell - Giant Fairy
3x Merlin - Rabbit
3x Maui - Demigod
3x Kristoff - Official Ice Master
2x Olaf - Friendly Snowman
2x Genie - On the Job
4x Let It Go
4x Develop Your Brain
3x Grab Your Sword
3x You Have Forgotten Me
2x Be Our Guest`,
  },

];

// Return a random deck for a given game, different from the current one if possible
export function getRandomDeck(game: "MTG" | "YGO" | "LOR", currentName?: string): SampleDeck {
  const pool = SAMPLE_DECKS.filter(d => d.game === game);
  const candidates = pool.filter(d => d.name !== currentName);
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}