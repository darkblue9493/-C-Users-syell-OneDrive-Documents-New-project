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
    rows: 3, reels: 5, paylines: PAYLINES_5x3,
    mascot: "&#129708;", // 🦬
    sceneClass: "scene-prairie",
    bgEmoji: ["&#127956;","&#127797;","&#127765;","&#9728;&#65039;"], // mountain, cactus, sun-elements
    music: { tempo: 140, scale: [196,247,294,330,392,440] },
    symbols: {
      WILD:    { ...svgSym("WILD","WILD"), weight: 3, pay: [0,0,0,50,100,500], wild: true },
      SCATTER: { ...svgSym("SCATTER","BONUS"), weight: 2, pay: [0,0,0,5,20,100], scatter: true },
      BUFFALO: { ...emojiSym("&#129708;","BUFFALO"), weight: 6, pay: [0,0,0,30,80,300] },
      EAGLE:   { ...emojiSym("&#129413;","EAGLE"), weight: 8, pay: [0,0,0,20,50,200] },
      SHERIFF: { ...emojiSym("&#11088;","SHERIFF"), weight: 10, pay: [0,0,0,15,40,150] },
      MONEY:   { ...svgSym("GOLD_COIN","GOLD"), weight: 10, pay: [0,0,0,10,30,100] },
      A:       { ...svgSym("CARD_A","A"), weight: 14, pay: [0,0,0,5,15,50] },
      K:       { ...svgSym("CARD_K","K"), weight: 14, pay: [0,0,0,4,12,40] },
      Q:       { ...svgSym("CARD_Q","Q"), weight: 16, pay: [0,0,0,3,10,30] },
      J:       { ...svgSym("CARD_J","J"), weight: 16, pay: [0,0,0,2,8,25] },
    },
    paytableOrder: ["WILD","BUFFALO","EAGLE","SHERIFF","MONEY","A","K"],
  },

  // =========================================================
  // 2. KING KONG - Skyscraper city
  // =========================================================
  kingKong: {
    rtpScale: 3.43,
    layout: "mascot-top",
    title: "King Kong",
    tagline: "Roar on Top of the World",
    theme: "kingkong",
    accent: "#ff3030",
    accent2: "#1a0d06",
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 25),
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 25),
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 25),
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 25),
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 30) || PAYLINES_5x3,
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3,
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3,
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 20),
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3,
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3,
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3,
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
    rows: 3, reels: 5, paylines: PAYLINES_5x3.slice(0, 20),
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

