/* ============================================================
 * SOUTH DIAMOND - Admin Slots Manager
 * Reads/writes SlotsConfig (localStorage) and renders the
 * per-game control grid inside admin.html
 * ============================================================ */
(function () {
  "use strict";
  if (!window.SlotsConfig) {
    console.error("SlotsConfig module not loaded. Make sure slots-config.js is included before slots-admin.js.");
    return;
  }
  const SC = window.SlotsConfig;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Per-game accent colors (visual cue in admin)
  const THEME_ACCENT = {
    buffalo: "#ff8533", kingkong: "#ff3030", triple777: "#ff2540",
    blackjack: "#2dd55b", gorilla: "#ffd200", wolf: "#95e3ff",
    bull: "#ffd95e", dragon: "#d4002a", mammoth: "#5dcef0",
    pharaoh: "#f7c000", ocean: "#00b4d8", vegas: "#ff5fe5",
    panda88: "#e8222e", lion: "#ff7530", pirate: "#b88a3a",
    zeus: "#2dd6f5", cleopatra: "#ffd200", arctic: "#5dd0f5",
    galaxy: "#a78bff", fruit: "#ff5630", viking: "#4682b4",
    aztec: "#2dd55b", halloween: "#ff7530", irish: "#2dd55b",
  };

  // Per-game mascot emoji for admin display
  const THEME_EMOJI = {
    buffalo: "\u{1F9AC}", kingkong: "\u{1F98D}", triple777: "7⃣",
    blackjack: "\u{1F0A1}", gorilla: "\u{1F98D}", wolf: "\u{1F43A}",
    bull: "\u{1F402}", dragon: "\u{1F409}", mammoth: "\u{1F9A3}",
    pharaoh: "\u{1F9DD}", ocean: "\u{1F988}", vegas: "7⃣",
    panda88: "\u{1F43C}", lion: "\u{1F981}", pirate: "☠️",
    zeus: "⚡", cleopatra: "\u{1F451}", arctic: "❄️",
    galaxy: "\u{1F680}", fruit: "\u{1F352}", viking: "⚔️",
    aztec: "☀️", halloween: "\u{1F383}", irish: "\u{1F340}",
  };

  function fmt(n) { return SC.fmt(n); }
  function pct(n) { return (Math.round(n * 1000) / 10).toFixed(1) + "%"; }

  // Pending in-memory config (changes here saved when "Save All" clicked)
  let pendingConfig = null;

  async function init() {
    try {
      pendingConfig = await SC.refreshFromServer({ admin: true });
    } catch (error) {
      pendingConfig = SC.load();
      showSaveStatus("Using local arcade settings. Log in as admin to sync live controls.", false);
    }
    bindMasterControls();
    renderGameCards();
    refreshSummary();
    renderRecentWins();
    // Auto-refresh stats every 5s while panel is visible
    setInterval(() => {
      const panel = $('[data-admin-panel="slots"]');
      if (panel && panel.classList.contains("is-active")) {
        refreshSummary();
        refreshGameStats();
        renderRecentWins();
      }
    }, 5000);
  }

  function bindMasterControls() {
    const globalToggle = $("[data-slots-global-enabled]");
    if (globalToggle) {
      globalToggle.checked = pendingConfig.globalEnabled !== false;
      updateStatusPill(globalToggle.checked);
      globalToggle.addEventListener("change", () => {
        pendingConfig.globalEnabled = globalToggle.checked;
        updateStatusPill(globalToggle.checked);
      });
    }
    $("[data-slots-save-all]")?.addEventListener("click", saveAll);
    $("[data-slots-reset-stats]")?.addEventListener("click", () => {
      if (confirm("Reset today's slot statistics for ALL games? Player credits are not affected.")) {
        SC.resetGameStats(null);
        refreshSummary();
        refreshGameStats();
        renderRecentWins();
        showSaveStatus("Daily stats reset.", true);
      }
    });
    $("[data-slots-export-config]")?.addEventListener("click", () => {
      const cfg = SC.load();
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "south-diamond-slots-config-" + SC.todayKey() + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  function updateStatusPill(online) {
    const pill = $("[data-slots-status-pill]");
    if (!pill) return;
    pill.textContent = online ? "LIVE" : "OFFLINE";
    pill.classList.toggle("online", online);
    pill.classList.toggle("offline", !online);
  }

  function renderGameCards() {
    const grid = $("[data-slots-admin-games]");
    if (!grid) return;
    grid.innerHTML = SC.GAME_LIST.map((g) => {
      const cfg = pendingConfig.games[g.key] || SC.defaultGameConfig();
      const accent = THEME_ACCENT[g.theme] || "#ffd76b";
      const emoji = THEME_EMOJI[g.theme] || "\u{1F3B0}";
      return `
        <article class="slot-game-admin-card" data-game-card="${g.key}" style="--game-accent:${accent}">
          <div class="sga-header">
            <div class="sga-mascot">${emoji}</div>
            <div class="sga-titles">
              <strong>${g.title}</strong>
              <span class="sga-theme">${g.theme} theme</span>
            </div>
            <label class="slots-toggle small">
              <input type="checkbox" data-game-enabled ${cfg.enabled !== false ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="sga-stats" data-game-stats>
            <div><span>Today's Spins</span><b data-stat-spins>0</b></div>
            <div><span>Wagered</span><b data-stat-wagered>0.00</b></div>
            <div><span>Paid Out</span><b data-stat-won>0.00</b></div>
            <div><span>Game RTP</span><b data-stat-rtp>--%</b></div>
          </div>

          <details class="sga-details">
            <summary>Edit game settings &amp; controls</summary>

            <div class="sga-control">
              <label>Target RTP: <b data-rtp-display>${pct(cfg.targetRtp)}</b></label>
              <input type="range" min="70" max="99" step="1" value="${Math.round(cfg.targetRtp * 100)}" data-game-rtp />
              <small>Higher = more wins paid (player friendly). Lower = more house edge.</small>
            </div>

            <div class="sga-control sga-grid-2">
              <label>
                <span>Daily Max Payout</span>
                <input type="number" min="0" step="1" value="${cfg.dailyMaxPayout}" data-game-max />
                <small>Once total wins reach this today, win amounts auto-reduce.</small>
              </label>
              <label>
                <span>Daily Min Payout</span>
                <input type="number" min="0" step="1" value="${cfg.dailyMinPayout}" data-game-min />
                <small>If below this after many spins, wins auto-boost.</small>
              </label>
            </div>

            <div class="sga-control sga-grid-2">
              <label>
                <span>Min Bet</span>
                <input type="number" min="0.01" step="0.05" value="${cfg.minBet}" data-game-minbet />
              </label>
              <label>
                <span>Max Bet</span>
                <input type="number" min="0.05" step="0.5" value="${cfg.maxBet}" data-game-maxbet />
              </label>
            </div>

            <fieldset class="sga-jackpots">
              <legend>Jackpot starting pool (resets when hit)</legend>
              <label><span>Grand</span><input type="number" min="0" step="10" value="${cfg.jackpotPool.grand}" data-jp-grand /></label>
              <label><span>Major</span><input type="number" min="0" step="10" value="${cfg.jackpotPool.major}" data-jp-major /></label>
              <label><span>Minor</span><input type="number" min="0" step="5" value="${cfg.jackpotPool.minor}" data-jp-minor /></label>
              <label><span>Mini</span><input type="number" min="0" step="1" value="${cfg.jackpotPool.mini}" data-jp-mini /></label>
            </fieldset>

            <div class="sga-actions">
              <button type="button" class="game-link" data-reset-game="${g.key}">Reset This Game's Stats</button>
            </div>
          </details>
        </article>
      `;
    }).join("");

    // Wire up per-card inputs
    $$("[data-game-card]", grid).forEach((card) => {
      const key = card.dataset.gameCard;
      const cfg = pendingConfig.games[key];
      const enabled = $("[data-game-enabled]", card);
      if (enabled) enabled.addEventListener("change", () => {
        cfg.enabled = enabled.checked;
        card.classList.toggle("is-disabled", !enabled.checked);
      });
      const rtp = $("[data-game-rtp]", card);
      const rtpDisp = $("[data-rtp-display]", card);
      if (rtp && rtpDisp) rtp.addEventListener("input", () => {
        cfg.targetRtp = parseInt(rtp.value, 10) / 100;
        rtpDisp.textContent = pct(cfg.targetRtp);
      });
      const max = $("[data-game-max]", card);
      if (max) max.addEventListener("change", () => { cfg.dailyMaxPayout = Number(max.value); });
      const min = $("[data-game-min]", card);
      if (min) min.addEventListener("change", () => { cfg.dailyMinPayout = Number(min.value); });
      const minBet = $("[data-game-minbet]", card);
      if (minBet) minBet.addEventListener("change", () => { cfg.minBet = Number(minBet.value); });
      const maxBet = $("[data-game-maxbet]", card);
      if (maxBet) maxBet.addEventListener("change", () => { cfg.maxBet = Number(maxBet.value); });
      ["grand", "major", "minor", "mini"].forEach((level) => {
        const inp = $(`[data-jp-${level}]`, card);
        if (inp) inp.addEventListener("change", () => { cfg.jackpotPool[level] = Number(inp.value); });
      });
      const resetBtn = $("[data-reset-game]", card);
      if (resetBtn) resetBtn.addEventListener("click", () => {
        if (confirm(`Reset today's stats for ${SC.GAME_LIST.find(g => g.key === key).title}?`)) {
          SC.resetGameStats(key);
          refreshGameStats();
          refreshSummary();
          showSaveStatus("Game stats reset.", true);
        }
      });
      if (!enabled.checked) card.classList.add("is-disabled");
    });
    refreshGameStats();
  }

  function refreshGameStats() {
    const stats = SC.loadStats();
    $$("[data-game-card]").forEach((card) => {
      const key = card.dataset.gameCard;
      const g = stats.games[key] || { wagered: 0, won: 0, spins: 0 };
      $("[data-stat-spins]", card).textContent = g.spins;
      $("[data-stat-wagered]", card).textContent = fmt(g.wagered);
      $("[data-stat-won]", card).textContent = fmt(g.won);
      const rtpVal = g.wagered > 0 ? g.won / g.wagered : 0;
      $("[data-stat-rtp]", card).textContent = g.wagered > 0 ? pct(rtpVal) : "--%";
      // Color-code RTP
      const rtpEl = $("[data-stat-rtp]", card);
      rtpEl.classList.remove("rtp-good", "rtp-warn", "rtp-bad");
      if (g.wagered > 5) {
        if (rtpVal > 1.0) rtpEl.classList.add("rtp-bad");
        else if (rtpVal > 0.95) rtpEl.classList.add("rtp-warn");
        else rtpEl.classList.add("rtp-good");
      }
    });
  }

  function refreshSummary() {
    const stats = SC.loadStats();
    $("[data-summary-spins]").textContent = stats.totalSpins;
    $("[data-summary-wagered]").textContent = fmt(stats.totalWagered);
    $("[data-summary-won]").textContent = fmt(stats.totalWon);
    const rtp = stats.totalWagered > 0 ? stats.totalWon / stats.totalWagered : 0;
    $("[data-summary-rtp]").textContent = stats.totalWagered > 0 ? pct(rtp) : "--%";
  }

  function renderRecentWins() {
    const wrap = $("[data-slots-recent-wins]");
    if (!wrap) return;
    const stats = SC.loadStats();
    const wins = (stats.recentWins || []).slice(0, 50);
    if (wins.length === 0) {
      wrap.innerHTML = '<p style="opacity:.6;text-align:center;padding:20px">No wins recorded yet today.</p>';
      return;
    }
    wrap.innerHTML = wins.map((w) => {
      const title = (SC.GAME_LIST.find(g => g.key === w.gameKey) || {}).title || w.gameKey;
      const time = new Date(w.at).toLocaleTimeString();
      const mult = w.wagered > 0 ? (w.amount / w.wagered).toFixed(1) : "?";
      return `
        <article class="rwin-row">
          <span class="rwin-time">${time}</span>
          <strong class="rwin-game">${title}</strong>
          <span class="rwin-bet">bet ${fmt(w.wagered)}</span>
          <b class="rwin-win">+${fmt(w.amount)}</b>
          <span class="rwin-mult ${mult >= 50 ? 'mega' : mult >= 10 ? 'big' : ''}">${mult}×</span>
        </article>
      `;
    }).join("");
  }

  async function saveAll() {
    try {
      pendingConfig = await SC.saveToServer(pendingConfig);
      renderGameCards();
      showSaveStatus("All settings saved live. Players will see the new rules on their next spin.", true);
    } catch (error) {
      const ok = SC.save(pendingConfig);
      showSaveStatus(ok ? "Saved locally, but live server sync failed. Please check admin login and retry." : "Save failed. Please retry.", false);
    }
  }

  function showSaveStatus(msg, success) {
    const el = $("[data-slots-save-status]");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("success", !!success);
    el.classList.toggle("error", !success);
    setTimeout(() => { el.textContent = ""; el.classList.remove("success", "error"); }, 4000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
