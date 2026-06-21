/* ============================================================
 * SOUTH DIAMOND SLOTS ARCADE - Engine + 24 Games
 * ============================================================
 * Self-contained slot engine with:
 *   - 24 distinct themed games
 *   - Weighted reel strips
 *   - Multi-payline evaluation
 *   - Wild substitution, scatter bonuses
 *   - Live progressive jackpots (Grand/Major/Minor/Mini)
 *   - Per-theme procedural music + sound effects
 *   - Fullscreen support
 *   - South Diamond account points
 * ============================================================ */

"use strict";

// ============================================================
// 1) SYMBOL LIBRARY - Reusable SVG and emoji symbols
// ============================================================
const SVG = {
  WILD: '<svg viewBox="0 0 60 60"><defs><linearGradient id="wg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff8cd"/><stop offset=".5" stop-color="#ffd76b"/><stop offset="1" stop-color="#a06b1f"/></linearGradient><filter id="wf"><feGaussianBlur stdDeviation="1.5"/></filter></defs><polygon points="30,4 56,30 30,56 4,30" fill="url(#wg)" stroke="#fff" stroke-width="2.5"/><text x="30" y="38" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="22" fill="#5a0017" stroke="#ffe091" stroke-width=".8">WILD</text></svg>',
  SCATTER: '<svg viewBox="0 0 60 60"><defs><radialGradient id="scg" cx=".5" cy=".5"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#ff5fe5"/><stop offset="1" stop-color="#7a006d"/></radialGradient></defs><g transform="translate(30 30)"><polygon points="0,-26 7,-9 26,-8 12,4 18,22 0,12 -18,22 -12,4 -26,-8 -7,-9" fill="url(#scg)" stroke="#fff" stroke-width="2"/></g><text x="30" y="36" text-anchor="middle" font-family="Arial Black" font-weight="900" font-size="11" fill="#fff" stroke="#7a006d" stroke-width=".5">BONUS</text></svg>',
  SEVEN: '<svg viewBox="0 0 60 60"><defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff8aa0"/><stop offset=".5" stop-color="#ff2540"/><stop offset="1" stop-color="#5a0017"/></linearGradient></defs><rect x="6" y="6" width="48" height="48" rx="8" fill="url(#sg)" stroke="#ffd76b" stroke-width="3"/><text x="30" y="44" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="34" fill="#ffd76b" stroke="#5a0017" stroke-width="1.2">7</text></svg>',
  TRIPLE_SEVEN: '<svg viewBox="0 0 60 60"><defs><linearGradient id="tsg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff5630"/><stop offset="1" stop-color="#a01020"/></linearGradient></defs><rect x="3" y="14" width="54" height="32" rx="6" fill="url(#tsg)" stroke="#ffd76b" stroke-width="2"/><text x="30" y="38" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="18" fill="#ffd76b">777</text></svg>',
  BAR: '<svg viewBox="0 0 60 60"><rect x="6" y="22" width="48" height="16" rx="3" fill="#1a0d06" stroke="#f6c85f" stroke-width="2.5"/><text x="30" y="34" text-anchor="middle" font-family="Arial Black" font-weight="900" font-size="11" fill="#f6c85f">BAR</text></svg>',
  BAR2: '<svg viewBox="0 0 60 60"><rect x="6" y="15" width="48" height="13" rx="2" fill="#1a0d06" stroke="#f6c85f" stroke-width="2"/><rect x="6" y="32" width="48" height="13" rx="2" fill="#1a0d06" stroke="#f6c85f" stroke-width="2"/><text x="30" y="25" text-anchor="middle" font-family="Arial Black" font-size="8" fill="#f6c85f">BAR</text><text x="30" y="42" text-anchor="middle" font-family="Arial Black" font-size="8" fill="#f6c85f">BAR</text></svg>',
  BAR3: '<svg viewBox="0 0 60 60"><rect x="6" y="8" width="48" height="11" rx="2" fill="#1a0d06" stroke="#f6c85f" stroke-width="1.8"/><rect x="6" y="24" width="48" height="11" rx="2" fill="#1a0d06" stroke="#f6c85f" stroke-width="1.8"/><rect x="6" y="40" width="48" height="11" rx="2" fill="#1a0d06" stroke="#f6c85f" stroke-width="1.8"/><text x="30" y="17" text-anchor="middle" font-family="Arial Black" font-size="7" fill="#f6c85f">BAR</text><text x="30" y="33" text-anchor="middle" font-family="Arial Black" font-size="7" fill="#f6c85f">BAR</text><text x="30" y="49" text-anchor="middle" font-family="Arial Black" font-size="7" fill="#f6c85f">BAR</text></svg>',
  GOLD_COIN: '<svg viewBox="0 0 60 60"><defs><radialGradient id="gc" cx=".4" cy=".3"><stop offset="0" stop-color="#fff8cd"/><stop offset="1" stop-color="#b8830a"/></radialGradient></defs><circle cx="30" cy="30" r="24" fill="url(#gc)" stroke="#8b5d00" stroke-width="3"/><text x="30" y="40" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="26" fill="#5a3a00">$</text></svg>',
  CROWN: '<svg viewBox="0 0 60 60"><defs><linearGradient id="cwg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#b8830a"/></linearGradient></defs><path d="M8 38 L14 18 L22 32 L30 12 L38 32 L46 18 L52 38 Z" fill="url(#cwg)" stroke="#5a3a00" stroke-width="2"/><rect x="8" y="38" width="44" height="10" fill="url(#cwg)" stroke="#5a3a00" stroke-width="2"/><circle cx="30" cy="14" r="3" fill="#ff2540"/><circle cx="14" cy="20" r="2" fill="#3bb8ff"/><circle cx="46" cy="20" r="2" fill="#3bb8ff"/></svg>',
  JACKPOT: '<svg viewBox="0 0 60 60"><defs><linearGradient id="jpg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd76b"/><stop offset="1" stop-color="#ff2540"/></linearGradient></defs><rect x="3" y="14" width="54" height="32" rx="14" fill="url(#jpg)" stroke="#fff" stroke-width="2"/><text x="30" y="36" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="13" fill="#fff" stroke="#5a0017" stroke-width=".5">JACKPOT</text></svg>',
  DIAMOND: '<svg viewBox="0 0 60 60"><defs><linearGradient id="dmg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e0f6ff"/><stop offset=".5" stop-color="#7be8ff"/><stop offset="1" stop-color="#0890b8"/></linearGradient></defs><polygon points="30,8 50,24 30,52 10,24" fill="url(#dmg)" stroke="#fff" stroke-width="2"/><polygon points="30,8 50,24 30,28 10,24" fill="#fff" opacity=".4"/></svg>',
  BELL: '<svg viewBox="0 0 60 60"><defs><radialGradient id="bg" cx=".4" cy=".3"><stop offset="0" stop-color="#fff8cd"/><stop offset="1" stop-color="#c08b00"/></radialGradient></defs><path d="M30 8 C18 8 14 22 14 36 L10 42 L50 42 L46 36 C46 22 42 8 30 8 Z" fill="url(#bg)" stroke="#5a3a00" stroke-width="2"/><circle cx="30" cy="48" r="4" fill="#5a3a00"/></svg>',
  CHERRY: '<svg viewBox="0 0 60 60"><path d="M20 18 Q30 6 40 18" fill="none" stroke="#3a7a00" stroke-width="3"/><circle cx="18" cy="38" r="14" fill="#ff2540" stroke="#5a0010" stroke-width="2"/><circle cx="42" cy="40" r="13" fill="#ff2540" stroke="#5a0010" stroke-width="2"/><ellipse cx="14" cy="34" rx="3" ry="2" fill="#ffb0b8" opacity=".7"/></svg>',
  STAR: '<svg viewBox="0 0 60 60"><defs><radialGradient id="sg2" cx=".5" cy=".4"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffb800"/></radialGradient></defs><polygon points="30,6 36,22 54,22 39,32 45,50 30,40 15,50 21,32 6,22 24,22" fill="url(#sg2)" stroke="#a06b1f" stroke-width="1.5"/></svg>',
  CLOVER: '<svg viewBox="0 0 60 60"><circle cx="30" cy="20" r="11" fill="#2dd55b" stroke="#1a8a30" stroke-width="2"/><circle cx="18" cy="32" r="11" fill="#2dd55b" stroke="#1a8a30" stroke-width="2"/><circle cx="42" cy="32" r="11" fill="#2dd55b" stroke="#1a8a30" stroke-width="2"/><circle cx="30" cy="44" r="11" fill="#2dd55b" stroke="#1a8a30" stroke-width="2"/><rect x="28" y="44" width="4" height="14" fill="#5a3a00"/></svg>',
  HORSESHOE: '<svg viewBox="0 0 60 60"><path d="M14 14 L14 36 Q14 48 30 48 Q46 48 46 36 L46 14 L40 14 L40 36 Q40 42 30 42 Q20 42 20 36 L20 14 Z" fill="#ffd76b" stroke="#5a3a00" stroke-width="2"/><circle cx="17" cy="18" r="2" fill="#5a3a00"/><circle cx="43" cy="18" r="2" fill="#5a3a00"/><circle cx="17" cy="40" r="2" fill="#5a3a00"/><circle cx="43" cy="40" r="2" fill="#5a3a00"/></svg>',
  CARD_A:  '<svg viewBox="0 0 60 60"><rect x="6" y="4" width="48" height="52" rx="6" fill="#fff" stroke="#1a0d06" stroke-width="2"/><text x="30" y="42" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="36" fill="#d11645">A</text><text x="14" y="18" font-family="Arial" font-weight="900" font-size="12" fill="#d11645">A</text><text x="46" y="50" text-anchor="end" font-family="Arial" font-weight="900" font-size="12" fill="#d11645">A</text></svg>',
  CARD_K:  '<svg viewBox="0 0 60 60"><rect x="6" y="4" width="48" height="52" rx="6" fill="#fff" stroke="#1a0d06" stroke-width="2"/><text x="30" y="42" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="36" fill="#3a7a00">K</text><text x="14" y="18" font-family="Arial" font-weight="900" font-size="12" fill="#3a7a00">K</text><text x="46" y="50" text-anchor="end" font-family="Arial" font-weight="900" font-size="12" fill="#3a7a00">K</text></svg>',
  CARD_Q:  '<svg viewBox="0 0 60 60"><rect x="6" y="4" width="48" height="52" rx="6" fill="#fff" stroke="#1a0d06" stroke-width="2"/><text x="30" y="42" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="34" fill="#8b1cb8">Q</text><text x="14" y="18" font-family="Arial" font-weight="900" font-size="12" fill="#8b1cb8">Q</text><text x="46" y="50" text-anchor="end" font-family="Arial" font-weight="900" font-size="12" fill="#8b1cb8">Q</text></svg>',
  CARD_J:  '<svg viewBox="0 0 60 60"><rect x="6" y="4" width="48" height="52" rx="6" fill="#fff" stroke="#1a0d06" stroke-width="2"/><text x="30" y="42" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="36" fill="#0066cc">J</text><text x="14" y="18" font-family="Arial" font-weight="900" font-size="12" fill="#0066cc">J</text><text x="46" y="50" text-anchor="end" font-family="Arial" font-weight="900" font-size="12" fill="#0066cc">J</text></svg>',
  CARD_10: '<svg viewBox="0 0 60 60"><rect x="6" y="4" width="48" height="52" rx="6" fill="#fff" stroke="#1a0d06" stroke-width="2"/><text x="30" y="42" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="26" fill="#1a0d06">10</text></svg>',
  SPADE:   '<svg viewBox="0 0 60 60"><path d="M30 8 Q12 26 12 36 Q12 44 22 44 Q26 44 30 40 Q34 44 38 44 Q48 44 48 36 Q48 26 30 8 Z" fill="#1a0d06" stroke="#000" stroke-width="1.5"/><path d="M30 38 L24 52 L36 52 Z" fill="#1a0d06"/></svg>',
  HEART:   '<svg viewBox="0 0 60 60"><path d="M30 52 C12 38 8 28 8 20 Q8 10 18 10 Q26 10 30 18 Q34 10 42 10 Q52 10 52 20 C52 28 48 38 30 52 Z" fill="#d11645" stroke="#5a0010" stroke-width="1.5"/></svg>',
  CLUB:    '<svg viewBox="0 0 60 60"><circle cx="30" cy="18" r="10" fill="#1a0d06"/><circle cx="18" cy="34" r="10" fill="#1a0d06"/><circle cx="42" cy="34" r="10" fill="#1a0d06"/><path d="M30 30 L26 50 L34 50 Z" fill="#1a0d06"/></svg>',
  DIAMOND_SUIT: '<svg viewBox="0 0 60 60"><polygon points="30,8 50,30 30,52 10,30" fill="#d11645" stroke="#5a0010" stroke-width="1.5"/></svg>',
};

// Emoji symbol helper
function emojiSym(emoji, label) {
  return { type: "emoji", icon: emoji, label: label || "" };
}
function svgSym(key, label) {
  return { type: "svg", icon: SVG[key], label: label || "" };
}
function imageSym(src, label) {
  return { type: "image", src, label: label || "" };
}
function symbolIconHtml(sym, className = "pt-symbol-img") {
  if (!sym) return "";
  if (sym.type === "svg") return sym.icon;
  if (sym.type === "image") {
    const label = sym.label || "Symbol";
    return `<img class="${className}" src="${sym.src}" alt="${label}" loading="eager" draggable="false" />`;
  }
  return `<span class="pt-emoji">${sym.icon || sym.label || ""}</span>`;
}
function symbolPayForCount(sym, count) {
  const pays = Array.isArray(sym?.pay) ? sym.pay : [];
  if (!Number.isFinite(count) || count < 1) return 0;
  const wholeCount = Math.floor(count);
  const isCompactThreeReelPay = pays.length > 3 && pays.slice(3).every((pay) => !Number(pay));
  if (pays.length <= 3 || isCompactThreeReelPay) return Number(pays[wholeCount - 1]) || 0;
  return Number(pays[wholeCount]) || Number(pays[wholeCount - 1]) || 0;
}
function symbolWinningCounts(sym, reels) {
  const pays = Array.isArray(sym?.pay) ? sym.pay : [];
  const maxCount = Math.max(1, Number(reels) || 1);
  const counts = [];
  for (let count = 1; count <= maxCount; count++) {
    if (symbolPayForCount(sym, count) > 0) counts.push(count);
  }
  return counts;
}
function symbolMinWinningCount(sym, reels) {
  const counts = symbolWinningCounts(sym, reels);
  return counts.length ? Math.min(...counts) : Math.min(3, Math.max(1, Number(reels) || 3));
}
function topSymbolPay(sym, count) {
  return symbolPayForCount(sym, count) || Math.max(0, ...((sym?.pay || []).filter((pay) => Number.isFinite(pay))));
}
function symbolMatchGroup(game, symKey) {
  const sym = game?.symbols?.[symKey];
  return sym?.matchGroup || symKey;
}
function groupedSymbolPay(game, targetSym, count, mixedGroup) {
  const target = game?.symbols?.[targetSym];
  if (!mixedGroup) return symbolPayForCount(target, count);
  const group = symbolMatchGroup(game, targetSym);
  const groupPays = Object.entries(game?.symbols || {})
    .filter(([key, sym]) => sym && !sym.scatter && !sym.wild && symbolMatchGroup(game, key) === group)
    .map(([, sym]) => symbolPayForCount(sym, count))
    .filter((pay) => pay > 0);
  const lowPay = groupPays.length ? Math.min(...groupPays) : symbolPayForCount(target, count);
  return Math.max(1, Math.round(lowPay * 0.35));
}