const MUSIC_PROFILES = {
  wildBuffalo:     { volume: 0.12, bassVolume: 0.11, harmonyVolume: 0.05, wave: "sawtooth", bassWave: "square",   pattern: [0,2,4,2,5,4,2,0], bassPattern: [0,0,3,0], harmonyEvery: 4 },
  kingKong:        { volume: 0.13, bassVolume: 0.13, harmonyVolume: 0.04, wave: "square",   bassWave: "sawtooth", pattern: [0,0,2,1,3,2,5,3], bassPattern: [0,0,0,2], harmonyEvery: 6 },
  triple777:       { volume: 0.14, bassVolume: 0.09, harmonyVolume: 0.06, wave: "square",   bassWave: "triangle", pattern: [4,2,4,5,4,2,1,0], bassPattern: [0,2,0,4], harmonyEvery: 2 },
  blackjack:       { volume: 0.11, bassVolume: 0.10, harmonyVolume: 0.05, wave: "triangle", bassWave: "sine",     pattern: [0,1,2,4,3,2,1,3], bassPattern: [0,0,2,1], harmonyEvery: 3 },
  gorillaGold:     { volume: 0.13, bassVolume: 0.14, harmonyVolume: 0.04, wave: "sawtooth", bassWave: "square",   pattern: [0,3,0,4,2,5,3,1], bassPattern: [0,3,0,2], harmonyEvery: 4 },
  goldWolf:        { volume: 0.12, bassVolume: 0.10, harmonyVolume: 0.07, wave: "triangle", bassWave: "sawtooth", pattern: [5,3,2,0,1,2,4,2], bassPattern: [0,0,4,0], harmonyEvery: 5 },
  wildBull:        { volume: 0.14, bassVolume: 0.12, harmonyVolume: 0.04, wave: "square",   bassWave: "square",   pattern: [0,2,4,5,4,2,0,3], bassPattern: [0,3,0,3], harmonyEvery: 3 },
  dragonEmpress:   { volume: 0.12, bassVolume: 0.11, harmonyVolume: 0.06, wave: "sine",     bassWave: "triangle", pattern: [0,2,3,5,4,3,1,2], bassPattern: [0,2,0,4], harmonyEvery: 4 },
  mammothRush:     { volume: 0.13, bassVolume: 0.15, harmonyVolume: 0.04, wave: "sawtooth", bassWave: "square",   pattern: [0,0,1,3,0,4,3,1], bassPattern: [0,0,0,3], harmonyEvery: 6 },
  pharaoh:         { volume: 0.12, bassVolume: 0.10, harmonyVolume: 0.06, wave: "triangle", bassWave: "sawtooth", pattern: [0,1,4,3,2,5,4,1], bassPattern: [0,4,0,1], harmonyEvery: 4 },
  oceanTreasure:   { volume: 0.11, bassVolume: 0.10, harmonyVolume: 0.07, wave: "sine",     bassWave: "triangle", pattern: [0,2,5,4,2,3,5,1], bassPattern: [0,2,0,5], harmonyEvery: 3 },
  vegas7s:         { volume: 0.15, bassVolume: 0.12, harmonyVolume: 0.06, wave: "square",   bassWave: "sawtooth", pattern: [4,5,4,2,5,4,2,0], bassPattern: [0,2,4,2], harmonyEvery: 2 },
  luckyPanda:      { volume: 0.12, bassVolume: 0.10, harmonyVolume: 0.06, wave: "triangle", bassWave: "sine",     pattern: [0,2,4,5,3,4,2,1], bassPattern: [0,0,3,4], harmonyEvery: 4 },
  lionsPride:      { volume: 0.13, bassVolume: 0.14, harmonyVolume: 0.04, wave: "sawtooth", bassWave: "square",   pattern: [0,3,5,3,2,4,5,1], bassPattern: [0,0,4,3], harmonyEvery: 5 },
  piratesTreasure: { volume: 0.13, bassVolume: 0.12, harmonyVolume: 0.05, wave: "square",   bassWave: "triangle", pattern: [0,2,3,5,3,2,4,1], bassPattern: [0,3,0,5], harmonyEvery: 4 },
  zeusThunder:     { volume: 0.15, bassVolume: 0.14, harmonyVolume: 0.05, wave: "sawtooth", bassWave: "square",   pattern: [5,4,2,5,3,1,4,0], bassPattern: [0,5,0,4], harmonyEvery: 2 },
  cleopatra:       { volume: 0.12, bassVolume: 0.10, harmonyVolume: 0.07, wave: "triangle", bassWave: "sine",     pattern: [0,2,1,4,3,5,4,2], bassPattern: [0,4,0,2], harmonyEvery: 4 },
  frozenRiches:    { volume: 0.11, bassVolume: 0.09, harmonyVolume: 0.08, wave: "sine",     bassWave: "triangle", pattern: [5,4,3,1,2,0,2,4], bassPattern: [0,0,5,0], harmonyEvery: 3 },
  galaxyStars:     { volume: 0.13, bassVolume: 0.11, harmonyVolume: 0.08, wave: "sawtooth", bassWave: "sine",     pattern: [0,4,2,5,1,3,5,4], bassPattern: [0,5,2,4], harmonyEvery: 3 },
  fruitMania:      { volume: 0.15, bassVolume: 0.10, harmonyVolume: 0.06, wave: "square",   bassWave: "triangle", pattern: [4,2,0,2,5,4,2,1], bassPattern: [0,2,0,5], harmonyEvery: 2 },
  vikingGlory:     { volume: 0.13, bassVolume: 0.15, harmonyVolume: 0.04, wave: "sawtooth", bassWave: "square",   pattern: [0,0,3,5,3,2,0,4], bassPattern: [0,3,0,5], harmonyEvery: 5 },
  aztecEmpire:     { volume: 0.13, bassVolume: 0.12, harmonyVolume: 0.05, wave: "triangle", bassWave: "sawtooth", pattern: [0,3,1,4,2,5,3,0], bassPattern: [0,1,0,4], harmonyEvery: 4 },
  halloweenHunt:   { volume: 0.12, bassVolume: 0.13, harmonyVolume: 0.06, wave: "square",   bassWave: "sawtooth", pattern: [5,4,2,1,0,2,4,3], bassPattern: [0,5,0,2], harmonyEvery: 3 },
  luckyCharms:     { volume: 0.14, bassVolume: 0.11, harmonyVolume: 0.06, wave: "triangle", bassWave: "square",   pattern: [0,2,4,5,4,3,1,2], bassPattern: [0,4,0,5], harmonyEvery: 2 },
};

Object.entries(MUSIC_PROFILES).forEach(([key, profile]) => {
  if (GAMES[key]) GAMES[key].music = { ...(GAMES[key].music || {}), ...profile };
});

function simpleRowPaylines(reels, rows) {
  return Array.from({ length: rows }, (_, row) => Array.from({ length: reels }, () => row));
}

