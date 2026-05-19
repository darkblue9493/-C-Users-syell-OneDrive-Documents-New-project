/* ============================================================
 * SOUTH DIAMOND SLOTS CONFIG - Shared by admin + arcade
 * ============================================================
 * - Stored in localStorage so admin writes and arcade reads
 * - Easily portable to backend later (replace the storage adapter)
 * ============================================================ */
(function (global) {
  "use strict";

  const STORAGE_KEY = "sd_slots_admin_v1";
  const STATS_KEY = "sd_slots_stats_v1";

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

  function defaultGameConfig() {
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

  function defaultConfig() {
    const cfg = {
      version: 1,
      globalEnabled: true,
      defaultBet: 0.25,
      dailyResetUtcHour: 0,
      lastModified: Date.now(),
      games: {},
    };
    for (const g of GAME_LIST) {
      cfg.games[g.key] = defaultGameConfig();
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultConfig();
      const parsed = JSON.parse(raw);
      // Merge with defaults so new games appear automatically
      const def = defaultConfig();
      for (const g of GAME_LIST) {
        parsed.games = parsed.games || {};
        if (!parsed.games[g.key]) parsed.games[g.key] = def.games[g.key];
        // Ensure nested fields exist
        if (!parsed.games[g.key].jackpotPool) parsed.games[g.key].jackpotPool = def.games[g.key].jackpotPool;
      }
      return parsed;
    } catch (err) {
      return defaultConfig();
    }
  }

  function save(cfg) {
    try {
      cfg.lastModified = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return true;
    } catch (err) { return false; }
  }

  function loadStats() {
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