// ============================================================
// MASCOT ART LIBRARY - Large illustrated mascots per game
// ============================================================
const MASCOT_ART = {
  // Wild Buffalo - shaggy buffalo head
  wildBuffalo: '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="buffG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff8a3a"/><stop offset=".5" stop-color="#a04818"/><stop offset="1" stop-color="#3a1808"/></linearGradient><radialGradient id="buffH" cx=".4" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#3a1808"/></radialGradient></defs><ellipse cx="100" cy="100" rx="78" ry="55" fill="url(#buffG)" stroke="#1a0d06" stroke-width="3"/><path d="M30 80 Q15 50 30 35 Q45 50 50 78 Z" fill="#3a1808" stroke="#1a0d06" stroke-width="2"/><path d="M170 80 Q185 50 170 35 Q155 50 150 78 Z" fill="#3a1808" stroke="#1a0d06" stroke-width="2"/><path d="M55 60 Q70 45 100 50 Q130 45 145 60 Q140 85 100 90 Q60 85 55 60 Z" fill="#ff8a3a" opacity=".8"/><circle cx="70" cy="95" r="6" fill="#1a0d06"/><circle cx="130" cy="95" r="6" fill="#1a0d06"/><circle cx="68" cy="93" r="2" fill="#fff"/><circle cx="128" cy="93" r="2" fill="#fff"/><ellipse cx="100" cy="125" rx="20" ry="14" fill="url(#buffH)" stroke="#1a0d06" stroke-width="2"/><ellipse cx="93" cy="123" rx="2" ry="3" fill="#1a0d06"/><ellipse cx="107" cy="123" rx="2" ry="3" fill="#1a0d06"/><path d="M40 110 L25 130 M50 125 L35 145 M150 125 L165 145 M160 110 L175 130" stroke="#1a0d06" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  // King Kong - silhouette ape with skyscrapers
  kingKong: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="kkG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#080808"/></linearGradient></defs><rect x="20" y="120" width="20" height="80" fill="#2a2a4a"/><rect x="45" y="100" width="20" height="100" fill="#3a3a5a"/><rect x="155" y="110" width="20" height="90" fill="#3a3a5a"/><rect x="170" y="90" width="15" height="110" fill="#4a4a6a"/><ellipse cx="100" cy="160" rx="50" ry="38" fill="url(#kkG)" stroke="#000" stroke-width="2"/><circle cx="100" cy="100" r="42" fill="url(#kkG)" stroke="#000" stroke-width="2"/><ellipse cx="100" cy="118" rx="22" ry="14" fill="#5a4030"/><circle cx="88" cy="95" r="5" fill="#ff6030"/><circle cx="112" cy="95" r="5" fill="#ff6030"/><circle cx="88" cy="95" r="2" fill="#1a0d06"/><circle cx="112" cy="95" r="2" fill="#1a0d06"/><path d="M88 120 Q100 130 112 120" stroke="#1a0d06" stroke-width="2" fill="none"/><ellipse cx="55" cy="155" rx="14" ry="22" fill="url(#kkG)" stroke="#000" stroke-width="2" transform="rotate(-15 55 155)"/><ellipse cx="145" cy="155" rx="14" ry="22" fill="url(#kkG)" stroke="#000" stroke-width="2" transform="rotate(15 145 155)"/></svg>',
  // Triple 777 - giant 777 logo
  triple777: '<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="t7G" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff8cd"/><stop offset=".4" stop-color="#ffd76b"/><stop offset="1" stop-color="#a06b1f"/></linearGradient></defs><rect x="0" y="20" width="200" height="60" rx="10" fill="#5a0017" stroke="#ffd76b" stroke-width="3"/><text x="35" y="72" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="62" fill="url(#t7G)" stroke="#5a0017" stroke-width="2">7</text><text x="100" y="72" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="62" fill="url(#t7G)" stroke="#5a0017" stroke-width="2">7</text><text x="165" y="72" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="62" fill="url(#t7G)" stroke="#5a0017" stroke-width="2">7</text><polygon points="0,15 200,15 200,20 0,20" fill="#ffd76b"/><polygon points="0,80 200,80 200,85 0,85" fill="#ffd76b"/></svg>',
  // Black Jack - cards and chips
  blackjack: '<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect x="60" y="20" width="60" height="84" rx="6" fill="#fff" stroke="#000" stroke-width="2" transform="rotate(-12 90 62)"/><text x="73" y="68" font-family="Georgia" font-weight="900" font-size="32" fill="#1a0d06" transform="rotate(-12 90 62)">A</text><path d="M55 60 Q45 50 50 40 Q60 40 60 55 Q65 40 75 40 Q75 55 65 60 Q65 70 55 65 Z" fill="#1a0d06" transform="rotate(-12 90 62)"/><rect x="90" y="30" width="60" height="84" rx="6" fill="#fff" stroke="#000" stroke-width="2" transform="rotate(8 120 72)"/><text x="103" y="78" font-family="Georgia" font-weight="900" font-size="32" fill="#d11645" transform="rotate(8 120 72)">K</text><circle cx="160" cy="110" r="20" fill="#d4002a" stroke="#fff" stroke-width="2"/><circle cx="160" cy="110" r="13" fill="#fff" stroke="#d4002a" stroke-width="1.5"/><circle cx="40" cy="100" r="18" fill="#1a8a30" stroke="#fff" stroke-width="2"/><circle cx="40" cy="100" r="11" fill="#fff" stroke="#1a8a30" stroke-width="1.5"/></svg>',
  // Gorilla Gold - gorilla with idol
  gorillaGold: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="gorG" cx=".5" cy=".4"><stop offset="0" stop-color="#5a4a3a"/><stop offset="1" stop-color="#1a0d06"/></radialGradient></defs><ellipse cx="100" cy="160" rx="60" ry="38" fill="url(#gorG)" stroke="#000" stroke-width="2"/><circle cx="100" cy="95" r="44" fill="url(#gorG)" stroke="#000" stroke-width="2"/><ellipse cx="100" cy="118" rx="22" ry="16" fill="#7a5a3a"/><circle cx="88" cy="92" r="6" fill="#ffd76b"/><circle cx="112" cy="92" r="6" fill="#ffd76b"/><circle cx="88" cy="93" r="3" fill="#1a0d06"/><circle cx="112" cy="93" r="3" fill="#1a0d06"/><path d="M88 124 Q100 132 112 124" stroke="#1a0d06" stroke-width="2" fill="none"/><polygon points="100,30 110,55 138,57 116,72 124,98 100,84 76,98 84,72 62,57 90,55" fill="#ffd76b" stroke="#a06b1f" stroke-width="2"/></svg>',
  // Gold Wolf - wolf head with moon
  goldWolf: '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="moonG" cx=".4" cy=".4"><stop offset="0" stop-color="#fff8cd"/><stop offset="1" stop-color="#b8830a"/></radialGradient><linearGradient id="wolfG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d4dce6"/><stop offset="1" stop-color="#5a6878"/></linearGradient></defs><circle cx="160" cy="36" r="22" fill="url(#moonG)" opacity=".9"/><path d="M100 50 L75 90 L55 80 L80 110 L70 150 L100 130 L130 150 L120 110 L145 80 L125 90 Z" fill="url(#wolfG)" stroke="#1a0d06" stroke-width="2"/><ellipse cx="85" cy="105" rx="4" ry="5" fill="#1a0d06"/><ellipse cx="115" cy="105" rx="4" ry="5" fill="#1a0d06"/><path d="M85 100 L80 95 L90 98 Z" fill="#fff"/><path d="M115 100 L120 95 L110 98 Z" fill="#fff"/><polygon points="100,120 95,128 105,128" fill="#1a0d06"/><path d="M90 132 L100 145 L110 132" stroke="#1a0d06" stroke-width="2" fill="none"/></svg>',
  // Wild Bull - bull with horns
  wildBull: '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bullG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffce6a"/><stop offset=".5" stop-color="#c87a32"/><stop offset="1" stop-color="#5a3a18"/></linearGradient></defs><ellipse cx="100" cy="100" rx="55" ry="48" fill="url(#bullG)" stroke="#3a1808" stroke-width="3"/><path d="M55 80 Q30 50 20 30 Q40 55 55 75 Z" fill="#fff" stroke="#3a1808" stroke-width="2"/><path d="M145 80 Q170 50 180 30 Q160 55 145 75 Z" fill="#fff" stroke="#3a1808" stroke-width="2"/><ellipse cx="100" cy="120" rx="22" ry="18" fill="#3a1808"/><ellipse cx="93" cy="118" rx="3" ry="4" fill="#fff"/><ellipse cx="107" cy="118" rx="3" ry="4" fill="#fff"/><circle cx="80" cy="100" r="6" fill="#1a0d06"/><circle cx="120" cy="100" r="6" fill="#1a0d06"/><circle cx="100" cy="135" r="6" fill="#ffd76b" stroke="#1a0d06" stroke-width="2"/></svg>',
  // Dragon Empress - Chinese dragon head
  dragonEmpress: '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="drgG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff8a3a"/><stop offset=".5" stop-color="#d4002a"/><stop offset="1" stop-color="#5a0010"/></linearGradient></defs><path d="M100 30 Q60 40 50 80 Q60 120 100 130 Q140 120 150 80 Q140 40 100 30 Z" fill="url(#drgG)" stroke="#5a0010" stroke-width="3"/><path d="M70 50 L55 35 L75 45 Z M130 50 L145 35 L125 45 Z" fill="#ffd76b" stroke="#5a0010" stroke-width="2"/><circle cx="85" cy="78" r="8" fill="#fff"/><circle cx="115" cy="78" r="8" fill="#fff"/><circle cx="85" cy="78" r="4" fill="#1a0d06"/><circle cx="115" cy="78" r="4" fill="#1a0d06"/><path d="M75 105 Q100 115 125 105 L100 130 Z" fill="#5a0010" stroke="#1a0d06" stroke-width="2"/><path d="M82 110 L78 124 M100 115 L100 130 M118 110 L122 124" stroke="#fff" stroke-width="2" fill="none"/><ellipse cx="60" cy="90" rx="6" ry="3" fill="#ffd76b" opacity=".8"/><ellipse cx="140" cy="90" rx="6" ry="3" fill="#ffd76b" opacity=".8"/></svg>',
  // Mammoth Rush - woolly mammoth
  mammothRush: '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="mamG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#c08a48"/><stop offset="1" stop-color="#5a3a18"/></linearGradient></defs><ellipse cx="100" cy="100" rx="68" ry="48" fill="url(#mamG)" stroke="#3a1808" stroke-width="3"/><ellipse cx="100" cy="80" rx="40" ry="34" fill="url(#mamG)" stroke="#3a1808" stroke-width="3"/><path d="M70 100 Q50 130 30 145 Q55 138 75 120 Z" fill="#fff" stroke="#3a1808" stroke-width="2"/><path d="M130 100 Q150 130 170 145 Q145 138 125 120 Z" fill="#fff" stroke="#3a1808" stroke-width="2"/><circle cx="85" cy="78" r="5" fill="#1a0d06"/><circle cx="115" cy="78" r="5" fill="#1a0d06"/><path d="M100 90 Q90 105 100 130 Q110 110 100 100" fill="url(#mamG)" stroke="#3a1808" stroke-width="2"/><path d="M55 60 L40 50 M55 55 L45 60 M145 60 L160 50 M145 55 L155 60" stroke="#3a1808" stroke-width="1.5" fill="none"/></svg>',
  // Pharaoh - golden mask
  pharaoh: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="phG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff8cd"/><stop offset=".4" stop-color="#ffd76b"/><stop offset="1" stop-color="#b8830a"/></linearGradient><linearGradient id="phB" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0890b8"/><stop offset="1" stop-color="#003a52"/></linearGradient></defs><path d="M100 30 Q60 35 55 75 L40 130 L60 175 L100 180 L140 175 L160 130 L145 75 Q140 35 100 30 Z" fill="url(#phG)" stroke="#5a3a00" stroke-width="3"/><rect x="55" y="65" width="40" height="6" fill="url(#phB)"/><rect x="105" y="65" width="40" height="6" fill="url(#phB)"/><rect x="55" y="75" width="40" height="6" fill="url(#phG)"/><rect x="105" y="75" width="40" height="6" fill="url(#phG)"/><ellipse cx="80" cy="100" rx="10" ry="6" fill="#000"/><ellipse cx="120" cy="100" rx="10" ry="6" fill="#000"/><line x1="65" y1="105" x2="55" y2="115" stroke="#000" stroke-width="3"/><line x1="135" y1="105" x2="145" y2="115" stroke="#000" stroke-width="3"/><path d="M85 130 Q100 138 115 130" stroke="#5a3a00" stroke-width="3" fill="none"/><path d="M100 50 Q85 35 100 25 Q115 35 100 50" fill="#0890b8" stroke="#003a52" stroke-width="2"/></svg>',
  // Ocean Treasure - shark
  oceanTreasure: '<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="shrG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7bc1d8"/><stop offset=".5" stop-color="#3a7a9a"/><stop offset="1" stop-color="#1a3a4a"/></linearGradient></defs><path d="M20 80 Q60 40 130 60 Q170 70 185 75 Q170 85 130 90 Q60 110 20 80 Z" fill="url(#shrG)" stroke="#1a3a4a" stroke-width="2.5"/><path d="M140 60 L155 30 L150 65 Z" fill="#3a7a9a" stroke="#1a3a4a" stroke-width="2"/><path d="M180 80 L210 65 L200 90 Z" fill="#3a7a9a" stroke="#1a3a4a" stroke-width="2"/><path d="M180 80 L210 95 L200 80 Z" fill="#3a7a9a" stroke="#1a3a4a" stroke-width="2"/><path d="M70 100 L60 130 L85 110 Z" fill="#3a7a9a" stroke="#1a3a4a" stroke-width="2"/><circle cx="140" cy="68" r="6" fill="#000"/><circle cx="138" cy="66" r="2" fill="#fff"/><path d="M155 80 Q170 90 155 95 M155 85 Q170 92 155 99" stroke="#fff" stroke-width="2" fill="none"/><path d="M60 75 L75 80 L60 85 L75 90 L60 95" stroke="#fff" stroke-width="1.5" fill="none"/></svg>',
  // Vegas 7s - neon sign
  vegas7s: '<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="neon"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="10" y="20" width="180" height="60" rx="30" fill="#1a0828" stroke="#ff5fe5" stroke-width="3"/><text x="100" y="65" text-anchor="middle" font-family="Impact,Arial Black" font-weight="900" font-size="38" fill="#ff5fe5" filter="url(#neon)" stroke="#fff" stroke-width="1">VEGAS 7</text><circle cx="20" cy="50" r="3" fill="#ffd76b"/><circle cx="180" cy="50" r="3" fill="#ffd76b"/><circle cx="100" cy="15" r="3" fill="#7be8ff"/></svg>',

  // Lucky Panda 88 - panda head with bamboo + gold ingot
  luckyPanda: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pdG" cx=".5" cy=".4"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e8e8e8"/></radialGradient></defs><ellipse cx="100" cy="115" rx="60" ry="48" fill="url(#pdG)" stroke="#1a0d06" stroke-width="3"/><ellipse cx="60" cy="80" rx="18" ry="22" fill="#1a0d06"/><ellipse cx="140" cy="80" rx="18" ry="22" fill="#1a0d06"/><ellipse cx="60" cy="100" rx="14" ry="16" fill="url(#pdG)"/><ellipse cx="140" cy="100" rx="14" ry="16" fill="url(#pdG)"/><circle cx="60" cy="100" r="5" fill="#1a0d06"/><circle cx="140" cy="100" r="5" fill="#1a0d06"/><circle cx="58" cy="98" r="2" fill="#fff"/><circle cx="138" cy="98" r="2" fill="#fff"/><ellipse cx="100" cy="125" rx="10" ry="7" fill="#1a0d06"/><path d="M100 132 Q92 142 100 145 Q108 142 100 132" stroke="#1a0d06" stroke-width="2" fill="#1a0d06"/><circle cx="35" cy="60" r="14" fill="#1a0d06"/><circle cx="165" cy="60" r="14" fill="#1a0d06"/><text x="100" y="180" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="26" fill="#e8222e" stroke="#ffd200" stroke-width="1.5">88</text></svg>',
  // Lion's Pride - lion head with mane
  lionsPride: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="manG" cx=".5" cy=".5"><stop offset="0" stop-color="#ff8a3a"/><stop offset="1" stop-color="#7a3a08"/></radialGradient></defs><circle cx="100" cy="110" r="78" fill="url(#manG)" stroke="#3a1808" stroke-width="3"/><path d="M30 110 L20 90 M30 130 L18 130 M40 70 L25 55 M50 50 L40 30 M100 30 L100 12 M150 50 L160 30 M160 70 L175 55 M170 110 L182 110 M170 130 L182 130 M40 150 L25 165 M160 150 L175 165" stroke="#7a3a08" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="110" r="52" fill="#ffce6a"/><circle cx="78" cy="100" r="6" fill="#1a0d06"/><circle cx="122" cy="100" r="6" fill="#1a0d06"/><circle cx="76" cy="98" r="2" fill="#fff"/><circle cx="120" cy="98" r="2" fill="#fff"/><ellipse cx="100" cy="125" rx="9" ry="7" fill="#1a0d06"/><path d="M100 132 L95 140 M100 132 L105 140" stroke="#1a0d06" stroke-width="2.5"/><path d="M85 135 L78 145 M115 135 L122 145" stroke="#1a0d06" stroke-width="2"/></svg>',
  // Pirate's Treasure - skull with crossed bones
  piratesTreasure: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="120" width="160" height="14" fill="#5a3a18" stroke="#3a1808" stroke-width="2" transform="rotate(15 100 127)"/><rect x="20" y="120" width="160" height="14" fill="#5a3a18" stroke="#3a1808" stroke-width="2" transform="rotate(-15 100 127)"/><circle cx="25" cy="115" r="14" fill="#fff" stroke="#1a0d06" stroke-width="2" transform="rotate(15 100 127)"/><circle cx="175" cy="115" r="14" fill="#fff" stroke="#1a0d06" stroke-width="2" transform="rotate(15 100 127)"/><circle cx="25" cy="140" r="14" fill="#fff" stroke="#1a0d06" stroke-width="2" transform="rotate(-15 100 127)"/><circle cx="175" cy="140" r="14" fill="#fff" stroke="#1a0d06" stroke-width="2" transform="rotate(-15 100 127)"/><ellipse cx="100" cy="80" rx="55" ry="50" fill="#fff" stroke="#1a0d06" stroke-width="3"/><ellipse cx="75" cy="80" rx="14" ry="18" fill="#1a0d06"/><ellipse cx="125" cy="80" rx="14" ry="18" fill="#1a0d06"/><circle cx="72" cy="78" r="3" fill="#ff5630"/><circle cx="128" cy="78" r="3" fill="#ff5630"/><path d="M88 105 L92 115 L96 105 L100 115 L104 105 L108 115 L112 105" stroke="#1a0d06" stroke-width="2.5" fill="none"/><ellipse cx="100" cy="105" rx="4" ry="2" fill="#1a0d06"/></svg>',
  // Zeus Thunder - bearded zeus head with crown
  zeusThunder: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="zsG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd76b"/><stop offset="1" stop-color="#b8830a"/></linearGradient></defs><path d="M50 60 L60 30 L75 50 L90 25 L100 50 L110 25 L125 50 L140 30 L150 60 Z" fill="url(#zsG)" stroke="#5a3a00" stroke-width="3"/><rect x="50" y="55" width="100" height="10" fill="url(#zsG)" stroke="#5a3a00" stroke-width="2"/><circle cx="100" cy="105" r="42" fill="#ffd9a8" stroke="#3a1808" stroke-width="2.5"/><circle cx="84" cy="100" r="5" fill="#2dd6f5"/><circle cx="116" cy="100" r="5" fill="#2dd6f5"/><circle cx="84" cy="100" r="2" fill="#1a0d06"/><circle cx="116" cy="100" r="2" fill="#1a0d06"/><path d="M70 130 Q80 140 100 138 Q120 140 130 130 L130 175 Q120 165 100 168 Q80 165 70 175 Z" fill="#fff" stroke="#1a0d06" stroke-width="2"/><path d="M75 125 L70 145 M80 130 L75 150 M125 125 L130 145 M120 130 L125 150" stroke="#a0a0a0" stroke-width="2" stroke-linecap="round"/><path d="M165 70 L175 50 L168 65 L180 55 L172 75 L185 75 L173 85" fill="#fffe5a" stroke="#ff5630" stroke-width="2"/></svg>',
  // Cleopatra Diamonds - egyptian queen with headdress
  cleopatra: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="clG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd200"/><stop offset="1" stop-color="#b8830a"/></linearGradient></defs><path d="M30 55 L100 25 L170 55 L170 75 L100 50 L30 75 Z" fill="url(#clG)" stroke="#5a3a00" stroke-width="2.5"/><path d="M30 75 L100 50 L170 75 L160 95 L100 75 L40 95 Z" fill="#4ec5e1" stroke="#5a3a00" stroke-width="2"/><ellipse cx="100" cy="120" rx="38" ry="46" fill="#e8b878" stroke="#3a1808" stroke-width="2"/><ellipse cx="84" cy="115" rx="9" ry="6" fill="#1a0d06"/><ellipse cx="116" cy="115" rx="9" ry="6" fill="#1a0d06"/><circle cx="84" cy="115" r="3" fill="#fff"/><circle cx="116" cy="115" r="3" fill="#fff"/><path d="M75 110 L65 105 M125 110 L135 105" stroke="#1a0d06" stroke-width="2"/><path d="M88 135 Q100 142 112 135" stroke="#d11645" stroke-width="3" fill="none"/><path d="M55 95 L40 105 M145 95 L160 105" stroke="#5a3a00" stroke-width="2"/><polygon points="100,160 96,170 100,175 104,170" fill="#4ec5e1" stroke="#5a3a00" stroke-width="1.5"/></svg>',
  // Frozen Riches - polar bear with snowflake
  frozenRiches: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="brG" cx=".4" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#b8d8f0"/></radialGradient></defs><ellipse cx="100" cy="115" rx="68" ry="54" fill="url(#brG)" stroke="#5a7090" stroke-width="3"/><circle cx="55" cy="80" r="18" fill="url(#brG)" stroke="#5a7090" stroke-width="2.5"/><circle cx="145" cy="80" r="18" fill="url(#brG)" stroke="#5a7090" stroke-width="2.5"/><ellipse cx="100" cy="100" rx="30" ry="22" fill="#e8f0f8"/><circle cx="86" cy="95" r="5" fill="#1a0d06"/><circle cx="114" cy="95" r="5" fill="#1a0d06"/><circle cx="84" cy="93" r="2" fill="#fff"/><circle cx="112" cy="93" r="2" fill="#fff"/><ellipse cx="100" cy="118" rx="8" ry="6" fill="#1a0d06"/><path d="M100 124 Q92 134 100 138 Q108 134 100 124" stroke="#1a0d06" stroke-width="2.5" fill="#5a3a18"/><g fill="#7be8ff" stroke="#fff" stroke-width="1.5"><polygon points="170,30 173,40 180,42 174,48 178,58 170,52 162,58 166,48 160,42 167,40"/></g></svg>',
  // Galaxy Stars - astronaut helmet with stars
  galaxyStars: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="hmG" cx=".4" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#7be8ff"/><stop offset="1" stop-color="#2a5a7a"/></radialGradient></defs><circle cx="100" cy="100" r="58" fill="url(#hmG)" stroke="#1a0d06" stroke-width="3"/><circle cx="100" cy="100" r="42" fill="#0a0a3a" stroke="#1a0d06" stroke-width="2"/><circle cx="85" cy="85" r="14" fill="#fff" opacity=".4"/><circle cx="100" cy="105" r="5" fill="#ffd76b"/><circle cx="115" cy="98" r="3" fill="#ff5fe5"/><circle cx="85" cy="115" r="3" fill="#2dd6f5"/><rect x="76" y="155" width="48" height="10" fill="#a78bff" stroke="#1a0d06" stroke-width="2"/><polygon points="40,50 43,57 50,58 45,63 47,72 40,68 33,72 35,63 30,58 37,57" fill="#fff"/><polygon points="160,40 163,47 170,48 165,53 167,62 160,58 153,62 155,53 150,48 157,47" fill="#ffd76b"/><polygon points="170,140 173,147 180,148 175,153 177,162 170,158 163,162 165,153 160,148 167,147" fill="#7be8ff"/></svg>',
  // Fruit Mania - cherries with leaves
  fruitMania: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ch1" cx=".4" cy=".3"><stop offset="0" stop-color="#ff8aa0"/><stop offset="1" stop-color="#5a0017"/></radialGradient></defs><path d="M50 50 Q100 10 150 50" fill="none" stroke="#3a7a00" stroke-width="5"/><path d="M70 50 L60 40 L80 50 Z" fill="#52ef9f" stroke="#3a7a00" stroke-width="2"/><path d="M130 50 L120 40 L140 50 Z" fill="#52ef9f" stroke="#3a7a00" stroke-width="2"/><circle cx="60" cy="130" r="40" fill="url(#ch1)" stroke="#5a0010" stroke-width="3"/><circle cx="140" cy="135" r="38" fill="url(#ch1)" stroke="#5a0010" stroke-width="3"/><ellipse cx="48" cy="115" rx="10" ry="6" fill="#ffb0c0" opacity=".7"/><ellipse cx="128" cy="120" rx="10" ry="6" fill="#ffb0c0" opacity=".7"/><circle cx="20" cy="60" r="5" fill="#fff45a"/><circle cx="180" cy="65" r="4" fill="#ff7530"/><circle cx="20" cy="160" r="4" fill="#a78bff"/></svg>',
  // Viking Glory - viking head with horned helmet
  vikingGlory: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vkG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#c0c8d0"/><stop offset="1" stop-color="#5a6878"/></linearGradient></defs><path d="M30 80 Q15 50 25 30 Q40 50 50 75 Z" fill="url(#vkG)" stroke="#3a4858" stroke-width="2"/><path d="M170 80 Q185 50 175 30 Q160 50 150 75 Z" fill="url(#vkG)" stroke="#3a4858" stroke-width="2"/><path d="M40 75 L100 50 L160 75 L160 100 L40 100 Z" fill="url(#vkG)" stroke="#3a4858" stroke-width="3"/><rect x="92" y="50" width="16" height="55" fill="url(#vkG)" stroke="#3a4858" stroke-width="2"/><ellipse cx="100" cy="125" rx="38" ry="46" fill="#e8b878" stroke="#3a1808" stroke-width="2"/><circle cx="85" cy="120" r="5" fill="#1a0d06"/><circle cx="115" cy="120" r="5" fill="#1a0d06"/><path d="M75 115 L65 110 M125 115 L135 110" stroke="#3a1808" stroke-width="2.5"/><path d="M75 145 Q100 155 125 145 L120 175 Q100 165 80 175 Z" fill="#c8954a" stroke="#5a3a08" stroke-width="2"/><path d="M82 155 L78 175 M90 158 L85 178 M110 158 L115 178 M118 155 L122 175" stroke="#5a3a08" stroke-width="2"/></svg>',
  // Aztec Empire - sun god mask
  aztecEmpire: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sgG" cx=".5" cy=".5"><stop offset="0" stop-color="#ffd200"/><stop offset="1" stop-color="#b8830a"/></radialGradient></defs><g stroke="#5a3a00" stroke-width="2"><polygon points="100,15 105,30 95,30" fill="url(#sgG)"/><polygon points="100,185 105,170 95,170" fill="url(#sgG)"/><polygon points="15,100 30,95 30,105" fill="url(#sgG)"/><polygon points="185,100 170,95 170,105" fill="url(#sgG)"/><polygon points="40,40 50,50 40,52 50,42 52,40" fill="url(#sgG)"/><polygon points="160,40 150,50 160,52 150,42 148,40" fill="url(#sgG)"/><polygon points="40,160 50,150 40,148 50,158 52,160" fill="url(#sgG)"/><polygon points="160,160 150,150 160,148 150,158 148,160" fill="url(#sgG)"/></g><circle cx="100" cy="100" r="55" fill="url(#sgG)" stroke="#5a3a00" stroke-width="3"/><ellipse cx="80" cy="92" rx="10" ry="7" fill="#1a0d06"/><ellipse cx="120" cy="92" rx="10" ry="7" fill="#1a0d06"/><circle cx="80" cy="92" r="3" fill="#2dd55b"/><circle cx="120" cy="92" r="3" fill="#2dd55b"/><polygon points="100,110 92,118 108,118" fill="#1a0d06"/><path d="M80 130 Q100 140 120 130 L120 140 L80 140 Z" fill="#1a0d06"/><path d="M85 142 L85 148 M95 142 L95 148 M105 142 L105 148 M115 142 L115 148" stroke="#fff" stroke-width="2"/></svg>',
  // Halloween Hunt - jack-o-lantern
  halloweenHunt: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pkG" cx=".5" cy=".5"><stop offset="0" stop-color="#ff8a3a"/><stop offset=".7" stop-color="#ff5630"/><stop offset="1" stop-color="#8b3a0a"/></radialGradient></defs><ellipse cx="100" cy="115" rx="80" ry="65" fill="url(#pkG)" stroke="#5a1f08" stroke-width="3"/><path d="M85 60 L95 75 L105 70 L115 75 L120 50 L100 45 L88 50 Z" fill="#2a6e1f" stroke="#1a4810" stroke-width="2"/><path d="M105 50 Q120 35 115 25" stroke="#2a6e1f" stroke-width="3" fill="none"/><path d="M60 85 L80 75 L80 95 Z" fill="#ffd700" stroke="#1a0d06" stroke-width="2"/><path d="M140 85 L120 75 L120 95 Z" fill="#ffd700" stroke="#1a0d06" stroke-width="2"/><circle cx="70" cy="85" r="4" fill="#1a0d06"/><circle cx="130" cy="85" r="4" fill="#1a0d06"/><path d="M60 130 L80 130 L75 145 L85 138 L90 150 L100 140 L110 150 L115 138 L125 145 L120 130 L140 130" stroke="#ffd700" stroke-width="2" fill="#1a0d06"/><path d="M45 110 L50 105 M40 130 L48 130 M160 110 L155 105 M160 130 L152 130" stroke="#1a0d06" stroke-width="2"/><circle cx="172" cy="35" r="14" fill="#fff8cd" stroke="#b8830a" stroke-width="2"/></svg>',
  // Lucky Charms - leprechaun hat with clover
  luckyCharms: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lpG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2dd55b"/><stop offset="1" stop-color="#0a4a1f"/></linearGradient></defs><rect x="40" y="125" width="120" height="20" rx="3" fill="url(#lpG)" stroke="#1a0d06" stroke-width="2.5"/><rect x="60" y="60" width="80" height="70" rx="6" fill="url(#lpG)" stroke="#1a0d06" stroke-width="3"/><rect x="60" y="120" width="80" height="14" fill="#1a0d06"/><rect x="92" y="120" width="16" height="14" fill="url(#lpG)"/><rect x="92" y="120" width="16" height="14" fill="none" stroke="#ffd200" stroke-width="2"/><rect x="96" y="124" width="8" height="6" fill="#ffd200"/><g transform="translate(100 90)"><circle cx="0" cy="-12" r="10" fill="#52ef9f" stroke="#0a4a1f" stroke-width="2"/><circle cx="-10" cy="0" r="10" fill="#52ef9f" stroke="#0a4a1f" stroke-width="2"/><circle cx="10" cy="0" r="10" fill="#52ef9f" stroke="#0a4a1f" stroke-width="2"/><circle cx="0" cy="12" r="10" fill="#52ef9f" stroke="#0a4a1f" stroke-width="2"/><rect x="-2" y="10" width="4" height="14" fill="#5a3a08"/></g><path d="M165 30 Q180 25 175 50 Q170 60 165 70" stroke="#a78bff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M165 30 L155 50 M170 40 L160 60 M175 50 L165 70" stroke="#ff5fe5" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>',
};