Object.values(GAMES).forEach((game) => {
  game.paylines = simpleRowPaylines(game.reels, game.rows);
  game.matchStyle = "Row Match";
});

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
const ASSET_KEYS = GAME_ORDER;
const ASSET_CACHE = {};

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
  const thumbUrl = `${ASSET_BASE}${gameKey}-thumb.png`;
  checkAssetExists(thumbUrl).then((exists) => {
    if (exists) {
      const art = tileEl.querySelector(".tile-mascot-art");
      if (art) art.innerHTML = `<img src="${thumbUrl}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block;" />`;
      const bg = tileEl.querySelector(".tile-bg");
      if (bg) {
        const bgUrl = `${ASSET_BASE}${gameKey}-bg.jpg`;
        checkAssetExists(bgUrl).then((bgExists) => {
          if (bgExists) bg.style.backgroundImage = `url('${bgUrl}')`;
        });
      }
    }
  });
}

function applyGameArt(gameKey, root) {
  if (!root) return;
  // Check for in-game background
  const bgUrl = `${ASSET_BASE}${gameKey}-bg.jpg`;
  checkAssetExists(bgUrl).then((exists) => {
    if (exists) {
      root.style.setProperty("--game-bg-image", `url('${bgUrl}')`);
      root.classList.add("has-real-bg");
    }
  });
  // Check for in-game mascot
  const mascotUrl = `${ASSET_BASE}${gameKey}-mascot.png`;
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
  lobbyFilter: "all",
  player: null,
  pointsSyncedAt: 0,
  appliedControlGame: null,
  appliedControlSignature: "",
  appliedDefaultBet: null,
  controlRefreshInFlight: false,
};

async function arcadeApi(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "South Diamond account request failed.");
  return data;
}

