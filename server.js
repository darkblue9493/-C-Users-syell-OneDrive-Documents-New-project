const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, "data");
const dbPath = path.join(dataDir, "chats.json");
const uploadDir = path.join(dataDir, "uploads");
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminPath = "/admin9493";
const adminMessagesPath = "/messages9493";
const adminLoginPath = "/login9493";
const adminExportToken = process.env.ADMIN_EXPORT_TOKEN || "";
const tierlockMerchantId = process.env.TIERLOCK_MERCHANT_ID || "e5474f4227";
const tierlockMerchantSecret = process.env.TIERLOCK_MERCHANT_SECRET || "";
const brevoApiKey = process.env.BREVO_API_KEY || "";
const resendApiKey = process.env.RESEND_API_KEY || "";
const adminLoginEmail = process.env.ADMIN_LOGIN_EMAIL || "";
const adminFromEmail = process.env.ADMIN_FROM_EMAIL || "";
const maintenanceMode = String(process.env.MAINTENANCE_MODE || "").toLowerCase() === "true";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(supabaseUrl && supabaseServiceKey);
const sessions = new Map();
const playerSessions = new Map();
const adminLoginAttempts = new Map();
const pendingAdminLogins = new Map();
const slotLiveClients = new Set();
const maxJsonBodyBytes = 8_000_000;
const playerSessionMaxAge = 60 * 60 * 24 * 400;
const adminSessionMaxAge = 60 * 60 * 2;
const signupBonusPoints = 5;
const referralBonusPoints = 10;
const spinCooldownMs = 24 * 60 * 60 * 1000;
const defaultSpinLimits = {
  10: 1,
  5: 2,
  3: 3,
  1: 10,
};
const defaultSlotSettings = {
  dailyPayoutLimit: 25,
  playerDailyPayoutLimit: 8,
};
const slotGameNames = {
  buffalo: "Buffalo Rush",
  diamond: "Diamond 777",
  diamond777: "Diamond 777",
  lucky777: "Lucky 777",
  milkyway: "Milky Way 777",
  dragon: "Dragon Conqueror",
  ocean: "Ocean Monster",
  firekirin: "Fire Kirin",
  pandamaster: "Panda Master",
  orion: "Orion Stars",
  goldendragon: "Golden Dragon",
  gamevault: "Game Vault",
  ultrapanda: "Ultra Panda",
  jungle: "Jungle Fortune",
  neon: "Neon Reels",
};
const arcadeSlotGameNames = {
  wildBuffalo: "Wild Buffalo",
  kingKong: "King Kong",
  triple777: "Triple 777",
  blackjack: "Black Jack Slots",
  gorillaGold: "Gorilla Gold",
  goldWolf: "Gold Wolf",
  wildBull: "Wild Bull",
  dragonEmpress: "Dragon Empress",
  mammothRush: "Mammoth Rush",
  pharaoh: "Pharaoh's Riches",
  oceanTreasure: "Ocean Treasure",
  vegas7s: "Vegas 7s",
  luckyPanda: "Lucky Panda 88",
  lionsPride: "Lion's Pride",
  piratesTreasure: "Pirate's Treasure",
  zeusThunder: "Zeus Thunder",
  cleopatra: "Cleopatra Diamonds",
  frozenRiches: "Frozen Riches",
  galaxyStars: "Galaxy Stars",
  fruitMania: "Fruit Mania",
  vikingGlory: "Viking Glory",
  aztecEmpire: "Aztec Empire",
  halloweenHunt: "Halloween Hunt",
  luckyCharms: "Lucky Charms",
};
const legacySlotArcadeMap = {
  buffalo: "wildBuffalo",
  diamond: "triple777",
  diamond777: "triple777",
  lucky777: "triple777",
  milkyway: "vegas7s",
  dragon: "dragonEmpress",
  ocean: "oceanTreasure",
  firekirin: "dragonEmpress",
  pandamaster: "gorillaGold",
  orion: "vegas7s",
  goldendragon: "dragonEmpress",
  gamevault: "wildBuffalo",
  ultrapanda: "gorillaGold",
  jungle: "gorillaGold",
  neon: "vegas7s",
};

function arcadeKeyForLegacySlot(gameKey) {
  if (Object.prototype.hasOwnProperty.call(arcadeSlotGameNames, gameKey)) return gameKey;
  return legacySlotArcadeMap[gameKey] || "wildBuffalo";
}

function defaultArcadeGameConfig() {
  return {
    enabled: true,
    targetRtp: 0.92,
    dailyMaxPayout: 1000,
    dailyMinPayout: 50,
    maxBet: 10,
    minBet: 0.05,
    jackpotPool: { grand: 1500, major: 500, minor: 100, mini: 20 },
  };
}

const arcadeGameDefaultOverrides = {
  wildBuffalo:     { targetRtp: 0.91, dailyMaxPayout: 850,  dailyMinPayout: 35, minBet: 0.05, maxBet: 8 },
  kingKong:        { targetRtp: 0.92, dailyMaxPayout: 1200, dailyMinPayout: 50, minBet: 0.1,  maxBet: 12 },
  triple777:       { targetRtp: 0.9,  dailyMaxPayout: 700,  dailyMinPayout: 25, minBet: 0.05, maxBet: 5 },
  blackjack:       { targetRtp: 0.93, dailyMaxPayout: 1500, dailyMinPayout: 75, minBet: 0.25, maxBet: 15 },
  gorillaGold:     { targetRtp: 0.92, dailyMaxPayout: 1100, dailyMinPayout: 50, minBet: 0.1,  maxBet: 10 },
  goldWolf:        { targetRtp: 0.91, dailyMaxPayout: 900,  dailyMinPayout: 40, minBet: 0.05, maxBet: 8 },
  wildBull:        { targetRtp: 0.9,  dailyMaxPayout: 650,  dailyMinPayout: 25, minBet: 0.05, maxBet: 5 },
  dragonEmpress:   { targetRtp: 0.94, dailyMaxPayout: 1800, dailyMinPayout: 90, minBet: 0.25, maxBet: 20 },
  mammothRush:     { targetRtp: 0.93, dailyMaxPayout: 1600, dailyMinPayout: 80, minBet: 0.2,  maxBet: 18 },
  pharaoh:         { targetRtp: 0.92, dailyMaxPayout: 1250, dailyMinPayout: 60, minBet: 0.1,  maxBet: 12 },
  oceanTreasure:   { targetRtp: 0.91, dailyMaxPayout: 950,  dailyMinPayout: 45, minBet: 0.05, maxBet: 9 },
  vegas7s:         { targetRtp: 0.9,  dailyMaxPayout: 750,  dailyMinPayout: 30, minBet: 0.05, maxBet: 6 },
  luckyPanda:      { targetRtp: 0.92, dailyMaxPayout: 1000, dailyMinPayout: 50, minBet: 0.1,  maxBet: 10 },
  lionsPride:      { targetRtp: 0.93, dailyMaxPayout: 1400, dailyMinPayout: 70, minBet: 0.2,  maxBet: 14 },
  piratesTreasure: { targetRtp: 0.91, dailyMaxPayout: 1050, dailyMinPayout: 50, minBet: 0.1,  maxBet: 10 },
  zeusThunder:     { targetRtp: 0.94, dailyMaxPayout: 2000, dailyMinPayout: 100, minBet: 0.25, maxBet: 20 },
  cleopatra:       { targetRtp: 0.93, dailyMaxPayout: 1550, dailyMinPayout: 75, minBet: 0.2,  maxBet: 16 },
  frozenRiches:    { targetRtp: 0.91, dailyMaxPayout: 900,  dailyMinPayout: 40, minBet: 0.05, maxBet: 8 },
  galaxyStars:     { targetRtp: 0.92, dailyMaxPayout: 1300, dailyMinPayout: 65, minBet: 0.1,  maxBet: 12 },
  fruitMania:      { targetRtp: 0.9,  dailyMaxPayout: 600,  dailyMinPayout: 20, minBet: 0.05, maxBet: 5 },
  vikingGlory:     { targetRtp: 0.92, dailyMaxPayout: 1150, dailyMinPayout: 55, minBet: 0.1,  maxBet: 11 },
  aztecEmpire:     { targetRtp: 0.93, dailyMaxPayout: 1450, dailyMinPayout: 70, minBet: 0.2,  maxBet: 15 },
  halloweenHunt:   { targetRtp: 0.91, dailyMaxPayout: 800,  dailyMinPayout: 35, minBet: 0.05, maxBet: 7 },
  luckyCharms:     { targetRtp: 0.92, dailyMaxPayout: 1000, dailyMinPayout: 50, minBet: 0.1,  maxBet: 10 },
};

function defaultArcadeGameConfigForKey(gameKey) {
  return {
    ...defaultArcadeGameConfig(),
    ...(arcadeGameDefaultOverrides[gameKey] || {}),
  };
}