// ============================================================
// SPIN PROFILES - Unique spin feel per theme
// ============================================================
const SPIN_PROFILES = {
  buffalo:   { duration: 1100, stagger: 320, easing: "cubic-bezier(.25,.7,.35,1)",  effect: "dust" },
  kingkong:  { duration: 950,  stagger: 220, easing: "cubic-bezier(.18,.65,.3,1)",  effect: "shake" },
  triple777: { duration: 700,  stagger: 150, easing: "cubic-bezier(.15,.85,.3,1)",  effect: "flash" },
  blackjack: { duration: 850,  stagger: 260, easing: "cubic-bezier(.3,.7,.4,1)",    effect: "smoke" },
  gorilla:   { duration: 1000, stagger: 300, easing: "cubic-bezier(.2,.7,.3,1)",    effect: "drum" },
  wolf:      { duration: 1200, stagger: 380, easing: "cubic-bezier(.25,.8,.35,1)",  effect: "mist" },
  bull:      { duration: 600,  stagger: 110, easing: "cubic-bezier(.1,.9,.3,1)",    effect: "streak" },
  dragon:    { duration: 1100, stagger: 340, easing: "cubic-bezier(.25,.75,.4,1)",  effect: "embers" },
  mammoth:   { duration: 1050, stagger: 380, easing: "cubic-bezier(.2,.65,.3,1)",   effect: "stomp" },
  pharaoh:   { duration: 1000, stagger: 300, easing: "cubic-bezier(.22,.7,.4,1)",   effect: "sand" },
  ocean:     { duration: 950,  stagger: 290, easing: "cubic-bezier(.3,.6,.35,1)",   effect: "wave" },
  vegas:     { duration: 750,  stagger: 200, easing: "cubic-bezier(.15,.85,.3,1)",  effect: "neon" },
  panda88:    { duration: 1050, stagger: 320, easing: "cubic-bezier(.22,.7,.35,1)",  effect: "lantern" },
  lion:       { duration: 1100, stagger: 350, easing: "cubic-bezier(.2,.7,.35,1)",   effect: "savannah" },
  pirate:     { duration: 980,  stagger: 290, easing: "cubic-bezier(.25,.7,.3,1)",   effect: "splash" },
  zeus:       { duration: 900,  stagger: 240, easing: "cubic-bezier(.18,.7,.3,1)",   effect: "lightning" },
  cleopatra:  { duration: 1050, stagger: 310, easing: "cubic-bezier(.22,.7,.4,1)",   effect: "sandgold" },
  arctic:     { duration: 1150, stagger: 360, easing: "cubic-bezier(.25,.8,.35,1)",  effect: "snow" },
  galaxy:     { duration: 850,  stagger: 200, easing: "cubic-bezier(.15,.85,.3,1)",  effect: "starburst" },
  fruit:      { duration: 700,  stagger: 160, easing: "cubic-bezier(.15,.85,.3,1)",  effect: "fruitpop" },
  viking:     { duration: 1050, stagger: 330, easing: "cubic-bezier(.2,.7,.3,1)",    effect: "axehit" },
  aztec:      { duration: 1100, stagger: 340, easing: "cubic-bezier(.25,.75,.4,1)",  effect: "templefire" },
  halloween:  { duration: 1100, stagger: 360, easing: "cubic-bezier(.25,.8,.4,1)",   effect: "spook" },
  irish:      { duration: 920,  stagger: 270, easing: "cubic-bezier(.18,.7,.3,1)",   effect: "rainbow" },
};
function getSpinProfile(game) {
  return SPIN_PROFILES[game.theme] || { duration: 900, stagger: 280, easing: "cubic-bezier(.18,.65,.25,1)", effect: "default" };
}

// ============================================================
// 2) PAYLINE PATTERNS
// ============================================================
const PAYLINES_5x3 = [
  [1,1,1,1,1], // 1: middle
  [0,0,0,0,0], // 2: top
  [2,2,2,2,2], // 3: bottom
  [0,1,2,1,0], // 4: V
  [2,1,0,1,2], // 5: ^
  [0,0,1,2,2], // 6: down stair
  [2,2,1,0,0], // 7: up stair
  [1,0,0,0,1], // 8: U-top
  [1,2,2,2,1], // 9: U-bot
  [0,1,1,1,0], // 10
  [2,1,1,1,2], // 11
  [1,0,1,2,1], // 12
  [1,2,1,0,1], // 13
  [0,2,0,2,0], // 14
  [2,0,2,0,2], // 15
  [0,1,0,1,0], // 16
  [2,1,2,1,2], // 17
  [1,1,0,1,1], // 18
  [1,1,2,1,1], // 19
  [0,0,2,0,0], // 20
  [2,2,0,2,2], // 21
  [1,0,2,0,1], // 22
  [1,2,0,2,1], // 23
  [0,2,2,2,0], // 24
  [2,0,0,0,2], // 25
];

const PAYLINES_5x3_50 = [
  ...PAYLINES_5x3,
  [0,1,2,2,1], [2,1,0,0,1], [1,0,1,1,2], [1,2,1,1,0], [0,2,1,0,1],
  [2,0,1,2,1], [0,1,2,0,2], [2,1,0,2,0], [1,0,0,1,2], [1,2,2,1,0],
  [0,0,1,1,2], [2,2,1,1,0], [0,1,0,2,2], [2,1,2,0,0], [1,0,2,2,0],
  [1,2,0,0,2], [0,2,1,2,0], [2,0,1,0,2], [0,0,0,1,2], [2,2,2,1,0],
  [0,1,1,2,2], [2,1,1,0,0], [1,1,0,0,1], [1,1,2,2,1], [0,2,2,1,0],
];

const PAYLINES_3x3 = [
  [1,1,1], [0,0,0], [2,2,2], [0,1,2], [2,1,0]
];

const PAYLINES_5x4 = [
  [1,1,1,1,1],[2,2,2,2,2],[0,0,0,0,0],[3,3,3,3,3],
  [0,1,2,1,0],[3,2,1,2,3],[1,0,0,0,1],[2,3,3,3,2],
  [0,1,1,1,0],[3,2,2,2,3],[1,2,1,2,1],[2,1,2,1,2],
  [0,1,2,3,3],[3,2,1,0,0],[1,2,3,2,1],[2,1,0,1,2],
  [0,2,0,2,0],[3,1,3,1,3],[1,1,2,1,1],[2,2,1,2,2]
];