async function refreshPlayerPoints({ redirectOnFail = false } = {}) {
  try {
    const data = await arcadeApi("/api/player/me");
    State.player = data.user;
    State.credits = Number(data.user?.points) || 0;
    State.pointsSyncedAt = Date.now();
    updateDisplays();
    return true;
  } catch (error) {
    State.player = null;
    State.credits = 0;
    updateDisplays();
    flashMessage("Log in to your South Diamond account to play slots.");
    if (redirectOnFail) {
      window.setTimeout(() => {
        window.location.href = "/#signup";
      }, 900);
    }
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
  if (State.controlRefreshInFlight) return;
  State.controlRefreshInFlight = true;
  try {
  await refreshArcadeControls();
  const lobbyView = $("[data-lobby-view]");
  if ($("[data-lobby-grid]") && lobbyView && !lobbyView.classList.contains("hidden")) renderLobby();
  if (!State.activeGame) return;
  applyAdminGameControls(State.activeGame);
  if (!isAdminGameEnabled(State.activeGame)) {
    showMaintenanceOverlay();
    setWinMessage("This game is currently turned off by admin.");
    stopAutoSpin();
    return;
  }
  hideMaintenanceOverlay();
  } finally {
    State.controlRefreshInFlight = false;
  }
}

function startArcadeControlsWatcher() {
  setInterval(() => {
    if (State.isSpinning) return;
    applyLiveArcadeControls();
  }, 5000);
}

function startArcadeLiveUpdates() {
  if (!("EventSource" in window)) return;
  try {
    const source = new EventSource("/api/player/slots/live");
    source.onmessage = () => {
      if (State.isSpinning) return;
      applyLiveArcadeControls();
    };
  } catch (error) {}
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
// 5) SLOT ENGINE - Weighted reels, payline evaluation
// ============================================================
function weightedPick(symbols) {
  const keys = Object.keys(symbols);
  const total = keys.reduce((s, k) => s + symbols[k].weight, 0);
  let roll = Math.random() * total;
  for (const k of keys) {
    roll -= symbols[k].weight;
    if (roll <= 0) return k;
  }
  return keys[0];
}

function generateGrid(game) {
  // Per reel, generate vertical column of symbols (rows tall)
  const grid = [];
  for (let r = 0; r < game.reels; r++) {
    const reel = [];
    for (let row = 0; row < game.rows; row++) {
      reel.push(weightedPick(game.symbols));
    }
    grid.push(reel);
  }
  return grid;
}

function evaluatePayline(game, grid, payline) {
  // payline is array of row indices, one per reel
  const firstSym = grid[0][payline[0]];
  if (!firstSym || game.symbols[firstSym].scatter) return null;
  // Find the symbol to match (skip wilds at start to figure out target)
  let targetSym = firstSym;
  if (game.symbols[firstSym].wild) {
    // Look for a non-wild non-scatter to match
    for (let i = 1; i < payline.length; i++) {
      const s = grid[i][payline[i]];
      if (s && !game.symbols[s].wild && !game.symbols[s].scatter) {
        targetSym = s;
        break;
      }
    }
  }
  // Count consecutive matching from left
  let count = 0;
  for (let i = 0; i < payline.length; i++) {
    const s = grid[i][payline[i]];
    if (!s) break;
    if (s === targetSym || game.symbols[s].wild) count++;
    else break;
  }
  if (count < 3) return null;
  const pay = game.symbols[targetSym].pay[count - 1] || game.symbols[targetSym].pay[count];
  if (!pay) return null;
  return { symbol: targetSym, count, pay, positions: payline.slice(0, count) };
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
  const pay = game.symbols[scatterSym].pay[count - 1] || 0;
  if (!pay) return null;
  return { symbol: scatterSym, count, pay, positions };
}

function evaluateSpin(game, grid, bet) {
  const wins = [];
  let totalPay = 0;
  game.paylines.forEach((line, idx) => {
    const win = evaluatePayline(game, grid, line);
    if (win) {
      // Pay is in multiples of bet/coin (coin = bet/numPaylines)
      const coinValue = bet / game.paylines.length;
      const amount = win.pay * coinValue;
      wins.push({ ...win, lineIndex: idx, amount, linePattern: line });
      totalPay += amount;
    }
  });
  const scatter = evaluateScatters(game, grid);
  if (scatter) {
    const amount = scatter.pay * bet;
    wins.push({ ...scatter, lineIndex: -1, amount });
    totalPay += amount;
  }
  // Apply per-game RTP scale (calibrated to ~92% RTP)
  const baseScale = game.rtpScale || 0.92;
  let adminMult = 1.0;
  if (typeof SlotsConfig !== "undefined" && State.activeGame) {
    try { adminMult = SlotsConfig.computeRtpMultiplier(State.activeGame); } catch (e) { adminMult = 1.0; }
  }
  totalPay = totalPay * baseScale * adminMult;
  // Progressive jackpot check
  let jpHit = null;
  const r = Math.random();
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
  return { wins, totalPay: Math.round(totalPay * 100) / 100, jpHit };
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
  music: { timer: null, noteIndex: 0 },
  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  },
  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },
  tone(freq, dur = 0.12, vol = 0.08, type = "triangle", options = {}) {
    const ctx = this.ensure();
    if (!ctx || (!State.soundOn && !options.music)) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(this.master);
      osc.start(); osc.stop(ctx.currentTime + dur + 0.02);
    } catch (err) {}
  },
  musicTone(freq, dur, vol, type) {
    this.tone(freq, dur, vol, type, { music: true });
  },
  click() { this.tone(440, 0.05, 0.06, "square"); },
  reelStop() { this.tone(220 + Math.random() * 80, 0.08, 0.05, "triangle"); },
  spinStart() { [440, 660, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.08, 0.05), i * 50)); },
  win(big = false) {
    if (big) {
      [523, 659, 784, 1047, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 0.1, "triangle"), i * 80));
    } else {
      [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 0.08), i * 70));
    }
  },
  jackpot() {
    const notes = [523, 659, 784, 1047, 880, 1047, 1318, 1568, 1318, 1568, 1976, 2093];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 0.15, "triangle"), i * 100));
  },
  startMusic(game) {
    if (!game || !State.musicOn) return;
    this.stopMusic();
    const ctx = this.ensure();
    if (!ctx) return;
    const tempo = game.music?.tempo || 100;
    const scale = game.music?.scale || [220, 277, 330, 392, 440];
    const pattern = game.music?.pattern || [0,2,4,2,5,4,2,3,1,3,5,4];
    const bassPattern = game.music?.bassPattern || [0,0,3,0];
    const wave = game.music?.wave || "sine";
    const bassWave = game.music?.bassWave || "triangle";
    const volume = game.music?.volume || 0.11;
    const bassVolume = game.music?.bassVolume || 0.1;
    const harmonyVolume = game.music?.harmonyVolume || 0.05;
    const harmonyEvery = Math.max(1, game.music?.harmonyEvery || 4);
    const interval = 60000 / tempo / 2;
    let beat = 0;
    this.music.timer = setInterval(() => {
      if (!State.musicOn) return;
      const note = scale[pattern[beat % pattern.length] % scale.length];
      const bassNote = scale[bassPattern[beat % bassPattern.length] % scale.length] / 2;
      this.musicTone(note, 0.24, volume, wave);
      if (beat % 2 === 0) this.musicTone(bassNote, 0.34, bassVolume, bassWave);
      if (beat % harmonyEvery === 0) {
        const harmony = scale[(pattern[beat % pattern.length] + 2) % scale.length];
        this.musicTone(harmony, 0.18, harmonyVolume, "triangle");
      }
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

// ============================================================
// 8) RENDERER - Build DOM for lobby + in-game view
// ============================================================
const FEATURED_GAMES = new Set(["wildBuffalo", "kingKong", "dragonEmpress"]);
const NEW_GAMES = new Set(["gorillaGold", "mammothRush", "oceanTreasure"]);
const HOT_GAMES = new Set(["triple777", "vegas7s", "pharaoh"]);
const TABLE_GAMES = new Set(["blackjack"]);
const GAME_CATEGORIES = {
  wildBuffalo: "HOT", kingKong: "HOT", triple777: "CLASSIC", blackjack: "TABLE",
  gorillaGold: "NEW", goldWolf: "WILD", wildBull: "CLASSIC", dragonEmpress: "HOT",
  mammothRush: "NEW", pharaoh: "TREASURE", oceanTreasure: "NEW", vegas7s: "HOT",
  luckyPanda: "LUCKY", lionsPride: "WILD", piratesTreasure: "TREASURE", zeusThunder: "MYTH",
  cleopatra: "TREASURE", frozenRiches: "COOL", galaxyStars: "SPACE", fruitMania: "CLASSIC",
  vikingGlory: "MYTH", aztecEmpire: "TREASURE", halloweenHunt: "BONUS", luckyCharms: "LUCKY",
};

function renderLobby() {
  const lobby = $("[data-lobby-grid]");
  if (!lobby) return;
  const filter = State.lobbyFilter || "all";
  const visibleGames = GAME_ORDER.filter((key) => {
    if (filter === "hot") return HOT_GAMES.has(key) || FEATURED_GAMES.has(key);
    if (filter === "new") return NEW_GAMES.has(key);
    if (filter === "slot") return !TABLE_GAMES.has(key);
    return true;
  });
  $$("[data-lobby-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lobbyFilter === filter);
  });
  lobby.innerHTML = visibleGames.map(key => {
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
          <small>${GAME_CATEGORIES[key] || "SLOT"} - ${game.matchStyle || "Row Match"}</small>
        </div>
        <div class="tile-play">
          <span class="play-icon">▶</span>
          <span class="play-text">${enabled ? "PLAY NOW" : "OFFLINE"}</span>
        </div>
      </button>
    `;
  }).join("") || '<p class="lobby-empty">No games in this section right now.</p>';
  // Apply real images (PNG) if available - SVG is fallback
  visibleGames.forEach((key) => {
    const tile = lobby.querySelector(`[data-game="${key}"]`);
    if (tile) applyTileArt(tile, key);
  });
}

function renderSymbolHtml(symKey, game, opts = {}) {
  const sym = game.symbols[symKey];
  if (!sym) return `<span class="sym-cell"><span class="sym-text">${symKey}</span></span>`;
  const winClass = opts.winning ? " is-winning" : "";
  if (sym.type === "svg") {
    return `<span class="sym-cell sym-svg${winClass}" data-sym="${symKey}"><span class="sym-inner">${sym.icon}</span></span>`;
  }
  return `<span class="sym-cell sym-emoji${winClass}" data-sym="${symKey}"><span class="sym-inner">${sym.icon}</span></span>`;
}

async function renderGameView(gameKey) {
  const game = GAMES[gameKey];
  if (!game) return;
  enterPhoneFullscreen();
  if (!isAdminGameEnabled(gameKey)) {
    State.activeGame = gameKey;
    $("[data-lobby-view]").classList.add("hidden");
    $("[data-game-view]").classList.remove("hidden");
    $("[data-back-button]").classList.remove("hidden");
    showMaintenanceOverlay();
    setWinMessage("This game is currently turned off by admin.");
    return;
  }
  State.activeGame = gameKey;
  applyAdminGameControls(gameKey, { force: true });
  const root = $("[data-game-view]");
  if (!root) return;

  // Apply theme + layout classes
  const layout = game.layout || "default";
  root.className = `game-view theme-${game.theme} ${game.sceneClass} layout-${layout}`;
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
  reelStrip.style.setProperty("--game-rows", game.rows);
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
  $("[data-lobby-view]").classList.add("hidden");
  $("[data-game-view]").classList.remove("hidden");
  $("[data-back-button]").classList.remove("hidden");

  // Apply real game art (image) overrides if available
  applyGameArt(gameKey, root);
  // Start music
  if (State.musicOn) Audio.startMusic(game);
  refreshArcadeControls().then(() => {
    if (State.activeGame !== gameKey || State.isSpinning) return;
    applyAdminGameControls(gameKey);
    if (!isAdminGameEnabled(gameKey)) {
      showMaintenanceOverlay();
      setWinMessage("This game is currently turned off by admin.");
    }
  });
}

function renderCharacterPaytable(game, root) {
  const order = game.paytableOrder || Object.keys(game.symbols).slice(0, 8);
  const topIdx = game.reels === 3 ? 2 : 4;
  const html = order.slice(0, 8).map(symKey => {
    const sym = game.symbols[symKey];
    if (!sym) return "";
    const pay = sym.pay[topIdx] || 0;
    const iconHtml = sym.type === "svg" ? sym.icon : `<span class="pt-emoji">${sym.icon}</span>`;
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
    const topIdx = game.reels === 3 ? 2 : 4;
    const pay = sym.pay[topIdx] || 0;
    const iconHtml = sym.type === "svg" ? sym.icon : `<span class="pt-emoji">${sym.icon}</span>`;
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
  $$("[data-jp-grand]").forEach((el) => { el.textContent = "$" + fmt(State.jackpots.grand); });
  $$("[data-jp-major]").forEach((el) => { el.textContent = "$" + fmt(State.jackpots.major); });
  $$("[data-jp-minor]").forEach((el) => { el.textContent = "$" + fmt(State.jackpots.minor); });
  $$("[data-jp-mini]").forEach((el) => { el.textContent = "$" + fmt(State.jackpots.mini); });
  const linesEl = $("[data-lines]");
  if (linesEl && State.activeGame) linesEl.textContent = GAMES[State.activeGame].paylines.length;
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
function animateReelSpin(reelEl, finalSymbols, game, delay = 0, opts = {}) {
  return new Promise((resolve) => {
    const symKeys = Object.keys(game.symbols);
    const visibleRows = game.rows;
    const profile = getSpinProfile(game);
    // Longer buffer for smoother landing - user sees symbols clearly scrolling past before result
    const bufferCount = 28 + Math.floor(Math.random() * 6);
    // Build strip: random buffer + 2 anticipation buffer + final symbols
    // The "anticipation" cells right before final symbols are picked from common low-pay symbols
    const stripSymbols = [];
    for (let i = 0; i < bufferCount; i++) {
      stripSymbols.push(symKeys[Math.floor(Math.random() * symKeys.length)]);
    }
    for (let i = 0; i < visibleRows; i++) {
      stripSymbols.push(finalSymbols[i] || symKeys[0]);
    }
    const strip = reelEl.querySelector(".reel-track");
    if (!strip) return resolve();
    strip.innerHTML = stripSymbols.map((s, idx) =>
      `<div class="reel-cell" data-row="${idx >= bufferCount ? idx - bufferCount : -1}">${renderSymbolHtml(s, game)}</div>`
    ).join("");
    const reelHeight = reelEl.offsetHeight || 200;
    const cellHeight = reelHeight / visibleRows;
    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";
    reelEl.classList.add("is-spinning");
    reelEl.dataset.effect = profile.effect;
    void strip.offsetHeight;
    // Stagger - each reel waits longer than previous (per-game stagger)
    const startDelay = delay * profile.stagger;
    // If slowFinish requested (last reel + big win pending), make it dramatic
    const slowMult = opts.slowFinish ? 1.8 : 1.0;
    const baseDuration = profile.duration + delay * 100;
    const duration = Math.round(baseDuration * slowMult);
    setTimeout(() => {
      const finalOffset = bufferCount * cellHeight;
      strip.style.setProperty("--final-offset", finalOffset + "px");
      strip.style.transition = `transform ${duration}ms ${profile.easing}`;
      strip.style.transform = `translateY(-${finalOffset}px)`;
      if (opts.slowFinish) reelEl.classList.add("slow-finish");
      // Remove blur class slightly before end so final symbols are sharp during last 15%
      const sharpEarly = Math.round(duration * 0.85);
      setTimeout(() => {
        reelEl.classList.remove("is-spinning");
      }, sharpEarly);
      // Trigger landing effect at end
      setTimeout(() => {
        reelEl.classList.remove("slow-finish");
        reelEl.classList.add("just-landed", "effect-" + profile.effect);
        Audio.reelStop();
        // Add a small "thud" particle effect if effect is dust/stomp/etc
        triggerLandingEffect(reelEl, profile.effect);
        setTimeout(() => {
          reelEl.classList.remove("just-landed", "effect-" + profile.effect);
        }, 600);
        resolve();
      }, duration);
    }, startDelay);
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
  if (!State.player && !(await refreshPlayerPoints({ redirectOnFail: true }))) {
    stopAutoSpin();
    return;
  }
  await refreshArcadeControls();
  if (State.credits < State.bet) {
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
  if (State.credits < State.bet) {
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
  Audio.resume();
  Audio.spinStart();

  // Deduct bet, increment jackpots
  State.credits -= State.bet;
  State.totalWagered += State.bet;
  State.spinCount++;
  incrementJackpots(State.bet);
  updateDisplays();
  setWinMessage("Reels rolling...");
  $("[data-win-amount]").textContent = "0.00";
  $("[data-reel-strip]").classList.remove("is-winning");
  hideWinBurst();

  // Generate result
  const grid = generateGrid(game);
  const result = evaluateSpin(game, grid, State.bet);
  const settlementPromise = arcadeApi("/api/player/slots/arcade-spin", {
    method: "POST",
    body: JSON.stringify({
      gameKey: State.activeGame,
      bet: State.bet,
      win: result.totalPay || 0,
    }),
  });

  // Determine if we should show anticipation
  const isJackpot = !!result.jpHit;
  const isMegaWin = !isJackpot && result.totalPay >= State.bet * 30;
  const isBigWin  = !isJackpot && !isMegaWin && result.totalPay >= State.bet * 10;
  const slowFinish = isJackpot || isMegaWin;

  // Animate reels stopping left-to-right; last reel gets slowFinish if anticipation needed
  const reels = $$("[data-reel-strip] .reel");
  const promises = reels.map((reel, idx) =>
    animateReelSpin(reel, grid[idx], game, idx, { slowFinish: slowFinish && idx === reels.length - 1 })
  );

  let settlement = null;
  try {
    const settled = await Promise.all([Promise.all(promises), settlementPromise]);
    settlement = settled[1];
    result.totalPay = Number(settlement.win) || 0;
  } catch (error) {
    await Promise.allSettled(promises);
    State.credits = Math.round((State.credits + State.bet) * 100) / 100;
    updateDisplays();
    State.isSpinning = false;
    if (spinButton) {
      spinButton.classList.remove("is-spinning");
      spinButton.disabled = false;
    }
    flashMessage(error.message || "Spin could not be saved. Try again.");
    stopAutoSpin();
    return;
  }

  // Highlight winning cells
  const winningCells = new Set();
  result.wins.forEach(w => {
    if (w.lineIndex === -1) {
      // scatter - positions are [reel,row]
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
    State.credits += result.totalPay;
    State.totalWon += result.totalPay;
    $("[data-reel-strip]").classList.add("is-winning");
    const isBig  = !isJackpot && !isMegaWin && result.totalPay >= State.bet * 10;
    const isMega = isMegaWin;
    // Anticipation before reveal for big/mega/jackpot wins
    if (isJackpot) {
      await showAnticipation(result.jpHit, 2500);
      showJackpotBurst(result.jpHit, result.totalPay);
      Audio.jackpot();
      setWinMessage(`${result.jpHit.toUpperCase()} JACKPOT! +${fmt(result.totalPay)}`);
    } else if (isMega) {
      await showAnticipation("mega", 1500);
      showWinBurst(result.totalPay, true, true);
      Audio.win(true);
      setWinMessage(`MEGA WIN! +${fmt(result.totalPay)}`);
    } else if (isBig) {
      await showAnticipation("big", 900);
      showWinBurst(result.totalPay, true, false);
      Audio.win(true);
      setWinMessage(`BIG WIN! +${fmt(result.totalPay)}`);
    } else {
      showWinBurst(result.totalPay, false, false);
      Audio.win(false);
      setWinMessage(`Win! +${fmt(result.totalPay)}`);
    }
    animateCounter($("[data-win-amount]"), 0, result.totalPay, 1200);
  } else {
    setWinMessage("Good luck! Try again.");
  }

  updateDisplays();
  if (settlement?.user) {
    State.player = settlement.user;
    State.credits = Number(settlement.user.points) || State.credits;
    State.pointsSyncedAt = Date.now();
    updateDisplays();
  }
  saveState();
  if (typeof SlotsConfig !== "undefined") {
    try { SlotsConfig.recordSpin(State.activeGame, State.bet, result.totalPay || 0); } catch (err) {}
  }
  State.isSpinning = false;
  if (spinButton) {
    spinButton.classList.remove("is-spinning");
    spinButton.disabled = false;
  }

  // Auto-spin
  if (State.autoSpin) {
    setTimeout(() => { if (State.autoSpin) spinGame(); }, 650);
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
  $("[data-ptm-info]").textContent = `${game.tagline} - wins are simple left-to-right row matches.`;
  const grid = $("[data-ptm-symbols]");
  const allSymbols = Object.keys(game.symbols).sort((a, b) => Math.max(...game.symbols[b].pay) - Math.max(...game.symbols[a].pay));
  grid.innerHTML = allSymbols.map((symKey) => {
    const sym = game.symbols[symKey];
    const iconHtml = sym.type === "svg" ? sym.icon : `<span class="pt-emoji">${sym.icon}</span>`;
    const pays = sym.pay || [];
    const tier = sym.wild ? "WILD" : sym.scatter ? "BONUS" : "";
    return `
      <div class="ptm-symbol-row ${sym.wild ? "is-wild" : ""} ${sym.scatter ? "is-scatter" : ""}">
        <div class="ptm-sym-icon">${iconHtml}</div>
        <div class="ptm-sym-label"><strong>${sym.label || symKey}</strong>${tier ? `<span class="ptm-tier">${tier}</span>` : ""}</div>
        <div class="ptm-payouts">${pays[2] ? `<span><b>3x</b> ${pays[2]}</span>` : ""}${pays[3] ? `<span><b>4x</b> ${pays[3]}</span>` : ""}${pays[4] ? `<span><b>5x</b> ${pays[4]}</span>` : ""}${pays[5] ? `<span><b>6x</b> ${pays[5]}</span>` : ""}</div>
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
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        try { if (screen.orientation?.lock) await screen.orientation.lock("landscape"); } catch (err) {}
      } else {
        document.body.classList.add("is-pseudo-fullscreen");
      }
      State.fullscreen = true;
    } else {
      await document.exitFullscreen();
      State.fullscreen = false;
    }
    $("[data-fullscreen-btn]")?.classList.toggle("is-active", State.fullscreen);
  } catch (err) {
    document.body.classList.toggle("is-pseudo-fullscreen");
    State.fullscreen = document.body.classList.contains("is-pseudo-fullscreen");
    $("[data-fullscreen-btn]")?.classList.toggle("is-active", State.fullscreen);
  }
}

function isPhoneViewport() {
  return window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
}

async function enterPhoneFullscreen() {
  if (!isPhoneViewport() || State.fullscreen) return;
  document.body.classList.add("is-phone-panorama");
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    try { if (screen.orientation?.lock) await screen.orientation.lock("landscape"); } catch (err) {}
    State.fullscreen = !!document.fullscreenElement || document.body.classList.contains("is-phone-panorama");
  } catch (err) {
    document.body.classList.add("is-pseudo-fullscreen");
    State.fullscreen = true;
  }
  $("[data-fullscreen-btn]")?.classList.toggle("is-active", State.fullscreen);
}