function defaultArcadeSlotsConfig() {
  return {
    version: 1,
    globalEnabled: true,
    defaultBet: 0.25,
    jackpotPool: { grand: 1500, major: 500, minor: 100, mini: 20 },
    dailyResetUtcHour: 0,
    lastModified: Date.now(),
    games: Object.fromEntries(Object.keys(arcadeSlotGameNames).map((key) => [key, defaultArcadeGameConfigForKey(key)])),
  };
}
const slotGameThemes = {
  buffalo: {
    symbols: ["BUF", "BISON", "EAGLE", "CACT", "A", "K", "Q", "SD"],
    weights: [2, 3, 6, 8, 11, 12, 12, 5],
    pays: {
      BUF: { 3: 9, 4: 32, 5: 120 },
      BISON: { 3: 7, 4: 24, 5: 90 },
      EAGLE: { 3: 5, 4: 16, 5: 55 },
      CACT: { 3: 4, 4: 11, 5: 35 },
      A: { 3: 3, 4: 8, 5: 24 },
      K: { 3: 2.5, 4: 6, 5: 18 },
      Q: { 3: 2, 4: 5, 5: 14 },
      SD: { 3: 4, 4: 14, 5: 70 },
    },
  },
  diamond: {
    symbols: ["777", "DIA", "BAR", "BELL", "CHERRY", "A", "K", "SD"],
    weights: [2, 3, 6, 8, 10, 12, 12, 5],
    pays: {
      777: { 3: 12, 4: 45, 5: 160 },
      DIA: { 3: 8, 4: 28, 5: 110 },
      BAR: { 3: 6, 4: 18, 5: 60 },
      BELL: { 3: 4, 4: 12, 5: 38 },
      CHERRY: { 3: 3, 4: 8, 5: 24 },
      A: { 3: 2.5, 4: 6, 5: 18 },
      K: { 3: 2, 4: 5, 5: 14 },
      SD: { 3: 4, 4: 14, 5: 70 },
    },
  },
  dragon: {
    symbols: ["DRG", "FIRE", "SWORD", "GOLD", "PALACE", "A", "K", "SD"],
    weights: [2, 4, 6, 8, 9, 12, 12, 5],
    pays: {
      DRG: { 3: 11, 4: 40, 5: 145 },
      FIRE: { 3: 7, 4: 26, 5: 95 },
      SWORD: { 3: 5, 4: 17, 5: 58 },
      GOLD: { 3: 4, 4: 12, 5: 38 },
      PALACE: { 3: 3, 4: 8, 5: 24 },
      A: { 3: 2.5, 4: 6, 5: 18 },
      K: { 3: 2, 4: 5, 5: 14 },
      SD: { 3: 4, 4: 14, 5: 70 },
    },
  },
  ocean: {
    symbols: ["OCEAN", "SHARK", "CRAB", "PEARL", "FISH", "A", "K", "SD"],
    weights: [2, 4, 6, 8, 10, 12, 12, 5],
    pays: {
      OCEAN: { 3: 10, 4: 36, 5: 130 },
      SHARK: { 3: 7, 4: 24, 5: 88 },
      CRAB: { 3: 5, 4: 16, 5: 54 },
      PEARL: { 3: 4, 4: 12, 5: 36 },
      FISH: { 3: 3, 4: 8, 5: 24 },
      A: { 3: 2.5, 4: 6, 5: 18 },
      K: { 3: 2, 4: 5, 5: 14 },
      SD: { 3: 4, 4: 14, 5: 70 },
    },
  },
  jungle: {
    symbols: ["TIGER", "LEOP", "GOLD", "MASK", "LEAF", "A", "K", "SD"],
    weights: [2, 4, 6, 8, 10, 12, 12, 5],
    pays: {
      TIGER: { 3: 10, 4: 36, 5: 132 },
      LEOP: { 3: 7, 4: 25, 5: 92 },
      GOLD: { 3: 5, 4: 16, 5: 55 },
      MASK: { 3: 4, 4: 11, 5: 34 },
      LEAF: { 3: 3, 4: 8, 5: 24 },
      A: { 3: 2.5, 4: 6, 5: 18 },
      K: { 3: 2, 4: 5, 5: 14 },
      SD: { 3: 4, 4: 14, 5: 70 },
    },
  },
  neon: {
    symbols: ["777", "BOLT", "DICE", "ROUL", "DIA", "A", "K", "SD"],
    weights: [2, 4, 6, 8, 9, 12, 12, 5],
    pays: {
      777: { 3: 12, 4: 44, 5: 150 },
      BOLT: { 3: 7, 4: 25, 5: 88 },
      DICE: { 3: 5, 4: 16, 5: 54 },
      ROUL: { 3: 4, 4: 12, 5: 36 },
      DIA: { 3: 3, 4: 8, 5: 24 },
      A: { 3: 2.5, 4: 6, 5: 18 },
      K: { 3: 2, 4: 5, 5: 14 },
      SD: { 3: 4, 4: 14, 5: 70 },
    },
  },
};
slotGameThemes.diamond777 = slotGameThemes.diamond;
slotGameThemes.lucky777 = {
  symbols: ["777", "LUCK", "DIA", "BELL", "BAR", "A", "K", "SD"],
  weights: [2, 4, 5, 8, 9, 12, 12, 5],
  pays: {
    777: { 3: 11, 4: 40, 5: 145 },
    LUCK: { 3: 8, 4: 28, 5: 100 },
    DIA: { 3: 6, 4: 18, 5: 60 },
    BELL: { 3: 4, 4: 12, 5: 36 },
    BAR: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.milkyway = {
  symbols: ["GALAXY", "MOON", "STAR", "ROUL", "CHIP", "A", "K", "SD"],
  weights: [2, 4, 6, 8, 9, 12, 12, 5],
  pays: {
    GALAXY: { 3: 10, 4: 38, 5: 136 },
    MOON: { 3: 7, 4: 25, 5: 90 },
    STAR: { 3: 5, 4: 17, 5: 56 },
    ROUL: { 3: 4, 4: 12, 5: 36 },
    CHIP: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.firekirin = {
  symbols: ["KIRIN", "FIRE", "DRG", "GOLD", "COIN", "A", "K", "SD"],
  weights: [2, 4, 5, 8, 10, 12, 12, 5],
  pays: {
    KIRIN: { 3: 11, 4: 42, 5: 150 },
    FIRE: { 3: 8, 4: 28, 5: 100 },
    DRG: { 3: 6, 4: 18, 5: 60 },
    GOLD: { 3: 4, 4: 12, 5: 38 },
    COIN: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.pandamaster = {
  symbols: ["PANDA", "BAMBOO", "COIN", "GOLD", "LUCK", "A", "K", "SD"],
  weights: [2, 4, 6, 8, 10, 12, 12, 5],
  pays: {
    PANDA: { 3: 10, 4: 36, 5: 132 },
    BAMBOO: { 3: 7, 4: 25, 5: 90 },
    COIN: { 3: 5, 4: 16, 5: 54 },
    GOLD: { 3: 4, 4: 12, 5: 36 },
    LUCK: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.orion = {
  symbols: ["ORION", "STAR", "DICE", "ROUL", "BOLT", "A", "K", "SD"],
  weights: [2, 4, 6, 8, 10, 12, 12, 5],
  pays: {
    ORION: { 3: 10, 4: 38, 5: 138 },
    STAR: { 3: 7, 4: 25, 5: 92 },
    DICE: { 3: 5, 4: 16, 5: 54 },
    ROUL: { 3: 4, 4: 12, 5: 36 },
    BOLT: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.goldendragon = {
  symbols: ["GDRG", "DRG", "GOLD", "FIRE", "COIN", "A", "K", "SD"],
  weights: [2, 4, 5, 8, 10, 12, 12, 5],
  pays: {
    GDRG: { 3: 12, 4: 45, 5: 160 },
    DRG: { 3: 8, 4: 28, 5: 100 },
    GOLD: { 3: 6, 4: 18, 5: 60 },
    FIRE: { 3: 4, 4: 12, 5: 38 },
    COIN: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.gamevault = {
  symbols: ["VAULT", "SAFE", "KEY", "GEM", "COIN", "A", "K", "SD"],
  weights: [2, 4, 6, 8, 10, 12, 12, 5],
  pays: {
    VAULT: { 3: 10, 4: 36, 5: 132 },
    SAFE: { 3: 7, 4: 25, 5: 90 },
    KEY: { 3: 5, 4: 16, 5: 54 },
    GEM: { 3: 4, 4: 12, 5: 36 },
    COIN: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
slotGameThemes.ultrapanda = {
  symbols: ["ULTRA", "PANDA", "GOLD", "COIN", "STAR", "A", "K", "SD"],
  weights: [2, 4, 6, 8, 10, 12, 12, 5],
  pays: {
    ULTRA: { 3: 11, 4: 40, 5: 145 },
    PANDA: { 3: 8, 4: 28, 5: 100 },
    GOLD: { 3: 5, 4: 16, 5: 56 },
    COIN: { 3: 4, 4: 12, 5: 36 },
    STAR: { 3: 3, 4: 8, 5: 24 },
    A: { 3: 2.5, 4: 6, 5: 18 },
    K: { 3: 2, 4: 5, 5: 14 },
    SD: { 3: 4, 4: 14, 5: 70 },
  },
};
const slotGameSymbols = Object.fromEntries(Object.entries(slotGameThemes).map(([key, theme]) => [key, theme.symbols]));
const slotPaylines = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 2],
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const starterChats = [];

function starterDatabase() {
  return {
    chats: starterChats,
    users: [],
    pointTransactions: [],
    activityLog: [],
    adminSessions: [],
    adminPasswordHash: "",
    adminPasswordResetTokens: [],
    spinSettings: { limits: { ...defaultSpinLimits } },
    spinWheel: { date: currentSpinDateKey(), awards: [] },
    slotSettings: { ...defaultSlotSettings },
    arcadeSlotsConfig: defaultArcadeSlotsConfig(),
    slotPayout: { date: currentSpinDateKey(), paidOut: 0, spins: [] },
    gameHistory: [],
  };
}

function normalizeDatabase(data) {
  const normalized = data && typeof data === "object" ? data : starterDatabase();
  if (!Array.isArray(normalized.chats)) normalized.chats = [];
  if (!Array.isArray(normalized.users)) normalized.users = [];
  if (!Array.isArray(normalized.pointTransactions)) normalized.pointTransactions = [];
  if (!Array.isArray(normalized.activityLog)) normalized.activityLog = [];
  if (!Array.isArray(normalized.gameHistory)) normalized.gameHistory = [];
  if (!Array.isArray(normalized.adminSessions)) normalized.adminSessions = [];
  if (!Array.isArray(normalized.adminPasswordResetTokens)) normalized.adminPasswordResetTokens = [];
  if (typeof normalized.adminPasswordHash !== "string") normalized.adminPasswordHash = "";
  normalized.spinSettings = normalizeSpinSettings(normalized.spinSettings);
  normalized.spinWheel = normalizeSpinWheel(normalized.spinWheel);
  normalized.slotSettings = normalizeSlotSettings(normalized.slotSettings);
  normalized.arcadeSlotsConfig = normalizeArcadeSlotsConfig(normalized.arcadeSlotsConfig);
  normalized.slotPayout = normalizeSlotPayout(normalized.slotPayout);
  const now = Date.now();
  normalized.adminSessions = normalized.adminSessions.filter((session) => {
    const expiresAt = session?.expiresAt ? new Date(session.expiresAt).getTime() : 0;
    return session?.token && expiresAt > now;
  });
  normalized.adminPasswordResetTokens = normalized.adminPasswordResetTokens.filter((reset) => {
    const expiresAt = reset?.expiresAt ? new Date(reset.expiresAt).getTime() : 0;
    return reset?.tokenHash && expiresAt > now;
  });
  normalized.users = normalized.users.map((user) => ({
    ...user,
    points: roundPoints(user.points),
    isVip: Boolean(user.isVip),
    adminNote: user.adminNote || "",
    referralCode: normalizeReferralCode(user.referralCode) || createReferralCode(user),
    referredBy: user.referredBy || null,
    spinLastAt: user.spinLastAt || null,
    playerSessionTokens: Array.isArray(user.playerSessionTokens)
      ? user.playerSessionTokens
      : user.playerSessionToken
        ? [user.playerSessionToken]
        : [],
  }));
  normalized.chats = normalized.chats
    .filter((chat) => !["demo-maya", "demo-andre"].includes(chat.id))
    .map((chat) => ({
      ...chat,
      unreadForAdmin: Number.isFinite(Number(chat.unreadForAdmin)) ? Number(chat.unreadForAdmin) : 0,
      messages: Array.isArray(chat.messages)
        ? chat.messages.map((message, index) => ({
            ...message,
            id:
              message.id ||
              `msg-${chat.id}-${index}-${String(message.createdAt || "old").replace(/[^a-z0-9]/gi, "")}`,
            paymentStatus: message.imageUrl ? message.paymentStatus || "pending" : message.paymentStatus,
          }))
        : [],
    }));
  return normalized;
}

function loadAdminSessions(data) {
  sessions.clear();
  (data.adminSessions || []).forEach((session) => {
    const expiresAt = session?.expiresAt ? new Date(session.expiresAt).getTime() : 0;
    if (session?.token && expiresAt > Date.now()) sessions.set(session.token, expiresAt);
  });
}

function moveChatToTop(chats, chatId) {
  const index = chats.findIndex((chat) => chat.id === chatId);
  if (index <= 0) return;
  const [chat] = chats.splice(index, 1);
  chats.unshift(chat);
}

const playerChatWelcomeText = "Welcome to South Diamond. Please let us know which game you'd like to play, and our team will be happy to assist you.";

function createPlayerWelcomeMessage() {
  const createdAt = new Date().toISOString();
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: "operator",
    text: playerChatWelcomeText,
    createdAt,
  };
}

function ensurePlayerChatThread(data, savedUser) {
  let chat = data.chats.find((item) => item.id === savedUser.chatId) || null;
  if (!chat) {
    chat = {
      id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: savedUser.username,
      userId: savedUser.id,
      unreadForAdmin: 0,
      messages: [createPlayerWelcomeMessage()],
    };
    savedUser.chatId = chat.id;
    data.chats.unshift(chat);
    return chat;
  }

  chat.name = savedUser.username;
  chat.userId = savedUser.id;
  if (!Array.isArray(chat.messages)) chat.messages = [];
  if (!chat.messages.length) chat.messages.push(createPlayerWelcomeMessage());
  return chat;
}

function ensureLocalStorage() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1${pathname}`, {
    ...options,
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase request failed.");
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function ensureDatabase() {
  ensureLocalStorage();
  if (useSupabase) {
    const rows = await supabaseRequest("/app_state?id=eq.main&select=id");
    if (!rows.length) {
      const localData = fs.existsSync(dbPath)
        ? normalizeDatabase(JSON.parse(fs.readFileSync(dbPath, "utf8")))
        : starterDatabase();
      await supabaseRequest("/app_state", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ id: "main", data: localData }),
      });
    }
    return;
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(starterDatabase(), null, 2));
    return;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  let changed = false;
  if (!Array.isArray(data.chats)) {
    data.chats = starterChats;
    changed = true;
  }
  if (!Array.isArray(data.users)) {
    data.users = [];
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }
}

async function readDatabase() {
  await ensureDatabase();
  if (useSupabase) {
    const rows = await supabaseRequest("/app_state?id=eq.main&select=data");
    const data = normalizeDatabase(rows[0]?.data || starterDatabase());
    loadAdminSessions(data);
    return data;
  }

  const data = normalizeDatabase(JSON.parse(fs.readFileSync(dbPath, "utf8")));
  loadAdminSessions(data);
  return data;
}

async function writeDatabase(data) {
  await ensureDatabase();
  const normalized = normalizeDatabase(data);
  loadAdminSessions(normalized);
  if (useSupabase) {
    await supabaseRequest("/app_state?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ id: "main", data: normalized, updated_at: new Date().toISOString() }),
    });
    return;
  }

  fs.writeFileSync(dbPath, JSON.stringify(normalized, null, 2));
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function sendSlotLiveEvent(payload) {
  const event = `data: ${JSON.stringify({ at: Date.now(), ...payload })}\n\n`;
  for (const client of [...slotLiveClients]) {
    try {
      client.write(event);
    } catch (error) {
      slotLiveClients.delete(client);
    }
  }
}

function openSlotLiveStream(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  response.write(`data: ${JSON.stringify({ type: "connected", at: Date.now() })}\n\n`);
  slotLiveClients.add(response);
  const heartbeat = setInterval(() => {
    try {
      response.write(`: keep-alive ${Date.now()}\n\n`);
    } catch (error) {
      clearInterval(heartbeat);
      slotLiveClients.delete(response);
    }
  }, 25000);
  request.on("close", () => {
    clearInterval(heartbeat);
    slotLiveClients.delete(response);
  });
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function sendCsv(response, fileName, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  response.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  response.end(csv);
}

function sendDownloadJson(response, fileName, data) {
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data, null, 2));
}

function addActivity(data, type, text, details = {}) {
  if (!Array.isArray(data.activityLog)) data.activityLog = [];
  data.activityLog.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    text,
    details,
    createdAt: new Date().toISOString(),
  });
  data.activityLog = data.activityLog.slice(0, 300);
}

function currentSpinDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function roundPoints(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
}

function normalizeSpinSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const sourceLimits = source.limits && typeof source.limits === "object" ? source.limits : source;
  return {
    limits: Object.fromEntries(
      Object.entries(defaultSpinLimits).map(([points, fallback]) => {
        const value = Number(sourceLimits[points]);
        return [points, Number.isInteger(value) && value >= 0 ? Math.min(value, 1000) : fallback];
      })
    ),
  };
}

function normalizeSpinWheel(spinWheel) {
  const wheel = spinWheel && typeof spinWheel === "object" ? spinWheel : {};
  return {
    date: typeof wheel.date === "string" && wheel.date ? wheel.date : currentSpinDateKey(),
    awards: Array.isArray(wheel.awards) ? wheel.awards : [],
  };
}

function normalizeSlotSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const limit = roundPoints(source.dailyPayoutLimit ?? defaultSlotSettings.dailyPayoutLimit);
  const playerLimit = roundPoints(source.playerDailyPayoutLimit ?? Math.min(defaultSlotSettings.playerDailyPayoutLimit, limit));
  return {
    dailyPayoutLimit: Math.max(0, Math.min(limit, 100000)),
    playerDailyPayoutLimit: Math.max(0, Math.min(playerLimit, 100000)),
  };
}

function normalizeSlotPayout(slotPayout) {
  const payout = slotPayout && typeof slotPayout === "object" ? slotPayout : {};
  return {
    date: typeof payout.date === "string" && payout.date ? payout.date : currentSpinDateKey(),
    paidOut: roundPoints(payout.paidOut),
    spins: Array.isArray(payout.spins) ? payout.spins : [],
  };
}

function normalizeArcadeGameConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const defaults = defaultArcadeGameConfig();
  const jackpotSource = source.jackpotPool && typeof source.jackpotPool === "object" ? source.jackpotPool : {};
  const minBet = roundPoints(source.minBet ?? defaults.minBet);
  const maxBet = roundPoints(source.maxBet ?? defaults.maxBet);
  return {
    enabled: source.enabled !== false,
    targetRtp: Math.max(0.7, Math.min(Number(source.targetRtp ?? defaults.targetRtp) || defaults.targetRtp, 0.99)),
    dailyMaxPayout: Math.max(0, roundPoints(source.dailyMaxPayout ?? defaults.dailyMaxPayout)),
    dailyMinPayout: Math.max(0, roundPoints(source.dailyMinPayout ?? defaults.dailyMinPayout)),
    minBet: Math.max(0.01, Math.min(minBet, 1000)),
    maxBet: Math.max(0.01, Math.min(Math.max(maxBet, minBet), 1000)),
    jackpotPool: {
      grand: Math.max(0, roundPoints(jackpotSource.grand ?? defaults.jackpotPool.grand)),
      major: Math.max(0, roundPoints(jackpotSource.major ?? defaults.jackpotPool.major)),
      minor: Math.max(0, roundPoints(jackpotSource.minor ?? defaults.jackpotPool.minor)),
      mini: Math.max(0, roundPoints(jackpotSource.mini ?? defaults.jackpotPool.mini)),
    },
  };
}

function normalizeArcadeSlotsConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const defaults = defaultArcadeSlotsConfig();
  const jackpotSource = source.jackpotPool && typeof source.jackpotPool === "object" ? source.jackpotPool : {};
  const games = {};
  for (const key of Object.keys(arcadeSlotGameNames)) {
    games[key] = normalizeArcadeGameConfig({
      ...defaultArcadeGameConfigForKey(key),
      ...(source.games?.[key] || {}),
    });
  }
  return {
    version: 1,
    globalEnabled: source.globalEnabled !== false,
    defaultBet: Math.max(0.01, Math.min(roundPoints(source.defaultBet ?? defaults.defaultBet), 1000)),
    jackpotPool: {
      grand: Math.max(0, roundPoints(jackpotSource.grand ?? defaults.jackpotPool.grand)),
      major: Math.max(0, roundPoints(jackpotSource.major ?? defaults.jackpotPool.major)),
      minor: Math.max(0, roundPoints(jackpotSource.minor ?? defaults.jackpotPool.minor)),
      mini: Math.max(0, roundPoints(jackpotSource.mini ?? defaults.jackpotPool.mini)),
    },
    dailyResetUtcHour: Math.max(0, Math.min(Number(source.dailyResetUtcHour ?? 0) || 0, 23)),
    lastModified: Number(source.lastModified) || Date.now(),
    games,
  };
}

function arcadeTotalDailyMaxPayout(arcadeSlotsConfig) {
  const config = normalizeArcadeSlotsConfig(arcadeSlotsConfig);
  return roundPoints(Object.values(config.games || {}).reduce((total, game) => {
    if (!game || game.enabled === false) return total;
    return total + Math.max(0, roundPoints(game.dailyMaxPayout));
  }, 0));
}

function arcadeTotalDailyMinPayout(arcadeSlotsConfig) {
  const config = normalizeArcadeSlotsConfig(arcadeSlotsConfig);
  return roundPoints(Object.values(config.games || {}).reduce((total, game) => {
    if (!game || game.enabled === false) return total;
    return total + Math.max(0, roundPoints(game.dailyMinPayout));
  }, 0));
}

function arcadeSlotsStatsFromPayout(slotPayout) {
  const payout = normalizeSlotPayout(slotPayout);
  const stats = {
    date: payout.date,
    totalWagered: 0,
    totalWon: 0,
    totalSpins: 0,
    games: Object.fromEntries(
      Object.keys(arcadeSlotGameNames).map((key) => [
        key,
        { wagered: 0, won: 0, spins: 0, lastWinAmount: 0, lastWinAt: 0 },
      ])
    ),
    recentWins: [],
  };
  for (const spin of payout.spins || []) {
    const gameKey = spin.arcadeGameKey || arcadeKeyForLegacySlot(spin.gameKey);
    if (!Object.prototype.hasOwnProperty.call(arcadeSlotGameNames, gameKey)) continue;
    const bet = roundPoints(spin.bet);
    const win = roundPoints(spin.win);
    const createdAt = spin.createdAt ? new Date(spin.createdAt).getTime() : 0;
    const game = stats.games[gameKey];
    game.wagered = roundPoints(game.wagered + bet);
    game.won = roundPoints(game.won + win);
    game.spins += 1;
    stats.totalWagered = roundPoints(stats.totalWagered + bet);
    stats.totalWon = roundPoints(stats.totalWon + win);
    stats.totalSpins += 1;
    if (win > 0) {
      game.lastWinAmount = win;
      game.lastWinAt = Math.max(game.lastWinAt, createdAt || 0);
      stats.recentWins.push({ gameKey, amount: win, wagered: bet, at: createdAt || Date.now() });
    }
  }
  stats.recentWins = stats.recentWins
    .sort((a, b) => b.at - a.at)
    .slice(0, 50);
  return stats;
}

function arcadeGameStatsFromPayout(slotPayout, gameKey) {
  const stats = { wagered: 0, won: 0, spins: 0 };
  const payout = normalizeSlotPayout(slotPayout);
  for (const spin of payout.spins || []) {
    const spinGameKey = spin.arcadeGameKey || arcadeKeyForLegacySlot(spin.gameKey);
    if (spinGameKey !== gameKey) continue;
    stats.wagered = roundPoints(stats.wagered + Math.max(0, roundPoints(spin.bet)));
    stats.won = roundPoints(stats.won + Math.max(0, roundPoints(spin.win)));
    stats.spins += 1;
  }
  return stats;
}

function arcadePayoutMultiplier(gameConfig, gameStats) {
  const cfg = normalizeArcadeGameConfig(gameConfig);
  const stats = gameStats || { wagered: 0, won: 0, spins: 0 };
  let multiplier = 1;
  if (cfg.dailyMaxPayout > 0 && stats.won >= cfg.dailyMaxPayout) {
    multiplier *= 0.35;
  }
  if (stats.spins > 50 && stats.won < cfg.dailyMinPayout && stats.wagered > 0) {
    multiplier *= 1.25;
  }
  if (stats.wagered > 0) {
    const currentRtp = stats.won / stats.wagered;
    if (currentRtp > cfg.targetRtp + 0.05) {
      multiplier *= Math.max(0.15, cfg.targetRtp / Math.max(currentRtp, 0.01));
    } else if (currentRtp < cfg.targetRtp - 0.05) {
      multiplier *= Math.min(1.35, cfg.targetRtp / Math.max(currentRtp, 0.25));
    }
  }
  return Math.max(0, Math.min(multiplier, 1.5));
}

function recalculateSlotPaidOut(slotPayout) {
  const payout = normalizeSlotPayout(slotPayout);
  payout.paidOut = roundPoints((payout.spins || []).reduce((total, spin) => total + Math.max(0, roundPoints(spin.win)), 0));
  return payout;
}

function ensureSlotPayoutToday(data) {
  const today = currentSpinDateKey();
  data.slotSettings = normalizeSlotSettings(data.slotSettings);
  data.slotPayout = normalizeSlotPayout(data.slotPayout);
  if (data.slotPayout.date !== today) {
    data.slotPayout = { date: today, paidOut: 0, spins: [] };
    return true;
  }
  return false;
}

function ensureSpinWheelToday(data) {
  const today = currentSpinDateKey();
  data.spinSettings = normalizeSpinSettings(data.spinSettings);
  data.spinWheel = normalizeSpinWheel(data.spinWheel);
  if (data.spinWheel.date !== today) {
    data.spinWheel = { date: today, awards: [] };
    return true;
  }
  return false;
}

function spinAwardCounts(data) {
  ensureSpinWheelToday(data);
  return (data.spinWheel.awards || []).reduce(
    (counts, award) => {
      const prize = String(Number(award.prize) || 0);
      if (Object.prototype.hasOwnProperty.call(counts, prize)) counts[prize] += 1;
      return counts;
    },
    { 10: 0, 5: 0, 3: 0, 1: 0, 0: 0 }
  );
}

function sanitizeSpinAward(award) {
  return {
    id: award.id,
    userId: award.userId,
    username: award.username,
    prize: Number(award.prize) || 0,
    createdAt: award.createdAt,
  };
}

function spinStatusForUser(data, user) {
  const now = Date.now();
  const lastSpin = user?.spinLastAt ? new Date(user.spinLastAt).getTime() : 0;
  const nextSpinAt = lastSpin ? new Date(lastSpin + spinCooldownMs).toISOString() : null;
  const eligible = !lastSpin || now - lastSpin >= spinCooldownMs;
  return {
    eligible,
    nextSpinAt: eligible ? null : nextSpinAt,
    settings: data.spinSettings,
    counts: spinAwardCounts(data),
  };
}

function pickSpinPrize(data) {
  const limits = normalizeSpinSettings(data.spinSettings).limits;
  const counts = spinAwardCounts(data);
  const available = [0, 0, 0, 0, 1, 1, 3, 5, 10].filter((prize) => {
    if (prize === 0) return true;
    return counts[String(prize)] < limits[String(prize)];
  });
  return available[Math.floor(Math.random() * available.length)] || 0;
}

function calculateSlotWin(result, bet) {
  const counts = result.reduce((map, symbol) => {
    if (symbol === "SD") return map;
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});
  const wilds = result.filter((symbol) => symbol === "SD").length;
  const bestCount = Math.max(0, ...Object.values(counts)) + wilds;
  if (bestCount >= 5) return bet * 25;
  if (bestCount === 4) return bet * 8;
  if (bestCount === 3) return bet * 2;
  if (wilds >= 3) return bet * 3;
  return 0;
}

function createLosingSlotResult(symbols) {
  return symbols.filter((symbol) => symbol !== "SD").slice(0, 5);
}

function pickWeightedSlotSymbol(theme) {
  const symbols = theme.symbols || slotGameThemes.buffalo.symbols;
  const weights = theme.weights || symbols.map(() => 1);
  const total = weights.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || symbols.length;
  let roll = Math.random() * total;
  for (let index = 0; index < symbols.length; index += 1) {
    roll -= Math.max(0, Number(weights[index]) || 0);
    if (roll <= 0) return symbols[index];
  }
  return symbols[symbols.length - 1] || "SD";
}

function spinSlotGrid(theme) {
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => pickWeightedSlotSymbol(theme)));
}

function evaluateSlotGrid(grid, theme, bet) {
  const wins = [];
  let totalWin = 0;
  slotPaylines.forEach((line, lineIndex) => {
    const lineSymbols = line.map((row, reelIndex) => grid?.[reelIndex]?.[row] || "SD");
    const baseSymbol = lineSymbols.find((symbol) => symbol !== "SD") || "SD";
    let matchCount = 0;
    for (const symbol of lineSymbols) {
      if (symbol === baseSymbol || symbol === "SD") {
        matchCount += 1;
      } else {
        break;
      }
    }
    const multiplier = theme.pays?.[baseSymbol]?.[matchCount] || 0;
    if (matchCount >= 3 && multiplier > 0) {
      const amount = roundPoints((bet * multiplier) / 3);
      if (amount > 0) {
        totalWin = roundPoints(totalWin + amount);
        wins.push({
          line: lineIndex + 1,
          symbol: baseSymbol,
          count: matchCount,
          multiplier,
          amount,
          positions: line.slice(0, matchCount),
        });
      }
    }
  });
  return { wins, totalWin };
}

function createLosingSlotGrid(theme, bet) {
  const symbols = (theme.symbols || slotGameThemes.buffalo.symbols).filter((symbol) => symbol !== "SD");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const grid = Array.from({ length: 5 }, (_, reelIndex) =>
      Array.from({ length: 3 }, (_, rowIndex) => symbols[(reelIndex * 2 + rowIndex + attempt) % symbols.length] || "A")
    );
    if (evaluateSlotGrid(grid, theme, bet).totalWin === 0) return grid;
  }
  return Array.from({ length: 5 }, (_, reelIndex) =>
    Array.from({ length: 3 }, (_, rowIndex) => symbols[(reelIndex + rowIndex * 3) % symbols.length] || "A")
  );
}

function slotPayoutForUserToday(data, userId) {
  ensureSlotPayoutToday(data);
  return (data.slotPayout.spins || []).reduce((total, spin) => {
    if (spin.userId !== userId) return total;
    return roundPoints(total + Math.max(0, Number(spin.win) || 0));
  }, 0);
}

function createPointTransaction(user, type, points, note, createdAt = new Date().toISOString()) {
  return {
    id: `points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    username: user.username,
    type,
    points: roundPoints(points),
    balanceAfter: roundPoints(user.points),
    note,
    createdAt,
  };
}

function createAdminCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendAdminEmail({ subject, text, html }) {
  if (!adminLoginEmail || !adminFromEmail) {
    throw new Error("Admin email is not set up. Add ADMIN_LOGIN_EMAIL and ADMIN_FROM_EMAIL in Render.");
  }

  if (brevoApiKey) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "South Diamond",
          email: adminFromEmail,
        },
        to: [{ email: adminLoginEmail, name: "South Diamond Admin" }],
        subject,
        textContent: text,
        htmlContent: html || `<p>${text}</p>`,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Could not send admin email.");
    }
    return;
  }

  if (!resendApiKey) {
    throw new Error("Admin email is not set up. Add RESEND_API_KEY or BREVO_API_KEY in Render.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `South Diamond <${adminFromEmail}>`,
      to: [adminLoginEmail],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not send admin email.");
  }
}

async function sendAdminLoginCode(code) {
  return sendAdminEmail({
    subject: "South Diamond admin login code",
    text: `Your South Diamond admin login code is ${code}. It expires in 5 minutes.`,
    html: `<p>Your South Diamond admin login code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
  });
}

async function createTierlockPaymentUrl(user, amount) {
  if (!tierlockMerchantId || !tierlockMerchantSecret) {
    throw new Error("Tierlock is not set up yet.");
  }

  const total = Number(amount);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Choose a valid payment amount.");
  }

  const orderId = `sd-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const response = await fetch("https://api.tierlock.com/api/generateLinkToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: tierlockMerchantId,
      merchant_secret: tierlockMerchantSecret,
      display_name: "South Diamond",
      total,
      order_id: orderId,
      customer: {
        email: user.email,
        phone: user.phone,
        name: user.username,
      },
    }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.success === false || !data.payment_url) {
    throw new Error(data.error || data.message || "Could not create Tierlock payment link.");
  }

  return { paymentUrl: data.payment_url, orderId };
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((part) => part.length === 2)
  );
}

function isAdminRequest(request) {
  const cookies = parseCookies(request);
  const token = cookies.sd_admin_session;
  const expiresAt = token ? sessions.get(token) : 0;
  if (!token || !expiresAt) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function clientKey(request) {
  return String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function requestOrigin(request) {
  const proto = request.headers["x-forwarded-proto"] || (request.socket.encrypted ? "https" : "http");
  return `${proto}://${request.headers.host}`;
}

function adminLoginInfo(request) {
  const ip = clientKey(request);
  return {
    ip,
    forwardedFor: String(request.headers["x-forwarded-for"] || ip),
    userAgent: String(request.headers["user-agent"] || "Unknown browser"),
    language: String(request.headers["accept-language"] || "Unknown"),
    countryHeader: String(request.headers["cf-ipcountry"] || request.headers["x-vercel-ip-country"] || ""),
    cityHeader: String(request.headers["x-vercel-ip-city"] || ""),
    regionHeader: String(request.headers["x-vercel-ip-country-region"] || ""),
  };
}

function isPrivateIp(ip) {
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1|unknown)/i.test(String(ip || ""));
}

async function lookupIpLocation(ip) {
  if (!ip || isPrivateIp(ip)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.error) return null;
    return [data.city, data.region, data.country_name].filter(Boolean).join(", ");
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendAdminLoginAlert(request) {
  const info = adminLoginInfo(request);
  const headerLocation = [info.cityHeader, info.regionHeader, info.countryHeader].filter(Boolean).join(", ");
  const lookupLocation = await lookupIpLocation(info.ip);
  const locationText = lookupLocation || headerLocation || "Location unavailable";
  const time = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const text = [
    "South Diamond admin login successful.",
    `Time: ${time} ET`,
    `Approximate location: ${locationText}`,
    `IP address: ${info.ip}`,
    `Forwarded IPs: ${info.forwardedFor}`,
    `Browser/device: ${info.userAgent}`,
    `Language: ${info.language}`,
    "",
    "If this was not you, reset your admin password immediately.",
  ].join("\n");
  return sendAdminEmail({
    subject: "South Diamond admin login alert",
    text,
    html: `<p><strong>South Diamond admin login successful.</strong></p>
      <p><strong>Time:</strong> ${time} ET</p>
      <p><strong>Approximate location:</strong> ${locationText}</p>
      <p><strong>IP address:</strong> ${info.ip}</p>
      <p><strong>Browser/device:</strong> ${info.userAgent}</p>
      <p>If this was not you, reset your admin password immediately.</p>`,
  });
}

function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function getLockout(request) {
  const key = clientKey(request);
  const record = adminLoginAttempts.get(key);
  if (!record?.lockedUntil) return null;
  if (Date.now() >= record.lockedUntil) {
    adminLoginAttempts.delete(key);
    return null;
  }
  return record;
}

function recordFailedAdminLogin(request) {
  const key = clientKey(request);
  const record = adminLoginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 5 * 60 * 1000;
  }
  adminLoginAttempts.set(key, record);
  return record;
}

function clearAdminLoginAttempts(request) {
  adminLoginAttempts.delete(clientKey(request));
}

function secureCookiePart(request) {
  const isHttps = request.headers["x-forwarded-proto"] === "https" || request.socket.encrypted;
  return isHttps ? "; Secure" : "";
}

function requireAdmin(request, response) {
  if (isAdminRequest(request)) return true;
  sendJson(response, 401, { error: "Admin login is required." });
  return false;
}

function isAdminOrExportRequest(request, url) {
  return isAdminRequest(request) || (adminExportToken && url.searchParams.get("token") === adminExportToken);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
}

function verifyAdminPassword(password, data) {
  if (data.adminPasswordHash) return verifyPassword(password, data.adminPasswordHash);
  return String(password) === adminPassword;
}

function normalizeReferralCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 18);
}

function createReferralCode(user) {
  const seed = String(user?.id || user?.email || user?.username || `${Date.now()}-${Math.random()}`);
  return `SD${crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8).toUpperCase()}`;
}

function parseDateOfBirth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { date, value: `${match[1]}-${match[2]}-${match[3]}` };
}

function isAtLeast18(dateOfBirth) {
  const parsed = parseDateOfBirth(dateOfBirth);
  if (!parsed) return false;
  const today = new Date();
  let age = today.getUTCFullYear() - parsed.date.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - parsed.date.getUTCMonth();
  const dayDiff = today.getUTCDate() - parsed.date.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 18;
}

function sanitizePointTransaction(transaction) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    username: transaction.username,
    type: transaction.type,
    source: transaction.source || "",
    points: roundPoints(transaction.points),
    balanceAfter: roundPoints(transaction.balanceAfter),
    note: transaction.note || "",
    createdAt: transaction.createdAt,
  };
}

function isAdminPointTransaction(transaction) {
  if (!transaction || transaction.userId == null) return false;
  if (transaction.source === "admin") return true;
  if (transaction.source && transaction.source !== "admin") return false;
  const note = String(transaction.note || "").toLowerCase();
  const legacySlotsName = ["south diamond", "slots"].join(" ");
  const automaticMarkers = [
    "gas gushers",
    "gas gushers arcade",
    legacySlotsName,
    [legacySlotsName, "arcade"].join(" "),
    "daily spin",
    "signup bonus",
    "referral bonus",
  ];
  return !automaticMarkers.some((marker) => note.includes(marker));
}

function sanitizeGameHistorySpin(spin) {
  return {
    id: spin.id,
    userId: spin.userId,
    username: spin.username,
    gameKey: spin.gameKey,
    arcadeGameKey: spin.arcadeGameKey || arcadeKeyForLegacySlot(spin.gameKey),
    gameName: spin.gameName || arcadeSlotGameNames[spin.arcadeGameKey] || slotGameNames[spin.gameKey] || "South Diamond Slots",
    bet: roundPoints(spin.bet),
    win: roundPoints(spin.win),
    requestedWin: spin.requestedWin == null ? null : roundPoints(spin.requestedWin),
    balanceAfter: spin.balanceAfter == null ? null : roundPoints(spin.balanceAfter),
    createdAt: spin.createdAt,
  };
}

function sanitizeActivity(item) {
  return {
    id: item.id,
    type: item.type,
    text: item.text,
    details: item.details || {},
    createdAt: item.createdAt,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    dateOfBirth: user.dateOfBirth || null,
    points: roundPoints(user.points),
    isVip: Boolean(user.isVip),
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt || user.lastLoginAt || user.createdAt,
    chatId: user.chatId || null,
    adminNote: user.adminNote || "",
    referralCode: user.referralCode || createReferralCode(user),
    referredBy: user.referredBy || null,
    spinLastAt: user.spinLastAt || null,
  };
}

function safeUploadName(originalName, mimeType) {
  const extension = path.extname(String(originalName || "")).toLowerCase();
  const fallback = mimeType === "image/png" ? ".png" : ".jpg";
  const safeExtension = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension) ? extension : fallback;
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExtension}`;
}

async function getPlayerUser(request) {
  const cookies = parseCookies(request);
  const token = cookies.sd_player_session;
  if (!token) return null;
  const data = await readDatabase();
  const userId = playerSessions.get(token);
  const user =
    (userId && data.users.find((item) => item.id === userId)) ||
    data.users.find((item) => Array.isArray(item.playerSessionTokens) && item.playerSessionTokens.includes(token));
  if (user) playerSessions.set(token, user.id);
  return user || null;
}

async function requirePlayer(request, response) {
  const user = await getPlayerUser(request);
  if (user) return user;
  sendJson(response, 401, { error: "Player login is required." });
  return null;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    request.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > maxJsonBodyBytes) {
        tooLarge = true;
        request.resume();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      if (tooLarge) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

function publicFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const routeMap = {
    "/": "index.html",
    "/index.html": "index.html",
    [adminPath]: "admin.html",
    [adminMessagesPath]: "admin-messages.html",
    [adminLoginPath]: "login.html",
    "/maintenance": "maintenance.html",
    "/maintenance.html": "maintenance.html",
  };
  const allowedPublicFiles = new Set([
    "/styles.css",
    "/script.js",
    "/slots-arcade.html",
    "/slots-arcade.css",
    "/slots-arcade.js",
    "/slots-config.js",
    "/slots-admin.js",
    "/admin-messages.html",
    "/service-worker.js",
    "/manifest.webmanifest",
    "/admin.webmanifest",
  ]);
  const isAssetPath =
    cleanPath.startsWith("/assets/") ||
    cleanPath.startsWith("/assets-1/") ||
    cleanPath.startsWith("/assets-2/") ||
    cleanPath.startsWith("/assets-3/");
  if (!routeMap[cleanPath] && !allowedPublicFiles.has(cleanPath) && !isAssetPath) {
    return null;
  }
  const filePath = path.join(root, routeMap[cleanPath] || cleanPath.replace(/^\/+/, ""));
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function serveFile(response, filePath, statusCode = 200, cacheControl = "no-store") {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(statusCode, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": cacheControl,
  });
  fs.createReadStream(filePath).pipe(response);
}

async function handleApi(request, response, urlPath, url) {
  if (request.method === "GET" && urlPath === "/api/player/slots/live") {
    openSlotLiveStream(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/admin/login") {
    const lockout = getLockout(request);
    if (lockout) {
      const minutes = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
      return sendJson(response, 429, { error: `Too many wrong attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` });
    }

    const body = await readBody(request);
    const data = await readDatabase();
    if (body.username !== adminUsername || !verifyAdminPassword(body.password, data)) {
      const record = recordFailedAdminLogin(request);
      if (record.lockedUntil && Date.now() < record.lockedUntil) {
        return sendJson(response, 429, { error: "Too many wrong attempts. Admin login is blocked for 5 minutes." });
      }
      return sendJson(response, 401, { error: "Wrong username or password." });
    }

    const code = createAdminCode();
    const pendingLoginId = `admin-login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await sendAdminLoginCode(code);
    } catch (error) {
      return sendJson(response, 500, { error: error.message || "Could not send admin login code." });
    }
    pendingAdminLogins.set(pendingLoginId, {
      code,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return sendJson(response, 200, {
      requiresCode: true,
      pendingLoginId,
      message: "Security code sent to your admin email.",
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/forgot-password") {
    const body = await readBody(request);
    const username = String(body.username || "").trim();
    if (username && username !== adminUsername) {
      return sendJson(response, 200, { ok: true, message: "If the admin account matches, a reset link has been sent." });
    }
    const token = createResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const data = await readDatabase();
    data.adminPasswordResetTokens = [
      {
        tokenHash: tokenHash(token),
        expiresAt,
        createdAt: new Date().toISOString(),
        ip: clientKey(request),
      },
      ...(data.adminPasswordResetTokens || []),
    ].slice(0, 5);
    await writeDatabase(data);
    const resetUrl = `${requestOrigin(request)}${adminLoginPath}?reset=${token}`;
    await sendAdminEmail({
      subject: "South Diamond admin password reset",
      text: `Use this link to reset your South Diamond admin password. It expires in 30 minutes.\n\n${resetUrl}`,
      html: `<p>Use this link to reset your South Diamond admin password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset admin password</a></p>`,
    });
    return sendJson(response, 200, { ok: true, message: "Password reset link sent to your admin email." });
  }

  if (request.method === "POST" && urlPath === "/api/admin/reset-password") {
    const body = await readBody(request);
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!token || password.length < 6) {
      return sendJson(response, 400, { error: "Use the reset link and enter a password with at least 6 characters." });
    }
    const data = await readDatabase();
    const hash = tokenHash(token);
    const reset = (data.adminPasswordResetTokens || []).find((item) => item.tokenHash === hash);
    if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) {
      return sendJson(response, 400, { error: "This reset link is expired. Request a new reset link." });
    }
    data.adminPasswordHash = hashPassword(password);
    data.adminPasswordResetTokens = (data.adminPasswordResetTokens || []).filter((item) => item.tokenHash !== hash);
    data.adminSessions = [];
    addActivity(data, "admin-password-reset", "Admin password was reset by email link", { ip: clientKey(request) });
    await writeDatabase(data);
    sessions.clear();
    return sendJson(response, 200, { ok: true, message: "Admin password reset. You can now log in." });
  }

  if (request.method === "POST" && urlPath === "/api/admin/verify-login") {
    const body = await readBody(request);
    const pendingLoginId = String(body.pendingLoginId || "");
    const code = String(body.code || "").replace(/\D/g, "");
    const pending = pendingAdminLogins.get(pendingLoginId);
    if (!pending) return sendJson(response, 400, { error: "Login code expired. Please log in again." });
    if (Date.now() > pending.expiresAt) {
      pendingAdminLogins.delete(pendingLoginId);
      return sendJson(response, 400, { error: "Login code expired. Please log in again." });
    }
    if (code !== pending.code) {
      pending.attempts += 1;
      if (pending.attempts >= 5) pendingAdminLogins.delete(pendingLoginId);
      return sendJson(response, 401, { error: "Wrong security code." });
    }

    pendingAdminLogins.delete(pendingLoginId);
    clearAdminLoginAttempts(request);
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const data = await readDatabase();
    data.adminSessions = [
      {
        token,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + adminSessionMaxAge * 1000).toISOString(),
        ip: clientKey(request),
        userAgent: String(request.headers["user-agent"] || ""),
      },
      ...(data.adminSessions || []),
    ].slice(0, 10);
    addActivity(data, "admin-login", "Admin logged in", { ip: clientKey(request) });
    await writeDatabase(data);
    sendAdminLoginAlert(request).catch((error) => console.error("Admin login alert failed:", error.message));
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_admin_session=${token}; HttpOnly${secureCookiePart(request)}; SameSite=Lax; Path=/; Max-Age=${adminSessionMaxAge}`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/admin/keepalive") {
    if (!requireAdmin(request, response)) return;
    const cookies = parseCookies(request);
    const data = await readDatabase();
    const session = (data.adminSessions || []).find((item) => item.token === cookies.sd_admin_session);
    if (!session) return sendJson(response, 401, { error: "Admin login is required." });
    const now = new Date();
    session.lastActiveAt = now.toISOString();
    session.expiresAt = new Date(now.getTime() + adminSessionMaxAge * 1000).toISOString();
    await writeDatabase(data);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_admin_session=${cookies.sd_admin_session}; HttpOnly${secureCookiePart(request)}; SameSite=Lax; Path=/; Max-Age=${adminSessionMaxAge}`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/admin/logout") {
    const cookies = parseCookies(request);
    if (cookies.sd_admin_session) sessions.delete(cookies.sd_admin_session);
    const data = await readDatabase();
    data.adminSessions = (data.adminSessions || []).filter((session) => session.token !== cookies.sd_admin_session);
    await writeDatabase(data);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "sd_admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && urlPath === "/api/admin/me") {
    return sendJson(response, isAdminRequest(request) ? 200 : 401, { loggedIn: isAdminRequest(request) });
  }

  if (request.method === "GET" && urlPath === "/api/admin/storage") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, {
      storage: useSupabase ? "supabase" : "local-file",
      users: data.users.length,
      chats: data.chats.length,
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/users") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, { users: data.users.map(sanitizeUser) });
  }

  if (request.method === "POST" && urlPath === "/api/admin/user-chat") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });

    let chat = data.chats.find((item) => item.id === user.chatId) || data.chats.find((item) => item.userId === user.id);
    if (!chat) {
      chat = {
        id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: user.username,
        userId: user.id,
        messages: [],
      };
      data.chats.unshift(chat);
    }

    chat.name = user.username;
    chat.userId = user.id;
    chat.unreadForAdmin = 0;
    chat.lastReadByAdminAt = new Date().toISOString();
    user.chatId = chat.id;
    moveChatToTop(data.chats, chat.id);
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "GET" && urlPath === "/api/admin/points") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, {
      transactions: data.pointTransactions.map(sanitizePointTransaction),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/activity") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, {
      activity: (data.activityLog || []).map(sanitizeActivity),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/spin-wheel") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    const resetToday = ensureSpinWheelToday(data);
    if (resetToday) await writeDatabase(data);
    return sendJson(response, 200, {
      settings: data.spinSettings,
      counts: spinAwardCounts(data),
      date: data.spinWheel.date,
      awards: (data.spinWheel.awards || []).slice(0, 120).map(sanitizeSpinAward),
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/spin-wheel-settings") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const nextSettings = normalizeSpinSettings({ limits: body.limits || body });
    const data = await readDatabase();
    ensureSpinWheelToday(data);
    data.spinSettings = nextSettings;
    addActivity(data, "spin-settings", "Updated daily spin wheel prize limits", { limits: nextSettings.limits });
    await writeDatabase(data);
    return sendJson(response, 200, {
      settings: data.spinSettings,
      counts: spinAwardCounts(data),
      date: data.spinWheel.date,
      awards: (data.spinWheel.awards || []).slice(0, 120).map(sanitizeSpinAward),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/slots-settings") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    const resetToday = ensureSlotPayoutToday(data);
    if (resetToday) await writeDatabase(data);
    return sendJson(response, 200, {
      settings: data.slotSettings,
      payout: data.slotPayout,
      date: data.slotPayout.date,
      spins: (data.slotPayout.spins || []).slice(0, 120),
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/slots-settings") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const data = await readDatabase();
    ensureSlotPayoutToday(data);
    data.slotSettings = normalizeSlotSettings(body);
    addActivity(data, "slots-settings", "Updated South Diamond Slots daily payout limit", data.slotSettings);
    await writeDatabase(data);
    sendSlotLiveEvent({ type: "slot-settings", settings: data.slotSettings });
    return sendJson(response, 200, {
      settings: data.slotSettings,
      payout: data.slotPayout,
      date: data.slotPayout.date,
      spins: (data.slotPayout.spins || []).slice(0, 120),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/slots-arcade-config") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    const resetToday = ensureSlotPayoutToday(data);
    if (resetToday) await writeDatabase(data);
    data.arcadeSlotsConfig = normalizeArcadeSlotsConfig(data.arcadeSlotsConfig);
    return sendJson(response, 200, {
      config: data.arcadeSlotsConfig,
      stats: arcadeSlotsStatsFromPayout(data.slotPayout),
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/slots-arcade-config") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const data = await readDatabase();
    data.arcadeSlotsConfig = normalizeArcadeSlotsConfig(body.config || body);
    data.arcadeSlotsConfig.lastModified = Date.now();
    addActivity(data, "slots-arcade-config", "Updated South Diamond Slots Arcade game controls", {
      globalEnabled: data.arcadeSlotsConfig.globalEnabled,
      games: Object.fromEntries(Object.entries(data.arcadeSlotsConfig.games).map(([key, cfg]) => [key, {
        enabled: cfg.enabled,
        minBet: cfg.minBet,
        maxBet: cfg.maxBet,
        targetRtp: cfg.targetRtp,
      }])),
    });
    await writeDatabase(data);
    sendSlotLiveEvent({
      type: "arcade-config",
      lastModified: data.arcadeSlotsConfig.lastModified,
      defaultBet: data.arcadeSlotsConfig.defaultBet,
    });
    return sendJson(response, 200, {
      config: data.arcadeSlotsConfig,
      stats: arcadeSlotsStatsFromPayout(data.slotPayout),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/slots-arcade-stats") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    const resetToday = ensureSlotPayoutToday(data);
    if (resetToday) await writeDatabase(data);
    return sendJson(response, 200, {
      stats: arcadeSlotsStatsFromPayout(data.slotPayout),
      payout: data.slotPayout,
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/slots-arcade-stats/reset") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const gameKey = Object.prototype.hasOwnProperty.call(arcadeSlotGameNames, body.gameKey) ? String(body.gameKey) : "";
    const data = await readDatabase();
    ensureSlotPayoutToday(data);
    data.slotPayout.spins = (data.slotPayout.spins || []).filter((spin) => {
      const spinGameKey = spin.arcadeGameKey || arcadeKeyForLegacySlot(spin.gameKey);
      const isArcadeSpin = Object.prototype.hasOwnProperty.call(arcadeSlotGameNames, spinGameKey);
      if (!isArcadeSpin) return true;
      return gameKey ? spinGameKey !== gameKey : false;
    });
    data.slotPayout = recalculateSlotPaidOut(data.slotPayout);
    addActivity(data, "slots-arcade-stats-reset", gameKey ? `Reset arcade stats for ${arcadeSlotGameNames[gameKey]}` : "Reset all arcade slot stats", { gameKey: gameKey || null });
    await writeDatabase(data);
    sendSlotLiveEvent({ type: "arcade-stats-reset", gameKey: gameKey || null });
    return sendJson(response, 200, {
      stats: arcadeSlotsStatsFromPayout(data.slotPayout),
      payout: data.slotPayout,
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/points") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const action = String(body.action || "");
    const amount = Number(body.points);
    const note = String(body.note || "").trim();
    if (!userId || !["add", "redeem"].includes(action) || !Number.isInteger(amount) || amount <= 0) {
      return sendJson(response, 400, { error: "Choose a player, action, and whole number of points." });
    }

    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    user.points = Number.isFinite(Number(user.points)) ? Number(user.points) : 0;

    if (action === "redeem" && user.points < amount) {
      return sendJson(response, 400, { error: "Player does not have enough available points." });
    }

    user.points = action === "add" ? user.points + amount : user.points - amount;
    const transaction = {
      id: `points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      username: user.username,
      type: action,
      source: "admin",
      points: amount,
      balanceAfter: user.points,
      note,
      createdAt: new Date().toISOString(),
    };
    data.pointTransactions.unshift(transaction);
    addActivity(
      data,
      action === "add" ? "points-add" : "points-redeem",
      `${action === "add" ? "Added" : "Redeemed"} ${amount} points for ${user.username}`,
      { userId: user.id, username: user.username, points: amount, balanceAfter: user.points }
    );
    await writeDatabase(data);
    return sendJson(response, 200, {
      user: sanitizeUser(user),
      transaction: sanitizePointTransaction(transaction),
      transactions: data.pointTransactions.map(sanitizePointTransaction),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/users.csv") {
    if (!isAdminOrExportRequest(request, url)) {
      return sendJson(response, 401, { error: "Admin login or export token is required." });
    }
    const data = await readDatabase();
    const rows = [
      ["Username", "VIP", "Phone", "Date of Birth", "Email", "Available Points", "Joined", "Last Login", "Chat ID"],
      ...data.users.map((user) => [
        user.username,
        user.isVip ? "Yes" : "No",
        user.phone,
        user.dateOfBirth || "",
        user.email,
        Number.isFinite(Number(user.points)) ? Number(user.points) : 0,
        user.createdAt || "",
        user.lastLoginAt || "",
        user.chatId || "",
      ]),
    ];
    return sendCsv(response, "south-diamond-players.csv", rows);
  }

  if (request.method === "GET" && urlPath === "/api/admin/backup") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendDownloadJson(response, `south-diamond-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
  }

  if (request.method === "GET" && urlPath === "/api/admin/dashboard") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeSince = Date.now() - 24 * 60 * 60 * 1000;
    const users = data.users || [];
    const chats = data.chats || [];
    const messages = chats.flatMap((chat) => chat.messages || []);
    const adminPointTransactions = (data.pointTransactions || []).filter(isAdminPointTransaction);
    return sendJson(response, 200, {
      stats: {
        totalUsers: users.length,
        usersToday: users.filter((user) => new Date(user.createdAt).getTime() >= startOfToday.getTime()).length,
        activePlayers: users.filter((user) => {
          const activeAt = user.lastActiveAt || user.lastLoginAt;
          return activeAt && new Date(activeAt).getTime() >= activeSince;
        }).length,
        openChats: chats.length,
        unreadChats: chats.reduce((total, chat) => total + (Number(chat.unreadForAdmin) || 0), 0),
        totalMessages: messages.length,
        imageUploads: messages.filter((message) => message.imageUrl).length,
        adminAddedPoints: adminPointTransactions
          .filter((transaction) => transaction.type === "add")
          .reduce((total, transaction) => roundPoints(total + (Number(transaction.points) || 0)), 0),
        adminRedeemedPoints: adminPointTransactions
          .filter((transaction) => transaction.type === "redeem")
          .reduce((total, transaction) => roundPoints(total + (Number(transaction.points) || 0)), 0),
      },
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/reset-player-password") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const password = String(body.password || "");
    if (!userId || password.length < 6) {
      return sendJson(response, 400, { error: "Choose a player and enter a password with at least 6 characters." });
    }

    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });

    user.passwordHash = hashPassword(password);
    addActivity(data, "password-reset", `Reset password for ${user.username}`, { userId: user.id, username: user.username });
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "POST" && urlPath === "/api/admin/user-note") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const note = String(body.note || "").trim().slice(0, 1000);
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    user.adminNote = note;
    addActivity(data, "player-note", `Updated notes for ${user.username}`, { userId: user.id, username: user.username });
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "POST" && urlPath === "/api/admin/player-vip") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    user.isVip = Boolean(body.isVip);
    const chat = data.chats.find((item) => item.id === user.chatId || item.userId === user.id);
    if (chat) chat.name = user.username;
    addActivity(data, "vip-player", `${user.isVip ? "Marked" : "Removed"} VIP for ${user.username}`, {
      userId: user.id,
      username: user.username,
      isVip: user.isVip,
    });
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "GET" && urlPath === "/api/admin/player-game-history") {
    if (!requireAdmin(request, response)) return;
    const userId = String(url.searchParams.get("userId") || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    const historyById = new Map();
    [...(data.gameHistory || []), ...(data.slotPayout?.spins || [])].forEach((spin) => {
      if (spin?.userId !== user.id || !spin.id) return;
      historyById.set(spin.id, sanitizeGameHistorySpin(spin));
    });
    const history = [...historyById.values()]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const totals = history.reduce(
      (summary, spin) => {
        summary.spins += 1;
        summary.wagered = roundPoints(summary.wagered + Math.max(0, Number(spin.bet) || 0));
        summary.won = roundPoints(summary.won + Math.max(0, Number(spin.win) || 0));
        return summary;
      },
      { spins: 0, wagered: 0, won: 0 }
    );
    return sendJson(response, 200, { user: sanitizeUser(user), history, totals });
  }

  if (request.method === "GET" && urlPath === "/api/admin/player-points-history") {
    if (!requireAdmin(request, response)) return;
    const userId = String(url.searchParams.get("userId") || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    const transactions = (data.pointTransactions || [])
      .filter((transaction) => transaction.userId === user.id)
      .filter(isAdminPointTransaction)
      .map(sanitizePointTransaction)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const totals = transactions.reduce(
      (summary, transaction) => {
        const points = Math.max(0, Number(transaction.points) || 0);
        if (transaction.type === "redeem") summary.redeemed = roundPoints(summary.redeemed + points);
        else summary.added = roundPoints(summary.added + points);
        summary.net = roundPoints(summary.added - summary.redeemed);
        return summary;
      },
      { added: 0, redeemed: 0, net: 0, currentBalance: roundPoints(user.points) }
    );
    return sendJson(response, 200, { user: sanitizeUser(user), transactions, totals });
  }

  if (request.method === "GET" && urlPath === "/api/player/spin-status") {
    const sessionUser = await requirePlayer(request, response);
    if (!sessionUser) return;
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === sessionUser.id);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    const resetToday = ensureSpinWheelToday(data);
    if (resetToday) await writeDatabase(data);
    return sendJson(response, 200, spinStatusForUser(data, user));
  }

  if (request.method === "POST" && urlPath === "/api/player/spin") {
    const sessionUser = await requirePlayer(request, response);
    if (!sessionUser) return;
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === sessionUser.id);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    ensureSpinWheelToday(data);
    const status = spinStatusForUser(data, user);
    if (!status.eligible) {
      return sendJson(response, 429, {
        error: "Daily spin already used. Come back in 24 hours.",
        ...status,
      });
    }

    const prize = pickSpinPrize(data);
    const createdAt = new Date().toISOString();
    user.spinLastAt = createdAt;
    user.lastActiveAt = createdAt;
    if (!Array.isArray(data.spinWheel.awards)) data.spinWheel.awards = [];
    const award = {
      id: `spin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      username: user.username,
      prize,
      createdAt,
    };
    data.spinWheel.awards.unshift(award);
    data.spinWheel.awards = data.spinWheel.awards.slice(0, 500);

    let transaction = null;
    if (prize > 0) {
      user.points = (Number(user.points) || 0) + prize;
      transaction = {
        id: `points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        username: user.username,
        type: "add",
        points: prize,
        balanceAfter: user.points,
        note: "Daily spin wheel reward",
        createdAt,
      };
      data.pointTransactions.unshift(transaction);
    }

    addActivity(
      data,
      "daily-spin",
      prize > 0 ? `${user.username} won ${prize} points on the daily spin` : `${user.username} spun better luck next time`,
      { userId: user.id, username: user.username, prize }
    );
    await writeDatabase(data);
    return sendJson(response, 200, {
      prize,
      label: prize > 0 ? `${prize} points` : "Better luck next time",
      user: sanitizeUser(user),
      transaction: transaction ? sanitizePointTransaction(transaction) : null,
      ...spinStatusForUser(data, user),
    });
  }

  if (request.method === "POST" && urlPath === "/api/player/slots/spin") {
    const sessionUser = await requirePlayer(request, response);
    if (!sessionUser) return;
    const body = await readBody(request);
    const gameKey = Object.prototype.hasOwnProperty.call(slotGameSymbols, body.gameKey) ? String(body.gameKey) : "diamond777";
    const bet = roundPoints(body.bet);

    const data = await readDatabase();
    ensureSlotPayoutToday(data);
    data.arcadeSlotsConfig = normalizeArcadeSlotsConfig(data.arcadeSlotsConfig);
    const arcadeGameKey = arcadeKeyForLegacySlot(gameKey);
    const arcadeGameConfig = data.arcadeSlotsConfig.games[arcadeGameKey] || defaultArcadeGameConfig();
    if (!data.arcadeSlotsConfig.globalEnabled || arcadeGameConfig.enabled === false) {
      return sendJson(response, 403, { error: "This slot game is currently turned off by admin." });
    }
    if (!Number.isFinite(bet) || bet < arcadeGameConfig.minBet || bet > arcadeGameConfig.maxBet) {
      return sendJson(response, 400, {
        error: `Bet must be between ${arcadeGameConfig.minBet} and ${arcadeGameConfig.maxBet} points for this game.`,
        minBet: arcadeGameConfig.minBet,
        maxBet: arcadeGameConfig.maxBet,
      });
    }
    const user = data.users.find((item) => item.id === sessionUser.id);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    user.points = roundPoints(user.points);
    if (user.points < bet) {
      return sendJson(response, 400, { error: "Not enough available points for that bet.", user: sanitizeUser(user) });
    }

    const createdAt = new Date().toISOString();
    const theme = slotGameThemes[gameKey] || slotGameThemes.diamond777;
    const arcadeGameStats = arcadeGameStatsFromPayout(data.slotPayout, arcadeGameKey);
    const gamePaidToday = arcadeGameStats.won;
    const remainingGamePayout = Math.max(0, roundPoints(arcadeGameConfig.dailyMaxPayout - gamePaidToday));
    const payoutMultiplier = arcadePayoutMultiplier(arcadeGameConfig, arcadeGameStats);
    let grid = [];
    let result = [];
    let wins = [];
    let bonus = null;
    let win = 0;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      grid = spinSlotGrid(theme);
      const evaluation = evaluateSlotGrid(grid, theme, bet);
      wins = evaluation.wins;
      const bonusWin = Math.random() < 0.015 ? roundPoints(bet * 5) : 0;
      bonus = bonusWin > 0 ? { label: "South Diamond bonus", amount: bonusWin } : null;
      win = roundPoints((evaluation.totalWin + bonusWin) * payoutMultiplier);
      if (win <= 0) wins = [];
      if (!win) bonus = null;
      break;
    }
    result = grid.map((reel) => reel[1] || reel[0] || "SD");
    const transactions = [];

    user.points = roundPoints(user.points - bet);
    const betTransaction = createPointTransaction(user, "redeem", bet, `South Diamond Slots spin - ${slotGameNames[gameKey]}`, createdAt);
    data.pointTransactions.unshift(betTransaction);
    transactions.push(betTransaction);

    if (win > 0) {
      user.points = roundPoints(user.points + win);
      const winTransaction = createPointTransaction(user, "add", win, `South Diamond Slots win - ${slotGameNames[gameKey]}`, createdAt);
      data.pointTransactions.unshift(winTransaction);
      transactions.push(winTransaction);
    }

    user.lastActiveAt = createdAt;
    data.slotPayout.paidOut = roundPoints(data.slotPayout.paidOut + win);
    const spinRecord = {
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      username: user.username,
      gameKey,
      arcadeGameKey,
      gameName: slotGameNames[gameKey],
      bet,
      win,
      result,
      grid,
      wins,
      bonus,
      balanceAfter: user.points,
      createdAt,
    };
    data.slotPayout.spins.unshift(spinRecord);
    data.gameHistory = Array.isArray(data.gameHistory) ? data.gameHistory : [];
    data.gameHistory.unshift(spinRecord);
    data.slotPayout.spins = data.slotPayout.spins.slice(0, 500);
    addActivity(data, "slots-spin", `${user.username} opened ${slotGameNames[gameKey]} for ${bet} points${win ? ` and earned ${win}` : ""}`, {
      userId: user.id,
      username: user.username,
      gameKey,
      bet,
      win,
      result,
      grid,
      wins,
      bonus,
      balanceAfter: user.points,
      remainingPayout: Math.max(0, roundPoints(arcadeTotalDailyMaxPayout(data.arcadeSlotsConfig) - arcadeSlotsStatsFromPayout(data.slotPayout).totalWon)),
      remainingPlayerPayout: Math.max(0, roundPoints(arcadeTotalDailyMaxPayout(data.arcadeSlotsConfig) - arcadeSlotsStatsFromPayout(data.slotPayout).totalWon)),
    });
    await writeDatabase(data);
    return sendJson(response, 200, {
      gameKey,
      result,
      grid,
      wins,
      bonus,
      bet,
      win,
      remainingPayout: Math.max(0, roundPoints(arcadeTotalDailyMaxPayout(data.arcadeSlotsConfig) - arcadeSlotsStatsFromPayout(data.slotPayout).totalWon)),
      remainingPlayerPayout: Math.max(0, roundPoints(arcadeTotalDailyMaxPayout(data.arcadeSlotsConfig) - arcadeSlotsStatsFromPayout(data.slotPayout).totalWon)),
      remainingGamePayout: Math.max(0, roundPoints(arcadeGameConfig.dailyMaxPayout - gamePaidToday - win)),
      user: sanitizeUser(user),
      transactions: transactions.map(sanitizePointTransaction),
    });
  }

  if (request.method === "POST" && urlPath === "/api/player/slots/arcade-spin") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const gameKey = Object.prototype.hasOwnProperty.call(arcadeSlotGameNames, body.gameKey) ? String(body.gameKey) : "";
    const bet = roundPoints(body.bet);
    const requestedWin = roundPoints(body.win);

    if (!gameKey) {
      return sendJson(response, 400, { error: "Arcade game was not recognized." });
    }
    if (!Number.isFinite(bet) || bet < 0.05 || bet > 1000) {
      return sendJson(response, 400, { error: "Choose a valid slot bet." });
    }
    if (!Number.isFinite(requestedWin) || requestedWin < 0 || requestedWin > 100000) {
      return sendJson(response, 400, { error: "Slot win amount was not valid." });
    }

    const data = await readDatabase();
    data.arcadeSlotsConfig = normalizeArcadeSlotsConfig(data.arcadeSlotsConfig);
    const arcadeGameConfig = data.arcadeSlotsConfig.games[gameKey];
    if (!data.arcadeSlotsConfig.globalEnabled || arcadeGameConfig?.enabled === false) {
      return sendJson(response, 403, { error: "This arcade game is currently turned off by admin." });
    }
    if (bet < arcadeGameConfig.minBet || bet > arcadeGameConfig.maxBet) {
      return sendJson(response, 400, {
        error: `Bet must be between ${arcadeGameConfig.minBet} and ${arcadeGameConfig.maxBet} points for this game.`,
        minBet: arcadeGameConfig.minBet,
        maxBet: arcadeGameConfig.maxBet,
      });
    }
    const storedUser = data.users.find((item) => item.id === user.id);
    if (!storedUser) return sendJson(response, 401, { error: "Player login is required." });
    if ((Number(storedUser.points) || 0) < bet) {
      return sendJson(response, 400, { error: "Not enough South Diamond points for that bet." });
    }

    ensureSlotPayoutToday(data);
    const arcadeGameStats = arcadeGameStatsFromPayout(data.slotPayout, gameKey);
    const gamePaidToday = arcadeGameStats.won;
    const remainingGamePayout = Math.max(0, roundPoints(arcadeGameConfig.dailyMaxPayout - gamePaidToday));
    const payoutMultiplier = arcadePayoutMultiplier(arcadeGameConfig, arcadeGameStats);
    const adjustedWin = roundPoints(requestedWin * payoutMultiplier);
    const win = adjustedWin;
    const createdAt = new Date().toISOString();
    const transactions = [];

    storedUser.points = roundPoints((Number(storedUser.points) || 0) - bet);
    const betTransaction = createPointTransaction(
      storedUser,
      "redeem",
      bet,
      `South Diamond Slots spin - ${arcadeSlotGameNames[gameKey]}`,
      createdAt
    );
    data.pointTransactions.unshift(betTransaction);
    transactions.push(betTransaction);

    if (win > 0) {
      storedUser.points = roundPoints((Number(storedUser.points) || 0) + win);
      const winTransaction = createPointTransaction(
        storedUser,
        "add",
        win,
        `South Diamond Slots win - ${arcadeSlotGameNames[gameKey]}`,
        createdAt
      );
      data.pointTransactions.unshift(winTransaction);
      transactions.push(winTransaction);
    }

    storedUser.lastActiveAt = createdAt;
    data.slotPayout.paidOut = roundPoints(data.slotPayout.paidOut + win);
    const spinRecord = {
      id: `slot-arcade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: storedUser.id,
      username: storedUser.username,
      gameKey,
      arcadeGameKey: gameKey,
      gameName: arcadeSlotGameNames[gameKey],
      bet,
      win,
      requestedWin,
      balanceAfter: storedUser.points,
      createdAt,
    };
    data.slotPayout.spins.unshift(spinRecord);
    data.gameHistory = Array.isArray(data.gameHistory) ? data.gameHistory : [];
    data.gameHistory.unshift(spinRecord);
    data.slotPayout.spins = data.slotPayout.spins.slice(0, 500);
    addActivity(
      data,
      "slots-arcade-spin",
      `${storedUser.username} opened ${arcadeSlotGameNames[gameKey]} for ${bet} points${win ? ` and earned ${win}` : ""}`,
      { userId: storedUser.id, username: storedUser.username, gameKey, bet, win, requestedWin }
    );
    await writeDatabase(data);
    playerSessions.forEach((userId, token) => {
      if (userId === storedUser.id) playerSessions.set(token, storedUser.id);
    });

    return sendJson(response, 200, {
      gameKey,
      bet,
      win,
      requestedWin,
      capped: win < requestedWin,
      remainingPayout: Math.max(0, roundPoints(arcadeTotalDailyMaxPayout(data.arcadeSlotsConfig) - arcadeSlotsStatsFromPayout(data.slotPayout).totalWon)),
      remainingPlayerPayout: Math.max(0, roundPoints(arcadeTotalDailyMaxPayout(data.arcadeSlotsConfig) - arcadeSlotsStatsFromPayout(data.slotPayout).totalWon)),
      remainingGamePayout: Math.max(0, roundPoints(arcadeGameConfig.dailyMaxPayout - gamePaidToday - win)),
      user: sanitizeUser(storedUser),
      transactions: transactions.map(sanitizePointTransaction),
    });
  }

  if (request.method === "GET" && urlPath === "/api/player/slots/arcade-config") {
    const data = await readDatabase();
    const resetToday = ensureSlotPayoutToday(data);
    if (resetToday) await writeDatabase(data);
    data.arcadeSlotsConfig = normalizeArcadeSlotsConfig(data.arcadeSlotsConfig);
    return sendJson(response, 200, {
      config: data.arcadeSlotsConfig,
      stats: arcadeSlotsStatsFromPayout(data.slotPayout),
    });
  }

  if (request.method === "POST" && urlPath === "/api/player/signup") {
    const body = await readBody(request);
    const username = String(body.username || "").trim();
    const phone = String(body.phone || "").trim();
    const parsedDateOfBirth = parseDateOfBirth(body.dateOfBirth);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const referralCode = normalizeReferralCode(body.referralCode);

    if (!username || !phone || !parsedDateOfBirth || !email || !password) {
      return sendJson(response, 400, { error: "Username, phone number, date of birth, email, and password are required." });
    }
    if (!isAtLeast18(parsedDateOfBirth.value)) {
      return sendJson(response, 403, { error: "You must be 18 or older to create a South Diamond account." });
    }
    if (password.length < 6) {
      return sendJson(response, 400, { error: "Password must be at least 6 characters." });
    }

    const data = await readDatabase();
    if (data.users.some((user) => user.email === email)) {
      return sendJson(response, 409, { error: "An account with this email already exists." });
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const referrer = referralCode
      ? data.users.find((item) => normalizeReferralCode(item.referralCode) === referralCode && item.email !== email)
      : null;
    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username,
      phone,
      email,
      dateOfBirth: parsedDateOfBirth.value,
      points: signupBonusPoints,
      isVip: false,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      playerSessionTokens: [token],
      chatId: null,
      referredBy: referrer?.id || null,
    };
    user.referralCode = createReferralCode(user);
    data.users.unshift(user);
    addActivity(data, "signup", `New player registered: ${user.username}`, { userId: user.id, username: user.username, email: user.email });
    const signupBonusTransaction = createPointTransaction(user, "add", signupBonusPoints, "Signup bonus - free starter points", user.createdAt);
    data.pointTransactions.unshift(signupBonusTransaction);
    addActivity(data, "signup-bonus", `Added ${signupBonusPoints} signup bonus points to ${user.username}`, {
      userId: user.id,
      username: user.username,
      points: signupBonusPoints,
    });
    if (referrer) {
      referrer.points = (Number(referrer.points) || 0) + referralBonusPoints;
      const referralTransaction = {
        id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: referrer.id,
        username: referrer.username,
        type: "add",
        points: referralBonusPoints,
        balanceAfter: referrer.points,
        note: `Referral bonus for inviting ${user.username}`,
        createdAt: new Date().toISOString(),
      };
      data.pointTransactions.unshift(referralTransaction);
      addActivity(data, "referral-bonus", `Added ${referralBonusPoints} referral points to ${referrer.username}`, {
        userId: referrer.id,
        username: referrer.username,
        referredUserId: user.id,
        referredUsername: user.username,
        points: referralBonusPoints,
      });
    }
    await writeDatabase(data);

    playerSessions.set(token, user.id);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_player_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${playerSessionMaxAge}`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/player/login") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(response, 401, { error: "Wrong email or password." });
    }

    user.lastLoginAt = new Date().toISOString();
    user.lastActiveAt = user.lastLoginAt;

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    user.playerSessionTokens = Array.isArray(user.playerSessionTokens) ? user.playerSessionTokens : [];
    user.playerSessionTokens = [...new Set([...user.playerSessionTokens, token])].slice(-8);
    await writeDatabase(data);

    playerSessions.set(token, user.id);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_player_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${playerSessionMaxAge}`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/player/logout") {
    const cookies = parseCookies(request);
    const token = cookies.sd_player_session;
    if (token) {
      playerSessions.delete(token);
      const data = await readDatabase();
      const user = data.users.find((item) => Array.isArray(item.playerSessionTokens) && item.playerSessionTokens.includes(token));
      if (user) {
        user.playerSessionTokens = user.playerSessionTokens.filter((item) => item !== token);
        await writeDatabase(data);
      }
    }
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "sd_player_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && urlPath === "/api/player/me") {
    const loggedInUser = await getPlayerUser(request);
    if (!loggedInUser) return sendJson(response, 401, { user: null });
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === loggedInUser.id);
    if (!user) return sendJson(response, 401, { user: null });
    const now = Date.now();
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    if (!lastActive || now - lastActive > 60 * 1000) {
      user.lastActiveAt = new Date(now).toISOString();
      await writeDatabase(data);
    }
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "GET" && urlPath === "/api/player/chat") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    const chat = ensurePlayerChatThread(data, savedUser);
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "GET" && urlPath === "/api/player/points") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const data = await readDatabase();
    const transactions = (data.pointTransactions || [])
      .filter((transaction) => transaction.userId === user.id)
      .map(sanitizePointTransaction);
    return sendJson(response, 200, { transactions });
  }

  if (request.method === "POST" && urlPath === "/api/player/reset-password") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || password.length < 6) {
      return sendJson(response, 400, { error: "Enter your email and a new password with at least 6 characters." });
    }

    const data = await readDatabase();
    const user = data.users.find((item) => item.email === email);
    if (!user) return sendJson(response, 404, { error: "No account was found for that email." });

    user.passwordHash = hashPassword(password);
    await writeDatabase(data);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "POST" && urlPath === "/api/player/profile") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    if (!phone) return sendJson(response, 400, { error: "Phone number is required." });
    if (password && password.length < 6) return sendJson(response, 400, { error: "Password must be at least 6 characters." });

    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    savedUser.phone = phone;
    if (password) savedUser.passwordHash = hashPassword(password);
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(savedUser) });
  }

  if (request.method === "POST" && urlPath === "/api/player/tierlock-payment") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    try {
      const payment = await createTierlockPaymentUrl(user, body.amount);
      return sendJson(response, 200, payment);
    } catch (error) {
      return sendJson(response, 400, { error: error.message || "Could not create Tierlock payment link." });
    }
  }

  if (request.method === "POST" && urlPath === "/api/player/avatar") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const imageData = String(body.imageData || "");
    const mimeType = String(body.mimeType || "");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType) || !imageData) {
      return sendJson(response, 400, { error: "Upload a valid image file." });
    }

    const base64 = imageData.includes(",") ? imageData.split(",").pop() : imageData;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 3_000_000) return sendJson(response, 400, { error: "Profile image must be under 3 MB." });

    await ensureDatabase();
    const fileName = safeUploadName(body.fileName, mimeType);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    savedUser.avatarUrl = `/uploads/${fileName}`;
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(savedUser) });
  }

  if (request.method === "GET" && urlPath === "/api/chats") {
    if (!requireAdmin(request, response)) return;
    return sendJson(response, 200, { chats: (await readDatabase()).chats });
  }

  if (request.method === "POST" && urlPath === "/api/admin/chats/read") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    const data = await readDatabase();
    const chat = data.chats.find((item) => item.id === threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });
    chat.unreadForAdmin = 0;
    chat.lastReadByAdminAt = new Date().toISOString();
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "POST" && urlPath === "/api/admin/payment-status") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    const messageId = String(body.messageId || "");
    const status = String(body.status || "");
    if (!threadId || !messageId || !["pending", "approved", "rejected"].includes(status)) {
      return sendJson(response, 400, { error: "Choose a payment screenshot and status." });
    }
    const data = await readDatabase();
    const chat = data.chats.find((item) => item.id === threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });
    const message = (chat.messages || []).find((item) => item.id === messageId && item.imageUrl);
    if (!message) return sendJson(response, 404, { error: "Payment screenshot was not found." });
    message.paymentStatus = status;
    addActivity(data, "payment-status", `Marked ${chat.name}'s payment ${status}`, { threadId, messageId, status, username: chat.name });
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-message") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    if (!text) return sendJson(response, 400, { error: "Message is required." });

    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    const chat = ensurePlayerChatThread(data, savedUser);
    chat.messages.push({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, author: "player", text, createdAt: new Date().toISOString() });
    chat.unreadForAdmin = (Number(chat.unreadForAdmin) || 0) + 1;
    moveChatToTop(data.chats, chat.id);
    await writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-upload") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const imageData = String(body.imageData || "");
    const mimeType = String(body.mimeType || "");
    const note = String(body.note || "").trim();
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType) || !imageData) {
      return sendJson(response, 400, { error: "Upload a valid image file." });
    }

    const base64 = imageData.includes(",") ? imageData.split(",").pop() : imageData;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 5_000_000) return sendJson(response, 400, { error: "Image must be under 5 MB." });

    await ensureDatabase();
    const fileName = safeUploadName(body.fileName, mimeType);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    let chat = data.chats.find((item) => item.id === savedUser.chatId);
    if (!chat) {
      chat = {
        id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: savedUser.username,
        userId: savedUser.id,
        messages: [],
      };
      savedUser.chatId = chat.id;
      data.chats.unshift(chat);
    }

    chat.messages.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: "player",
      text: note || "Payment screenshot attached.",
      imageUrl: `/uploads/${fileName}`,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    });
    chat.unreadForAdmin = (Number(chat.unreadForAdmin) || 0) + 1;
    moveChatToTop(data.chats, chat.id);
    await writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/operator-message") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    if (!text || !body.threadId) return sendJson(response, 400, { error: "Thread and message are required." });

    const data = await readDatabase();
    const chat = data.chats.find((item) => item.id === body.threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });

    chat.messages.push({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, author: "operator", text, createdAt: new Date().toISOString() });
    chat.unreadForAdmin = 0;
    chat.lastReadByAdminAt = new Date().toISOString();
    addActivity(data, "chat-reply", `Replied to ${chat.name}`, { threadId: chat.id, username: chat.name });
    await writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/admin/broadcast") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const text = String(body.message || "").trim().slice(0, 1000);
    const userIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.map((id) => String(id)))] : [];
    if (!text) return sendJson(response, 400, { error: "Broadcast message is required." });
    if (!userIds.length) return sendJson(response, 400, { error: "Choose at least one player." });

    const data = await readDatabase();
    const selectedUsers = data.users.filter((user) => userIds.includes(user.id));
    if (!selectedUsers.length) return sendJson(response, 404, { error: "No matching players were found." });

    const createdAt = new Date().toISOString();
    selectedUsers.forEach((user, index) => {
      const chat = ensurePlayerChatThread(data, user);
      chat.messages.push({
        id: `msg-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        author: "operator",
        text,
        createdAt,
        broadcast: true,
      });
      chat.lastReadByAdminAt = createdAt;
      moveChatToTop(data.chats, chat.id);
    });
    addActivity(data, "broadcast", `Broadcast sent to ${selectedUsers.length} players`, {
      count: selectedUsers.length,
      userIds: selectedUsers.map((user) => user.id),
    });
    await writeDatabase(data);
    return sendJson(response, 200, { sent: selectedUsers.length, chats: data.chats });
  }

  if (request.method === "DELETE" && urlPath === "/api/chats") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    if (!threadId) return sendJson(response, 400, { error: "Choose a chat to delete." });

    const data = await readDatabase();
    data.chats = data.chats.filter((chat) => chat.id !== threadId);
    data.users = data.users.map((user) => (user.chatId === threadId ? { ...user, chatId: null } : user));
    addActivity(data, "chat-delete", "Deleted a selected chat", { threadId });
    await writeDatabase(data);
    return sendJson(response, 200, { chats: data.chats });
  }

  return sendJson(response, 404, { error: "API route was not found." });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname, url);
      return;
    }

    const isPublicAsset =
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/assets-1/") ||
      url.pathname.startsWith("/assets-2/") ||
      url.pathname.startsWith("/assets-3/") ||
      url.pathname === "/styles.css" ||
      url.pathname === "/script.js" ||
      url.pathname === "/slots-arcade.html" ||
      url.pathname === "/slots-arcade.css" ||
      url.pathname === "/slots-arcade.js" ||
      url.pathname === "/slots-config.js" ||
      url.pathname === "/slots-admin.js" ||
      url.pathname === "/service-worker.js" ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/admin.webmanifest";
    const isAdminRoute = url.pathname === adminPath || url.pathname === adminMessagesPath || url.pathname === adminLoginPath;
    if (maintenanceMode && !isAdminRoute && !isPublicAsset && !url.pathname.startsWith("/uploads/")) {
      const maintenancePath = publicFilePath("/maintenance.html");
      if (maintenancePath && fs.existsSync(maintenancePath)) {
        serveFile(response, maintenancePath, 503);
        return;
      }
    }

    if (url.pathname.startsWith("/uploads/")) {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(uploadDir, fileName);
      if (!fs.existsSync(filePath)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
      });
      fs.createReadStream(filePath).pipe(response);
      return;
    }

    if (["/admin", "/admin.html", "/admin-messages.html", "/login.html"].includes(url.pathname)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    if ((url.pathname === adminPath || url.pathname === adminMessagesPath) && !isAdminRequest(request)) {
      response.writeHead(302, { Location: adminLoginPath });
      response.end();
      return;
    }

    if (url.pathname === adminLoginPath && isAdminRequest(request)) {
      response.writeHead(302, { Location: adminPath });
      response.end();
      return;
    }

    const filePath = publicFilePath(url.pathname);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    serveFile(response, filePath);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
}

ensureDatabase()
  .then(readDatabase)
  .then(() => {
    http.createServer(handleRequest).listen(port, () => {
      console.log(`South Diamond server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("South Diamond could not start:", error.message);
    process.exit(1);
  });