// ============================================================
// 3) GAME REGISTRY - 12 distinct slot games
// ============================================================
const GAMES = {
  // =========================================================
  // 1. WILD BUFFALO - Western prairie
  // =========================================================
  wildBuffalo: {
    rtpScale: 4.92,
    layout: "mascot-watermark",
    title: "Wild Buffalo",
    tagline: "Stampede Across the Plains",
    theme: "buffalo",
    accent: "#ff8533",
    accent2: "#ffd76b",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "&#129708;", // 🦬
    sceneClass: "scene-prairie",
    bgEmoji: ["&#127956;","&#127797;","&#127765;","&#9728;&#65039;"], // mountain, cactus, sun-elements
    music: { tempo: 140, scale: [196,247,294,330,392,440] },
    symbols: {
      WILD:    { ...imageSym("assets/slots/buffalo/wild.png","WILD"), weight: 3, pay: [0,0,0,50,100,500], wild: true },
      SCATTER: { ...imageSym("assets/slots/buffalo/bonus.png","BONUS"), weight: 2, pay: [0,0,0,5,20,100], scatter: true },
      BUFFALO: { ...imageSym("assets/slots/buffalo/buffalo.png","BUFFALO"), weight: 6, pay: [0,0,0,30,80,300] },
      EAGLE:   { ...imageSym("assets/slots/buffalo/eagle.png","EAGLE"), weight: 8, pay: [0,0,0,20,50,200] },
      SHERIFF: { ...imageSym("assets/slots/buffalo/wolf.png","WOLF"), weight: 10, pay: [0,0,0,15,40,150] },
      MONEY:   { ...imageSym("assets/slots/buffalo/mesa.png","MESA"), weight: 10, pay: [0,0,0,10,30,100] },
      A:       { ...imageSym("assets/slots/buffalo/a.png","A"), weight: 14, pay: [0,0,0,5,15,50] },
      K:       { ...imageSym("assets/slots/buffalo/k.png","K"), weight: 14, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","BUFFALO","EAGLE","SHERIFF","MONEY","A","K"],
  },

  // =========================================================
  // 2. KING KONG - Skyscraper city
  // =========================================================
  kingKong: {
    rtpScale: 3.43,
    layout: "mascot-watermark",
    title: "King Kong",
    tagline: "Roar on Top of the World",
    theme: "kingkong",
    accent: "#ff3030",
    accent2: "#1a0d06",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "&#129421;", // 🦍
    sceneClass: "scene-skyscraper",
    bgEmoji: ["&#127968;","&#127747;","&#127769;","&#9889;"],
    music: { tempo: 110, scale: [110,131,165,196,220,247,294] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,75,150,750], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,20,100], scatter: true },
      KONG:    { ...emojiSym("&#129421;","KONG"), weight: 5, pay: [0,0,0,50,120,500] },
      CITY:    { ...emojiSym("&#127968;","CITY"), weight: 8, pay: [0,0,0,30,80,300] },
      PLANE:   { ...emojiSym("&#9992;&#65039;","PLANE"), weight: 10, pay: [0,0,0,20,50,200] },
      BANANA:  { ...emojiSym("&#127820;","BANANA"), weight: 12, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,5,15,60] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,5,12,50] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,4,10,40] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,3,8,30] },
    },
    paytableOrder: ["WILD","KONG","CITY","PLANE","BANANA","A","K"],
  },

  // =========================================================
  // 3. TRIPLE 777 - Classic Vegas 3x3
  // =========================================================
  triple777: {
    rtpScale: 0.361,
    layout: "classic-compact",
    title: "Triple 777",
    tagline: "Classic Sevens, Classic Wins",
    theme: "triple777",
    accent: "#ff2540",
    accent2: "#ffd76b",
    rows: 3, reels: 3, paylines: PAYLINES_3x3,
    mascot: '<span style="font-family:Impact;color:#ffd76b;text-shadow:0 0 12px #ff2540">777</span>',
    sceneClass: "scene-classic-vegas",
    bgEmoji: ["&#127920;","&#11088;","&#128176;","&#127922;"],
    music: { tempo: 160, scale: [262,330,392,523,659] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 4, pay: [0,0,200,0,0,0], wild: true },
      SEVEN:   { ...svgSym("SEVEN","7"), weight: 4, pay: [0,0,500,0,0,0] },
      BAR3:    { ...svgSym("BAR3","BAR x3"), weight: 6, pay: [0,0,150,0,0,0] },
      BAR2:    { ...svgSym("BAR2","BAR x2"), weight: 8, pay: [0,0,80,0,0,0] },
      BAR:     { ...svgSym("BAR","BAR"), weight: 10, pay: [0,0,40,0,0,0] },
      BELL:    { ...svgSym("BELL","BELL"), weight: 12, pay: [0,0,25,0,0,0] },
      CHERRY:  { ...svgSym("CHERRY","CHERRY"), weight: 14, pay: [0,2,10,0,0,0] },
      STAR:    { ...svgSym("STAR","STAR"), weight: 14, pay: [0,0,15,0,0,0] },
    },
    paytableOrder: ["WILD","SEVEN","BAR3","BAR2","BAR","BELL","STAR","CHERRY"],
  },

  // =========================================================
  // 4. BLACK JACK SLOTS - Casino table green
  // =========================================================
  blackjack: {
    rtpScale: 1.78,
    layout: "table-felt",
    title: "Black Jack Slots",
    tagline: "House Style, Slot Action",
    theme: "blackjack",
    accent: "#2dd55b",
    accent2: "#ffd76b",
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 20),
    mascot: '<span style="font-size:1.2em">&#9824;&#65039;</span>',
    sceneClass: "scene-table",
    bgEmoji: ["&#127183;","&#127185;","&#127187;","&#127189;"],
    music: { tempo: 90, scale: [220,277,330,415,494] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,25,150], scatter: true },
      SPADE:   { ...svgSym("SPADE","SPADE"), weight: 7, pay: [0,0,0,40,100,400] },
      HEART:   { ...svgSym("HEART","HEART"), weight: 7, pay: [0,0,0,40,100,400] },
      DIA:     { ...svgSym("DIAMOND_SUIT","DIAMOND"), weight: 8, pay: [0,0,0,30,80,300] },
      CLUB:    { ...svgSym("CLUB","CLUB"), weight: 8, pay: [0,0,0,30,80,300] },
      A:       { ...svgSym("CARD_A","A"), weight: 12, pay: [0,0,0,15,40,150] },
      K:       { ...svgSym("CARD_K","K"), weight: 12, pay: [0,0,0,12,35,125] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 14, pay: [0,0,0,8,25,90] },
      J:       { ...svgSym("CARD_J","J"), weight: 14, pay: [0,0,0,6,20,70] },
    },
    paytableOrder: ["WILD","SPADE","HEART","DIA","CLUB","A","K"],
  },

  // =========================================================
  // 5. GORILLA GOLD - Jungle ruins 5x4
  // =========================================================
  gorillaGold: {
    rtpScale: 2.78,
    layout: "mascot-watermark",
    title: "Gorilla Gold",
    tagline: "Find the Lost Temple Treasure",
    theme: "gorilla",
    accent: "#ffd200",
    accent2: "#2dd55b",
    rows: 4, reels: 5, paylines: PAYLINES_5x4,
    mascot: "&#129421;",
    sceneClass: "scene-jungle",
    bgEmoji: ["&#127796;","&#129716;","&#127797;","&#128293;"],
    music: { tempo: 100, scale: [165,196,247,294,330,392] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,25,200], scatter: true },
      GORILLA: { ...emojiSym("&#129421;","GORILLA"), weight: 5, pay: [0,0,0,60,150,600] },
      IDOL:    { ...emojiSym("&#129720;","IDOL"), weight: 7, pay: [0,0,0,40,100,400] },
      GEM:     { ...svgSym("DIAMOND","GEM"), weight: 9, pay: [0,0,0,25,70,250] },
      PALM:    { ...emojiSym("&#127796;","PALM"), weight: 11, pay: [0,0,0,15,45,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 13, pay: [0,0,0,8,25,80] },
      K:       { ...svgSym("CARD_K","K"), weight: 13, pay: [0,0,0,6,20,70] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 15, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 15, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","GORILLA","IDOL","GEM","PALM","A","K"],
  },

  // =========================================================
  // 6. GOLD WOLF - Snowy night
  // =========================================================
  goldWolf: {
    rtpScale: 3.12,
    layout: "mascot-watermark",
    title: "Gold Wolf",
    tagline: "Howling Riches Under the Moon",
    theme: "wolf",
    accent: "#95e3ff",
    accent2: "#ffd76b",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "&#128058;",
    sceneClass: "scene-snow",
    bgEmoji: ["&#127956;","&#10052;&#65039;","&#127794;","&#127769;"],
    music: { tempo: 80, scale: [147,196,247,294,330,392] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,80,200,800], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,25,150], scatter: true },
      WOLF:    { ...emojiSym("&#128058;","WOLF"), weight: 5, pay: [0,0,0,50,125,500] },
      MOON:    { ...emojiSym("&#127769;","MOON"), weight: 8, pay: [0,0,0,30,75,300] },
      SNOW:    { ...emojiSym("&#10052;&#65039;","SNOW"), weight: 10, pay: [0,0,0,20,50,200] },
      PINE:    { ...emojiSym("&#127794;","PINE"), weight: 12, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","WOLF","MOON","SNOW","PINE","A","K"],
  },

  // =========================================================
  // 7. WILD BULL - Western 3x3
  // =========================================================
  wildBull: {
    rtpScale: 0.385,
    layout: "classic-compact",
    title: "Wild Bull",
    tagline: "Sheriff's 777 Showdown",
    theme: "bull",
    accent: "#ffd95e",
    accent2: "#ff5630",
    rows: 3, reels: 3, paylines: PAYLINES_3x3,
    mascot: "&#128002;",
    sceneClass: "scene-rodeo",
    bgEmoji: ["&#127956;","&#127797;","&#129508;"],
    music: { tempo: 130, scale: [196,247,294,330,392,494] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,500,0,0,0], wild: true },
      BULL:    { ...emojiSym("&#128002;","BULL"), weight: 5, pay: [0,0,250,0,0,0] },
      SHERIFF: { ...emojiSym("&#11088;","SHERIFF"), weight: 7, pay: [0,0,120,0,0,0] },
      SEVEN:   { ...svgSym("SEVEN","7"), weight: 7, pay: [0,0,100,0,0,0] },
      BAR3:    { ...svgSym("BAR3","BAR x3"), weight: 9, pay: [0,0,80,0,0,0] },
      BAR2:    { ...svgSym("BAR2","BAR x2"), weight: 11, pay: [0,0,50,0,0,0] },
      BAR:     { ...svgSym("BAR","BAR"), weight: 13, pay: [0,0,25,0,0,0] },
      HORSE:   { ...svgSym("HORSESHOE","HORSESHOE"), weight: 15, pay: [0,0,15,0,0,0] },
    },
    paytableOrder: ["WILD","BULL","SHERIFF","SEVEN","BAR3","BAR2","BAR","HORSE"],
  },

  // =========================================================
  // 8. DRAGON EMPRESS - Asian temple
  // =========================================================
  dragonEmpress: {
    rtpScale: 2.93,
    layout: "mascot-watermark",
    title: "Dragon Empress",
    tagline: "Lucky Lantern Fortune",
    theme: "dragon",
    accent: "#d4002a",
    accent2: "#ffd200",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "&#128009;",
    sceneClass: "scene-temple",
    bgEmoji: ["&#127982;","&#128293;","&#127777;","&#128241;"],
    music: { tempo: 95, scale: [262,294,349,392,440,523] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,25,200], scatter: true },
      DRAGON:  { ...emojiSym("&#128009;","DRAGON"), weight: 5, pay: [0,0,0,60,150,600] },
      LANTERN: { ...emojiSym("&#127982;","LANTERN"), weight: 7, pay: [0,0,0,40,100,400] },
      INGOT:   { ...svgSym("GOLD_COIN","GOLD"), weight: 9, pay: [0,0,0,25,70,250] },
      FAN:     { ...emojiSym("&#128241;","FAN"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","DRAGON","LANTERN","INGOT","FAN","A","K"],
  },

  // =========================================================
  // 9. MAMMOTH RUSH - Ice age 5x4
  // =========================================================
  mammothRush: {
    rtpScale: 2.63,
    layout: "mascot-watermark",
    title: "Mammoth Rush",
    tagline: "Stampede From the Ice Age",
    theme: "mammoth",
    accent: "#5dcef0",
    accent2: "#ffd76b",
    rows: 4, reels: 5, paylines: PAYLINES_5x4,
    mascot: "&#129507;",
    sceneClass: "scene-iceage",
    bgEmoji: ["&#127956;","&#10052;&#65039;","&#127794;","&#10052;&#65039;"],
    music: { tempo: 85, scale: [131,165,196,247,294,330] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1500], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,30,300], scatter: true },
      MAMMOTH: { ...emojiSym("&#129507;","MAMMOTH"), weight: 4, pay: [0,0,0,75,200,800] },
      DEER:    { ...emojiSym("&#129420;","STAG"), weight: 7, pay: [0,0,0,40,100,400] },
      EAGLE:   { ...emojiSym("&#129413;","EAGLE"), weight: 9, pay: [0,0,0,25,70,250] },
      WOLF:    { ...emojiSym("&#128058;","WOLF"), weight: 11, pay: [0,0,0,20,50,180] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,25,80] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,20,70] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      "10":    { ...svgSym("CARD_10","10"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","MAMMOTH","DEER","EAGLE","WOLF","A","K"],
  },

  // =========================================================
  // 10. PHARAOH'S RICHES - Egypt
  // =========================================================
  pharaoh: {
    rtpScale: 3.03,
    layout: "mascot-watermark",
    title: "Pharaoh's Riches",
    tagline: "Treasure of the Sand Kings",
    theme: "pharaoh",
    accent: "#f7c000",
    accent2: "#0890b8",
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 20),
    mascot: "&#129501;",
    sceneClass: "scene-egypt",
    bgEmoji: ["&#127956;","&#129501;","&#128330;","&#9728;&#65039;"],
    music: { tempo: 105, scale: [185,247,294,370,440,494] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,25,200], scatter: true },
      PHARAOH: { ...emojiSym("&#129501;","PHARAOH"), weight: 5, pay: [0,0,0,55,140,550] },
      COBRA:   { ...emojiSym("&#128013;","COBRA"), weight: 7, pay: [0,0,0,35,90,350] },
      SCARAB:  { ...emojiSym("&#128030;","SCARAB"), weight: 9, pay: [0,0,0,25,65,225] },
      URN:     { ...emojiSym("&#127992;","URN"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","PHARAOH","COBRA","SCARAB","URN","A","K"],
  },

  // =========================================================
  // 11. OCEAN TREASURE - Underwater
  // =========================================================
  oceanTreasure: {
    rtpScale: 2.9,
    layout: "mascot-watermark",
    title: "Ocean Treasure",
    tagline: "Deep Sea Mega Wins",
    theme: "ocean",
    accent: "#00b4d8",
    accent2: "#ffd76b",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "&#129416;",
    sceneClass: "scene-ocean",
    bgEmoji: ["&#127754;","&#128031;","&#129408;","&#129410;"],
    music: { tempo: 90, scale: [196,247,294,330,392,440] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,80,200,900], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,25,150], scatter: true },
      SHARK:   { ...emojiSym("&#129416;","SHARK"), weight: 5, pay: [0,0,0,50,125,500] },
      OCTOPUS: { ...emojiSym("&#129425;","OCTOPUS"), weight: 7, pay: [0,0,0,35,90,360] },
      FISH:    { ...emojiSym("&#129418;","FISH"), weight: 9, pay: [0,0,0,25,65,240] },
      CRAB:    { ...emojiSym("&#129408;","CRAB"), weight: 11, pay: [0,0,0,15,40,140] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","SHARK","OCTOPUS","FISH","CRAB","A","K"],
  },

  // =========================================================
  // 12. VEGAS 7s - Neon city 3x3
  // =========================================================
  vegas7s: {
    rtpScale: 0.439,
    layout: "classic-compact",
    title: "Vegas 7s",
    tagline: "Hot Neon Wins",
    theme: "vegas",
    accent: "#ff5fe5",
    accent2: "#7be8ff",
    rows: 3, reels: 3, paylines: PAYLINES_3x3,
    mascot: '<span style="font-family:Impact;color:#ff5fe5;text-shadow:0 0 12px #ff5fe5">VEGAS</span>',
    sceneClass: "scene-neon",
    bgEmoji: ["&#127914;","&#11088;","&#127920;","&#127922;"],
    music: { tempo: 155, scale: [277,330,392,494,587] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,300,0,0,0], wild: true },
      SEVEN:   { ...svgSym("SEVEN","HOT 7"), weight: 5, pay: [0,0,500,0,0,0] },
      DIAMOND: { ...svgSym("DIAMOND","GEM"), weight: 7, pay: [0,0,150,0,0,0] },
      BAR3:    { ...svgSym("BAR3","BAR x3"), weight: 9, pay: [0,0,100,0,0,0] },
      BAR2:    { ...svgSym("BAR2","BAR x2"), weight: 11, pay: [0,0,60,0,0,0] },
      BAR:     { ...svgSym("BAR","BAR"), weight: 13, pay: [0,0,30,0,0,0] },
      BELL:    { ...svgSym("BELL","BELL"), weight: 15, pay: [0,0,20,0,0,0] },
      CHERRY:  { ...svgSym("CHERRY","CHERRY"), weight: 15, pay: [0,2,12,0,0,0] },
    },
    paytableOrder: ["WILD","SEVEN","DIAMOND","BAR3","BAR2","BAR","BELL","CHERRY"],
  },

  // =========================================================
  // 13. LUCKY PANDA 88 - Asian fortune
  // =========================================================
  luckyPanda: {
    rtpScale: 2.64,
    layout: "mascot-watermark",
    title: "Lucky Panda 88",
    tagline: "Bamboo Fortune Awaits",
    theme: "panda88",
    accent: "#e8222e",
    accent2: "#ffd200",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\uD83D\uDC3C",
    sceneClass: "scene-panda",
    bgEmoji: ["\uD83C\uDF8B","\uD83C\uDFEE","\uD83E\uDD8C","\u9670\uFE0F"],
    music: { tempo: 95, scale: [262, 294, 349, 392, 440, 523] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD PANDA"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","FORTUNE"), weight: 2, pay: [0,0,0,5,25,150], scatter: true },
      PANDA:   { ...emojiSym("\uD83D\uDC3C","PANDA"), weight: 5, pay: [0,0,0,60,150,600] },
      INGOT:   { ...svgSym("GOLD_COIN","INGOT"), weight: 7, pay: [0,0,0,40,100,400] },
      LANTERN: { ...emojiSym("\uD83C\uDFEE","LANTERN"), weight: 9, pay: [0,0,0,25,65,225] },
      BAMBOO:  { ...emojiSym("\uD83C\uDF8B","BAMBOO"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","PANDA","INGOT","LANTERN","BAMBOO","A","K"],
  },

  // =========================================================
  // 14. LION'S PRIDE - African safari
  // =========================================================
  lionsPride: {
    rtpScale: 2.65,
    layout: "mascot-watermark",
    title: "Lion's Pride",
    tagline: "Roar of the Savanna",
    theme: "lion",
    accent: "#ff7530",
    accent2: "#ffce6a",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\uD83E\uDD81",
    sceneClass: "scene-savanna",
    bgEmoji: ["\uD83E\uDD8A","\uD83D\uDC18","\uD83E\uDD92","\u2600\uFE0F"],
    music: { tempo: 90, scale: [98, 131, 165, 196, 247, 294] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,90,220,900], wild: true },
      SCATTER: { ...svgSym("SCATTER","SUN"), weight: 2, pay: [0,0,0,5,25,150], scatter: true },
      LION:    { ...emojiSym("\uD83E\uDD81","LION"), weight: 5, pay: [0,0,0,55,140,550] },
      ELEPHANT:{ ...emojiSym("\uD83D\uDC18","ELEPHANT"), weight: 7, pay: [0,0,0,35,90,360] },
      GIRAFFE: { ...emojiSym("\uD83E\uDD92","GIRAFFE"), weight: 9, pay: [0,0,0,25,65,240] },
      ZEBRA:   { ...emojiSym("\uD83E\uDD8C","ZEBRA"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","LION","ELEPHANT","GIRAFFE","ZEBRA","A","K"],
  },

  // =========================================================
  // 15. PIRATE'S TREASURE - Pirate ship
  // =========================================================
  piratesTreasure: {
    rtpScale: 2.63,
    layout: "mascot-top",
    title: "Pirate's Treasure",
    tagline: "Plunder the Seas",
    theme: "pirate",
    accent: "#b88a3a",
    accent2: "#d4002a",
    rows: 4, reels: 5, paylines: PAYLINES_5x4,
    mascot: "\u2620\uFE0F",
    sceneClass: "scene-pirate",
    bgEmoji: ["\u26F5","\u2693","\u26A1","\uD83D\uDC99"],
    music: { tempo: 110, scale: [196, 233, 277, 329, 392, 466] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","CHEST"), weight: 2, pay: [0,0,0,5,30,250], scatter: true },
      SHIP:    { ...emojiSym("\u26F5","SHIP"), weight: 5, pay: [0,0,0,60,150,600] },
      SKULL:   { ...emojiSym("\u2620\uFE0F","SKULL"), weight: 7, pay: [0,0,0,40,100,400] },
      ANCHOR:  { ...emojiSym("\u2693","ANCHOR"), weight: 9, pay: [0,0,0,25,65,250] },
      PARROT:  { ...emojiSym("\uD83E\uDD9C","PARROT"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,25,80] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,20,70] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","SHIP","SKULL","ANCHOR","PARROT","A","K"],
  },

  // =========================================================
  // 16. ZEUS THUNDER - Greek gods
  // =========================================================
  zeusThunder: {
    rtpScale: 2.61,
    layout: "mascot-watermark",
    title: "Zeus Thunder",
    tagline: "Olympian Lightning",
    theme: "zeus",
    accent: "#2dd6f5",
    accent2: "#ffd76b",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\u26A1",
    sceneClass: "scene-olympus",
    bgEmoji: ["\u26A1","\u2601\uFE0F","\uD83C\uDFDB\uFE0F","\uD83D\uDC09"],
    music: { tempo: 105, scale: [196, 247, 294, 392, 494, 587] },
    symbols: {
      WILD:    { ...svgSym("WILD","ZEUS"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","BOLT"), weight: 2, pay: [0,0,0,5,30,200], scatter: true },
      EAGLE:   { ...emojiSym("\uD83E\uDD85","EAGLE"), weight: 5, pay: [0,0,0,55,140,550] },
      HELMET:  { ...emojiSym("\uD83E\uDE96","HELMET"), weight: 7, pay: [0,0,0,35,90,350] },
      TEMPLE:  { ...emojiSym("\uD83C\uDFDB\uFE0F","TEMPLE"), weight: 9, pay: [0,0,0,25,65,225] },
      VASE:    { ...emojiSym("\uD83C\uDFFA","VASE"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","EAGLE","HELMET","TEMPLE","VASE","A","K"],
  },

  // =========================================================
  // 17. CLEOPATRA DIAMONDS - Egyptian queen
  // =========================================================
  cleopatra: {
    rtpScale: 2.42,
    layout: "mascot-watermark",
    title: "Cleopatra Diamonds",
    tagline: "Queen of the Nile",
    theme: "cleopatra",
    accent: "#ffd200",
    accent2: "#4ec5e1",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\uD83D\uDC51",
    sceneClass: "scene-cleo",
    bgEmoji: ["\uD83D\uDC51","\uD83D\uDD3A","\uD83D\uDC0D","\u2600\uFE0F"],
    music: { tempo: 95, scale: [196, 233, 277, 311, 349, 415] },
    symbols: {
      WILD:    { ...svgSym("WILD","CLEO"), weight: 3, pay: [0,0,0,110,275,1100], wild: true },
      SCATTER: { ...svgSym("SCATTER","ANKH"), weight: 2, pay: [0,0,0,5,30,200], scatter: true },
      DIAMOND: { ...svgSym("DIAMOND","DIAMOND"), weight: 5, pay: [0,0,0,60,150,600] },
      SCARAB:  { ...emojiSym("\uD83D\uDC1E","SCARAB"), weight: 7, pay: [0,0,0,40,100,400] },
      COBRA:   { ...emojiSym("\uD83D\uDC0D","COBRA"), weight: 9, pay: [0,0,0,25,65,225] },
      SARCOPH: { ...emojiSym("\uD83C\uDFFA","SARCO"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","DIAMOND","SCARAB","COBRA","SARCOPH","A","K"],
  },

  // =========================================================
  // 18. FROZEN RICHES - Arctic ice
  // =========================================================
  frozenRiches: {
    rtpScale: 2.65,
    layout: "mascot-watermark",
    title: "Frozen Riches",
    tagline: "Icy Cold Cash",
    theme: "arctic",
    accent: "#5dd0f5",
    accent2: "#c8e8ff",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\uD83D\uDC3B\u200D\u2744\uFE0F",
    sceneClass: "scene-arctic",
    bgEmoji: ["\u2744\uFE0F","\uD83C\uDFD4\uFE0F","\uD83D\uDC27","\uD83D\uDC1F"],
    music: { tempo: 78, scale: [392, 466, 523, 587, 698, 784] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,90,220,900], wild: true },
      SCATTER: { ...svgSym("SCATTER","FLAKE"), weight: 2, pay: [0,0,0,5,30,200], scatter: true },
      BEAR:    { ...emojiSym("\uD83D\uDC3B\u200D\u2744\uFE0F","POLAR"), weight: 5, pay: [0,0,0,55,140,550] },
      PENGUIN: { ...emojiSym("\uD83D\uDC27","PENGUIN"), weight: 7, pay: [0,0,0,35,90,350] },
      FISH:    { ...emojiSym("\uD83D\uDC1F","FISH"), weight: 9, pay: [0,0,0,25,65,225] },
      IGLOO:   { ...emojiSym("\uD83C\uDFD4\uFE0F","IGLOO"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","BEAR","PENGUIN","FISH","IGLOO","A","K"],
  },

  // =========================================================
  // 19. GALAXY STARS - Deep space
  // =========================================================
  galaxyStars: {
    rtpScale: 2.7,
    layout: "mascot-top",
    title: "Galaxy Stars",
    tagline: "Reach for the Cosmos",
    theme: "galaxy",
    accent: "#a78bff",
    accent2: "#2dd6f5",
    rows: 4, reels: 5, paylines: PAYLINES_5x4,
    mascot: "\uD83D\uDE80",
    sceneClass: "scene-galaxy",
    bgEmoji: ["\u2728","\uD83C\uDF1F","\uD83E\uDE90","\uD83D\uDC7D"],
    music: { tempo: 130, scale: [220, 277, 330, 415, 494, 622] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1500], wild: true },
      SCATTER: { ...svgSym("SCATTER","NEBULA"), weight: 2, pay: [0,0,0,5,30,300], scatter: true },
      ALIEN:   { ...emojiSym("\uD83D\uDC7D","ALIEN"), weight: 5, pay: [0,0,0,60,150,600] },
      ROCKET:  { ...emojiSym("\uD83D\uDE80","ROCKET"), weight: 7, pay: [0,0,0,40,100,400] },
      PLANET:  { ...emojiSym("\uD83E\uDE90","PLANET"), weight: 9, pay: [0,0,0,25,65,250] },
      STAR:    { ...svgSym("STAR","STAR"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,25,80] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,20,70] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      "10":    { ...svgSym("CARD_10","10"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","ALIEN","ROCKET","PLANET","STAR","A","K"],
  },

  // =========================================================
  // 20. FRUIT MANIA - Classic fruit machine 3x3
  // =========================================================
  fruitMania: {
    rtpScale: 0.363,
    layout: "classic-compact",
    title: "Fruit Mania",
    tagline: "Classic Fruit Frenzy",
    theme: "fruit",
    accent: "#ff5630",
    accent2: "#fff45a",
    rows: 3, reels: 3, paylines: PAYLINES_3x3,
    mascot: "\uD83C\uDF52",
    sceneClass: "scene-fruit",
    bgEmoji: ["\uD83C\uDF52","\uD83C\uDF4B","\uD83C\uDF4A","\uD83C\uDF49"],
    music: { tempo: 145, scale: [262, 330, 392, 494, 587, 698] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,400,0,0,0], wild: true },
      SEVEN:   { ...svgSym("SEVEN","777"), weight: 5, pay: [0,0,500,0,0,0] },
      BAR3:    { ...svgSym("BAR3","BAR x3"), weight: 7, pay: [0,0,200,0,0,0] },
      WATERMELON: { ...emojiSym("\uD83C\uDF49","MELON"), weight: 9, pay: [0,0,100,0,0,0] },
      PLUM:    { ...emojiSym("\uD83C\uDF47","PLUM"), weight: 11, pay: [0,0,60,0,0,0] },
      ORANGE:  { ...emojiSym("\uD83C\uDF4A","ORANGE"), weight: 13, pay: [0,0,40,0,0,0] },
      LEMON:   { ...emojiSym("\uD83C\uDF4B","LEMON"), weight: 14, pay: [0,0,25,0,0,0] },
      CHERRY:  { ...svgSym("CHERRY","CHERRY"), weight: 15, pay: [0,3,15,0,0,0] },
    },
    paytableOrder: ["WILD","SEVEN","BAR3","WATERMELON","PLUM","ORANGE","LEMON","CHERRY"],
  },

  // =========================================================
  // 21. VIKING GLORY - Norse warriors
  // =========================================================
  vikingGlory: {
    rtpScale: 2.77,
    layout: "mascot-top",
    title: "Viking Glory",
    tagline: "Battle for Valhalla",
    theme: "viking",
    accent: "#4682b4",
    accent2: "#ffd76b",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\u2694\uFE0F",
    sceneClass: "scene-viking",
    bgEmoji: ["\u26F5","\u2694\uFE0F","\uD83D\uDEE1\uFE0F","\uD83D\uDC3A"],
    music: { tempo: 100, scale: [147, 175, 196, 233, 262, 311] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","HAMMER"), weight: 2, pay: [0,0,0,5,30,200], scatter: true },
      VIKING:  { ...emojiSym("\uD83E\uDDD4","VIKING"), weight: 5, pay: [0,0,0,55,140,550] },
      AXE:     { ...emojiSym("\u2694\uFE0F","AXE"), weight: 7, pay: [0,0,0,40,100,400] },
      SHIELD:  { ...emojiSym("\uD83D\uDEE1\uFE0F","SHIELD"), weight: 9, pay: [0,0,0,25,65,225] },
      WOLF:    { ...emojiSym("\uD83D\uDC3A","WOLF"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","VIKING","AXE","SHIELD","WOLF","A","K"],
  },

  // =========================================================
  // 22. AZTEC EMPIRE - Mayan ruins
  // =========================================================
  aztecEmpire: {
    rtpScale: 2.53,
    layout: "mascot-watermark",
    title: "Aztec Empire",
    tagline: "Lost City Riches",
    theme: "aztec",
    accent: "#2dd55b",
    accent2: "#ffd200",
    rows: 4, reels: 5, paylines: PAYLINES_5x4,
    mascot: "\u2600\uFE0F",
    sceneClass: "scene-aztec",
    bgEmoji: ["\uD83C\uDFEF","\u2600\uFE0F","\uD83D\uDC06","\uD83C\uDF34"],
    music: { tempo: 100, scale: [165, 175, 196, 220, 247, 294] },
    symbols: {
      WILD:    { ...svgSym("WILD","SUN GOD"), weight: 3, pay: [0,0,0,110,275,1100], wild: true },
      SCATTER: { ...svgSym("SCATTER","SKULL"), weight: 2, pay: [0,0,0,5,30,250], scatter: true },
      JAGUAR:  { ...emojiSym("\uD83D\uDC06","JAGUAR"), weight: 5, pay: [0,0,0,60,150,600] },
      EAGLE:   { ...emojiSym("\uD83E\uDD85","EAGLE"), weight: 7, pay: [0,0,0,40,100,400] },
      IDOL:    { ...emojiSym("\uD83C\uDFEF","IDOL"), weight: 9, pay: [0,0,0,25,65,250] },
      PALM:    { ...emojiSym("\uD83C\uDF34","PALM"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,25,80] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,20,70] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      "10":    { ...svgSym("CARD_10","10"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","JAGUAR","EAGLE","IDOL","PALM","A","K"],
  },

  // =========================================================
  // 23. HALLOWEEN HUNT - Spooky night
  // =========================================================
  halloweenHunt: {
    rtpScale: 2.77,
    layout: "mascot-watermark",
    title: "Halloween Hunt",
    tagline: "Trick or Treasure",
    theme: "halloween",
    accent: "#ff7530",
    accent2: "#9c5cff",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\uD83C\uDF83",
    sceneClass: "scene-halloween",
    bgEmoji: ["\uD83D\uDC7B","\uD83E\uDDD9\u200D\u2640\uFE0F","\uD83E\uDD87","\uD83C\uDF83"],
    music: { tempo: 80, scale: [185, 220, 247, 277, 311, 370] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,95,240,950], wild: true },
      SCATTER: { ...svgSym("SCATTER","MOON"), weight: 2, pay: [0,0,0,5,30,200], scatter: true },
      PUMPKIN: { ...emojiSym("\uD83C\uDF83","PUMPKIN"), weight: 5, pay: [0,0,0,55,140,550] },
      WITCH:   { ...emojiSym("\uD83E\uDDD9\u200D\u2640\uFE0F","WITCH"), weight: 7, pay: [0,0,0,40,100,400] },
      GHOST:   { ...emojiSym("\uD83D\uDC7B","GHOST"), weight: 9, pay: [0,0,0,25,65,225] },
      BAT:     { ...emojiSym("\uD83E\uDD87","BAT"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","PUMPKIN","WITCH","GHOST","BAT","A","K"],
  },

  // =========================================================
  // 24. LUCKY CHARMS - Irish leprechaun
  // =========================================================
  luckyCharms: {
    rtpScale: 2.62,
    layout: "mascot-watermark",
    title: "Lucky Charms",
    tagline: "Find the Pot of Gold",
    theme: "irish",
    accent: "#2dd55b",
    accent2: "#ffd200",
    rows: 3, reels: 5, paylines: PAYLINES_5x3_50,
    mascot: "\uD83C\uDF40",
    sceneClass: "scene-irish",
    bgEmoji: ["\uD83C\uDF08","\uD83C\uDF40","\uD83D\uDCB0","\uD83C\uDFB6"],
    music: { tempo: 130, scale: [196, 247, 277, 349, 392, 440] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,100,250,1000], wild: true },
      SCATTER: { ...svgSym("SCATTER","RAINBOW"), weight: 2, pay: [0,0,0,5,30,200], scatter: true },
      LEPRECHAUN: { ...emojiSym("\uD83E\uDDD9","LUCKY"), weight: 5, pay: [0,0,0,60,150,600] },
      POT:     { ...emojiSym("\uD83D\uDCB0","GOLD"), weight: 7, pay: [0,0,0,40,100,400] },
      CLOVER:  { ...emojiSym("\uD83C\uDF40","CLOVER"), weight: 9, pay: [0,0,0,25,65,250] },
      HORSE:   { ...svgSym("HORSESHOE","HORSESHOE"), weight: 11, pay: [0,0,0,15,40,150] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,8,20,75] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,6,18,65] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,5,15,50] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,4,12,40] },
    },
    paytableOrder: ["WILD","LEPRECHAUN","POT","CLOVER","HORSE","A","K"],
  },
};

// Order in which to show games in the lobby
const GAME_ORDER = [
  "wildBuffalo","kingKong","triple777","blackjack","gorillaGold","goldWolf",
  "wildBull","dragonEmpress","mammothRush","pharaoh","oceanTreasure","vegas7s",
  "luckyPanda","lionsPride","piratesTreasure","zeusThunder","cleopatra","frozenRiches",
  "galaxyStars","fruitMania","vikingGlory","aztecEmpire","halloweenHunt","luckyCharms"
];


// ============================================================
// IMAGE ASSETS - Set these paths to use real PNG/JPG game art
// If the file does not exist, the SVG mascot above is used instead.
// Drop your art into /assets/slots/ to override:
//   - {gameKey}-thumb.png  -> lobby tile background art (1080x720 recommended)
//   - {gameKey}-mascot.png -> in-game mascot (transparent PNG, 1200x900 recommended)
//   - {gameKey}-bg.jpg     -> in-game background scene (1920x1080)
// ============================================================
const ASSET_BASE = "assets/slots/";
const ASSET_VERSION = "v=20260524-all-lobby-cards";
const ASSET_KEYS = GAME_ORDER;
const ASSET_CACHE = {};
const FULL_TILE_ART_KEYS = new Set(GAME_ORDER);

function versionedAssetUrl(url) {
  return `${url}${url.includes("?") ? "&" : "?"}${ASSET_VERSION}`;
}

function checkAssetExists(url) {
  if (ASSET_CACHE[url] !== undefined) return Promise.resolve(ASSET_CACHE[url]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { ASSET_CACHE[url] = true; resolve(true); };
    img.onerror = () => { ASSET_CACHE[url] = false; resolve(false); };
    img.src = url;
  });
}

function applyTileArt(tileEl, gameKey) {
  if (FULL_TILE_ART_KEYS.has(gameKey)) {
    const thumbUrl = versionedAssetUrl(`${ASSET_BASE}${gameKey}-thumb-fast.webp`);
    tileEl.classList.add("has-full-tile-art");
    const bg = tileEl.querySelector(".tile-bg");
    if (bg) bg.style.backgroundImage = `url('${thumbUrl}')`;
    const art = tileEl.querySelector(".tile-mascot-art");
    if (art) art.innerHTML = `<img src="${thumbUrl}" alt="" loading="eager" decoding="async" fetchpriority="high" />`;
    return;
  }
  const thumbUrl = versionedAssetUrl(`${ASSET_BASE}${gameKey}-thumb.png`);
  checkAssetExists(thumbUrl).then((exists) => {
    if (exists) {
      tileEl.classList.add("has-full-tile-art");
      const bg = tileEl.querySelector(".tile-bg");
      if (bg) bg.style.backgroundImage = `url('${thumbUrl}')`;
      const art = tileEl.querySelector(".tile-mascot-art");
      if (art) art.innerHTML = `<img src="${thumbUrl}" alt="" loading="lazy" />`;
    }
  });
}

function applyGameArt(gameKey, root) {
  if (!root) return;
  // Check for in-game background
  const bgUrl = versionedAssetUrl(`${ASSET_BASE}${gameKey}-bg.jpg`);
  checkAssetExists(bgUrl).then((exists) => {
    if (exists) {
      root.style.setProperty("--game-bg-image", `url('${bgUrl}')`);
      root.classList.add("has-real-bg");
    }
  });
  // Check for in-game mascot
  const mascotUrl = versionedAssetUrl(`${ASSET_BASE}${gameKey}-mascot.png`);
  checkAssetExists(mascotUrl).then((exists) => {
    if (exists) {
      root.style.setProperty("--mascot-bg", `url('${mascotUrl}')`);
      // For mascot-top layout, replace the SVG with the image
      const bigMascot = root.querySelector(".big-mascot-art");
      if (bigMascot) {
        bigMascot.innerHTML = `<img src="${mascotUrl}" alt="" style="width:100%;height:100%;object-fit:contain;display:block;" />`;
      }
    }
  });
}

const GENERATED_SYMBOL_SETS = {
  wildBuffalo: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","buffalo.png","BUFFALO"],["S2","wolf.png","WOLF"],["S3","eagle.png","EAGLE"],["S4","mesa.png","MESA"],["S5","a.png","A"],["S6","k.png","K"]],
  kingKong: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","king_kong.png","KING KONG"],["S2","gorilla.png","GORILLA"],["S3","roaring_gorilla.png","ROAR"],["S4","lion.png","LION"],["S5","a.png","A"],["S6","k.png","K"]],
  triple777: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","red_777.png","777"],["S2","fire_777.png","FIRE 777"],["S3","blue_777.png","BLUE 777"],["S4","purple_777.png","PURPLE 777"],["S5","bell.png","BELL"],["S6","diamond.png","DIAMOND"]],
  blackjack: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","blackjack_red.png","BLACKJACK"],["S2","blackjack_blue.png","BLACKJACK"],["S3","blackjack_green.png","BLACKJACK"],["S4","blackjack_purple.png","BLACKJACK"],["S5","crown.png","CROWN"],["S6","coins.png","CHIPS"]],
  gorillaGold: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","gorilla.png","GORILLA"],["S2","gorilla_purple.png","GORILLA"],["S3","gold_chest.png","CHEST"],["S4","coins.png","GOLD"],["S5","crown.png","CROWN"],["S6","gem.png","GEM"]],
  goldWolf: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","wolf.png","WOLF"],["S2","wolf_round.png","WOLF"],["S3","moon_wolf.png","MOON WOLF"],["S4","blue_gem.png","BLUE GEM"],["S5","gold.png","GOLD"],["S6","k.png","K"]],
  wildBull: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","buffalo.png","BULL"],["S2","bull_skull.png","SKULL"],["S3","buffalo_round.png","BULL"],["S4","horseshoe.png","HORSESHOE"],["S5","gold.png","GOLD"],["S6","a.png","A"]],
  dragonEmpress: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","red_dragon.png","RED DRAGON"],["S2","green_dragon.png","GREEN DRAGON"],["S3","green_dragon_2.png","EMERALD DRAGON"],["S4","blue_dragon.png","BLUE DRAGON"],["S5","red_gem.png","RUBY"],["S6","crown.png","CROWN"]],
  mammothRush: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","purple_mammoth.png","MAMMOTH"],["S2","brown_mammoth.png","MAMMOTH"],["S3","mammoth.png","MAMMOTH"],["S4","mountain.png","MOUNTAIN"],["S5","gold.png","GOLD"],["S6","q.png","Q"]],
  pharaoh: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","crown.png","CROWN"],["S2","gold_skull.png","SKULL"],["S3","coins.png","COINS"],["S4","red_gem.png","RUBY"],["S5","green_gem.png","EMERALD"],["S6","purple_gem.png","AMETHYST"]],
  oceanTreasure: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","treasure.png","TREASURE"],["S2","anchor.png","ANCHOR"],["S3","pearl.png","PEARL"],["S4","shipwreck.png","SHIPWRECK"],["S5","ship.png","SHIP"],["S6","chest.png","CHEST"]],
  vegas7s: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","red_777.png","777"],["S2","blue_777.png","BLUE 777"],["S3","bell.png","BELL"],["S4","crown.png","CROWN"],["S5","red_gem.png","RUBY"],["S6","coins.png","COINS"]],
  luckyPanda: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","panda_gold.png","PANDA"],["S2","panda_coin.png","PANDA"],["S3","panda_red.png","PANDA"],["S4","panda_black.png","PANDA"],["S5","clover.png","CLOVER"],["S6","coins.png","COINS"]],
  lionsPride: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","lion.png","LION"],["S2","lion_2.png","LION"],["S3","lion_3.png","LION"],["S4","white_lion.png","WHITE LION"],["S5","king_lion.png","KING LION"],["S6","crown.png","CROWN"]],
  piratesTreasure: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","pirate.png","PIRATE"],["S2","pirate_blue.png","PIRATE"],["S3","pirate_parrot.png","PARROT"],["S4","ship.png","SHIP"],["S5","rum.png","RUM"],["S6","skull.png","SKULL"]],
  zeusThunder: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","blue_wild.png","THUNDER"],["S2","crown.png","CROWN"],["S3","blue_gem.png","BLUE GEM"],["S4","bell.png","BELL"],["S5","gold_coin.png","GOLD"],["S6","purple_gem.png","AMETHYST"]],
  cleopatra: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","crown.png","CROWN"],["S2","red_gem.png","RUBY"],["S3","green_gem.png","EMERALD"],["S4","purple_gem.png","AMETHYST"],["S5","blue_diamond.png","DIAMOND"],["S6","gold_skull.png","GOLD SKULL"]],
  frozenRiches: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","white_lion.png","WHITE LION"],["S2","blue_gem.png","ICE GEM"],["S3","blue_landscape.png","ICE PEAK"],["S4","waterfall.png","FROZEN FALLS"],["S5","wolf.png","WOLF"],["S6","ice_9.png","ICE 9"]],
  galaxyStars: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","star.png","STAR"],["S2","purple_gem.png","AMETHYST"],["S3","blue_diamond.png","DIAMOND"],["S4","red_gem.png","RUBY"],["S5","green_gem.png","EMERALD"],["S6","orange_gem.png","SUN GEM"]],
  fruitMania: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","cherry.png","CHERRY"],["S2","lemon.png","LEMON"],["S3","orange.png","ORANGE"],["S4","plum.png","PLUM"],["S5","grapes.png","GRAPES"],["S6","watermelon.png","WATERMELON"]],
  vikingGlory: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","skull.png","SKULL"],["S2","crown.png","CROWN"],["S3","gold_pot.png","GOLD"],["S4","coins.png","COINS"],["S5","bear.png","BEAR"],["S6","axe.png","AXE"]],
  aztecEmpire: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","green_gem.png","EMERALD"],["S2","clover.png","GREEN SEAL"],["S3","gold_coin.png","GOLD"],["S4","crown.png","CROWN"],["S5","skull.png","SKULL"],["S6","emerald.png","EMERALD"]],
  halloweenHunt: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","skull.png","SKULL"],["S2","pirate_skull.png","BONES"],["S3","orange_gem.png","EMBER"],["S4","red_gem.png","RUBY"],["S5","purple_gem.png","AMETHYST"],["S6","rum.png","POTION"]],
  luckyCharms: [["WILD","wild.png","WILD","wild"],["SCATTER","bonus.png","BONUS","scatter"],["S1","clover.png","CLOVER"],["S2","clover_2.png","CLOVER"],["S3","horseshoe.png","HORSESHOE"],["S4","pot.png","GOLD POT"],["S5","crown.png","CROWN"],["S6","green_gem.png","EMERALD"]],
};

const GENERATED_SYMBOL_PACKS = {
  wildBuffalo: "assets-1",
  kingKong: "assets-1",
  triple777: "assets-1",
  blackjack: "assets-1",
  gorillaGold: "assets-1",
  goldWolf: "assets-1",
  wildBull: "assets-1",
  dragonEmpress: "assets-1",
  mammothRush: "assets-2",
  pharaoh: "assets-2",
  oceanTreasure: "assets-2",
  vegas7s: "assets-2",
  luckyPanda: "assets-2",
  lionsPride: "assets-2",
  piratesTreasure: "assets-2",
  zeusThunder: "assets-2",
  cleopatra: "assets-3",
  frozenRiches: "assets-3",
  galaxyStars: "assets-3",
  fruitMania: "assets-3",
  vikingGlory: "assets-3",
  aztecEmpire: "assets-3",
  halloweenHunt: "assets-3",
  luckyCharms: "assets-3",
};

function generatedSymbol(gameKey, entry, index) {
  const [key, file, label, role] = entry;
  const isWild = role === "wild";
  const isScatter = role === "scatter";
  const matchGroup = generatedSymbolMatchGroup(gameKey, key, label);
  const payoutTiers = [
    [0,0,0,50,100,500],
    [0,0,0,5,20,100],
    [0,0,0,30,80,300],
    [0,0,0,20,50,200],
    [0,0,0,15,40,150],
    [0,0,0,10,30,100],
    [0,0,0,5,15,50],
    [0,0,0,4,12,40],
  ];
  return {
    ...imageSym(`${GENERATED_SYMBOL_PACKS[gameKey] || "assets-1"}/${gameKey}/${file}?v=hd1`, label),
    weight: isWild ? 3 : isScatter ? 2 : index < 4 ? 7 : index < 6 ? 10 : 14,
    pay: payoutTiers[index] || payoutTiers[payoutTiers.length - 1],
    ...(matchGroup ? { matchGroup } : {}),
    ...(isWild ? { wild: true } : {}),
    ...(isScatter ? { scatter: true } : {}),
  };
}

function generatedSymbolMatchGroup(gameKey, key, label) {
  const text = String(label || "").toUpperCase();
  const familyRules = [
    ["SEVENS", ["777"]],
    ["BLACKJACK", ["BLACKJACK"]],
    ["WOLF", ["WOLF"]],
    ["DRAGON", ["DRAGON"]],
    ["MAMMOTH", ["MAMMOTH"]],
    ["PANDA", ["PANDA"]],
    ["LION", ["LION"]],
    ["PIRATE", ["PIRATE"]],
    ["CLOVER", ["CLOVER"]],
    ["GORILLA", ["GORILLA"]],
    ["BULL", ["BULL"]],
    ["EMERALD", ["EMERALD"]],
  ];
  for (const [group, needles] of familyRules) {
    if (needles.some((needle) => text.includes(needle))) return `${gameKey}:${group}`;
  }
  return "";
}

function applyGeneratedSymbolSets() {
  Object.entries(GENERATED_SYMBOL_SETS).forEach(([gameKey, entries]) => {
    const game = GAMES[gameKey];
    if (!game) return;
    game.symbols = Object.fromEntries(entries.map((entry, index) => [entry[0], generatedSymbol(gameKey, entry, index)]));
    game.paytableOrder = entries.map((entry) => entry[0]);
  });
}

applyGeneratedSymbolSets();

// ============================================================
// 4) STATE - Credits, jackpots, current game
// ============================================================
const STORAGE_PREFIX = "sd_slots_v1_";
const State = {
  credits: 0,
  bet: 0.25,
  betLevels: [0.05, 0.10, 0.25, 0.50, 1.00, 2.50, 5.00, 10.00],
  jackpots: { grand: 1519.23, major: 524.95, minor: 107.97, mini: 21.87 },
  jackpotsIncrement: { grand: 0.0035, major: 0.0018, minor: 0.0009, mini: 0.0004 },
  jackpotChance: { mini: 1/600, minor: 1/2400, major: 1/12000, grand: 1/60000 },
  totalWagered: 0,
  totalWon: 0,
  spinCount: 0,
  activeGame: null,
  isSpinning: false,
  autoSpin: false,
  musicOn: true,
  soundOn: true,
  fullscreen: false,
  player: null,
  guestChatName: "",
  pointsSyncedAt: 0,
  appliedControlGame: null,
  appliedControlSignature: "",
  appliedDefaultBet: null,
  // ---- ADVANCED ENGINE STATE ----
  freeSpinsRemaining: 0,        // counts down each free spin
  freeSpinMultiplier: 5,         // applied to wins during free spins
  freeSpinTotalWin: 0,           // accumulated win over a free-spin session
  freeSpinTriggerBet: 0,         // bet level when free spins were triggered
};

async function arcadeApi(path, options = {}) {
  // Build an AbortController so requests cannot hang the UI indefinitely.
  // If the caller passes their own signal we still respect it via "any".
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 12000;
  const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      ...options,
      signal: controller ? controller.signal : options.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "South Diamond account request failed.");
    return data;
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("South Diamond is taking too long to respond. Please try again.");
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function refreshPlayerPoints({ redirectOnFail = false } = {}) {
  try {
    const data = await arcadeApi("/api/player/me");
    State.player = data.user;
    State.credits = Number(data.user?.points) || 0;
    State.pointsSyncedAt = Date.now();
    updateDisplays();
    updateArcadeAccountUi();
    return true;
  } catch (error) {
    State.player = null;
    State.credits = 0;
    updateDisplays();
    updateArcadeAccountUi();
    flashMessage("Log in to your South Diamond account to play slots.");
    if (redirectOnFail) window.location.href = "/";
    return false;
  }
}

async function refreshArcadeControls({ admin = false } = {}) {
  if (typeof SlotsConfig === "undefined" || typeof SlotsConfig.refreshFromServer !== "function") {
    return typeof SlotsConfig !== "undefined" ? SlotsConfig.load() : null;
  }
  try {
    return await SlotsConfig.refreshFromServer({ admin });
  } catch (error) {
    return SlotsConfig.load();
  }
}

function adminGameConfig(gameKey) {
  if (typeof SlotsConfig === "undefined") return null;
  const cfg = SlotsConfig.load();
  return cfg.games?.[gameKey] || null;
}

function numberSetting(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function gameControlSignature(gameKey) {
  const rootCfg = typeof SlotsConfig !== "undefined" ? SlotsConfig.load() : null;
  const cfg = adminGameConfig(gameKey);
  if (!cfg) return "";
  return JSON.stringify({
    defaultBet: numberSetting(rootCfg?.defaultBet, 0.25),
    enabled: cfg.enabled !== false,
    minBet: numberSetting(cfg.minBet, 0.05),
    maxBet: numberSetting(cfg.maxBet, 10),
    targetRtp: numberSetting(cfg.targetRtp, 0.92),
    dailyMaxPayout: numberSetting(cfg.dailyMaxPayout, 1000),
    dailyMinPayout: numberSetting(cfg.dailyMinPayout, 50),
    jackpotPool: cfg.jackpotPool || {},
  });
}

function betLevelsForGame(gameKey) {
  const cfg = adminGameConfig(gameKey);
  const minBet = cfg ? Math.max(0.01, numberSetting(cfg.minBet, 0.05)) : 0.05;
  const maxBet = cfg ? Math.max(minBet, numberSetting(cfg.maxBet, 10)) : 10;
  return [...new Set([...State.betLevels, minBet, maxBet]
    .map((value) => Math.round(Number(value) * 100) / 100)
    .filter((value) => Number.isFinite(value) && value >= minBet && value <= maxBet))]
    .sort((a, b) => a - b);
}

function applyAdminGameControls(gameKey, { force = false } = {}) {
  const rootCfg = typeof SlotsConfig !== "undefined" ? SlotsConfig.load() : null;
  const cfg = adminGameConfig(gameKey);
  if (!cfg) return false;
  const signature = gameControlSignature(gameKey);
  const changed = force || State.appliedControlGame !== gameKey || State.appliedControlSignature !== signature;
  if (!changed) return false;
  const previousDefaultBet = State.appliedDefaultBet;
  const minBet = Math.max(0.01, numberSetting(cfg.minBet, 0.05));
  const maxBet = Math.max(minBet, numberSetting(cfg.maxBet, 10));
  const defaultBet = Math.max(minBet, Math.min(numberSetting(rootCfg?.defaultBet, 0.25), maxBet));
  const pool = cfg.jackpotPool || {};
  ["grand", "major", "minor", "mini"].forEach((level) => {
    const fallback = State.jackpots[level] || 0;
    State.jackpots[level] = Math.max(0, numberSetting(pool[level], fallback));
  });
  State.appliedControlGame = gameKey;
  State.appliedControlSignature = signature;
  if (
    force ||
    State.bet < minBet ||
    State.bet > maxBet ||
    previousDefaultBet === null ||
    Math.abs(State.bet - previousDefaultBet) < 0.001
  ) {
    State.bet = defaultBet;
  }
  State.appliedDefaultBet = defaultBet;
  clampBetToAdmin(gameKey);
  updateDisplays();
  return true;
}

function clampBetToAdmin(gameKey) {
  const gcfg = adminGameConfig(gameKey);
  if (!gcfg) return true;
  const minBet = Math.max(0.01, numberSetting(gcfg.minBet, 0.05));
  const maxBet = Math.max(minBet, numberSetting(gcfg.maxBet, 10));
  if (State.bet < minBet) State.bet = minBet;
  if (State.bet > maxBet) State.bet = maxBet;
  updateDisplays();
  return State.bet >= minBet && State.bet <= maxBet;
}

function isAdminGameEnabled(gameKey) {
  if (typeof SlotsConfig === "undefined") return true;
  return SlotsConfig.isGameEnabled(gameKey);
}

async function applyLiveArcadeControls() {
  await refreshArcadeControls();
  if ($("[data-lobby-grid]")) renderLobby();
  if (!State.activeGame) return;
  applyAdminGameControls(State.activeGame);
  if (!isAdminGameEnabled(State.activeGame)) {
    showMaintenanceOverlay();
    setWinMessage("This game is currently turned off by admin.");
    stopAutoSpin();
    return;
  }
  hideMaintenanceOverlay();
}

function startArcadeControlsWatcher() {
  // Slower polling fallback (every 4s) – the live SSE stream below handles
  // the instant push case. The poll only exists for environments where SSE
  // is blocked (some proxies/extensions).
  setInterval(() => {
    if (State.isSpinning) return;
    applyLiveArcadeControls();
  }, 4000);
  startArcadeLiveStream();
  window.addEventListener("storage", (event) => {
    if (event.key !== "sd_slots_live_config_broadcast" || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue);
      if (payload.config && typeof SlotsConfig !== "undefined" && typeof SlotsConfig.save === "function") {
        SlotsConfig.save(payload.config);
        applyLiveArcadeControls().catch(() => {});
      }
    } catch (error) {}
  });
}

// Listen on the server-sent-event stream so admin saves and stat changes
// reflect on the player immediately (no polling lag). Auto-reconnects on
// errors with a short back-off. The same endpoint is what admin listens to.
let _arcadeLiveStream = null;
function startArcadeLiveStream() {
  if (_arcadeLiveStream || typeof EventSource === "undefined") return;
  try {
    _arcadeLiveStream = new EventSource("/api/player/slots/live");
    _arcadeLiveStream.addEventListener("message", (event) => {
      let payload = {};
      try { payload = JSON.parse(event.data || "{}"); } catch (e) {}
      // Admin changed controls (enable/disable, bet limits, jackpots, RTP)
      if (payload.type === "arcade-config" || payload.type === "slot-settings") {
        if (payload.config && typeof SlotsConfig !== "undefined" && typeof SlotsConfig.save === "function") {
          SlotsConfig.save(payload.config);
        }
        // Re-pull config and re-apply to the active game and lobby tiles.
        applyLiveArcadeControls().catch(() => {});
      }
      // Another player (or this player) just spun — keep the local stats
      // cache fresh so the admin tab can read up-to-date data if both are
      // open in the same browser.
      if (payload.type === "slots-arcade-spin" || payload.type === "slot-spin" || payload.type === "arcade-stats-reset") {
        if (typeof SlotsConfig !== "undefined" && typeof SlotsConfig.refreshStatsFromServer === "function") {
          SlotsConfig.refreshStatsFromServer().catch(() => {});
        }
      }
    });
    _arcadeLiveStream.addEventListener("error", () => {
      try { _arcadeLiveStream && _arcadeLiveStream.close(); } catch (e) {}
      _arcadeLiveStream = null;
      // Reconnect after a short delay.
      setTimeout(startArcadeLiveStream, 3000);
    });
  } catch (err) {
    _arcadeLiveStream = null;
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "state") || "{}");
    if (typeof saved.bet === "number") State.bet = saved.bet;
    if (saved.jackpots) Object.assign(State.jackpots, saved.jackpots);
    if (typeof saved.totalWagered === "number") State.totalWagered = saved.totalWagered;
    if (typeof saved.totalWon === "number") State.totalWon = saved.totalWon;
    if (typeof saved.musicOn === "boolean") State.musicOn = saved.musicOn;
    if (typeof saved.soundOn === "boolean") State.soundOn = saved.soundOn;
  } catch (err) { /* fresh state */ }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_PREFIX + "state", JSON.stringify({
      bet: State.bet, jackpots: State.jackpots,
      totalWagered: State.totalWagered, totalWon: State.totalWon,
      musicOn: State.musicOn, soundOn: State.soundOn,
    }));
  } catch (err) {}
}

// ============================================================
// 5) SLOT ENGINE - ADVANCED
//   - Crypto-grade uniform RNG (with Math.random fallback)
//   - Per-reel weighted reel strips (industry-standard)
//   - Wild multipliers (game.wildMultiplier: 2 / 3)
//   - 243 / 1024 ways-to-win evaluation (game.wayMode = "ways")
//   - Free-spin bonus rounds (3+ scatters: 8 / 12 / 15 spins, 5x multiplier)
//   - RTP governor (uses admin SlotsConfig.computeRtpMultiplier)
//   - Live progressive jackpots (unchanged)
//   - All existing image / paytable / symbol contracts preserved
// ============================================================

// -- Crypto-grade uniform RNG (falls back to Math.random) ----
const _RNG_BUF = (typeof Uint32Array !== "undefined") ? new Uint32Array(1) : null;
function rng() {
  try {
    if (_RNG_BUF && typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(_RNG_BUF);
      return _RNG_BUF[0] / 0x100000000;
    }
  } catch (e) { /* fall through */ }
  return Math.random();
}

// -- Per-reel weight builder ---------------------------------
// Returns an array (length = game.reels) of { SYM: weight, ... } maps.
// Games can override entirely by setting game.reelWeights = [{...}, ...].
// Otherwise we derive from the base symbol weights with a tiny industry-style
// per-reel variation that doesn't break the paytable: wilds slightly rarer on
// outer reels, scatters held to >=1 per reel. Result is cached on the game.
function buildReelWeights(game) {
  if (Array.isArray(game._cachedReelWeights) && game._cachedReelWeights.length === game.reels) {
    return game._cachedReelWeights;
  }
  if (Array.isArray(game.reelWeights) && game.reelWeights.length === game.reels) {
    game._cachedReelWeights = game.reelWeights;
    return game.reelWeights;
  }
  const reels = [];
  const symKeys = Object.keys(game.symbols);
  for (let r = 0; r < game.reels; r++) {
    const w = {};
    for (const k of symKeys) {
      const sym = game.symbols[k];
      let weight = Number(sym.weight) || 1;
      if (sym.wild && (r === 0 || r === game.reels - 1)) {
        weight = Math.max(1, Math.round(weight * 0.8));
      }
      if (sym.scatter) {
        weight = Math.max(1, weight);
      }
      w[k] = weight;
    }
    reels.push(w);
  }
  game._cachedReelWeights = reels;
  return reels;
}

// Backwards-compatible single-table picker (kept for any external callers)
function weightedPick(symbols) {
  const keys = Object.keys(symbols);
  let total = 0;
  for (const k of keys) total += Number(symbols[k].weight) || 0;
  if (total <= 0) return keys[0];
  let roll = rng() * total;
  for (const k of keys) {
    roll -= Number(symbols[k].weight) || 0;
    if (roll <= 0) return k;
  }
  return keys[keys.length - 1];
}

function weightedPickReel(game, reelIndex) {
  const reels = buildReelWeights(game);
  const w = reels[reelIndex] || reels[0];
  const keys = Object.keys(w);
  let total = 0;
  for (const k of keys) total += Number(w[k]) || 0;
  if (total <= 0) return keys[0];
  let roll = rng() * total;
  for (const k of keys) {
    roll -= Number(w[k]) || 0;
    if (roll <= 0) return k;
  }
  return keys[keys.length - 1];
}

function _generateGridRaw(game) {
  const grid = [];
  for (let r = 0; r < game.reels; r++) {
    const reel = [];
    for (let row = 0; row < game.rows; row++) {
      reel.push(weightedPickReel(game, r));
    }
    grid.push(reel);
  }
  return grid;
}

function _quickPayProbe(game, grid) {
  let sum = 0;
  if (game.wayMode === "ways") {
    const ws = evaluateWays(game, grid);
    for (const w of ws) sum += w.pay;
  } else {
    const lines = game.paylines || [];
    for (const line of lines) {
      const w = evaluatePayline(game, grid, line);
      if (w) sum += w.pay;
    }
  }
  const sc = evaluateScatters(game, grid);
  if (sc) sum += sc.pay;
  return sum;
}

// generateGrid: optionally re-roll a few candidates and pick the one whose
// probe is closer to admin RTP target. Preserves symbol probabilities since
// each candidate is i.i.d. sampled from the same distribution.
function generateGrid(game) {
  const baseGrid = _generateGridRaw(game);
  if (!State.activeGame || typeof SlotsConfig === "undefined" || !SlotsConfig.computeRtpMultiplier) {
    return baseGrid;
  }
  let mult = 1;
  try { mult = SlotsConfig.computeRtpMultiplier(State.activeGame) || 1; } catch (e) { mult = 1; }
  if (Math.abs(mult - 1) < 0.05) return baseGrid;
  const wantMoreWins = mult > 1;
  const candidates = [baseGrid];
  for (let i = 0; i < 3; i++) candidates.push(_generateGridRaw(game));
  let best = candidates[0];
  let bestScore = wantMoreWins ? -Infinity : Infinity;
  for (const g of candidates) {
    const probe = _quickPayProbe(game, g);
    if (wantMoreWins ? probe > bestScore : probe < bestScore) {
      best = g; bestScore = probe;
    }
  }
  return best;
}

function evaluatePayline(game, grid, payline) {
  const lineSymbols = payline.map((row, reelIndex) => grid[reelIndex]?.[row]).filter(Boolean);
  if (!lineSymbols.length) return null;
  const firstSym = lineSymbols[0];
  if (!firstSym || game.symbols[firstSym]?.scatter) return null;

  const candidates = new Set();
  lineSymbols.forEach((symKey) => {
    const sym = game.symbols[symKey];
    if (sym && !sym.scatter && !sym.wild) candidates.add(symKey);
  });

  let bestWin = null;
  candidates.forEach((targetSym) => {
    const target = game.symbols[targetSym];
    if (!target || target.scatter) return;
    let count = 0;
    let wildCount = 0;
    let mixedGroup = false;
    for (let i = 0; i < payline.length; i++) {
      const symKey = grid[i]?.[payline[i]];
      const sym = game.symbols[symKey];
      if (!symKey || sym?.scatter) break;
      if (symKey === targetSym) { count++; }
      else if (symbolMatchGroup(game, symKey) === symbolMatchGroup(game, targetSym)) { count++; mixedGroup = true; }
      else if (sym?.wild) { count++; wildCount++; }
      else break;
    }
    if (count < symbolMinWinningCount(target, game.reels)) return;
    const basePay = groupedSymbolPay(game, targetSym, count, mixedGroup);
    if (!basePay) return;
    let mult = 1;
    if (wildCount > 0 && game.wildMultiplier) {
      mult = (typeof game.wildMultiplier === "number") ? game.wildMultiplier : 2;
    }
    const pay = basePay * mult;
    const win = {
      symbol: targetSym, count, pay, basePay, multiplier: mult,
      positions: payline.slice(0, count).map((row, reelIndex) => [reelIndex, row]),
    };
    if (
      !bestWin ||
      win.pay > bestWin.pay ||
      (win.pay === bestWin.pay && win.count > bestWin.count)
    ) {
      bestWin = win;
    }
  });
  return bestWin;
}

function evaluateScatters(game, grid) {
  let count = 0;
  const positions = [];
  for (let r = 0; r < game.reels; r++) {
    for (let row = 0; row < game.rows; row++) {
      if (grid[r][row] && game.symbols[grid[r][row]].scatter) {
        count++;
        positions.push([r, row]);
      }
    }
  }
  if (count < 3) return null;
  const scatterSym = Object.keys(game.symbols).find(k => game.symbols[k].scatter);
  if (!scatterSym) return null;
  const pay = symbolPayForCount(game.symbols[scatterSym], count);
  if (!pay) return null;
  return { symbol: scatterSym, count, pay, positions };
}

// 243/1024 ways: for each non-wild non-scatter symbol, walk reels L-to-R;
// on each reel count target+wild occurrences and multiply.
function evaluateWays(game, grid) {
  const wins = [];
  const symKeys = Object.keys(game.symbols);
  for (const targetKey of symKeys) {
    const target = game.symbols[targetKey];
    if (!target || target.scatter || target.wild) continue;
    const minCount = symbolMinWinningCount(target, game.reels);
    let waysProduct = 1;
    let reelsHit = 0;
    const positions = [];
    let anyTargetSeen = false;
    for (let r = 0; r < game.reels; r++) {
      let matches = 0;
      let targetHere = false;
      const rowsHere = [];
      for (let row = 0; row < game.rows; row++) {
        const k = grid[r][row];
        const sym = game.symbols[k];
        if (k === targetKey) { matches++; rowsHere.push(row); targetHere = true; }
        else if (sym?.wild) { matches++; rowsHere.push(row); }
      }
      if (targetHere) anyTargetSeen = true;
      if (matches === 0) break;
      waysProduct *= matches;
      reelsHit++;
      rowsHere.forEach((row) => positions.push([r, row]));
    }
    if (!anyTargetSeen) continue;
    if (reelsHit < minCount) continue;
    const basePay = symbolPayForCount(target, reelsHit);
    if (!basePay) continue;
    const pay = basePay * waysProduct;
    wins.push({
      symbol: targetKey, count: reelsHit, pay, basePay,
      ways: waysProduct, positions,
    });
  }
  return wins;
}

function evaluateSpin(game, grid, bet) {
  const wins = [];
  let totalPay = 0;

  if (game.wayMode === "ways") {
    const totalWays = Math.pow(Math.max(1, game.rows), Math.max(1, game.reels));
    const coinValue = bet / totalWays;
    const wayWins = evaluateWays(game, grid);
    wayWins.forEach((win, idx) => {
      const amount = Math.round(win.pay * coinValue * 100) / 100;
      wins.push({ ...win, lineIndex: idx, amount });
      totalPay += amount;
    });
  } else {
    const coinValue = bet / Math.max(1, game.paylines.length);
    game.paylines.forEach((line, idx) => {
      const win = evaluatePayline(game, grid, line);
      if (win) {
        const amount = Math.round(win.pay * coinValue * 100) / 100;
        wins.push({ ...win, lineIndex: idx, amount, linePattern: line });
        totalPay += amount;
      }
    });
  }

  const scatter = evaluateScatters(game, grid);
  let freeSpinsAwarded = 0;
  if (scatter) {
    const amount = Math.round(scatter.pay * bet * 100) / 100;
    wins.push({ ...scatter, lineIndex: -1, amount });
    totalPay += amount;
    if (scatter.count >= 5) freeSpinsAwarded = 15;
    else if (scatter.count === 4) freeSpinsAwarded = 12;
    else if (scatter.count === 3) freeSpinsAwarded = 8;
  }

  if (State.freeSpinsRemaining > 0) {
    const fsMult = Number(State.freeSpinMultiplier) || 5;
    if (fsMult !== 1) {
      totalPay = Math.round(totalPay * fsMult * 100) / 100;
      wins.forEach((w) => { w.amount = Math.round(w.amount * fsMult * 100) / 100; });
    }
  }

  // Progressive jackpot check (unchanged behavior)
  let jpHit = null;
  const r = rng();
  if (r < State.jackpotChance.grand) { jpHit = "grand"; totalPay += State.jackpots.grand; }
  else if (r < State.jackpotChance.grand + State.jackpotChance.major) { jpHit = "major"; totalPay += State.jackpots.major; }
  else if (r < State.jackpotChance.grand + State.jackpotChance.major + State.jackpotChance.minor) { jpHit = "minor"; totalPay += State.jackpots.minor; }
  else if (r < State.jackpotChance.grand + State.jackpotChance.major + State.jackpotChance.minor + State.jackpotChance.mini) { jpHit = "mini"; totalPay += State.jackpots.mini; }
  if (jpHit) {
    const cfg = adminGameConfig(State.activeGame);
    const pool = cfg?.jackpotPool || {};
    State.jackpots[jpHit] = Math.max(0, numberSetting(pool[jpHit], jpHit === "grand" ? 1500 : jpHit === "major" ? 500 : jpHit === "minor" ? 100 : 20));
    State.appliedControlSignature = gameControlSignature(State.activeGame);
  }
  return { wins, totalPay: Math.round(totalPay * 100) / 100, jpHit, freeSpinsAwarded };
}

function describeWin(game, result, grid = []) {
  if (!result || !Array.isArray(result.wins) || !result.wins.length) {
    return result?.jpHit ? `${result.jpHit.toUpperCase()} jackpot` : "Win";
  }
  const primary = result.wins.slice().sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))[0];
  if (!primary) return "Win";
  const sym = game.symbols[primary.symbol];
  const label = sym?.label || primary.symbol || "symbol";
  if (primary.lineIndex === -1) return `${primary.count} BONUS symbols`;
  const wildUsed = (primary.positions || []).some(([reel, row]) => game.symbols[grid?.[reel]?.[row]]?.wild);
  return wildUsed ? `${primary.count} ${label} with WILD` : `${primary.count} ${label}`;
}

function incrementJackpots(bet) {
  for (const k of Object.keys(State.jackpots)) {
    State.jackpots[k] += bet * State.jackpotsIncrement[k];
  }
}

// ============================================================
// 6) AUDIO ENGINE - WebAudio synth music + sound effects
// ============================================================
const Audio = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  music: { timer: null, noteIndex: 0 },
  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.master.gain.value = 0.95;
    this.musicGain.gain.value = State.musicOn ? 0.34 : 0.0001;
    this.sfxGain.gain.value = State.soundOn ? 0.9 : 0.0001;
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    return this.ctx;
  },
  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },
  setMusicEnabled(enabled) {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain.gain.setTargetAtTime(enabled ? 0.34 : 0.0001, ctx.currentTime, 0.03);
  },
  setSoundEnabled(enabled) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    this.sfxGain.gain.cancelScheduledValues(ctx.currentTime);
    this.sfxGain.gain.setTargetAtTime(enabled ? 0.9 : 0.0001, ctx.currentTime, 0.02);
  },
  tone(freq, dur = 0.12, vol = 0.12, type = "triangle", bus = "sfx") {
    const ctx = this.ensure();
    if (!ctx) return;
    if (bus === "sfx" && !State.soundOn) return;
    if (bus === "music" && !State.musicOn) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(bus === "music" ? this.musicGain : this.sfxGain);
      osc.start(); osc.stop(ctx.currentTime + dur + 0.02);
    } catch (err) {}
  },
  sweep(startFreq, endFreq, dur = 0.2, vol = 0.14, type = "sawtooth") {
    const ctx = this.ensure();
    if (!ctx || !State.soundOn) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), ctx.currentTime + dur);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.03);
    } catch (err) {}
  },
  noiseBurst(dur = 0.08, vol = 0.16) {
    const ctx = this.ensure();
    if (!ctx || !State.soundOn) return;
    try {
      const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buffer;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start();
    } catch (err) {}
  },
  click() {
    this.tone(620, 0.045, 0.14, "square");
    setTimeout(() => this.tone(940, 0.035, 0.08, "triangle"), 24);
  },
  reelStop() {
    this.noiseBurst(0.035, 0.08);
    this.tone(170 + Math.random() * 90, 0.07, 0.13, "triangle");
    setTimeout(() => this.tone(420 + Math.random() * 160, 0.05, 0.1, "square"), 36);
  },
  spinStart() {
    this.noiseBurst(0.16, 0.12);
    this.sweep(160, 920, 0.32, 0.15, "sawtooth");
    [220, 330, 440, 660, 880, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 0.07, 0.18, i % 2 ? "sawtooth" : "square"), i * 34));
  },
  coinCascade(big = false) {
    const notes = big ? [988, 1175, 1318, 1568, 1976, 2349] : [784, 988, 1175, 1568];
    notes.forEach((f, i) => setTimeout(() => {
      this.tone(f, 0.09, big ? 0.2 : 0.14, "triangle");
      this.tone(f * 1.5, 0.045, big ? 0.08 : 0.05, "sine");
    }, i * (big ? 52 : 68)));
  },
  freeSpin() {
    this.noiseBurst(0.18, 0.12);
    [523, 659, 784, 1047, 1318, 1568, 2093].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 0.28, i % 2 ? "sawtooth" : "triangle"), i * 58));
    setTimeout(() => this.sweep(420, 1680, 0.42, 0.12, "sine"), 120);
  },
  win(big = false, game = null) {
    // Theme-aware win fanfare: use the game's musical scale so the celebratory
    // arpeggio matches the game's musical bed instead of always being C-major.
    const seed = (game && game.music && Array.isArray(game.music.scale) && game.music.scale.length)
      ? game.music.scale.slice()
      : [523, 659, 784, 1047, 1318, 1568];
    const baseScale = seed.slice();
    let idx = 0;
    while (baseScale.length < 6) {
      baseScale.push(seed[idx % seed.length] * 2);
      idx++;
    }
    if (big) {
      this.coinCascade(true);
      baseScale.slice(0, 8).forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 0.34, i % 2 ? "sawtooth" : "triangle"), i * 70));
    } else {
      this.coinCascade(false);
      baseScale.slice(0, 5).forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 0.28, "triangle"), i * 65));
    }
  },
  jackpot() {
    this.noiseBurst(0.3, 0.18);
    this.sweep(220, 2200, 0.65, 0.16, "sawtooth");
    const notes = [523, 659, 784, 1047, 880, 1047, 1318, 1568, 1318, 1568, 1976, 2093];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.28, 0.4, i % 2 ? "sawtooth" : "triangle"), i * 85));
  },
  startMusic(game) {
    if (!game || !State.musicOn) return;
    this.stopMusic();
    const ctx = this.ensure();
    if (!ctx) return;
    this.setMusicEnabled(true);
    const tempo = game.music?.tempo || 100;
    const scale = game.music?.scale || [220, 277, 330, 392, 440];
    const gameSeed = String(State.activeGame || game.title || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const interval = 60000 / tempo / 2;
    let beat = 0;
    const patterns = [
      [0,2,4,2,5,4,2,3,1,3,5,4],
      [0,3,5,3,1,4,6,4,2,5,3,1],
      [0,4,2,5,3,6,4,1,5,2,4,0],
      [0,1,3,5,4,2,6,3,5,1,4,2],
    ];
    const pattern = patterns[gameSeed % patterns.length];
    const wave = ["sine", "triangle", "square", "sawtooth"][gameSeed % 4];
    this.music.timer = setInterval(() => {
      if (!State.musicOn) return;
      const note = scale[pattern[beat % pattern.length] % scale.length];
      this.tone(note, 0.22, 0.12, wave, "music");
      if (beat % 4 === 0) this.tone(scale[0] / 2, 0.34, 0.16, "triangle", "music");
      if (beat % 8 === 4) this.tone(scale[(gameSeed + beat) % scale.length] * 1.5, 0.14, 0.08, "sine", "music");
      beat++;
    }, interval);
  },
  stopMusic() {
    if (this.music.timer) clearInterval(this.music.timer);
    this.music.timer = null;
  },
};