function setupPhonePanoramaMode() {
  if (!isPhoneViewport()) return;
  document.body.classList.add("is-phone-panorama");
  enterPhoneFullscreen();
  const retry = () => enterPhoneFullscreen();
  window.addEventListener("pointerdown", retry, { once: true, passive: true });
  window.addEventListener("touchstart", retry, { once: true, passive: true });
}

// ============================================================
// 11) NAVIGATION
// ============================================================
function backToLobby() {
  stopAutoSpin();
  Audio.stopMusic();
  if (document.body.classList.contains("is-pseudo-fullscreen") && !isPhoneViewport()) {
    document.body.classList.remove("is-pseudo-fullscreen");
    State.fullscreen = false;
    $("[data-fullscreen-btn]")?.classList.remove("is-active");
  }
  State.activeGame = null;
  $("[data-game-view]").classList.add("hidden");
  $("[data-lobby-view]").classList.remove("hidden");
  $("[data-back-button]").classList.add("hidden");
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
    const filterBtn = e.target.closest("[data-lobby-filter]");
    if (filterBtn) {
      State.lobbyFilter = filterBtn.dataset.lobbyFilter || "all";
      Audio.click();
      renderLobby();
      return;
    }
    const tile = e.target.closest("[data-game]");
    if (tile) {
      Audio.resume();
      Audio.click();
      renderGameView(tile.dataset.game);
      return;
    }
    if (e.target.closest("[data-arcade-home]")) { backToLobby(); return; }
    if (e.target.closest("[data-back-button]")) { backToLobby(); return; }
    if (e.target.closest("[data-spin-btn]")) { Audio.resume(); spinGame(); return; }
    if (e.target.closest("[data-bet-up]")) { changeBet(+1); return; }
    if (e.target.closest("[data-bet-down]")) { changeBet(-1); return; }
    if (e.target.closest("[data-max-bet]")) { setMaxBet(); return; }
    if (e.target.closest("[data-auto-btn]")) { toggleAutoSpin(); return; }
    if (e.target.closest("[data-music-btn]")) {
      State.musicOn = !State.musicOn;
      $("[data-music-btn]").classList.toggle("is-active", State.musicOn);
      $("[data-music-btn]").textContent = State.musicOn ? "\u{1F3B5} ON" : "\u{1F3B5} OFF";
      if (State.musicOn && State.activeGame) Audio.startMusic(GAMES[State.activeGame]);
      else Audio.stopMusic();
      saveState(); return;
    }
    if (e.target.closest("[data-sound-btn]")) {
      State.soundOn = !State.soundOn;
      $("[data-sound-btn]").classList.toggle("is-active", State.soundOn);
      $("[data-sound-btn]").textContent = State.soundOn ? "\u{1F50A}" : "\u{1F507}";
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
  if (!(await refreshPlayerPoints({ redirectOnFail: true }))) {
    return;
  }
  await refreshArcadeControls();
  renderLobby();
  updateDisplays();
  bindEvents();
  startJackpotTicker();
  startArcadeLiveUpdates();
  startArcadeControlsWatcher();
  setupPhonePanoramaMode();
  // Music/sound button initial state
  const mb = $("[data-music-btn]"); if (mb) { mb.textContent = State.musicOn ? "\u{1F3B5} ON" : "\u{1F3B5} OFF"; mb.classList.toggle("is-active", State.musicOn); }
  const sb = $("[data-sound-btn]"); if (sb) { sb.textContent = State.soundOn ? "\u{1F50A}" : "\u{1F507}"; sb.classList.toggle("is-active", State.soundOn); }
  // If URL has ?game=xxx, open it
  try {
    const u = new URLSearchParams(window.location.search);
    const g = u.get("game");
    if (g && GAMES[g]) await renderGameView(g);
  } catch (err) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
