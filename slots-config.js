/* ============================================================
 * SOUTH DIAMOND SLOTS CONFIG - Shared by admin + arcade
 * ============================================================
 * - Stored on the server so admin writes and arcade/player pages read
 * - localStorage remains only as a same-browser fallback
 * ============================================================ */
(function (global) {
  "use strict";

  const STORAGE_KEY = "sd_slots_admin_v1";
  const STATS_KEY = "sd_slots_stats_v1";
  let serverConfig = null;
  let serverStats = null;

  // List of game keys + display titles (kept in sync with slots-arcade.js GAMES)
  const GAME_LIST = [
    { key: "wildBuffalo",     title: "Wild Buffalo",       theme: "buffalo"   },
    { key: "kingKong",        title: "King Kong",          theme: "kingkong"  },
    { key: "triple777",       title: "Triple 777",         theme: "triple777" },
    { key: "blackjack",       title: "Black Jack Slots",   theme: "blackjack" },
    { key: "gorillaGold",     title: "Gorilla Gold",       theme: "gorilla"   },
    { key: "goldWolf",        title: "Gold Wolf",          theme: "wolf"      },
    { key: "wildBull",        title: "Wild Bull",          theme: "bull"      },
    { key: "dragonEmpress",   title: "Dragon Empress",     theme: "dragon"    },
    { key: "mammothRush",     title: "Mammoth Rush",       theme: "mammoth"   },
    { key: "pharaoh",         title: "Pharaoh's Riches",   theme: "pharaoh"   },
    { key: "oceanTreasure",   title: "Ocean Treasure",     theme: "ocean"     },
    { key: "vegas7s",         title: "Vegas 7s",           theme: "vegas"     },
    { key: "luckyPanda",      title: "Lucky Panda 88",     theme: "panda88"   },
    { key: "lionsPride",      title: "Lion's Pride",       theme: "lion"      },
    { key: "piratesTreasure", title: "Pirate's Treasure",  theme: "pirate"    },
    { key: "zeusThunder",     title: "Zeus Thunder",       theme: "zeus"      },
    { key: "cleopatra",       title: "Cleopatra Diamonds", theme: "cleopatra" },
    { key: "frozenRiches",    title: "Frozen Riches",      theme: "arctic"    },
    { key: "galaxyStars",     title: "Galaxy Stars",       theme: "galaxy"    },
    { key: "fruitMania",      title: "Fruit Mania",        theme: "fruit"     },
    { key: "vikingGlory",     title: "Viking Glory",       theme: "viking"    },
    { key: "aztecEmpire",     title: "Aztec Empire",       theme: "aztec"     },
    { key: "halloweenHunt",   title: "Halloween Hunt",     theme: "halloween" },
    { key: "luckyCharms",     title: "Lucky Charms",       theme: "irish"     },
  ];

  const GAME_DEFAULT_OVERRIDES = {
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

  function defaultGameConfig(gameKey) {
    return {
      enabled: true,
      targetRtp: 0.92,
      dailyMaxPayout: 1000,
      dailyMinPayout: 50,
      maxBet: 10,
      minBet: 0.05,
      jackpotPool: { grand: 1500, major: 500, minor: 100, mini: 20 },
      ...(GAME_DEFAULT_OVERRIDES[gameKey] || {}),
    };
  }

  function defaultConfig() {
    const cfg = {
      version: 1,
      globalEnabled: true,
      defaultBet: 0.25,
      jackpotPool: { grand: 1500, major: 500, minor: 100, mini: 20 },
      dailyResetUtcHour: 0,
      lastModified: Date.now(),
      games: {},
    };
    for (const g of GAME_LIST) {
      cfg.games[g.key] = defaultGameConfig(g.key);
    }
    return cfg;
  }

  function defaultStats() {
    const stats = {
      date: todayKey(),
      totalWagered: 0,
      totalWon: 0,
      totalSpins: 0,
      games: {},
      recentWins: [],
    };
    for (const g of GAME_LIST) {
      stats.games[g.key] = { wagered: 0, won: 0, spins: 0, lastWinAmount: 0, lastWinAt: 0 };
    }
    return stats;
  }

  function todayKey() {
    const d = new Date();
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
  }

  function load() {
    if (serverConfig) return mergeConfig(serverConfig);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultConfig();
      const parsed = JSON.parse(raw);
      return mergeConfig(parsed);
    } catch (err) {
      return defaultConfig();
    }
  }

  function mergeConfig(config) {
    const parsed = config && typeof config === "object" ? config : {};
    const def = defaultConfig();
    parsed.jackpotPool = {
      ...def.jackpotPool,
      ...(parsed.jackpotPool || {}),
    };
    parsed.games = parsed.games || {};
    for (const g of GAME_LIST) {
      parsed.games[g.key] = { ...def.games[g.key], ...(parsed.games[g.key] || {}) };
      parsed.games[g.key].jackpotPool = {
        ...def.games[g.key].jackpotPool,
        ...(parsed.games[g.key].jackpotPool || {}),
      };
    }
    return { ...def, ...parsed, games: parsed.games };
  }

  function save(cfg) {
    try {
      cfg.lastModified = Date.now();
      serverConfig = mergeConfig(cfg);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return true;
    } catch (err) { return false; }
  }

  async function refreshFromServer({ admin = false } = {}) {
    const endpoint = admin ? "/api/admin/slots-arcade-config" : "/api/player/slots/arcade-config";
    const response = await fetch(endpoint, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("Could not load slots arcade controls.");
    const data = await response.json();
    if (!data.config) throw new Error("Admin login is required to load live slots arcade controls.");
    serverConfig = mergeConfig(data.config || data);
    if (data.stats) serverStats = mergeStats(data.stats);
    save(serverConfig);
    return serverConfig;
  }

  async function saveToServer(cfg) {
    const merged = mergeConfig(cfg);
    const response = await fetch("/api/admin/slots-arcade-config", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: merged }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not save slots arcade controls.");
    if (!data.config) throw new Error("Admin login is required to save live slots arcade controls.");
    serverConfig = mergeConfig(data.config || merged);
    if (data.stats) serverStats = mergeStats(data.stats);
    save(serverConfig);
    return serverConfig;
  }

  function mergeStats(stats) {
    const parsed = stats && typeof stats === "object" ? stats : {};
    const def = defaultStats();
    parsed.games = parsed.games || {};
    for (const g of GAME_LIST) {
      parsed.games[g.key] = { ...def.games[g.key], ...(parsed.games[g.key] || {}) };
    }
    return {
      ...def,
      ...parsed,
      games: parsed.games,
      recentWins: Array.isArray(parsed.recentWins) ? parsed.recentWins : [],
    };
  }

  async function refreshStatsFromServer() {
    const response = await fetch("/api/admin/slots-arcade-stats", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not load slots arcade stats.");
    serverStats = mergeStats(data.stats || data);
    saveStats(serverStats);
    return serverStats;
  }

  async function resetStatsOnServer(gameKey = null) {
    const response = await fetch("/api/admin/slots-arcade-stats/reset", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not reset slots arcade stats.");
    serverStats = mergeStats(data.stats || data);
    saveStats(serverStats);
    return serverStats;
  }

  function loadStats() {
    if (serverStats && serverStats.date === todayKey()) return mergeStats(serverStats);
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (!raw) return defaultStats();
      const parsed = JSON.parse(raw);
      // Daily reset
      if (parsed.date !== todayKey()) {
        return defaultStats();
      }
      // Ensure shape
      const def = defaultStats();
      for (const g of GAME_LIST) {
        if (!parsed.games[g.key]) parsed.games[g.key] = def.games[g.key];
      }
      return parsed;
    } catch (err) { return defaultStats(); }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      return true;
    } catch (err) { return false; }
  }

  // Called by arcade after each spin
  function recordSpin(gameKey, wagered, won) {
    const stats = loadStats();
    stats.totalWagered += wagered;
    stats.totalWon += won;
    stats.totalSpins += 1;
    const g = stats.games[gameKey] || (stats.games[gameKey] = { wagered: 0, won: 0, spins: 0, lastWinAmount: 0, lastWinAt: 0 });
    g.wagered += wagered;
    g.won += won;
    g.spins += 1;
    if (won > 0) {
      g.lastWinAmount = won;
      g.lastWinAt = Date.now();
      // Track recent wins (last 50)
      stats.recentWins = stats.recentWins || [];
      stats.recentWins.unshift({ gameKey, amount: won, wagered, at: Date.now() });
      stats.recentWins = stats.recentWins.slice(0, 50);
    }
    serverStats = mergeStats(stats);
    saveStats(stats);
    return stats;
  }

  // Calculate dynamic RTP adjustment for a game based on daily caps
  // Returns a multiplier to apply on top of the game's base RTP scale
  function computeRtpMultiplier(gameKey) {
    const cfg = load();
    const game = cfg.games[gameKey];
    if (!game) return 1.0;
    const stats = loadStats();
    const gStats = stats.games[gameKey] || { wagered: 0, won: 0, spins: 0 };
    // If daily max payout reached, reduce wins to 20% baseline
    if (gStats.won >= game.dailyMaxPayout) return 0.2;
    // If daily min payout still pending and many spins played, boost slightly
    if (gStats.spins > 50 && gStats.won < game.dailyMinPayout && gStats.wagered > 0) {
      return 1.2;
    }
    // Adjust toward target RTP - if currently above target, reduce; if below, boost
    if (gStats.wagered > 5) {
      const currentRtp = gStats.won / gStats.wagered;
      if (currentRtp > game.targetRtp + 0.05) return 0.85;
      if (currentRtp < game.targetRtp - 0.05) return 1.15;
    }
    return 1.0;
  }

  function isGameEnabled(gameKey) {
    const cfg = load();
    if (!cfg.globalEnabled) return false;
    return cfg.games[gameKey]?.enabled !== false;
  }

  function resetGameStats(gameKey) {
    const stats = loadStats();
    if (gameKey) {
      stats.games[gameKey] = { wagered: 0, won: 0, spins: 0, lastWinAmount: 0, lastWinAt: 0 };
    } else {
      // Reset all
      Object.keys(stats.games).forEach(k => {
        stats.games[k] = { wagered: 0, won: 0, spins: 0, lastWinAmount: 0, lastWinAt: 0 };
      });
      stats.totalWagered = 0;
      stats.totalWon = 0;
      stats.totalSpins = 0;
      stats.recentWins = [];
    }
    saveStats(stats);
    return stats;
  }

  function fmt(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  global.SlotsConfig = {
    GAME_LIST,
    load, save,
    refreshFromServer, saveToServer,
    refreshStatsFromServer, resetStatsOnServer,
    loadStats, saveStats,
    recordSpin,
    computeRtpMultiplier,
    isGameEnabled,
    resetGameStats,
    defaultConfig, defaultGameConfig,
    todayKey,
    fmt,
  };
})(typeof window !== "undefined" ? window : globalThis);