// ============================================================
// 7) UTILITIES
// ============================================================
function fmt(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setArcadeAuthStatus(message, good = false) {
  const el = document.querySelector("[data-arcade-auth-status]");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-good", Boolean(good));
}

function showArcadeAuth(message = "") {
  const panel = document.querySelector("[data-arcade-auth-panel]");
  if (panel) panel.classList.remove("is-collapsed");
  if (message) setArcadeAuthStatus(message);
}

function hideArcadeAuth() {
  document.querySelector("[data-arcade-auth-panel]")?.classList.add("is-collapsed");
}

function getGuestChatName() {
  if (State.guestChatName) return State.guestChatName;
  try {
    State.guestChatName = String(localStorage.getItem(STORAGE_PREFIX + "guest_chat_name") || "").trim().slice(0, 60);
  } catch (error) {}
  return State.guestChatName;
}

function setGuestChatName(name) {
  State.guestChatName = String(name || "").trim().slice(0, 60);
  try {
    if (State.guestChatName) localStorage.setItem(STORAGE_PREFIX + "guest_chat_name", State.guestChatName);
  } catch (error) {}
}

function setGuestChatStatus(message = "") {
  const status = document.querySelector("[data-arcade-guest-status]");
  if (status) status.textContent = message;
}

function updateGuestNameStep() {
  const form = document.querySelector("[data-arcade-guest-name-form]");
  if (!form) return;
  const needsName = !State.player && !getGuestChatName();
  form.classList.toggle("hidden", !needsName);
  const messageInput = document.querySelector("[data-arcade-chat-form] input[name='message']");
  if (messageInput) {
    messageInput.disabled = needsName;
    messageInput.placeholder = needsName ? "Enter your name first..." : "Message support...";
  }
  if (needsName) {
    form.elements.namedItem("name")?.focus();
  }
}

function updateArcadeAccountUi() {
  const loggedIn = Boolean(State.player);
  document.body.classList.toggle("is-arcade-player", loggedIn);
  const name = document.querySelector("[data-arcade-player-name]");
  if (name) name.textContent = loggedIn ? State.player.username || "Player" : "Guest";
  const menuName = document.querySelector("[data-arcade-menu-name]");
  if (menuName) menuName.textContent = loggedIn ? State.player.username || "Player" : "Player";
  const authOpen = document.querySelector("[data-arcade-auth-open]");
  const logout = document.querySelector("[data-arcade-logout]");
  const spinOpen = document.querySelector("[data-arcade-spin-open]");
  const chatOpen = document.querySelector("[data-arcade-chat-open]");
  if (authOpen) {
    authOpen.classList.toggle("hidden", loggedIn);
    authOpen.disabled = loggedIn;
  }
  if (logout) logout.classList.toggle("hidden", !loggedIn);
  if (spinOpen) spinOpen.disabled = !loggedIn;
  if (chatOpen) chatOpen.disabled = !loggedIn;
  if (spinOpen) spinOpen.classList.toggle("hidden", !loggedIn);
  if (chatOpen) chatOpen.classList.toggle("hidden", !loggedIn);
  if (loggedIn) {
    hideArcadeAuth();
  } else {
    hideArcadeAuth();
    setArcadeAuthStatus("Log in to play, chat, and use daily spin.");
    document.querySelector("[data-arcade-chat]")?.classList.add("hidden");
  }
}

function renderArcadeMessages(messages = []) {
  const list = document.querySelector("[data-arcade-chat-messages]");
  if (!list) return;
  list.innerHTML = "";
  const fallback = State.player
    ? "Message South Diamond support here."
    : getGuestChatName()
      ? "Send your message to South Diamond support."
      : "Enter your name to start a chat with South Diamond support.";
  const shown = messages.length ? messages : [{ author: "operator", text: fallback }];
  shown.forEach((message) => {
    const item = document.createElement("article");
    item.className = `arcade-chat-message ${message.author === "operator" ? "operator" : "player"}`;
    const author = document.createElement("span");
    author.textContent = message.author === "operator" ? "Support" : "You";
    const text = document.createElement("p");
    text.textContent = message.text || "";
    item.append(author, text);
    list.appendChild(item);
  });
  list.scrollTop = list.scrollHeight;
}

async function refreshArcadeChat() {
  if (!document.querySelector("[data-arcade-chat-messages]")) return;
  const endpoint = State.player ? "/api/player/chat" : "/api/chats/guest-message";
  const data = await arcadeApi(endpoint, { timeoutMs: 8000 });
  renderArcadeMessages(data.chat?.messages || []);
}

function openArcadeChat({ guest = false } = {}) {
  const drawer = document.querySelector("[data-arcade-chat]");
  if (!drawer) return;
  if (!State.player) return window.location.href = "/";
  drawer.classList.remove("hidden");
  updateGuestNameStep();
  if (!State.player && guest) {
    setArcadeAuthStatus("Enter your name to start chat.", true);
  }
  refreshArcadeChat().catch(() => {});
}

// ----- Daily free spin wheel -----
// Physical wheel layout, clockwise starting from the TOP (under the pointer).
// Each prize value matches a real prize the server can award (0/1/3/5/10).
// The most common prize (1) appears most often so the wheel feels fair.
const DAILY_SPIN_SEGMENTS = [10, 1, 3, 1, 5, 1, 3, 0];
const DAILY_SPIN_COLORS = {
  10: "#ffb000",
  5: "#16a34a",
  3: "#1f7ae0",
  1: "#7a2ff2",
  0: "#c0203a",
};
const DAILY_SPIN_SEG_DEG = 360 / DAILY_SPIN_SEGMENTS.length;
let dailySpinRotation = 0;
let dailySpinBuilt = false;
let dailySpinSpinning = false;

// Convert an angle measured clockwise from the top into SVG x/y on a circle.
function spinWheelXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function buildDailySpinWheel() {
  const wheel = document.querySelector("[data-arcade-spin-wheel]");
  if (!wheel || dailySpinBuilt) return;
  const cx = 100, cy = 100, r = 96, labelR = 60;
  let paths = "";
  let labels = "";
  DAILY_SPIN_SEGMENTS.forEach((prize, i) => {
    const a0 = i * DAILY_SPIN_SEG_DEG;
    const a1 = a0 + DAILY_SPIN_SEG_DEG;
    const p0 = spinWheelXY(cx, cy, r, a0);
    const p1 = spinWheelXY(cx, cy, r, a1);
    paths += `<path d="M${cx} ${cy} L${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${r} ${r} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z" fill="${DAILY_SPIN_COLORS[prize] || "#444"}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`;
    const c = spinWheelXY(cx, cy, labelR, a0 + DAILY_SPIN_SEG_DEG / 2);
    const text = prize > 0 ? String(prize) : "—";
    labels += `<text x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="${prize > 0 ? 26 : 20}" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,.55);stroke-width:3px">${text}</text>`;
  });
  wheel.innerHTML =
    `<svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#08020d"/>` +
    paths + labels +
    `</svg>`;
  dailySpinBuilt = true;
}

function formatSpinWait(value) {
  if (!value) return "Come back tomorrow for your next free spin.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Come back tomorrow for your next free spin.";
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return "Your daily spin is ready.";
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.ceil((ms % 3600000) / 60000);
  if (hrs > 0) return `Next free spin in ${hrs}h ${mins}m.`;
  return `Next free spin in ${mins}m.`;
}

async function refreshDailySpinStatus({ updateResult = true } = {}) {
  if (!State.player) return null;
  const status = await arcadeApi("/api/player/spin-status", { timeoutMs: 8000 });
  const menuBtn = document.querySelector("[data-arcade-spin-open]");
  const runBtn = document.querySelector("[data-arcade-spin-run]");
  const result = document.querySelector("[data-arcade-spin-result]");
  if (menuBtn) menuBtn.classList.toggle("is-ready", Boolean(status.eligible));
  if (runBtn && !dailySpinSpinning) {
    runBtn.disabled = !status.eligible;
    runBtn.textContent = status.eligible ? "SPIN" : "Come Back Tomorrow";
  }
  if (result && updateResult && !dailySpinSpinning) {
    result.textContent = status.eligible ? "Your daily spin is ready — tap SPIN!" : formatSpinWait(status.nextSpinAt);
  }
  return status;
}

function openArcadeSpin() {
  if (!State.player) return showArcadeAuth("Sign in to use daily spin.");
  // Close the menu panel if it's open so the wheel is front and centre.
  document.querySelector("[data-arcade-menu-panel]")?.classList.add("hidden");
  const modal = document.querySelector("[data-arcade-spin-modal]");
  if (!modal) return;
  buildDailySpinWheel();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  refreshDailySpinStatus().catch((error) => {
    const result = document.querySelector("[data-arcade-spin-result]");
    if (result) result.textContent = error.message;
  });
}

function closeArcadeSpin() {
  if (dailySpinSpinning) return; // don't let the player close mid-spin
  const modal = document.querySelector("[data-arcade-spin-modal]");
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden", "true");
}

// Spin the wheel so it lands exactly on a segment matching the server prize.
async function runArcadeDailySpin() {
  const button = document.querySelector("[data-arcade-spin-run]");
  const result = document.querySelector("[data-arcade-spin-result]");
  const wheel = document.querySelector("[data-arcade-spin-wheel]");
  if (!button || !State.player || dailySpinSpinning) return;
  buildDailySpinWheel();
  dailySpinSpinning = true;
  button.disabled = true;
  button.textContent = "Spinning...";
  if (result) result.textContent = "Good luck! 🍀";
  try {
    const data = await arcadeApi("/api/player/spin", { method: "POST", body: JSON.stringify({}), timeoutMs: 12000 });
    const prize = Number(data.prize) || 0;

    // Choose one physical segment that shows this prize, then rotate so that
    // segment's centre stops under the pointer at the top.
    const matches = DAILY_SPIN_SEGMENTS.map((p, i) => (p === prize ? i : -1)).filter((i) => i >= 0);
    const segIndex = matches.length ? matches[Math.floor(Math.random() * matches.length)] : 0;
    const center = segIndex * DAILY_SPIN_SEG_DEG + DAILY_SPIN_SEG_DEG / 2;
    const jitter = (Math.random() * 2 - 1) * (DAILY_SPIN_SEG_DEG / 2 - 6); // stay inside the wedge
    const targetMod = (360 - (center % 360)) % 360;
    const current = dailySpinRotation;
    let base = current - (current % 360) + targetMod;
    while (base < current + 360 * 6) base += 360; // always at least 6 full turns forward
    dailySpinRotation = base + jitter;

    if (wheel) {
      wheel.style.transition = "transform 5s cubic-bezier(.12,.67,.12,1)";
      // Force a reflow so the new transition/transform always animates.
      void wheel.offsetWidth;
      wheel.style.transform = `rotate(${dailySpinRotation}deg)`;
    }

    await new Promise((resolve) => setTimeout(resolve, 5200));

    State.player = data.user;
    State.credits = Number(data.user?.points) || State.credits;
    updateDisplays();
    updateArcadeAccountUi();
    if (result) {
      result.innerHTML = prize > 0
        ? `🎉 The wheel landed on <strong>${prize}</strong> — you won <strong>${prize} point${prize === 1 ? "" : "s"}</strong>!<br><span class="arcade-spin-balance">New balance: ${fmt(State.credits)} pts</span>`
        : "The wheel landed on —. Better luck tomorrow!";
    }
    Audio.win(prize >= 5, null);
  } catch (error) {
    if (result) result.textContent = `${error.message} ${formatSpinWait(error.nextSpinAt)}`.trim();
  } finally {
    dailySpinSpinning = false;
    refreshDailySpinStatus({ updateResult: false }).catch(() => {});
  }
}

// On game open, pop the wheel automatically when the 24h timer has elapsed.
async function maybeAutoOpenDailySpin() {
  if (!State.player) return;
  try {
    const status = await arcadeApi("/api/player/spin-status", { timeoutMs: 8000 });
    if (status && status.eligible) openArcadeSpin();
  } catch (err) {
    // Never block the game if the status check fails.
  }
}

function bindArcadePlayerTools() {
  const loginForm = document.querySelector("[data-arcade-login-form]");
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    setArcadeAuthStatus("Checking login...");
    try {
      const data = await arcadeApi("/api/player/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginForm.elements.email.value.trim(),
          password: loginForm.elements.password.value,
        }),
        timeoutMs: 12000,
      });
      State.player = data.user;
      State.credits = Number(data.user?.points) || 0;
      loginForm.reset();
      setArcadeAuthStatus("Signed in.", true);
      updateDisplays();
      updateArcadeAccountUi();
      renderLobby();
    } catch (error) {
      setArcadeAuthStatus(error.message || "Could not sign in.");
    } finally {
      if (button) button.disabled = false;
    }
  });
  document.querySelector("[data-arcade-auth-open]")?.addEventListener("click", () => showArcadeAuth("Enter your player login."));
  document.querySelector("[data-arcade-guest-chat-open]")?.addEventListener("click", () => openArcadeChat({ guest: true }));
  document.querySelector("[data-arcade-logout]")?.addEventListener("click", async () => {
    await arcadeApi("/api/player/logout", { method: "POST", timeoutMs: 8000 }).catch(() => {});
    State.player = null;
    State.credits = 0;
    updateDisplays();
    updateArcadeAccountUi();
    window.location.href = "/";
  });
  document.querySelector("[data-arcade-chat-open]")?.addEventListener("click", () => {
    openArcadeChat();
  });
  document.querySelector("[data-arcade-chat-home]")?.addEventListener("click", openArcadeChat);
  document.querySelector("[data-arcade-menu-open]")?.addEventListener("click", () => {
    document.querySelector("[data-arcade-menu-panel]")?.classList.toggle("hidden");
  });
  document.querySelector("[data-arcade-menu-close]")?.addEventListener("click", () => {
    document.querySelector("[data-arcade-menu-panel]")?.classList.add("hidden");
  });
  document.querySelector("[data-arcade-password-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("[data-arcade-menu-status]");
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    if (status) status.textContent = "Updating password...";
    try {
      await arcadeApi("/api/player/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.elements.currentPassword.value,
          newPassword: form.elements.newPassword.value,
        }),
        timeoutMs: 10000,
      });
      form.reset();
      if (status) status.textContent = "Password updated.";
    } catch (error) {
      if (status) status.textContent = error.message || "Could not update password.";
    } finally {
      if (button) button.disabled = false;
    }
  });
  document.querySelector("[data-arcade-chat-close]")?.addEventListener("click", () => {
    document.querySelector("[data-arcade-chat]")?.classList.add("hidden");
  });
  document.querySelector("[data-arcade-guest-name-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = form.elements.namedItem("name");
    const name = nameInput?.value.trim() || "";
    if (!name) {
      setGuestChatStatus("Please enter your name first.");
      nameInput?.focus();
      return;
    }
    setGuestChatName(name);
    setGuestChatStatus("");
    updateGuestNameStep();
    renderArcadeMessages([]);
    document.querySelector("[data-arcade-chat-form] input[name='message']")?.focus();
  });
  document.querySelector("[data-arcade-chat-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.message;
    const text = input.value.trim();
    if (!text) return;
    if (!State.player && !getGuestChatName()) {
      updateGuestNameStep();
      setGuestChatStatus("Please enter your name first.");
      return;
    }
    input.value = "";
    const data = await arcadeApi(State.player ? "/api/chats/player-message" : "/api/chats/guest-message", {
      method: "POST",
      body: JSON.stringify(State.player ? { text } : { text, name: getGuestChatName() }),
      timeoutMs: 10000,
    });
    renderArcadeMessages(data.chat?.messages || []);
  });
  document.querySelector("[data-arcade-spin-open]")?.addEventListener("click", openArcadeSpin);
  document.querySelector("[data-arcade-spin-close]")?.addEventListener("click", closeArcadeSpin);
  document.querySelector("[data-arcade-spin-run]")?.addEventListener("click", runArcadeDailySpin);
  document.querySelector("[data-arcade-spin-modal]")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeArcadeSpin();
  });
}

// ============================================================
// 8) RENDERER - Build DOM for lobby + in-game view
// ============================================================
const FEATURED_GAMES = new Set(["wildBuffalo", "kingKong", "dragonEmpress"]);
const NEW_GAMES = new Set(["gorillaGold", "mammothRush", "oceanTreasure"]);
const HOT_GAMES = new Set(["triple777", "vegas7s", "pharaoh"]);

function renderLobby() {
  const lobby = $("[data-lobby-grid]");
  if (!lobby) return;
  lobby.innerHTML = GAME_ORDER.map(key => {
    const game = GAMES[key];
    const enabled = isAdminGameEnabled(key);
    const mascotSvg = MASCOT_ART[key] || "";
    const badge = FEATURED_GAMES.has(key) ? '<span class="tile-badge badge-featured">FEATURED</span>' :
                  NEW_GAMES.has(key) ? '<span class="tile-badge badge-new">NEW</span>' :
                  HOT_GAMES.has(key) ? '<span class="tile-badge badge-hot">HOT</span>' : '';
    return `
      <button class="lobby-tile theme-${game.theme}${enabled ? "" : " is-maintenance"}" data-game="${key}" aria-disabled="${enabled ? "false" : "true"}">
        <div class="tile-bg ${game.sceneClass}"></div>
        <div class="tile-shine" aria-hidden="true"></div>
        <div class="tile-decor" aria-hidden="true">${(game.bgEmoji || []).map(e => `<span>${e}</span>`).join("")}</div>
        <div class="tile-mascot-art" aria-hidden="true">${mascotSvg}</div>
        ${enabled ? badge : '<span class="tile-badge badge-maintenance">MAINTENANCE</span>'}
        <div class="tile-info">
          <strong>${game.title}</strong>
          <span>${game.tagline}</span>
          <small>${game.reels}×${game.rows} · ${game.paylines.length} ${game.paylines.length === 1 ? "line" : "lines"} · RTP ${Math.round((game.rtpScale || 0.92) * 100 / (game.rtpScale > 1 ? game.rtpScale : 1)) || 92}%</small>
        </div>
        <div class="tile-play">
          <span class="play-icon">▶</span>
          <span class="play-text">${enabled ? "PLAY NOW" : "OFFLINE"}</span>
        </div>
      </button>
    `;
  }).join("");
  // Apply real images (PNG) if available - SVG is fallback
  GAME_ORDER.forEach((key) => {
    const tile = lobby.querySelector(`[data-game="${key}"]`);
    if (tile) applyTileArt(tile, key);
  });
}

function renderSymbolHtml(symKey, game, opts = {}) {
  const sym = game.symbols[symKey];
  if (!sym) return `<span class="sym-cell"><span class="sym-text">${symKey}</span></span>`;
  const winClass = opts.winning ? " is-winning" : "";
  if (sym.type === "image") {
    const label = sym.label || symKey;
    return `<span class="sym-cell sym-image${winClass}" data-sym="${symKey}"><span class="sym-inner"><img src="${sym.src}" alt="${label}" loading="eager" draggable="false" /></span></span>`;
  }
  if (sym.type === "svg") {
    return `<span class="sym-cell sym-svg${winClass}" data-sym="${symKey}"><span class="sym-inner">${sym.icon}</span></span>`;
  }
  return `<span class="sym-cell sym-emoji${winClass}" data-sym="${symKey}"><span class="sym-inner">${sym.icon}</span></span>`;
}

async function renderGameView(gameKey) {
  const game = GAMES[gameKey];
  if (!game) return;
  await refreshArcadeControls().catch(() => null);
  if (!isAdminGameEnabled(gameKey)) {
    State.activeGame = gameKey;
    document.body.classList.remove("is-lobby-active");
    $("[data-lobby-view]").classList.add("hidden");
    $("[data-game-view]").classList.remove("hidden");
    $("[data-back-button]").classList.remove("hidden");
    $("[data-arcade-home]")?.classList.remove("hidden");
    showMaintenanceOverlay();
    setWinMessage("This game is currently turned off by admin.");
    return;
  }
  State.activeGame = gameKey;
  $("[data-arcade-home]")?.classList.remove("hidden");
  applyAdminGameControls(gameKey, { force: true });
  const root = $("[data-game-view]");
  if (!root) return;

  // Apply theme + layout classes
  const layout = game.layout || "default";
  root.className = `game-view theme-${game.theme} ${game.sceneClass} layout-${layout}`;
  root.dataset.reels = String(game.reels);
  root.dataset.rows = String(game.rows);
  root.style.setProperty("--accent", game.accent);
  root.style.setProperty("--accent2", game.accent2 || game.accent);

  // Inject big mascot SVG illustration (for watermark/top layouts)
  const mascotSvg = MASCOT_ART[State.activeGame] || "";
  if (mascotSvg) {
    root.style.setProperty("--mascot-bg", `url('data:image/svg+xml;utf8,${encodeURIComponent(mascotSvg)}')`);
  }
  // Remove any prior big-mascot element
  $$(".big-mascot-art", root).forEach(el => el.remove());
  if (layout === "mascot-top" && mascotSvg) {
    const bigMascot = document.createElement("div");
    bigMascot.className = "big-mascot-art mascot-art";
    bigMascot.innerHTML = mascotSvg;
    const logoBar = $(".game-logo-bar", root);
    if (logoBar) logoBar.parentNode.insertBefore(bigMascot, logoBar.nextSibling);
  }
  // Character paytable (top of game) for layouts that benefit from it
  $$(".character-paytable", root).forEach(el => el.remove());
  if (layout === "mascot-top" || layout === "table-felt") {
    renderCharacterPaytable(game, root);
  }

  // Header info
  $("[data-game-title]").innerHTML = game.title;
  $("[data-game-mascot]").innerHTML = game.mascot;
  $("[data-game-tagline]").textContent = game.tagline;

  // Background decorative emojis
  const decor = $("[data-game-decor]");
  if (decor) {
    decor.innerHTML = "";
    const emojiSet = game.bgEmoji || [];
    for (let i = 0; i < 18; i++) {
      const sp = document.createElement("span");
      sp.innerHTML = emojiSet[i % emojiSet.length];
      sp.style.left = `${Math.random() * 100}%`;
      sp.style.top = `${Math.random() * 100}%`;
      sp.style.animationDelay = `${Math.random() * 6}s`;
      sp.style.fontSize = `${1 + Math.random() * 2}rem`;
      sp.style.opacity = (0.1 + Math.random() * 0.4).toFixed(2);
      decor.appendChild(sp);
    }
  }

  // Build reels with scrolling strip structure
  const reelStrip = $("[data-reel-strip]");
  reelStrip.style.gridTemplateColumns = `repeat(${game.reels}, 1fr)`;
  const reelsFrame = reelStrip.closest(".reels-frame");
  if (reelsFrame) {
    reelsFrame.style.setProperty("--game-reels", game.reels);
    reelsFrame.style.setProperty("--game-rows", game.rows);
  }
  reelStrip.style.setProperty("--game-rows", game.rows);
  reelStrip.style.setProperty("--game-reels", game.reels);
  reelStrip.innerHTML = "";
  for (let r = 0; r < game.reels; r++) {
    const reel = document.createElement("div");
    reel.className = "reel";
    reel.dataset.reel = String(r);
    reel.style.setProperty("--rows", game.rows);
    const strip = document.createElement("div");
    strip.className = "reel-track";
    for (let row = 0; row < game.rows; row++) {
      const cell = document.createElement("div");
      cell.className = "reel-cell";
      cell.dataset.row = String(row);
      cell.innerHTML = renderSymbolHtml(weightedPick(game.symbols), game);
      strip.appendChild(cell);
    }
    reel.appendChild(strip);
    reelStrip.appendChild(reel);
  }

  // Paytable ladders
  renderPaytable(game);

  // Update bet & credit displays
  clampBetToAdmin(gameKey);
  updateDisplays();

  // Show game view, hide lobby
  hideMaintenanceOverlay();
  document.body.classList.remove("is-lobby-active");
  $("[data-lobby-view]").classList.add("hidden");
  $("[data-game-view]").classList.remove("hidden");
  $("[data-back-button]").classList.remove("hidden");

  // Apply real game art (image) overrides if available
  applyGameArt(gameKey, root);
  // Start music
  if (State.musicOn) Audio.startMusic(game);
}

function renderCharacterPaytable(game, root) {
  const order = game.paytableOrder || Object.keys(game.symbols).slice(0, 8);
  const html = order.slice(0, 8).map(symKey => {
    const sym = game.symbols[symKey];
    if (!sym) return "";
    const pay = topSymbolPay(sym, game.reels);
    const iconHtml = symbolIconHtml(sym);
    return `<div class="char-pt"><div class="char-pt-icon">${iconHtml}</div><div class="char-pt-value">${pay}</div></div>`;
  }).join("");
  const bar = document.createElement("div");
  bar.className = "character-paytable";
  bar.innerHTML = html;
  // Insert before play-area
  const playArea = $(".play-area", root);
  if (playArea) playArea.parentNode.insertBefore(bar, playArea);
}

function renderPaytable(game) {
  const left = $("[data-paytable-left]");
  const right = $("[data-paytable-right]");
  if (!left || !right) return;
  const order = game.paytableOrder || Object.keys(game.symbols).slice(0, 8);
  const half = Math.ceil(order.length / 2);
  const renderRow = (symKey) => {
    const sym = game.symbols[symKey];
    if (!sym) return "";
    // Top payout (5 of a kind or 3 for 3-reel)
    const pay = topSymbolPay(sym, game.reels);
    const iconHtml = symbolIconHtml(sym);
    return `
      <div class="pt-row">
        <div class="pt-icon">${iconHtml}</div>
        <div class="pt-value">${pay}</div>
      </div>
    `;
  };
  left.innerHTML = order.slice(0, half).map(renderRow).join("");
  right.innerHTML = order.slice(half).map(renderRow).join("");
}

function updateDisplays() {
  $("[data-credits]").textContent = fmt(State.credits);
  $("[data-bet]").textContent = fmt(State.bet);
  $("[data-jp-grand]").textContent = "$" + fmt(State.jackpots.grand);
  $("[data-jp-major]").textContent = "$" + fmt(State.jackpots.major);
  $("[data-jp-minor]").textContent = "$" + fmt(State.jackpots.minor);
  $("[data-jp-mini]").textContent = "$" + fmt(State.jackpots.mini);
  const linesEl = $("[data-lines]");
  if (linesEl && State.activeGame) {
    const g = GAMES[State.activeGame];
    linesEl.textContent = g.wayMode === "ways"
      ? Math.pow(Math.max(1, g.rows), Math.max(1, g.reels))
      : g.paylines.length;
  }
}

// Render or hide the free-spin counter badge in the game view
function renderFreeSpinBadge() {
  const gameView = $("[data-game-view]");
  if (!gameView) return;
  let badge = gameView.querySelector("[data-free-spin-badge]");
  if (State.freeSpinsRemaining > 0) {
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "free-spin-badge";
      badge.setAttribute("data-free-spin-badge", "");
      gameView.appendChild(badge);
    }
    const mult = Number(State.freeSpinMultiplier) || 5;
    badge.innerHTML = `
      <div class="fsb-title">FREE SPINS</div>
      <div class="fsb-count">${State.freeSpinsRemaining}</div>
      <div class="fsb-meta">${mult}x multiplier \u00b7 won ${fmt(State.freeSpinTotalWin || 0)}</div>
    `;
    badge.classList.remove("hidden");
  } else if (badge) {
    badge.classList.add("hidden");
  }
}

function startJackpotTicker() {
  // Visually increment jackpots in real-time to feel "live"
  setInterval(() => {
    State.jackpots.grand += 0.0017 + Math.random() * 0.0019;
    State.jackpots.major += 0.0008 + Math.random() * 0.0011;
    State.jackpots.minor += 0.0003 + Math.random() * 0.0006;
    State.jackpots.mini += 0.0001 + Math.random() * 0.0002;
    updateDisplays();
  }, 200);
}

// ============================================================
// 9) SPIN ANIMATION
// ============================================================
// ============================================================
// REEL MOTION ENGINE  (requestAnimationFrame, frame-rate independent)
//   Phase 1  beginReelLoop : reels start spinning INSTANTLY on click,
//            looping at constant velocity while the server resolves.
//   Phase 2  landReel      : staggered stop with an overshoot + settle
//            bounce, landing exactly on the resolved grid.
// Motion is driven by delta-time (px/sec) so it feels identical on a
// 60Hz or 144Hz display and never stutters when frames are dropped.
// ============================================================
const REEL_LOOP_CPS = 24;            // loop speed in cells-per-second
const reelSleep = (ms) => new Promise((r) => setTimeout(r, ms));

function reelCellHeight(reelEl) {
  const cell = reelEl.querySelector(".reel-cell");
  if (cell && cell.offsetHeight) return cell.offsetHeight;
  const rows = Number(reelEl.style.getPropertyValue("--rows")) || 3;
  return (reelEl.offsetHeight || 270) / rows;
}

// Start an instant, continuously-scrolling blur loop on a single reel.
function beginReelLoop(reelEl, game) {
  const strip = reelEl.querySelector(".reel-track");
  if (!strip) return;
  const symKeys = Object.keys(game.symbols);
  const rows = game.rows;
  const cellH = reelCellHeight(reelEl);        // measure BEFORE we overwrite cells
  const total = rows + 4;                       // window + spares for recycling
  let html = "";
  for (let i = 0; i < total; i++) {
    html += `<div class="reel-cell" data-row="-1">${renderSymbolHtml(symKeys[(Math.random() * symKeys.length) | 0], game)}</div>`;
  }
  strip.style.transition = "none";
  strip.innerHTML = html;
  reelEl.classList.remove("is-warming");
  reelEl.classList.add("is-spinning");

  const st = {
    y: Math.random() * cellH,                   // random phase so reels aren't in lockstep
    vel: REEL_LOOP_CPS * cellH * (0.92 + Math.random() * 0.16), // ±8% speed variance
    cellH, rows, symKeys, game, strip,
    running: true, landing: false,
    last: performance.now(), raf: 0,
  };
  reelEl._spin = st;

  const tick = (now) => {
    if (!st.running) return;
    const dt = Math.min(0.05, (now - st.last) / 1000); // clamp tab-switch gaps
    st.last = now;
    if (!st.landing) {
      st.y += st.vel * dt;
      // symbols travel DOWNWARD; recycle bottom cell to the top
      while (st.y >= st.cellH) {
        st.y -= st.cellH;
        const last = st.strip.lastElementChild;
        if (last) {
          last.innerHTML = renderSymbolHtml(st.symKeys[(Math.random() * st.symKeys.length) | 0], st.game);
          st.strip.insertBefore(last, st.strip.firstElementChild);
        }
      }
      st.strip.style.transform = `translateY(${st.y - st.cellH}px)`;
    }
    st.raf = requestAnimationFrame(tick);
  };
  st.raf = requestAnimationFrame(tick);
}

// Immediately freeze a reel's loop (used on error / safety abort).
function haltReelLoop(reelEl) {
  const st = reelEl && reelEl._spin;
  if (st) { st.running = false; if (st.raf) cancelAnimationFrame(st.raf); }
  if (reelEl) reelEl.classList.remove("is-spinning", "is-warming");
}

// Decelerate a spinning reel to rest on finalSymbols, with overshoot + settle.
function landReel(reelEl, finalSymbols, game, opts = {}) {
  return new Promise((resolve) => {
    const st = reelEl._spin;
    const strip = reelEl.querySelector(".reel-track");
    if (!st || !strip) return resolve();
    const cellH = st.cellH;
    const rows = game.rows;
    const symKeys = st.symKeys;
    const profile = getSpinProfile(game);
    const runIn = 10;                                   // cells scrolled before the result lands

    // Fixed strip: [final rows][run-in randoms]. Final block starts above the
    // window and descends into place, so motion stays downward and continuous.
    let html = "";
    for (let i = 0; i < rows; i++) {
      html += `<div class="reel-cell" data-row="${i}">${renderSymbolHtml(finalSymbols[i] || symKeys[0], game)}</div>`;
    }
    for (let i = 0; i < runIn; i++) {
      html += `<div class="reel-cell" data-row="-1">${renderSymbolHtml(symKeys[(Math.random() * symKeys.length) | 0], game)}</div>`;
    }
    st.landing = true;                                  // stop the loop writing transform
    strip.style.transition = "none";
    strip.innerHTML = html;

    const startT = -(runIn * cellH);                    // run-in fills the window
    const restT = 0;                                    // final rows fill the window
    const over = Math.min(18, cellH * 0.16);            // overshoot past the stop, then settle
    const dur = Math.round((opts.duration || 520) * (opts.slowFinish ? 1.35 : 1));
    const decel = 0.80;                                 // fraction spent decelerating vs settling
    const ease = (x) => 1 - Math.pow(1 - x, 3);         // easeOutCubic
    const t0 = performance.now();
    if (opts.slowFinish) reelEl.classList.add("slow-finish");

    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      let T;
      if (p < decel) {
        T = startT + (restT + over - startT) * ease(p / decel);
      } else {
        const q = (p - decel) / (1 - decel);
        T = (restT + over) + (restT - (restT + over)) * ease(q);
      }
      strip.style.transform = `translateY(${T}px)`;
      if (p < 1) { requestAnimationFrame(step); return; }
      // Settled.
      strip.style.transform = `translateY(${restT}px)`;
      st.running = false;
      if (st.raf) cancelAnimationFrame(st.raf);
      reelEl.classList.remove("is-spinning", "slow-finish");
      reelEl.classList.add("just-landed", "effect-" + profile.effect);
      reelEl.dataset.effect = profile.effect;
      if (Audio.reelStop) Audio.reelStop();
      triggerLandingEffect(reelEl, profile.effect);
      setTimeout(() => reelEl.classList.remove("just-landed", "effect-" + profile.effect), 600);
      resolve();
    };
    requestAnimationFrame(step);
  });
}

function triggerLandingEffect(reelEl, effect) {
  if (!effect || effect === "default" || effect === "clean") return;
  // Inject a quick burst element under reel
  const burst = document.createElement("div");
  burst.className = "landing-fx fx-" + effect;
  reelEl.appendChild(burst);
  setTimeout(() => burst.remove(), 700);
}

async function spinGame() {
  if (State.isSpinning || !State.activeGame) return;
  const game = GAMES[State.activeGame];
  const isFreeSpin = State.freeSpinsRemaining > 0;
  const spinBet = isFreeSpin ? (State.freeSpinTriggerBet || State.bet) : State.bet;
  if (!State.player && !(await refreshPlayerPoints({ redirectOnFail: true }))) {
    stopAutoSpin();
    return;
  }
  // Best-effort refresh of admin controls — do not let a slow network block the spin.
  // We race the refresh against a short timeout so the player can keep spinning
  // even if /api/player/slots/arcade-config is briefly slow.
  refreshArcadeControls().catch(() => null);
  if (!isFreeSpin && State.credits < State.bet) {
    flashMessage("Not enough South Diamond points. Ask admin to add points.");
    stopAutoSpin();
    return;
  }
  if (!isAdminGameEnabled(State.activeGame)) {
    showMaintenanceOverlay();
    flashMessage("This game is currently turned off by admin.");
    stopAutoSpin();
    return;
  }
  clampBetToAdmin(State.activeGame);
  if (!isFreeSpin && State.credits < State.bet) {
    flashMessage("Not enough South Diamond points for this game's admin bet limit.");
    stopAutoSpin();
    return;
  }
  State.isSpinning = true;
  const spinButton = $("[data-spin-btn]");
  if (spinButton) {
    spinButton.classList.add("is-spinning");
    spinButton.disabled = true;
  }
  // Hard safety: regardless of what happens below (network hang, animation
  // hiccup, JS exception in a downstream call), make sure the spin button is
  // never permanently disabled. 20 seconds is well past any realistic spin.
  if (State._spinSafetyTimer) clearTimeout(State._spinSafetyTimer);
  State._spinSafetyTimer = setTimeout(() => {
    State.isSpinning = false;
    const btn = $("[data-spin-btn]");
    if (btn) {
      btn.classList.remove("is-spinning");
      btn.disabled = false;
    }
    // Clear lingering reel-spinning styling AND stop any running rAF loop
    // so the reels don't stay blurred or keep scrolling forever.
    $$("[data-reel-strip] .reel").forEach((el) => haltReelLoop(el));
  }, 20000);
  Audio.resume();
  Audio.spinStart();

  if (isFreeSpin) {
    State.freeSpinsRemaining -= 1;
    State.spinCount++;
    setWinMessage(`FREE SPIN \u2014 ${State.freeSpinsRemaining} left`);
  } else {
    State.credits -= State.bet;
    State.totalWagered += State.bet;
    State.spinCount++;
    incrementJackpots(State.bet);
  }
  updateDisplays();
  renderFreeSpinBadge();
  setWinMessage("Reels rolling...");
  $("[data-win-amount]").textContent = "0.00";
  $("[data-reel-strip]").classList.remove("is-winning");
  hideWinBurst();

  // Start the reels spinning IMMEDIATELY on click — do not wait for the
  // network. They loop at constant velocity while the server resolves the
  // grid below, then stop on the real result. This is what gives the spin
  // its instant, responsive game feel.
  const reels = $$("[data-reel-strip] .reel");
  reels.forEach((reel) => beginReelLoop(reel, game));
  const spinStartedAt = performance.now();

  let settlement = null;
  let grid = [];
  let result = null;
  try {
    settlement = await arcadeApi("/api/player/slots/arcade-spin", {
      method: "POST",
      body: JSON.stringify({
        gameKey: State.activeGame,
        bet: isFreeSpin ? 0 : State.bet,
        freeSpin: isFreeSpin,
        triggerBet: spinBet,
      }),
    });
    grid = Array.isArray(settlement.grid) ? settlement.grid : generateGrid(game);
    // The server may attach a daily must-drop jackpot on top of the normal win.
    // It is bet-independent and separate from RTP — fold it into the displayed
    // total and flag the tier so the jackpot celebration fires.
    const jackpotWin = Number(settlement.jackpotWin) || 0;
    const jackpotTier = jackpotWin > 0 ? (settlement.jackpotTier || null) : null;
    result = {
      wins: Array.isArray(settlement.wins) ? settlement.wins : [],
      totalPay: (Number(settlement.win) || 0) + jackpotWin,
      jpHit: jackpotTier,
      jackpotWin,
      anticipation: settlement.anticipation === true,
      freeSpinsAwarded: Number(settlement.freeSpinsAwarded) || 0,
    };
    if (isFreeSpin && Number.isFinite(Number(settlement.freeSpinsRemaining))) {
      State.freeSpinsRemaining = Math.max(0, Number(settlement.freeSpinsRemaining));
      renderFreeSpinBadge();
    }
  } catch (error) {
    if (!isFreeSpin) {
      State.credits = Math.round((State.credits + State.bet) * 100) / 100;
    }
    reels.forEach(haltReelLoop);
    updateDisplays();
    State.isSpinning = false;
    if (State._spinSafetyTimer) { clearTimeout(State._spinSafetyTimer); State._spinSafetyTimer = null; }
    if (spinButton) {
      spinButton.classList.remove("is-spinning");
      spinButton.disabled = false;
    }
    flashMessage(error.message || "Spin could not be saved. Try again.");
    stopAutoSpin();
    return;
  }

  // Determine if we should show anticipation
  const isJackpot = !!result.jpHit;
  const isMegaWin = !isJackpot && result.totalPay >= spinBet * 30;
  const isBigWin  = !isJackpot && !isMegaWin && result.totalPay >= spinBet * 10;
  // The server flags near-miss teases and big pending wins; either one earns
  // the dramatic last-reel slow-down that makes a real machine feel alive.
  const slowFinish = isJackpot || isMegaWin || result.anticipation === true;

  // Guarantee a minimum visible spin so a fast server response still feels
  // like a real spin (reels never "snap" instantly to the result).
  const profile = getSpinProfile(game);
  const MIN_SPIN = slowFinish ? 950 : 650;
  const elapsed = performance.now() - spinStartedAt;
  if (elapsed < MIN_SPIN) await reelSleep(MIN_SPIN - elapsed);

  // Stop reels left-to-right; each reel decelerates with an overshoot bounce.
  // The last reel slows dramatically when a big win / jackpot is pending.
  const stagger = Math.max(110, Math.round(profile.stagger * 0.55));
  const promises = reels.map((reel, idx) =>
    reelSleep(idx * stagger).then(() =>
      landReel(reel, grid[idx], game, {
        slowFinish: slowFinish && idx === reels.length - 1,
        duration: 470 + idx * 45,
      })
    )
  );

  try {
    await Promise.all(promises);
  } catch (error) {
    await Promise.allSettled(promises);
    updateDisplays();
    State.isSpinning = false;
    if (State._spinSafetyTimer) { clearTimeout(State._spinSafetyTimer); State._spinSafetyTimer = null; }
    if (spinButton) {
      spinButton.classList.remove("is-spinning");
      spinButton.disabled = false;
    }
    // Force-stop any lingering reel spin loops.
    $$("[data-reel-strip] .reel").forEach((el) => haltReelLoop(el));
    flashMessage(error.message || "Spin could not be saved. Try again.");
    stopAutoSpin();
    return;
  }

  // Highlight winning cells
  const winningCells = new Set();
  result.wins.forEach(w => {
    if (Array.isArray(w.positions) && w.positions.length) {
      (w.positions || []).forEach(([r, row]) => winningCells.add(`${r}-${row}`));
    } else if (w.linePattern) {
      for (let i = 0; i < w.count; i++) {
        winningCells.add(`${i}-${w.linePattern[i]}`);
      }
    }
  });
  $$("[data-reel-strip] .reel").forEach((reelEl) => {
    const r = reelEl.dataset.reel;
    const visibleCells = $$(".reel-track .reel-cell", reelEl).filter(c => c.dataset.row !== "-1" && c.dataset.row !== "" );
    visibleCells.forEach((cell) => {
      const row = cell.dataset.row;
      if (winningCells.has(`${r}-${row}`)) {
        cell.querySelector(".sym-cell")?.classList.add("is-winning");
      }
    });
  });

  // Apply win
  if (result.totalPay > 0) {
    const winReason = describeWin(game, result, grid);
    State.credits += result.totalPay;
    State.totalWon += result.totalPay;
    if (isFreeSpin) State.freeSpinTotalWin += result.totalPay;
    $("[data-reel-strip]").classList.add("is-winning");
    const isBig  = !isJackpot && !isMegaWin && result.totalPay >= spinBet * 10;
    const isMega = isMegaWin;
    const fsTag = isFreeSpin ? " (FREE)" : "";
    // Anticipation before reveal for big/mega/jackpot wins
    if (isJackpot) {
      await showAnticipation(result.jpHit, 2500);
      showJackpotBurst(result.jpHit, result.totalPay);
      Audio.jackpot();
      setWinMessage(`${result.jpHit.toUpperCase()} JACKPOT! +${fmt(result.totalPay)}`);
    } else if (isMega) {
      await showAnticipation("mega", 1500);
      showWinBurst(result.totalPay, true, true);
      Audio.win(true, game);
      setWinMessage(`MEGA WIN${fsTag}! ${winReason} +${fmt(result.totalPay)}`);
    } else if (isBig) {
      await showAnticipation("big", 900);
      showWinBurst(result.totalPay, true, false);
      Audio.win(true, game);
      setWinMessage(`BIG WIN${fsTag}! ${winReason} +${fmt(result.totalPay)}`);
    } else {
      showWinBurst(result.totalPay, false, false);
      Audio.win(false, game);
      setWinMessage(`Win${fsTag}! ${winReason} +${fmt(result.totalPay)}`);
    }
    animateCounter($("[data-win-amount]"), 0, result.totalPay, 1200);
  } else if (isFreeSpin) {
    setWinMessage(`Free spin \u2014 no win. ${State.freeSpinsRemaining} left.`);
  } else {
    setWinMessage("Good luck! Try again.");
  }

  // Free-spin trigger (only when not already inside a free-spin session)
  if (!isFreeSpin && result.freeSpinsAwarded > 0) {
    State.freeSpinsRemaining = result.freeSpinsAwarded;
    State.freeSpinTriggerBet = State.bet;
    State.freeSpinTotalWin = 0;
    await showAnticipation("big", 900);
    Audio.freeSpin();
    setWinMessage(`${result.freeSpinsAwarded} FREE SPINS UNLOCKED! Tap SPIN to play.`);
  }
  // End-of-session summary
  if (isFreeSpin && State.freeSpinsRemaining === 0) {
    const total = State.freeSpinTotalWin;
    State.freeSpinTotalWin = 0;
    State.freeSpinTriggerBet = 0;
    if (total > 0) setWinMessage(`Free spins complete! Total: +${fmt(total)}`);
    else setWinMessage("Free spins complete.");
  }

  updateDisplays();
  renderFreeSpinBadge();
  if (settlement?.user) {
    State.player = settlement.user;
    State.credits = Number(settlement.user.points) || State.credits;
    State.pointsSyncedAt = Date.now();
    updateDisplays();
  }
  saveState();
  if (typeof SlotsConfig !== "undefined") {
    // Record only the normal (RTP) win for client stats; the jackpot is a
    // separate must-drop pool and must not skew the RTP display.
    try { SlotsConfig.recordSpin(State.activeGame, isFreeSpin ? 0 : State.bet, Math.max(0, (result.totalPay || 0) - (result.jackpotWin || 0))); } catch (err) {}
  }
  State.isSpinning = false;
  if (State._spinSafetyTimer) { clearTimeout(State._spinSafetyTimer); State._spinSafetyTimer = null; }
  if (spinButton) {
    spinButton.classList.remove("is-spinning");
    spinButton.disabled = false;
  }

  // Auto-spin (also auto-continues free spins)
  if (State.autoSpin || State.freeSpinsRemaining > 0) {
    setTimeout(() => {
      if (State.autoSpin || State.freeSpinsRemaining > 0) spinGame();
    }, 650);
  }
}

function animateCounter(el, from, to, duration) {
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setWinMessage(text) {
  const el = $("[data-win-msg]");
  if (el) el.textContent = text;
}

function flashMessage(text) {
  setWinMessage(text);
  const el = $("[data-win-msg]");
  if (el) {
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1200);
  }
}

function showWinBurst(amount, isBig, isMega) {
  const burst = $("[data-win-burst]");
  if (!burst) return;
  burst.classList.remove("hidden", "mega");
  if (isMega) burst.classList.add("mega");
  $("[data-burst-amount]").innerHTML = isMega ? `MEGA WIN<br><span>+${fmt(amount)}</span>` :
                                          isBig ? `BIG WIN<br><span>+${fmt(amount)}</span>` :
                                                  `+${fmt(amount)}`;
  const coinBox = $("[data-coin-box]");
  if (coinBox) {
    coinBox.innerHTML = "";
    const n = isMega ? 40 : isBig ? 24 : 12;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "coin";
      c.textContent = ["\u{1F4B0}","\u{1F48E}","⭐","\u{1F31F}","\u{1F4B5}"][i % 5];
      c.style.left = (5 + Math.random() * 90) + "%";
      c.style.animationDelay = (Math.random() * 0.5) + "s";
      c.style.animationDuration = (1.2 + Math.random() * 1.4) + "s";
      coinBox.appendChild(c);
    }
  }
  setTimeout(() => burst.classList.add("hidden"), isMega ? 3500 : isBig ? 2600 : 1800);
}

function showJackpotBurst(level, amount) {
  const burst = $("[data-jackpot-burst]");
  if (!burst) return;
  burst.classList.remove("hidden");
  burst.dataset.level = level;
  $("[data-jp-burst-level]").textContent = level.toUpperCase() + " JACKPOT";
  $("[data-jp-burst-amount]").textContent = "$" + fmt(amount);
  setTimeout(() => burst.classList.add("hidden"), 4000);
}

function hideWinBurst() {
  $("[data-win-burst]")?.classList.add("hidden");
  $("[data-jackpot-burst]")?.classList.add("hidden");
}


// ============================================================
// ANTICIPATION OVERLAYS
// ============================================================
function showAnticipation(level, durationMs) {
  return new Promise((resolve) => {
    const overlay = $("[data-anticipation]");
    if (!overlay) return resolve();
    overlay.classList.remove("hidden");
    overlay.dataset.level = level;
    const txt = $("[data-anticipation-text]");
    if (txt) {
      if (level === "grand")      txt.textContent = "GRAND JACKPOT INCOMING!";
      else if (level === "major") txt.textContent = "MAJOR PRIZE INCOMING!";
      else if (level === "minor") txt.textContent = "MINOR PRIZE INCOMING!";
      else if (level === "mini")  txt.textContent = "MINI PRIZE INCOMING!";
      else if (level === "mega")  txt.textContent = "MEGA WIN INCOMING!";
      else                         txt.textContent = "BIG WIN INCOMING!";
    }
    // Drumroll: rising tone build-up
    if (Audio.ensure()) {
      const ctx = Audio.ctx;
      if (ctx) {
        const startFreq = 110;
        const endFreq = level === "grand" ? 880 : level === "major" ? 660 : 440;
        const steps = Math.floor(durationMs / 80);
        for (let i = 0; i < steps; i++) {
          setTimeout(() => {
            const t = i / steps;
            Audio.tone(startFreq + (endFreq - startFreq) * t, 0.08, 0.06 + 0.04 * t, "sawtooth");
          }, i * 80);
        }
      }
    }
    setTimeout(() => {
      overlay.classList.add("hidden");
      resolve();
    }, durationMs);
  });
}

// ============================================================
// MAINTENANCE OVERLAY + PAYTABLE MODAL
// ============================================================
function showMaintenanceOverlay() {
  const o = $("[data-maintenance-overlay]");
  if (o) o.classList.remove("hidden");
}
function hideMaintenanceOverlay() {
  const o = $("[data-maintenance-overlay]");
  if (o) o.classList.add("hidden");
}

function openPaytableModal() {
  const modal = $("[data-paytable-modal]");
  if (!modal || !State.activeGame) return;
  const game = GAMES[State.activeGame];
  $("[data-ptm-title]").textContent = game.title + " - Paytable";
  $("[data-ptm-info]").innerHTML = `${game.reels}x${game.rows} reels &middot; ${game.paylines.length} ${game.paylines.length === 1 ? "line" : "lines"} &middot; ${game.tagline}`;
  const grid = $("[data-ptm-symbols]");
  const allSymbols = Object.keys(game.symbols).sort((a, b) => Math.max(...game.symbols[b].pay) - Math.max(...game.symbols[a].pay));
  grid.innerHTML = allSymbols.map((symKey) => {
    const sym = game.symbols[symKey];
    const iconHtml = symbolIconHtml(sym, "ptm-symbol-img");
    const payoutCounts = symbolWinningCounts(sym, game.reels);
    const tier = sym.wild ? "WILD" : sym.scatter ? "BONUS" : "";
    const payoutHtml = payoutCounts
      .map((count) => {
        const pay = symbolPayForCount(sym, count);
        return pay ? `<span><b>${count}x</b> ${pay}</span>` : "";
      })
      .join("");
    return `
      <div class="ptm-symbol-row ${sym.wild ? "is-wild" : ""} ${sym.scatter ? "is-scatter" : ""}">
        <div class="ptm-sym-icon">${iconHtml}</div>
        <div class="ptm-sym-label"><strong>${sym.label || symKey}</strong>${tier ? `<span class="ptm-tier">${tier}</span>` : ""}</div>
        <div class="ptm-payouts">${payoutHtml}</div>
      </div>
    `;
  }).join("");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}
function closePaytableModal() {
  const modal = $("[data-paytable-modal]");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
}

// ============================================================
// 10) FULLSCREEN
// ============================================================
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      const target = document.querySelector(".slots-arcade-body") || document.documentElement;
      const request = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
      if (request) {
        await request.call(target);
        try { if (screen.orientation?.lock) await screen.orientation.lock("landscape"); } catch (err) {}
      } else {
        document.body.classList.add("is-pseudo-fullscreen");
      }
      State.fullscreen = true;
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) await exit.call(document);
      document.body.classList.remove("is-pseudo-fullscreen");
      State.fullscreen = false;
    }
    $("[data-fullscreen-btn]")?.classList.toggle("is-active", State.fullscreen);
  } catch (err) {
    document.body.classList.toggle("is-pseudo-fullscreen");
    State.fullscreen = document.body.classList.contains("is-pseudo-fullscreen");
    $("[data-fullscreen-btn]")?.classList.toggle("is-active", State.fullscreen);
  }
}

document.addEventListener("fullscreenchange", () => {
  State.fullscreen = Boolean(document.fullscreenElement) || document.body.classList.contains("is-pseudo-fullscreen");
  $("[data-fullscreen-btn]")?.classList.toggle("is-active", State.fullscreen);
});

// ============================================================
// 11) NAVIGATION
// ============================================================
function backToLobby() {
  stopAutoSpin();
  Audio.stopMusic();
  if (document.body.classList.contains("is-pseudo-fullscreen")) {
    document.body.classList.remove("is-pseudo-fullscreen");
    State.fullscreen = false;
    $("[data-fullscreen-btn]")?.classList.remove("is-active");
  }
  State.activeGame = null;
  $("[data-game-view]").classList.add("hidden");
  $("[data-lobby-view]").classList.remove("hidden");
  document.body.classList.add("is-lobby-active");
  $("[data-back-button]").classList.add("hidden");
  $("[data-arcade-home]")?.classList.add("hidden");
  updateDisplays();
}

function toggleAutoSpin() {
  if (State.autoSpin) stopAutoSpin();
  else startAutoSpin();
}
function startAutoSpin() {
  State.autoSpin = true;
  $("[data-auto-btn]").classList.add("is-active");
  $("[data-auto-btn]").textContent = "STOP";
  if (!State.isSpinning) spinGame();
}
function stopAutoSpin() {
  State.autoSpin = false;
  $("[data-auto-btn]")?.classList.remove("is-active");
  if ($("[data-auto-btn]")) $("[data-auto-btn]").textContent = "AUTO";
}

function changeBet(direction) {
  const levels = State.activeGame ? betLevelsForGame(State.activeGame) : State.betLevels;
  const idx = levels.indexOf(State.bet);
  const fallback = levels.reduce((best, value, index) => (value <= State.bet ? index : best), 0);
  const next = Math.max(0, Math.min(levels.length - 1, (idx === -1 ? fallback : idx) + direction));
  State.bet = levels[next];
  if (State.activeGame) clampBetToAdmin(State.activeGame);
  Audio.click();
  updateDisplays();
  saveState();
}
function setMaxBet() {
  const gcfg = State.activeGame ? adminGameConfig(State.activeGame) : null;
  const adminMax = gcfg ? numberSetting(gcfg.maxBet, 10) : 10;
  const adminMin = gcfg ? numberSetting(gcfg.minBet, 0.05) : 0.05;
  const maxAllowed = Math.min(State.credits, adminMax);
  const levels = State.activeGame ? betLevelsForGame(State.activeGame) : State.betLevels;
  const maxAffordable = levels.filter(b => b <= maxAllowed).slice(-1)[0] || adminMin;
  State.bet = maxAffordable;
  if (State.activeGame) clampBetToAdmin(State.activeGame);
  Audio.click();
  updateDisplays();
  saveState();
}

// ============================================================
// 12) WIRE UP EVENTS
// ============================================================
function bindEvents() {
  document.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-game]");
    if (tile) {
      Audio.resume();
      Audio.click();
      renderGameView(tile.dataset.game);
      return;
    }
    if (e.target.closest("[data-back-button]")) { e.preventDefault(); backToLobby(); return; }
    if (e.target.closest("[data-arcade-home]")) {
      e.preventDefault();
      if (State.activeGame) backToLobby();
      return;
    }
    if (e.target.closest("[data-spin-btn]")) { Audio.resume(); spinGame(); return; }
    if (e.target.closest("[data-bet-up]")) { changeBet(+1); return; }
    if (e.target.closest("[data-bet-down]")) { changeBet(-1); return; }
    if (e.target.closest("[data-max-bet]")) { setMaxBet(); return; }
    if (e.target.closest("[data-auto-btn]")) { toggleAutoSpin(); return; }
    if (e.target.closest("[data-music-btn]")) {
      State.musicOn = !State.musicOn;
      $("[data-music-btn]").classList.toggle("is-active", State.musicOn);
      $("[data-music-btn]").textContent = State.musicOn ? "\u{1F3B5} ON" : "\u{1F3B5} OFF";
      Audio.setMusicEnabled(State.musicOn);
      if (State.musicOn && State.activeGame) Audio.startMusic(GAMES[State.activeGame]);
      else Audio.stopMusic();
      saveState(); return;
    }
    if (e.target.closest("[data-sound-btn]")) {
      State.soundOn = !State.soundOn;
      $("[data-sound-btn]").classList.toggle("is-active", State.soundOn);
      $("[data-sound-btn]").textContent = State.soundOn ? "\u{1F50A}" : "\u{1F507}";
      Audio.setSoundEnabled(State.soundOn);
      saveState(); return;
    }
    if (e.target.closest("[data-fullscreen-btn]")) { toggleFullscreen(); return; }
    if (e.target.closest("[data-open-paytable]")) { openPaytableModal(); return; }
    if (e.target.closest("[data-paytable-close]")) { closePaytableModal(); return; }
  });

  // Keyboard: space to spin, ESC to exit
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && State.activeGame) { e.preventDefault(); spinGame(); }
    if (e.code === "Escape" && State.activeGame) { backToLobby(); }
  });
}

// ============================================================
// 13) BOOTSTRAP
// ============================================================
async function bootstrap() {
  loadState();
  Audio.setMusicEnabled(State.musicOn);
  Audio.setSoundEnabled(State.soundOn);
  renderLobby();
  bindArcadePlayerTools();
  await refreshPlayerPoints({ redirectOnFail: true });
  try {
    await refreshArcadeControls();
    renderLobby();
  } catch (err) {}
  updateDisplays();
  bindEvents();
  startJackpotTicker();
  startArcadeControlsWatcher();
  setInterval(() => {
    if (State.player && !document.querySelector("[data-arcade-chat]")?.classList.contains("hidden")) {
      refreshArcadeChat().catch(() => {});
    }
  }, 4500);
  // Music/sound button initial state
  const mb = $("[data-music-btn]"); if (mb) { mb.textContent = State.musicOn ? "\u{1F3B5} ON" : "\u{1F3B5} OFF"; mb.classList.toggle("is-active", State.musicOn); }
  const sb = $("[data-sound-btn]"); if (sb) { sb.textContent = State.soundOn ? "\u{1F50A}" : "\u{1F507}"; sb.classList.toggle("is-active", State.soundOn); }
  // If URL has ?game=xxx, open it
  try {
    const u = new URLSearchParams(window.location.search);
    const g = u.get("game");
    if (g && GAMES[g]) await renderGameView(g);
  } catch (err) {}
  // Pop the daily free spin automatically when the 24h timer has elapsed.
  if (State.player) {
    setTimeout(() => { maybeAutoOpenDailySpin().catch(() => {}); }, 900);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
// End of arcade client (daily free spin wheel included).
