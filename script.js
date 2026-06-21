const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const canUseApi = location.protocol === "http:" || location.protocol === "https:";
const isAdminPage = Boolean(document.querySelector("[data-admin-inbox]"));
const winnerList = document.querySelector("[data-winner-list]");
const winnerHighlight = document.querySelector("[data-winner-highlight]");
const promoTracks = document.querySelectorAll(".promo-track");
const guestPromoHtml = `
  <span>Get Free</span>
  <strong>5 Points</strong>
  <span>After</span>
  <strong>Login!</strong>
`;
const playerPromoHtml = `
  <span>Get</span>
  <strong>30 Points</strong>
  <span>On 10 For</span>
  <strong>First 3 Times</strong>
`;

if ("serviceWorker" in navigator && canUseApi) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then((registration) => registration.update().catch(() => {}))
      .catch(() => {});
  });
}

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    header.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.tagName !== "A") return;
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const winnerNames = [
  "Maria K.",
  "Dre M.",
  "Tasha R.",
  "Kevin P.",
  "LaToya B.",
  "Marcus W.",
  "Destiny J.",
  "Andre S.",
  "Maya L.",
  "Chris R.",
  "Ankit T.",
  "Dylan C.",
];

const winnerGames = [
  "Golden Dragon bonus round",
  "Orion Stars jackpot session",
  "Ultra Panda slot run",
  "Game Vault lucky spin",
  "JUWA fish table streak",
  "Fire Kirin hot room",
  "Panda Master reel hit",
  "Vblink diamond spin",
  "Milky Way table win",
  "Lucky 777 bonus room",
];

const playerChatWelcomeText = "Welcome to South Diamond. Please let us know which game you'd like to play, and our team will be happy to assist you.";

function randomWinnerAmount() {
  const amount = Math.floor((260 + Math.random() * 1740) / 10) * 10;
  return `$${amount.toLocaleString()}`;
}

function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatPoints(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? number.toLocaleString() : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function updatePromoBanner(isLoggedIn = false) {
  promoTracks.forEach((track) => {
    const message = track.querySelector("p");
    const link = track.querySelector("a");
    if (message) message.innerHTML = isLoggedIn ? playerPromoHtml : guestPromoHtml;
    if (link) {
      link.textContent = isLoggedIn ? "Payment" : "Log In";
      link.href = isLoggedIn ? "#bonus" : "#login";
    }
  });
}

function renderRecentWinners() {
  if (!winnerList) return;
  const names = shuffleItems(winnerNames).slice(0, 4);
  const games = shuffleItems(winnerGames);
  const rows = names.map((name, index) => ({
    label: index < 2 ? "Just now" : "Today",
    name,
    game: games[index % games.length],
    amount: randomWinnerAmount(),
  }));
  winnerList.classList.remove("is-sliding");
  window.requestAnimationFrame(() => {
    winnerList.innerHTML = rows
      .map(
        (winner) => `
          <article>
            <span>${winner.label}</span>
            <strong>${winner.name}</strong>
            <p>${winner.game}</p>
            <b>${winner.amount}</b>
          </article>
        `
      )
      .join("");
    winnerList.classList.add("is-sliding");
    if (winnerHighlight) winnerHighlight.textContent = rows[0]?.amount || "$850";
  });
}

renderRecentWinners();
if (winnerList) setInterval(renderRecentWinners, 5200);

async function api(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(path, {
    cache: "no-store",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    signal: controller.signal,
    ...options,
  }).finally(() => clearTimeout(timeout));
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong.");
    Object.assign(error, data);
    throw error;
  }
  return data;
}

function createMessage(item) {
  const message = document.createElement("article");
  message.className = `message ${item.author}`;
  message.innerHTML = `<span>${item.author === "operator" ? "Support" : "Player"}</span><p></p>`;
  message.querySelector("p").textContent = item.text;
  if (item.imageUrl) {
    const link = document.createElement("a");
    link.className = "message-attachment";
    link.href = item.imageUrl;
    link.target = "_blank";
    link.rel = "noopener";
    const image = document.createElement("img");
    image.alt = "Attached payment screenshot";
    image.src = item.imageUrl;
    image.addEventListener("load", () => {
      const messageList = message.closest(".chat-messages");
      if (messageList?.dataset.stickToBottom === "true") scrollMessagesToBottom(messageList);
    });
    image.addEventListener("error", () => {
      link.classList.add("is-broken");
      link.removeAttribute("href");
      link.textContent = "Attachment unavailable";
    });
    link.appendChild(image);
    message.appendChild(link);
    if (isAdminPage) {
      const review = document.createElement("div");
      review.className = "payment-review";
      review.innerHTML = `
        <span>Payment: ${item.paymentStatus || "pending"}</span>
        <button type="button" data-payment-status="approved">Approve</button>
        <button type="button" data-payment-status="rejected">Reject</button>
        <button type="button" data-payment-status="pending">Pending</button>
      `;
      review.querySelectorAll("button").forEach((button) => {
        button.dataset.messageId = item.id || "";
        button.classList.toggle("is-active", button.dataset.paymentStatus === (item.paymentStatus || "pending"));
      });
      message.appendChild(review);
    }
  }
  return message;
}

function isNearMessageBottom(container, threshold = 120) {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
}

function scrollMessagesToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

function renderMessages(container, messages) {
  const scope = container.dataset.messageScope || "";
  const previousScope = container.dataset.renderedScope || "";
  const shouldStickToBottom =
    container.dataset.forceScroll === "true" ||
    !container.dataset.messagesKey ||
    previousScope !== scope ||
    isNearMessageBottom(container);
  const nextKey = JSON.stringify(
    {
      scope,
      messages: messages.map((item) => ({
        id: item.id || "",
        author: item.author,
        text: item.text,
        imageUrl: item.imageUrl || "",
        paymentStatus: item.paymentStatus || "",
        createdAt: item.createdAt || "",
      })),
    }
  );
  if (container.dataset.messagesKey === nextKey) {
    delete container.dataset.forceScroll;
    container.dataset.stickToBottom = "false";
    return;
  }
  container.dataset.messagesKey = nextKey;
  container.dataset.renderedScope = scope;
  container.dataset.stickToBottom = String(shouldStickToBottom);
  delete container.dataset.forceScroll;
  container.innerHTML = "";
  messages.forEach((item) => container.appendChild(createMessage(item)));
  if (shouldStickToBottom) requestAnimationFrame(() => scrollMessagesToBottom(container));
}

function showPlayerToast(text) {
  let toast = document.querySelector("[data-player-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "player-toast";
    toast.dataset.playerToast = "true";
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add("is-visible");
  window.clearTimeout(showPlayerToast.timeoutId);
  showPlayerToast.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 5200);
}

function requestPlayerNotificationPermission() {
  if (!("Notification" in window) || playerNotificationsReady) return;
  playerNotificationsReady = true;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function notifyPlayerOperatorMessage(message) {
  const text = message?.text || "You have a new message from South Diamond support.";
  showPlayerToast(text);
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    new Notification("South Diamond support", {
      body: text,
      icon: "/assets/app-icon.svg",
      badge: "/assets/app-icon.svg",
    });
  }
}

const playerAuth = document.querySelector("[data-player-auth]");
const playerAppSections = document.querySelectorAll("[data-player-app]");
const playerOnlyItems = document.querySelectorAll("[data-player-only]");
const guestOnlyItems = document.querySelectorAll("[data-guest-only]");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll(".auth-panel");
const playerLogin = document.querySelector("[data-player-login]");
const playerAuthMessage = document.querySelector("[data-player-auth-message]");
const playerNameDisplay = document.querySelector("[data-player-name-display]");
const playerPointsDisplay = document.querySelectorAll("[data-player-points], [data-player-points-display]");
const playerLogout = document.querySelector("[data-player-logout]");
const playerForm = document.querySelector("[data-player-form]");
const playerMessages = document.querySelector("[data-player-messages]");
const playerInput = document.querySelector("[data-player-input]");
const playerAvatarNav = document.querySelector("[data-player-avatar-nav]");
const playerVipBadge = document.querySelector("[data-player-vip-badge]");
const profileSection = document.querySelector("[data-profile-panel]");
const profileOpenLinks = document.querySelectorAll("[data-profile-open]");
const profileForm = document.querySelector("[data-profile-form]");
const profilePhone = document.querySelector("#profile-phone");
const profilePassword = document.querySelector("#profile-password");
const profileStatus = document.querySelector("[data-profile-status]");
const profileUsername = document.querySelector("[data-profile-username]");
const profileEmail = document.querySelector("[data-profile-email]");
const profileVipBadge = document.querySelector("[data-profile-vip-badge]");
const vipLevelName = document.querySelector("[data-vip-level-name]");
const vipLevelCopy = document.querySelector("[data-vip-level-copy]");
const vipLevelProgress = document.querySelector("[data-vip-level-progress]");
const vipLevelNext = document.querySelector("[data-vip-level-next]");
const profileAvatarPreview = document.querySelector("[data-player-avatar-preview]");
const playerPointTransactions = document.querySelector("[data-player-point-transactions]");
const avatarForm = document.querySelector("[data-avatar-form]");
const avatarFile = document.querySelector("[data-avatar-file]");
const avatarStatus = document.querySelector("[data-avatar-status]");
const uploadForm = document.querySelector("[data-upload-form]");
const uploadFile = document.querySelector("[data-upload-file]");
const uploadNote = document.querySelector("[data-upload-note]");
const uploadStatus = document.querySelector("[data-upload-status]");
const chatWidget = document.querySelector("[data-player-chat]");
const chatToggle = document.querySelector("[data-chat-toggle]");
const referralNavLinks = document.querySelectorAll("[data-referral-nav]");
const lobbyCards = document.querySelectorAll("[data-lobby-card]");
const paymentActions = document.querySelector(".payment-actions");
const welcomeModal = document.querySelector("[data-welcome-modal]");
const welcomeClose = document.querySelector("[data-welcome-close]");
const welcomePoints = document.querySelector("[data-welcome-points]");
const welcomeChat = document.querySelector("[data-welcome-chat]");
const welcomePayment = document.querySelector("[data-welcome-payment]");
const referralCodeInput = document.querySelector("[data-referral-code-input]");
const referralLoginNote = document.querySelector("[data-referral-login-note]");
const referralLinkInput = document.querySelector("[data-referral-link]");
const copyReferralButton = document.querySelector("[data-copy-referral]");
const referralStatus = document.querySelector("[data-referral-status]");
const loginStreakDisplay = document.querySelector("[data-login-streak]");
const loginStreakNote = document.querySelector("[data-login-streak-note]");
const loginBonusSummary = document.querySelector("[data-login-bonus-summary]");
const spinTriggers = document.querySelectorAll("[data-spin-trigger]");
const spinModal = document.querySelector("[data-spin-modal]");
const spinClose = document.querySelector("[data-spin-close]");
const spinWheel = document.querySelector("[data-spin-wheel]");
const spinButton = document.querySelector("[data-spin-button]");
const spinResult = document.querySelector("[data-spin-result]");
const slotsOpenButtons = document.querySelectorAll("[data-sd-slots-open]");
const slotsModal = document.querySelector("[data-slots-modal]");
const slotsClose = document.querySelector("[data-slots-close]");
const slotsBack = document.querySelector("[data-slots-back]");
const slotsMusicButton = document.querySelector("[data-slots-music]");
const slotsLobby = document.querySelector("[data-slots-lobby]");
const slotMachine = document.querySelector("[data-slot-machine]");
const slotBalanceDisplay = document.querySelector("[data-slots-balance]");
const slotGameTitle = document.querySelector("[data-slot-game-title]");
const slotThemeLabel = document.querySelector("[data-slot-theme-label]");
const slotWinLabel = document.querySelector("[data-slot-win-label]");
const slotBoard = document.querySelector("[data-slot-board]");
const slotBetDisplay = document.querySelector("[data-slot-bet]");
const slotBetDown = document.querySelector("[data-slot-bet-down]");
const slotBetUp = document.querySelector("[data-slot-bet-up]");
const slotSpinButton = document.querySelector("[data-slot-spin]");
const slotCreditsDisplay = document.querySelector("[data-slot-credits]");
const slotWinAmount = document.querySelector("[data-slot-win-amount]");
const winBurst = document.querySelector("[data-win-burst]");
const winBurstAmount = document.querySelector("[data-win-burst-amount]");
const winCoins = document.querySelector("[data-win-coins]");
const bigWinBanner = document.querySelector("[data-big-win-banner]");
const slotMaxBetBtn = document.querySelector("[data-slot-max-bet]");
const slotAutoBtn = document.querySelector("[data-slot-auto]");
const slotStage = document.querySelector("[data-slot-stage]");
const paylineOverlay = document.querySelector("[data-payline-overlay]");

let currentPlayer = null;
let hasOpenedPlayerChat = false;
let hasCheckedDailySpin = false;
let spinRotation = 0;
let activeSlotGame = "buffalo";
let slotBalance = 0;
let slotBet = 0.25;
let slotIsSpinning = false;
let slotMusicOn = false;
let slotAudioContext = null;
let slotMusicTimer = null;
let slotAutoSpinning = false;
let slotAutoSpinTimer = null;
let slotCurrentWin = 0;
let lastPlayerOperatorMessageId = "";
let playerNotificationsReady = false;
const referralCodeFromUrl = (() => {
  try {
    return new URLSearchParams(window.location.search).get("ref") || "";
  } catch {
    return "";
  }
})();
const adminSearchState = {
  players: "",
  vip: "",
  transactions: "",
  add: "",
  redeem: "",
  activity: "",
  broadcast: "",
  spin: "",
  slots: "",
};

let adminPlayerFilter = "all";
let shouldShowWelcome = false;

function setAuthMessage(text, isSuccess = false) {
  if (!playerAuthMessage) return;
  playerAuthMessage.textContent = text;
  playerAuthMessage.style.color = isSuccess ? "#52ef9f" : "";
}

function updatePlayerVipBadges(user) {
  const levelName = user?.vipLevel?.name || (user?.isVip ? "Diamond" : "Bronze");
  [playerVipBadge, profileVipBadge].forEach((badge) => {
    if (!badge) return;
    badge.textContent = `${levelName} VIP`;
    badge.classList.remove("is-hidden");
    badge.dataset.vipLevel = String(user?.vipLevel?.key || levelName).toLowerCase();
  });
  if (!user) {
    playerVipBadge?.classList.add("is-hidden");
    profileVipBadge?.classList.add("is-hidden");
  }
}

function updateVipLevelDisplay(user) {
  const vip = user?.vipLevel || {};
  const levelName = vip.name || "Bronze";
  if (vipLevelName) vipLevelName.textContent = `${levelName} VIP`;
  if (vipLevelProgress) vipLevelProgress.style.width = `${Math.max(0, Math.min(100, Number(vip.progressPercent) || 0))}%`;
  if (vipLevelCopy) {
    vipLevelCopy.textContent = vip.manualVip
      ? "Diamond VIP is active on your account."
      : `${formatPoints(vip.lifetimePoints || 0)} lifetime points earned.`;
  }
  if (vipLevelNext) {
    vipLevelNext.textContent = vip.nextLevel
      ? `${formatPoints(vip.progressNeeded || 0)} more lifetime points to reach ${vip.nextLevel.name}.`
      : "Highest VIP level reached.";
  }
}

function referralUrlFor(user) {
  if (!user?.referralCode) return "";
  const baseUrl = window.location.protocol === "file:" ? window.location.href.split(/[?#]/)[0] : `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}?ref=${encodeURIComponent(user.referralCode)}`;
}

function pointLabel(value) {
  const number = Number(value) || 0;
  const formatted = Number.isInteger(number) ? formatPoints(number) : number.toFixed(2);
  return `${formatted} point${number === 1 ? "" : "s"}`;
}

function updateDailyLoginDisplay(user, bonus = null) {
  const streak = Math.max(0, Number(user?.dailyLoginStreak) || 0);
  const nextReward = bonus?.nextReward || (streak > 0 ? Math.min((streak + 1) * 0.5, 3) : 0.5);
  if (loginStreakDisplay) loginStreakDisplay.textContent = String(streak);
  if (loginStreakNote) {
    loginStreakNote.textContent = bonus?.awarded
      ? `Today: +${pointLabel(bonus.points)}. Miss a day and streak points expire.`
      : `Next login bonus: ${pointLabel(nextReward)}.`;
  }
  if (loginBonusSummary) {
    loginBonusSummary.textContent = streak > 0
      ? `${streak}-day login streak. Next bonus: ${pointLabel(nextReward)}.`
      : "Log in daily to start your streak.";
  }
}

function showPlayerApp(user) {
  currentPlayer = user;
  document.body.classList.add("is-player-logged-in");
  updatePromoBanner(true);
  if (playerAuth) playerAuth.classList.add("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  playerOnlyItems.forEach((item) => {
    if (!item.matches("[data-profile-panel]")) item.classList.remove("is-hidden");
  });
  profileSection?.classList.add("is-hidden");
  guestOnlyItems.forEach((item) => item.classList.add("is-hidden"));
  minimizePlayerChat();
  if (playerNameDisplay) playerNameDisplay.textContent = user.username;
  updatePlayerVipBadges(user);
  playerPointsDisplay.forEach((item) => {
    item.textContent = formatPoints(user.points);
  });
  updateDailyLoginDisplay(user);
  renderProfile(user);
  refreshPlayerChat();
  window.setTimeout(requestPlayerNotificationPermission, 1200);
  if (shouldShowWelcome) showWelcomeModal(user);
  shouldShowWelcome = false;
  maybeShowDailySpin();
}

function showPlayerAuth() {
  currentPlayer = null;
  document.body.classList.remove("is-player-logged-in");
  updatePromoBanner(false);
  document.body.classList.remove("player-chat-open");
  if (playerAuth) playerAuth.classList.remove("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  playerOnlyItems.forEach((item) => item.classList.add("is-hidden"));
  profileSection?.classList.add("is-hidden");
  guestOnlyItems.forEach((item) => item.classList.remove("is-hidden"));
  if (playerNameDisplay) playerNameDisplay.textContent = "Guest";
  updatePlayerVipBadges(null);
  playerPointsDisplay.forEach((item) => {
    item.textContent = "0";
  });
  hasOpenedPlayerChat = false;
  lastPlayerOperatorMessageId = "";
  renderProfile(null);
  if (playerMessages) {
    renderMessages(playerMessages, [
      { author: "operator", text: "Create an account or log in at the top of the page to chat with South Diamond support." },
    ]);
  }
  minimizePlayerChat();
}

function renderProfile(user) {
  if (!profileUsername) return;
  if (!user) {
    profileUsername.textContent = "Player";
    profileEmail.textContent = "";
    updatePlayerVipBadges(null);
    if (referralLinkInput) referralLinkInput.value = "";
    if (referralStatus) referralStatus.textContent = "";
    if (profilePhone) profilePhone.value = "";
    if (profilePassword) profilePassword.value = "";
    if (profileAvatarPreview) {
      profileAvatarPreview.textContent = "SD";
      profileAvatarPreview.style.backgroundImage = "";
    }
    if (playerAvatarNav) {
      playerAvatarNav.classList.add("is-hidden");
      playerAvatarNav.removeAttribute("src");
    }
    updateVipLevelDisplay(null);
    return;
  }

  profileUsername.textContent = user.username;
  profileEmail.textContent = user.email;
  updatePlayerVipBadges(user);
  updateVipLevelDisplay(user);
  if (referralLinkInput) referralLinkInput.value = referralUrlFor(user);
  if (referralStatus) referralStatus.textContent = "";
  if (profilePhone) profilePhone.value = user.phone || "";
  if (profilePassword) profilePassword.value = "";
  if (user.avatarUrl) {
    profileAvatarPreview.textContent = "";
    profileAvatarPreview.style.backgroundImage = `url("${user.avatarUrl}")`;
    playerAvatarNav.src = user.avatarUrl;
    playerAvatarNav.classList.remove("is-hidden");
  } else {
    profileAvatarPreview.textContent = user.username.slice(0, 2).toUpperCase();
    profileAvatarPreview.style.backgroundImage = "";
    playerAvatarNav.classList.add("is-hidden");
    playerAvatarNav.removeAttribute("src");
  }
}

function renderPlayerPointTransactions(transactions = []) {
  if (!playerPointTransactions) return;
  playerPointTransactions.innerHTML = "";
  if (!transactions.length) {
    playerPointTransactions.innerHTML = `<article class="points-transaction empty">No point transactions yet.</article>`;
    return;
  }
  transactions.forEach((transaction) => {
    const item = document.createElement("article");
    item.className = `points-transaction ${transaction.type === "redeem" ? "redeem" : "add"}`;
    item.innerHTML = `
      <div>
        <strong></strong>
        <span></span>
        <small></small>
      </div>
      <b></b>
    `;
    item.querySelector("strong").textContent = transaction.type === "redeem" ? "Points Redeemed" : "Points Added";
    item.querySelector("span").textContent = transaction.note || (transaction.type === "redeem" ? "Redeemed from account" : "Added to account");
    item.querySelector("small").textContent = `${new Date(transaction.createdAt).toLocaleString()} | Balance ${formatPoints(transaction.balanceAfter)}`;
    item.querySelector("b").textContent = `${transaction.type === "redeem" ? "-" : "+"}${formatPoints(transaction.points)}`;
    playerPointTransactions.appendChild(item);
  });
}

async function refreshPlayerPointTransactions() {
  if (!playerPointTransactions || !currentPlayer || !canUseApi) return;
  try {
    const data = await api("/api/player/points");
    renderPlayerPointTransactions(data.transactions || []);
  } catch (error) {
    playerPointTransactions.innerHTML = `<article class="points-transaction empty">${error.message}</article>`;
  }
}

function openPlayerProfile() {
  if (!currentPlayer) {
    document.querySelector('[data-auth-tab="login"]')?.click();
    playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  profileSection?.classList.remove("is-hidden");
  profileSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  refreshPlayerPointTransactions();
}

function minimizePlayerChat() {
  if (!chatWidget || !chatToggle) return;
  chatWidget.classList.remove("is-hidden");
  chatWidget.classList.add("is-minimized");
  document.body.classList.remove("player-chat-open");
  chatToggle.textContent = "Open Chat";
  chatToggle.setAttribute("aria-expanded", "false");
}

function openPlayerChat() {
  // Guests (not-logged-in users) can also open the chat. Their messages go to the
  // guest chat endpoint and land on the main admin's desk.
  if (!chatWidget || !chatToggle) return false;
  chatWidget.classList.remove("is-hidden", "is-minimized");
  document.body.classList.add("player-chat-open");
  chatToggle.textContent = "Minimize";
  chatToggle.setAttribute("aria-expanded", "true");
  hasOpenedPlayerChat = true;
  refreshPlayerChat();
  playerInput?.focus();
  return true;
}

async function openPlayerReferral() {
  if (!currentPlayer) {
    document.querySelector('[data-auth-tab="login"]')?.click();
    playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  openPlayerProfile();
  if (!referralLinkInput?.value) return;
  referralLinkInput.focus();
  referralLinkInput.select();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(referralLinkInput.value);
      if (referralStatus) referralStatus.textContent = "Referral link copied.";
    } else if (referralStatus) {
      referralStatus.textContent = "Referral link selected. Copy it to share.";
    }
  } catch {
    if (referralStatus) referralStatus.textContent = "Referral link selected. Copy it to share.";
  }
}

function showWelcomeModal(user) {
  if (!welcomeModal) return;
  if (welcomePoints) welcomePoints.textContent = formatPoints(user.points);
  welcomeModal.classList.remove("is-hidden");
}

function closeWelcomeModal() {
  welcomeModal?.classList.add("is-hidden");
}

// Rich symbol library: each symbol maps to display data (icon, color, tier)
const SLOT_SYMBOL_LIBRARY = {
  // High value
  "SD":     { icon: '<svg viewBox="0 0 40 40"><defs><linearGradient id="sdg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff8dc"/><stop offset=".5" stop-color="#f6c85f"/><stop offset="1" stop-color="#a06b1f"/></linearGradient></defs><polygon points="20,3 36,20 20,37 4,20" fill="url(#sdg)" stroke="#fff" stroke-width="1.5"/><text x="20" y="25" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="14" fill="#1a0d06">SD</text></svg>', color:"#ffd76b", tier:"wild", label:"WILD" },
  "777":    { icon: '<svg viewBox="0 0 40 40"><defs><linearGradient id="sevg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff4d6d"/><stop offset="1" stop-color="#8b0023"/></linearGradient></defs><rect x="3" y="3" width="34" height="34" rx="6" fill="url(#sevg)" stroke="#ffd76b" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-family="Impact" font-weight="900" font-size="18" fill="#ffd76b">777</text></svg>', color:"#ff4d6d", tier:"premium", label:"777" },
  "DIA":    { icon:"\uD83D\uDC8E", color:"#7be8ff", tier:"premium", label:"DIAMOND" },
  "BAR":    { icon: '<svg viewBox="0 0 40 40"><rect x="4" y="10" width="32" height="20" rx="3" fill="#1a0d06" stroke="#f6c85f" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-family="Arial Black" font-weight="900" font-size="11" fill="#f6c85f">BAR</text></svg>', color:"#f6c85f", tier:"premium", label:"BAR" },
  "BELL":   { icon:"\uD83D\uDD14", color:"#ffc845", tier:"high", label:"BELL" },
  "CHERRY": { icon:"\uD83C\uDF52", color:"#ff5675", tier:"high", label:"CHERRY" },
  // Theme: Buffalo
  "BUF":    { icon:"assets/slots/buffalo/buffalo.png", color:"#ffb162", tier:"premium", label:"BUFFALO", type:"image" },
  "BISON":  { icon:"assets/slots/buffalo/wolf.png", color:"#cf8a4a", tier:"high", label:"WOLF", type:"image" },
  "EAGLE":  { icon:"assets/slots/buffalo/eagle.png", color:"#e8c489", tier:"high", label:"EAGLE", type:"image" },
  "CACT":   { icon:"assets/slots/buffalo/mesa.png", color:"#69d27a", tier:"mid", label:"MESA", type:"image" },
  "BUFFALO_BONUS": { icon:"assets/slots/buffalo/bonus.png", color:"#ffd76b", tier:"high", label:"BONUS", type:"image" },
  "BUFFALO_WILD":  { icon:"assets/slots/buffalo/wild.png", color:"#ffd76b", tier:"wild", label:"WILD", type:"image" },
  "BUFFALO_A":     { icon:"assets/slots/buffalo/a.png", color:"#ff5675", tier:"low", label:"A", type:"image" },
  "BUFFALO_K":     { icon:"assets/slots/buffalo/k.png", color:"#ffc845", tier:"low", label:"K", type:"image" },
  // Theme: Dragon
  "DRG":    { icon:"\uD83D\uDC09", color:"#ff5630", tier:"premium", label:"DRAGON" },
  "FIRE":   { icon:"\uD83D\uDD25", color:"#ff7a30", tier:"high", label:"FIRE" },
  "SWORD":  { icon:"\u2694\uFE0F", color:"#c0c8d2", tier:"high", label:"SWORD" },
  "GOLD":   { icon: '<svg viewBox="0 0 40 40"><defs><radialGradient id="gold" cx=".4" cy=".3"><stop offset="0" stop-color="#fff8cd"/><stop offset="1" stop-color="#b8830a"/></radialGradient></defs><circle cx="20" cy="20" r="15" fill="url(#gold)" stroke="#8b5d00" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="14" fill="#5a3a00">$</text></svg>', color:"#ffd76b", tier:"high", label:"GOLD" },
  "PALACE": { icon:"\uD83C\uDFEF", color:"#ff9a4a", tier:"mid", label:"PALACE" },
  // Theme: Ocean
  "OCEAN":  { icon:"\uD83C\uDF0A", color:"#3bb8ff", tier:"premium", label:"WAVE" },
  "SHARK":  { icon:"\uD83E\uDD88", color:"#5fc1f5", tier:"high", label:"SHARK" },
  "CRAB":   { icon:"\uD83E\uDD80", color:"#ff7e5a", tier:"high", label:"CRAB" },
  "PEARL":  { icon: '<svg viewBox="0 0 40 40"><defs><radialGradient id="pearl" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#dde9ff"/><stop offset="1" stop-color="#7fa5cc"/></radialGradient></defs><circle cx="20" cy="20" r="14" fill="url(#pearl)" stroke="#aac4e0" stroke-width="1.5"/></svg>', color:"#dde9ff", tier:"high", label:"PEARL" },
  "FISH":   { icon:"\uD83D\uDC1F", color:"#ffb854", tier:"mid", label:"FISH" },
  // Theme: Jungle
  "TIGER":  { icon:"\uD83D\uDC2F", color:"#ffa64d", tier:"premium", label:"TIGER" },
  "LEOP":   { icon:"\uD83D\uDC06", color:"#ffd966", tier:"high", label:"LEOPARD" },
  "MASK":   { icon:"\uD83D\uDC79", color:"#7ad186", tier:"high", label:"TOTEM" },
  "LEAF":   { icon:"\uD83C\uDF43", color:"#52ef9f", tier:"mid", label:"LEAF" },
  // Theme: Neon
  "BOLT":   { icon:"\u26A1", color:"#fff05a", tier:"premium", label:"BOLT" },
  "DICE":   { icon:"\uD83C\uDFB2", color:"#ff5fe5", tier:"high", label:"DICE" },
  "ROUL":   { icon: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#5e0024" stroke="#f6c85f" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#1a0d06"/><line x1="20" y1="6" x2="20" y2="14" stroke="#fff" stroke-width="2"/><line x1="20" y1="34" x2="20" y2="26" stroke="#fff" stroke-width="2"/><line x1="6" y1="20" x2="14" y2="20" stroke="#fff" stroke-width="2"/><line x1="34" y1="20" x2="26" y2="20" stroke="#fff" stroke-width="2"/></svg>', color:"#ff3b7a", tier:"high", label:"ROULETTE" },
  // Card faces
  "A":      { icon:"A", color:"#ff5675", tier:"low", label:"A" },
  "K":      { icon:"K", color:"#ffc845", tier:"low", label:"K" },
  "Q":      { icon:"Q", color:"#a78bff", tier:"low", label:"Q" },
  "J":      { icon:"J", color:"#52ef9f", tier:"low", label:"J" },
  "10":     { icon:"10", color:"#7be8ff", tier:"low", label:"10" },
};

function getSymbolMeta(symbol) {
  return SLOT_SYMBOL_LIBRARY[symbol] || { icon: symbol || "?", color: "#fff", tier: "low", label: symbol || "?" };
}

const slotGames = {
  buffalo: {
    title: "Buffalo Rush",
    label: "Wild prairie reels",
    className: "buffalo",
    accent: "#ffb162",
    symbols: ["BUFFALO_WILD", "BUFFALO_BONUS", "BUF", "BISON", "EAGLE", "CACT", "BUFFALO_A", "BUFFALO_K"],
  },
  diamond: {
    title: "Diamond 777",
    label: "Classic jackpot reels",
    className: "diamond",
    accent: "#7be8ff",
    symbols: ["777", "DIA", "BAR", "BELL", "CHERRY", "A", "K", "SD"],
  },
  dragon: {
    title: "Dragon Conqueror",
    label: "Fire bonus reels",
    className: "dragon",
    accent: "#ff5630",
    symbols: ["DRG", "FIRE", "SWORD", "GOLD", "PALACE", "A", "K", "SD"],
  },
  ocean: {
    title: "Ocean Monster",
    label: "Deep sea wins",
    className: "ocean",
    accent: "#3bb8ff",
    symbols: ["OCEAN", "SHARK", "CRAB", "PEARL", "FISH", "A", "K", "SD"],
  },
  jungle: {
    title: "Jungle Fortune",
    label: "Big wild wins",
    className: "jungle",
    accent: "#52ef9f",
    symbols: ["TIGER", "LEOP", "GOLD", "MASK", "LEAF", "A", "K", "SD"],
  },
  neon: {
    title: "Neon Reels",
    label: "Fast city spins",
    className: "neon",
    accent: "#ff5fe5",
    symbols: ["777", "BOLT", "DICE", "ROUL", "DIA", "A", "K", "SD"],
  },
  // Bonus mapped games (use generic mappings)
  milkyway: {
    title: "Milky Way 777",
    label: "Galaxy reels",
    className: "neon",
    accent: "#a78bff",
    symbols: ["777", "DIA", "BOLT", "BELL", "A", "K", "SD"],
  },
  lucky777: {
    title: "Lucky 777",
    label: "Classic sevens",
    className: "diamond",
    accent: "#ff4d6d",
    symbols: ["777", "BAR", "CHERRY", "BELL", "DIA", "A", "K", "SD"],
  },
  diamond777: {
    title: "Diamond 777",
    label: "Premium gem reels",
    className: "diamond",
    accent: "#7be8ff",
    symbols: ["777", "DIA", "BAR", "BELL", "CHERRY", "A", "K", "SD"],
  },
  firekirin: {
    title: "Fire Kirin",
    label: "Flame wild reels",
    className: "dragon",
    accent: "#ff7a30",
    symbols: ["DRG", "FIRE", "GOLD", "PALACE", "A", "K", "Q", "SD"],
  },
  pandamaster: {
    title: "Panda Master",
    label: "Panda bonus reels",
    className: "jungle",
    accent: "#7ad186",
    symbols: ["TIGER", "LEAF", "BELL", "GOLD", "A", "K", "Q", "SD"],
  },
  orion: {
    title: "Orion Stars",
    label: "Neon star wins",
    className: "neon",
    accent: "#a78bff",
    symbols: ["BOLT", "DICE", "ROUL", "DIA", "777", "A", "K", "SD"],
  },
  goldendragon: {
    title: "Golden Dragon",
    label: "VIP dragon reels",
    className: "dragon",
    accent: "#ffd76b",
    symbols: ["DRG", "GOLD", "FIRE", "PALACE", "SWORD", "A", "K", "SD"],
  },
  gamevault: {
    title: "Game Vault",
    label: "Treasure reels",
    className: "buffalo",
    accent: "#f6c85f",
    symbols: ["GOLD", "BAR", "DIA", "BELL", "CHERRY", "A", "K", "SD"],
  },
  ultrapanda: {
    title: "Ultra Panda",
    label: "Lucky panda reels",
    className: "jungle",
    accent: "#69d27a",
    symbols: ["LEAF", "GOLD", "BELL", "TIGER", "A", "K", "Q", "SD"],
  },
};

function loadSlotBalance() {
  slotBalance = Number(currentPlayer?.points) || 0;
}

function updateSlotUi() {
  const game = slotGames[activeSlotGame] || slotGames.buffalo;
  slotBalance = Number(currentPlayer?.points) || slotBalance || 0;
  if (slotBalanceDisplay) slotBalanceDisplay.textContent = formatPoints(slotBalance);
  if (slotCreditsDisplay) slotCreditsDisplay.textContent = formatPoints(slotBalance);
  if (slotBetDisplay) slotBetDisplay.textContent = formatPoints(slotBet);
  if (slotGameTitle) slotGameTitle.textContent = game.title;
  if (slotThemeLabel) slotThemeLabel.textContent = game.label;
  if (slotMachine) {
    const allClasses = [...new Set(Object.values(slotGames).map((item) => item.className))];
    slotMachine.classList.remove(...allClasses);
    slotMachine.classList.add(game.className);
    if (game.accent) slotMachine.style.setProperty("--slot-accent", game.accent);
  }
  if (slotWinAmount && !slotIsSpinning) slotWinAmount.textContent = formatPoints(slotCurrentWin);
}

function renderSymbolCell(symbol, isWinning) {
  const meta = getSymbolMeta(symbol);
  if (meta.type === "image") {
    const winClass = isWinning ? " is-winning" : "";
    return `<span class="symbol-cell tier-${meta.tier || "low"} sym-image${winClass}" data-symbol="${symbol}" style="--sym-color:${meta.color}"><img src="${meta.icon}" alt="${meta.label || symbol}" loading="eager" draggable="false" /></span>`;
  }
  const isSvg = typeof meta.icon === "string" && meta.icon.startsWith("<svg");
  const tierClass = `tier-${meta.tier || "low"}`;
  const winClass = isWinning ? " is-winning" : "";
  if (isSvg) {
    return `<span class="symbol-cell ${tierClass}${winClass}" data-symbol="${symbol}" style="--sym-color:${meta.color}"><span class="sym-svg">${meta.icon}</span></span>`;
  }
  // Emoji or text
  const isText = /^[A-Z0-9]+$/.test(meta.icon) && meta.icon.length <= 3;
  const cls = isText ? "sym-text" : "sym-emoji";
  return `<span class="symbol-cell ${tierClass}${winClass}" data-symbol="${symbol}" style="--sym-color:${meta.color}"><span class="${cls}">${meta.icon}</span></span>`;
}

function renderSlotReels(symbolsOrGrid, wins = []) {
  if (!slotBoard) return;
  const grid = Array.isArray(symbolsOrGrid?.[0])
    ? symbolsOrGrid
    : (symbolsOrGrid || []).map((symbol) => [symbol, symbol, symbol]);
  const winningCells = new Set();
  wins.forEach((win) => {
    (win.positions || []).forEach((row, reelIndex) => {
      winningCells.add(`${reelIndex}-${row}`);
    });
  });
  slotBoard.querySelectorAll(".slot-reel").forEach((reel, index) => {
    const reelSymbols = grid[index] || ["SD", "SD", "SD"];
    reel.innerHTML = reelSymbols
      .slice(0, 3)
      .map((symbol, row) => renderSymbolCell(symbol || "SD", winningCells.has(`${index}-${row}`)))
      .join("");
  });
}

function randomSlotGrid(game) {
  const symbols = game?.symbols?.length ? game.symbols : ["SD", "777", "BAR", "DIA", "A", "K"];
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)])
  );
}

function startSlotRollingPreview() {
  const game = slotGames[activeSlotGame] || slotGames.buffalo;
  return window.setInterval(() => renderSlotReels(randomSlotGrid(game)), 92);
}

function getSlotAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!slotAudioContext) slotAudioContext = new AudioContext();
  return slotAudioContext;
}

function playSlotTone(frequency = 440, duration = 0.12, volume = 0.05) {
  try {
    const context = getSlotAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  } catch {
    // Sound can be blocked until the player taps the page.
  }
}

function playSlotSound(type = "click") {
  if (type === "win") {
    [740, 920, 1160].forEach((frequency, index) => window.setTimeout(() => playSlotTone(frequency, 0.16, 0.08), index * 90));
    return;
  }
  playSlotTone(type === "stop" ? 520 : 360, 0.1, 0.045);
}

function startSlotMusic() {
  if (slotMusicTimer) return;
  slotMusicOn = true;
  slotsMusicButton?.classList.add("is-active");
  if (slotsMusicButton) slotsMusicButton.textContent = "Music On";
  const notes = [196, 247, 294, 247, 330, 294];
  let index = 0;
  slotMusicTimer = window.setInterval(() => {
    playSlotTone(notes[index % notes.length], 0.18, 0.025);
    index += 1;
  }, 420);
}

function stopSlotMusic() {
  if (slotMusicTimer) window.clearInterval(slotMusicTimer);
  slotMusicTimer = null;
  slotMusicOn = false;
  slotsMusicButton?.classList.remove("is-active");
  if (slotsMusicButton) slotsMusicButton.textContent = "Music Off";
}

function openSlotsLobby() {
  if (!currentPlayer) {
    document.querySelector('[data-auth-tab="login"]')?.click();
    playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  loadSlotBalance();
  updateSlotUi();
  slotsModal?.classList.remove("is-hidden");
  slotsModal?.setAttribute("aria-hidden", "false");
  slotsLobby?.classList.remove("is-hidden");
  slotMachine?.classList.add("is-hidden");
  slotsBack?.classList.add("is-hidden");
  if (slotWinLabel) slotWinLabel.textContent = "Choose a South Diamond slot game.";
}

function closeSlotsLobby() {
  slotsModal?.classList.add("is-hidden");
  slotsModal?.setAttribute("aria-hidden", "true");
  stopSlotMusic();
}

function openSlotGame(gameKey) {
  activeSlotGame = slotGames[gameKey] ? gameKey : "buffalo";
  const game = slotGames[activeSlotGame];
  slotsLobby?.classList.add("is-hidden");
  slotMachine?.classList.remove("is-hidden");
  slotsBack?.classList.remove("is-hidden");
  renderSlotReels(shuffleItems(game.symbols).slice(0, 5));
  if (slotWinLabel) slotWinLabel.textContent = "Tap Spin to start.";
  updateSlotUi();
}

function animateCount(el, fromVal, toVal, duration = 1200) {
  if (!el) return;
  const start = performance.now();
  const diff = toVal - fromVal;
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const cur = fromVal + diff * eased;
    el.textContent = formatPoints(Math.round(cur * 100) / 100);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function showWinBurst(amount, isBig) {
  if (!winBurst) return;
  winBurst.classList.remove("is-hidden");
  if (winBurstAmount) winBurstAmount.textContent = `+${formatPoints(amount)}`;
  winBurst.classList.add("is-active");
  // Coin shower
  if (winCoins) {
    winCoins.innerHTML = "";
    const coinCount = isBig ? 24 : 12;
    for (let i = 0; i < coinCount; i++) {
      const coin = document.createElement("span");
      coin.className = "coin-particle";
      coin.style.left = `${10 + Math.random() * 80}%`;
      coin.style.animationDelay = `${Math.random() * 0.6}s`;
      coin.style.animationDuration = `${1.4 + Math.random() * 1.0}s`;
      coin.textContent = ["\uD83D\uDCB0","\uD83D\uDC8E","\u2B50","\uD83C\uDF1F"][i % 4];
      winCoins.appendChild(coin);
    }
  }
  if (isBig && bigWinBanner) {
    bigWinBanner.classList.remove("is-hidden");
    bigWinBanner.classList.add("is-active");
    window.setTimeout(() => {
      bigWinBanner.classList.remove("is-active");
      bigWinBanner.classList.add("is-hidden");
    }, 2800);
  }
  window.setTimeout(() => {
    winBurst.classList.remove("is-active");
    winBurst.classList.add("is-hidden");
  }, 2400);
}

async function spinSlotGame() {
  if (slotIsSpinning || !currentPlayer) return;
  slotBalance = Number(currentPlayer.points) || 0;
  if (slotBalance < slotBet) {
    if (slotWinLabel) slotWinLabel.textContent = "Not enough points. Lower your bet or ask admin to add points.";
    stopSlotAutoSpin();
    return;
  }
  slotIsSpinning = true;
  slotCurrentWin = 0;
  if (slotWinLabel) slotWinLabel.textContent = "Reels rolling...";
  if (slotWinAmount) slotWinAmount.textContent = "0";
  slotBoard?.classList.remove("is-winning");
  if (slotSpinButton) {
    slotSpinButton.disabled = true;
    slotSpinButton.classList.add("is-spinning");
    const txt = slotSpinButton.querySelector(".spin-button-text");
    if (txt) txt.textContent = "STOP";
  }
  const rollingTimer = startSlotRollingPreview();
  slotBoard?.querySelectorAll(".slot-reel").forEach((reel, index) => {
    reel.classList.add("is-spinning");
    reel.style.animationDuration = `${0.18 + index * 0.04}s`;
  });
  try {
    const data = await api("/api/player/slots/spin", {
      method: "POST",
      body: JSON.stringify({ gameKey: activeSlotGame, bet: slotBet }),
    });
    // Stop reels in sequence for realism
    const totalSpinTime = 2400;
    const stopStagger = 280;
    window.setTimeout(() => {
      window.clearInterval(rollingTimer);
      const reels = slotBoard?.querySelectorAll(".slot-reel") || [];
      const grid = data.grid || data.result || [];
      reels.forEach((reel, index) => {
        window.setTimeout(() => {
          reel.classList.remove("is-spinning");
          reel.classList.add("just-stopped");
          // Render only this reel with final symbols
          const reelSymbols = (grid[index] || ["SD","SD","SD"]).slice(0, 3);
          reel.innerHTML = reelSymbols
            .map((symbol) => renderSymbolCell(symbol || "SD", false))
            .join("");
          playSlotSound("stop");
          window.setTimeout(() => reel.classList.remove("just-stopped"), 360);
        }, index * stopStagger);
      });
      // After all reels stop, apply wins and update UI
      window.setTimeout(() => {
        renderSlotReels(data.grid || data.result, data.wins || []);
        slotBoard?.classList.toggle("is-winning", data.win > 0);
        updateCurrentPlayer(data.user);
        const winAmt = Number(data.win) || 0;
        slotCurrentWin = winAmt;
        if (slotWinLabel) {
          const bonusText = data.bonus?.amount ? ` (incl. ${formatPoints(data.bonus.amount)} bonus)` : "";
          slotWinLabel.textContent = winAmt > 0 ? `WIN! ${formatPoints(winAmt)} points${bonusText}` : "No win. Spin again.";
        }
        if (winAmt > 0) {
          animateCount(slotWinAmount, 0, winAmt, 1200);
          const isBig = winAmt >= slotBet * 10;
          showWinBurst(winAmt, isBig);
          playSlotSound("win");
        } else {
          if (slotWinAmount) slotWinAmount.textContent = "0";
        }
        updateSlotUi();
        refreshPlayerPointTransactions();
        slotIsSpinning = false;
        if (slotSpinButton) {
          slotSpinButton.disabled = false;
          slotSpinButton.classList.remove("is-spinning");
          const txt = slotSpinButton.querySelector(".spin-button-text");
          if (txt) txt.textContent = "SPIN";
        }
        // Auto-spin continues
        if (slotAutoSpinning) {
          slotAutoSpinTimer = window.setTimeout(() => spinSlotGame(), 1200);
        }
      }, reels.length * stopStagger + 200);
    }, totalSpinTime);
  } catch (error) {
    window.clearInterval(rollingTimer);
    slotBoard?.querySelectorAll(".slot-reel").forEach((reel) => reel.classList.remove("is-spinning"));
    if (slotWinLabel) slotWinLabel.textContent = error.message;
    if (error.user) updateCurrentPlayer(error.user);
    slotIsSpinning = false;
    stopSlotAutoSpin();
    if (slotSpinButton) {
      slotSpinButton.disabled = false;
      slotSpinButton.classList.remove("is-spinning");
      const txt = slotSpinButton.querySelector(".spin-button-text");
      if (txt) txt.textContent = "SPIN";
    }
    updateSlotUi();
  }
}

function startSlotAutoSpin() {
  if (slotAutoSpinning) return;
  slotAutoSpinning = true;
  slotAutoBtn?.classList.add("is-active");
  if (slotAutoBtn) slotAutoBtn.textContent = "STOP AUTO";
  if (!slotIsSpinning) spinSlotGame();
}

function stopSlotAutoSpin() {
  slotAutoSpinning = false;
  if (slotAutoSpinTimer) window.clearTimeout(slotAutoSpinTimer);
  slotAutoSpinTimer = null;
  slotAutoBtn?.classList.remove("is-active");
  if (slotAutoBtn) slotAutoBtn.textContent = "AUTO";
}

function setMaxBet() {
  const maxBets = [0.25, 0.5, 1, 2, 5, 10];
  const affordable = maxBets.filter((b) => b <= slotBalance);
  slotBet = affordable.length ? affordable[affordable.length - 1] : 0.25;
  updateSlotUi();
}

function updateCurrentPlayer(user) {
  if (!user) return;
  currentPlayer = user;
  playerPointsDisplay.forEach((item) => {
    item.textContent = formatPoints(user.points);
  });
  updateDailyLoginDisplay(user);
  renderProfile(user);
}

function openSpinModal(message = "") {
  if (!spinModal) return;
  if (spinResult) spinResult.textContent = message;
  if (spinButton) {
    spinButton.disabled = false;
    spinButton.textContent = "Spin";
  }
  spinModal.classList.remove("is-hidden");
  spinModal.setAttribute("aria-hidden", "false");
}

function closeSpinModal() {
  spinModal?.classList.add("is-hidden");
  spinModal?.setAttribute("aria-hidden", "true");
}

function formatNextSpin(value) {
  if (!value) return "";
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return "";
  return `Next spin opens ${next.toLocaleString()}.`;
}

async function maybeShowDailySpin() {
  if (!currentPlayer || hasCheckedDailySpin || !canUseApi || !spinModal) return;
  hasCheckedDailySpin = true;
  try {
    const data = await api("/api/player/spin-status");
    if (data.eligible) openSpinModal("Your daily spin is ready.");
  } catch {
    // Keep the page smooth if the spin status cannot load.
  }
}

async function openSpinForPlayer() {
  if (!currentPlayer) {
    document.querySelector('[data-auth-tab="login"]')?.click();
    playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  openSpinModal("Checking your daily spin...");
  try {
    const data = await api("/api/player/spin-status");
    if (data.eligible) {
      if (spinResult) spinResult.textContent = "Your daily spin is ready.";
      return;
    }
    if (spinButton) {
      spinButton.disabled = true;
      spinButton.textContent = "Come Back Tomorrow";
    }
    if (spinResult) spinResult.textContent = `Daily spin already used. ${formatNextSpin(data.nextSpinAt)}`;
  } catch (error) {
    if (spinResult) spinResult.textContent = error.message;
  }
}

function prizeToRotation(prize) {
  const centers = {
    0: 36,
    1: 108,
    3: 180,
    5: 252,
    10: 324,
  };
  const center = centers[String(prize)] ?? 36;
  spinRotation += 360 * 18 + (360 - center) + Math.floor(Math.random() * 20 - 10);
  return spinRotation;
}

async function runSpinWheel() {
  if (!currentPlayer) {
    closeSpinModal();
    document.querySelector('[data-auth-tab="login"]')?.click();
    playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (!spinButton || !spinWheel) return;
  spinButton.disabled = true;
  spinButton.textContent = "Spinning...";
  if (spinResult) spinResult.textContent = "Wheel is spinning. Good luck!";
  try {
    const data = await api("/api/player/spin", { method: "POST", body: JSON.stringify({}) });
    spinWheel.classList.add("is-spinning");
    spinWheel.style.transitionDuration = "20s";
    spinWheel.style.transform = `rotate(${prizeToRotation(data.prize)}deg)`;
    window.setTimeout(() => {
      spinWheel.classList.remove("is-spinning");
      updateCurrentPlayer(data.user);
      refreshPlayerPointTransactions();
      if (spinResult) {
        spinResult.textContent =
          data.prize > 0
            ? `You won ${data.prize} point${data.prize === 1 ? "" : "s"}. Added to your account.`
            : "Better luck next time. Come back tomorrow.";
      }
      spinButton.textContent = "Come Back Tomorrow";
    }, 20000);
  } catch (error) {
    if (spinResult) spinResult.textContent = `${error.message} ${formatNextSpin(error.nextSpinAt)}`.trim();
    spinButton.disabled = false;
    spinButton.textContent = "Spin";
  }
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    authTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    authPanels.forEach((panel) => {
      const isLogin = panel.matches("[data-player-login]");
      panel.classList.toggle(
        "is-active",
        tab.dataset.authTab === "login" && isLogin
      );
    });
    setAuthMessage("");
  });
});

document.querySelectorAll(".player-account-dropdown a, .player-account-dropdown button").forEach((item) => {
  item.addEventListener("click", () => {
    item.closest(".player-account-menu")?.removeAttribute("open");
  });
});

profileOpenLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openPlayerProfile();
  });
});

referralNavLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openPlayerReferral();
  });
});

chatWidget?.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
chatWidget?.addEventListener("touchmove", (event) => event.stopPropagation(), { passive: true });

document.querySelectorAll('a[href="#login"]').forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector('[data-auth-tab="login"]')?.click();
  });
});

if (referralCodeFromUrl && referralCodeInput) {
  referralCodeInput.value = referralCodeFromUrl.trim();
  document.querySelector('[data-auth-tab="login"]')?.click();
  if (referralLoginNote) {
    referralLoginNote.textContent = "Referral link applied. Log in or contact South Diamond support to join.";
    referralLoginNote.classList.remove("is-hidden");
  }
}

async function checkPlayerSession() {
  if (!playerAuth) return;
  if (!canUseApi) {
    showPlayerAuth();
    setAuthMessage("Run the website through the server to use player accounts.");
    return;
  }

  try {
    const data = await api("/api/player/me");
    showPlayerApp(data.user);
  } catch {
    showPlayerAuth();
  }
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function isAdultDate(value) {
  if (!value) return false;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 18;
}

if (playerLogin) {
  playerLogin.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    try {
      const data = await api("/api/player/login", {
        method: "POST",
        body: JSON.stringify(formData(playerLogin)),
      });
      playerLogin.reset();
      shouldShowWelcome = false;
      showPlayerApp(data.user);
      updateDailyLoginDisplay(data.user, data.dailyLoginBonus);
      if (data.dailyLoginBonus?.awarded) {
        const expired = Number(data.dailyLoginBonus.expiredPoints) > 0
          ? ` ${pointLabel(data.dailyLoginBonus.removedPoints || data.dailyLoginBonus.expiredPoints)} expired after the missed streak.`
          : "";
        const message = `Daily login bonus: +${pointLabel(data.dailyLoginBonus.points)}. ${data.dailyLoginBonus.streak}-day streak.${expired}`;
        setAuthMessage(message, true);
        showPlayerToast(message);
        refreshPlayerPointTransactions();
      }
      requestPlayerNotificationPermission();
    } catch (error) {
      setAuthMessage(error.message);
    }
  });
}

if (playerLogout) {
  playerLogout.addEventListener("click", async () => {
    await api("/api/player/logout", { method: "POST" }).catch(() => {});
    showPlayerAuth();
  });
}

if (copyReferralButton && referralLinkInput) {
  copyReferralButton.addEventListener("click", async () => {
    if (!referralLinkInput.value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLinkInput.value);
      } else {
        referralLinkInput.select();
        document.execCommand("copy");
      }
      if (referralStatus) referralStatus.textContent = "Referral link copied.";
      copyReferralButton.textContent = "Copied";
      setTimeout(() => {
        copyReferralButton.textContent = "Copy";
      }, 1200);
    } catch {
      referralLinkInput.select();
      if (referralStatus) referralStatus.textContent = "Select and copy your link.";
    }
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    profileStatus.textContent = "";
    try {
      const data = await api("/api/player/profile", {
        method: "POST",
        body: JSON.stringify({
          phone: profilePhone.value.trim(),
          password: profilePassword.value,
        }),
      });
      currentPlayer = data.user;
      renderProfile(data.user);
      profileStatus.textContent = "Profile updated.";
      profileStatus.style.color = "#52ef9f";
    } catch (error) {
      profileStatus.textContent = error.message;
      profileStatus.style.color = "";
    }
  });
}

async function refreshPlayerChat() {
  if (!playerMessages) return;
  // Track login state for the form handler (decides between player vs guest endpoint).
  window.__sdPlayerLoggedIn = Boolean(currentPlayer);

  if (currentPlayer) {
    // Authenticated player path — uses /api/player/me + /api/player/chat.
    try {
      const data = await api("/api/player/me");
      currentPlayer = data.user;
      renderProfile(data.user);
      const chats = await api("/api/player/chat");
      const messages = chats.chat?.messages || [
        { author: "operator", text: playerChatWelcomeText },
      ];
      const operatorMessages = messages.filter((message) => message.author === "operator");
      const latestOperatorMessage = operatorMessages[operatorMessages.length - 1];
      if (!lastPlayerOperatorMessageId) {
        lastPlayerOperatorMessageId = latestOperatorMessage?.id || "";
      } else if (latestOperatorMessage?.id && latestOperatorMessage.id !== lastPlayerOperatorMessageId) {
        lastPlayerOperatorMessageId = latestOperatorMessage.id;
        notifyPlayerOperatorMessage(latestOperatorMessage);
      }
      renderMessages(playerMessages, messages);
    } catch {
      renderMessages(playerMessages, [
        { author: "operator", text: playerChatWelcomeText },
      ]);
    }
    return;
  }

  // Guest path — uses /api/chats/guest-message (cookie-based).
  try {
    const data = await api("/api/chats/guest-message");
    const messages = data.chat?.messages?.length
      ? data.chat.messages
      : [{ author: "operator", text: playerChatWelcomeText }];
    renderMessages(playerMessages, messages);
  } catch {
    renderMessages(playerMessages, [
      { author: "operator", text: playerChatWelcomeText },
    ]);
  }
}

if (playerForm) {
  playerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = playerInput.value.trim();
    if (!text) return;

    // If the player is logged in, use the authenticated endpoint. Otherwise fall back to the
    // guest endpoint so anyone can chat with support before signing in.
    const isLoggedIn = Boolean(window.__sdPlayerLoggedIn);
    const endpoint = isLoggedIn ? "/api/chats/player-message" : "/api/chats/guest-message";

    try {
      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      playerInput.value = "";
      playerMessages.dataset.forceScroll = "true";
      renderMessages(playerMessages, data.chat.messages);
      playerInput.focus();
    } catch (error) {
      renderMessages(playerMessages, [{ author: "operator", text: error.message }]);
    }
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare image."));
    image.src = dataUrl;
  });
}

async function compressImage(file, maxEdge = 1600, quality = 0.82) {
  const dataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return { imageData: dataUrl, mimeType: file.type };
  }

  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return {
    imageData: canvas.toDataURL("image/jpeg", quality),
    mimeType: "image/jpeg",
  };
}

if (avatarForm) {
  avatarForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    avatarStatus.textContent = "";
    const file = avatarFile.files[0];
    if (!file) {
      avatarStatus.textContent = "Choose an image first.";
      return;
    }
    if (file.size > 3_000_000) {
      avatarStatus.textContent = "Profile image must be under 3 MB.";
      return;
    }

    const button = avatarForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Uploading...";
    try {
      const prepared = await compressImage(file, 900, 0.82);
      const data = await api("/api/player/avatar", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: prepared.mimeType,
          imageData: prepared.imageData,
        }),
      });
      currentPlayer = data.user;
      renderProfile(data.user);
      avatarForm.reset();
      avatarStatus.textContent = "Profile picture updated.";
    } catch (error) {
      avatarStatus.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Upload Picture";
    }
  });
}

if (uploadForm) {
  uploadFile?.addEventListener("change", () => {
    if (uploadFile.files[0]) uploadForm.requestSubmit();
  });

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    uploadStatus.textContent = "";
    const file = uploadFile.files[0];
    if (!file) {
      uploadStatus.textContent = "Choose an image first.";
      return;
    }
    if (file.size > 5_000_000) {
      uploadStatus.textContent = "Image must be under 5 MB.";
      return;
    }

    const button = uploadForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Uploading...";
    try {
      const prepared = await compressImage(file);
      const data = await api("/api/chats/player-upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: prepared.mimeType,
          imageData: prepared.imageData,
          note: uploadNote?.value.trim() || "",
        }),
      });
      uploadForm.reset();
      uploadStatus.textContent = "Image uploaded.";
      playerMessages.dataset.forceScroll = "true";
      renderMessages(playerMessages, data.chat.messages);
    } catch (error) {
      uploadStatus.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Upload Image";
    }
  });
}

if (playerAuth) {
  playerAuth.querySelectorAll("input").forEach((input) => {
    input.addEventListener("pointerdown", () => input.focus());
  });
  checkPlayerSession();
  setInterval(() => {
    if (currentPlayer) refreshPlayerChat();
  }, 3500);
}

if (chatToggle && chatWidget) {
  chatToggle.addEventListener("click", () => {
    const isMinimized = chatWidget.classList.toggle("is-minimized");
    document.body.classList.toggle("player-chat-open", !isMinimized);
    chatToggle.textContent = isMinimized ? "Open Chat" : "Minimize";
    chatToggle.setAttribute("aria-expanded", String(!isMinimized));
    if (!isMinimized) {
      hasOpenedPlayerChat = true;
      refreshPlayerChat();
    }
  });
}

lobbyCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (!currentPlayer) return;
    event.preventDefault();
    openPlayerChat();
  });
});

if (paymentActions) {
  paymentActions.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-tierlock-amount]");
    if (!button) return;
    const amount = button.dataset.tierlockAmount;
    button.disabled = true;
    button.textContent = "Opening...";
    try {
      const data = await api("/api/player/tierlock-payment", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      window.open(data.paymentUrl, "_blank", "noopener");
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Tierlock";
    }
  });
}

welcomeClose?.addEventListener("click", closeWelcomeModal);
welcomePayment?.addEventListener("click", closeWelcomeModal);
welcomeChat?.addEventListener("click", () => {
  closeWelcomeModal();
  openPlayerChat();
  document.querySelector("#chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
});
welcomeModal?.addEventListener("click", (event) => {
  if (event.target === welcomeModal) closeWelcomeModal();
});

spinTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openSpinForPlayer();
  });
});

spinClose?.addEventListener("click", closeSpinModal);
spinButton?.addEventListener("click", runSpinWheel);
spinModal?.addEventListener("click", (event) => {
  if (event.target === spinModal) closeSpinModal();
});

slotsOpenButtons.forEach((button) => {
  button.addEventListener("click", openSlotsLobby);
});

slotsClose?.addEventListener("click", closeSlotsLobby);
slotsBack?.addEventListener("click", openSlotsLobby);
slotsModal?.addEventListener("click", (event) => {
  if (event.target === slotsModal) closeSlotsLobby();
});

slotsLobby?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot-game]");
  if (!button) return;
  openSlotGame(button.dataset.slotGame);
});

slotBetDown?.addEventListener("click", () => {
  slotBet = Math.max(0.25, Math.round((slotBet - 0.25) * 100) / 100);
  playSlotSound("click");
  updateSlotUi();
});

slotBetUp?.addEventListener("click", () => {
  slotBet = Math.min(500, Math.round((slotBet + 0.25) * 100) / 100);
  playSlotSound("click");
  updateSlotUi();
});

slotSpinButton?.addEventListener("click", spinSlotGame);

slotsMusicButton?.addEventListener("click", () => {
  if (slotMusicOn) stopSlotMusic();
  else startSlotMusic();
});

const adminInbox = document.querySelector("[data-admin-inbox]");
const adminMessages = document.querySelector("[data-admin-messages]");
const adminName = document.querySelector("[data-admin-name]");
const adminChatStatus = document.querySelector("[data-admin-chat-status]");
const adminCount = document.querySelector("[data-admin-count]");
const adminForm = document.querySelector("[data-admin-form]");
const adminInput = document.querySelector("[data-admin-input]");
const deleteChat = document.querySelector("[data-delete-chat]");
const adminUsers = document.querySelector("[data-admin-users]");
const adminVipUsers = document.querySelector("[data-admin-vip-users]");
const adminUserCount = document.querySelector("[data-admin-user-count]");
const adminVipCount = document.querySelector("[data-vip-count]");
const dashboardStats = document.querySelector("[data-dashboard-stats]");
const pointsTransactions = document.querySelector("[data-points-transactions]");
const pointsCount = document.querySelector("[data-points-count]");
const pointsAddList = document.querySelector("[data-points-add-list]");
const pointsRedeemList = document.querySelector("[data-points-redeem-list]");
const adminActivityList = document.querySelector("[data-admin-activity]");
const broadcastUsers = document.querySelector("[data-broadcast-users]");
const broadcastForm = document.querySelector("[data-broadcast-form]");
const broadcastCount = document.querySelector("[data-broadcast-count]");
const broadcastStatus = document.querySelector("[data-broadcast-status]");
const broadcastSelectAll = document.querySelector("[data-broadcast-select-all]");
const spinSettingsForm = document.querySelector("[data-spin-settings-form]");
const spinSettingsStatus = document.querySelector("[data-spin-settings-status]");
const spinAdminStats = document.querySelector("[data-spin-admin-stats]");
const spinAwardsList = document.querySelector("[data-spin-awards]");
const spinDate = document.querySelector("[data-spin-date]");
const slotsSettingsForm = document.querySelector("[data-slots-settings-form]");
const slotsSettingsStatus = document.querySelector("[data-slots-settings-status]");
const slotsAdminStats = document.querySelector("[data-slots-admin-stats]");
const slotsSpinsList = document.querySelector("[data-slots-spins]");
const slotsAdminDate = document.querySelector("[data-slots-admin-date]");
const adminPanelButtons = document.querySelectorAll("[data-admin-panel-button]");
const adminPanels = document.querySelectorAll("[data-admin-panel]");
const adminChatJumps = document.querySelectorAll("[data-admin-chat-jump]");
const adminMessagesPanel = document.querySelector("[data-admin-messages-panel]");
const adminUnreadBadges = document.querySelectorAll("[data-chat-unread-count]");
const adminRefresh = document.querySelector("[data-admin-refresh]");
const adminTitle = document.querySelector("[data-admin-title]");
const playerModal = document.querySelector("[data-player-modal]");
const closePlayerModal = document.querySelector("[data-close-player-modal]");
const modalUsername = document.querySelector("[data-modal-username]");
const modalEmail = document.querySelector("[data-modal-email]");
const modalPhone = document.querySelector("[data-modal-phone]");
const modalDob = document.querySelector("[data-modal-dob]");
const modalJoined = document.querySelector("[data-modal-joined]");
const modalStatus = document.querySelector("[data-modal-status]");
const modalPoints = document.querySelector("[data-modal-points]");
const modalOpenChat = document.querySelector("[data-modal-open-chat]");
const modalPointsForm = document.querySelector("[data-modal-points-form]");
const modalResetForm = document.querySelector("[data-modal-reset-form]");
const modalNoteForm = document.querySelector("[data-modal-note-form]");
const modalGameHistory = document.querySelector("[data-modal-game-history]");
const modalGameHistorySummary = document.querySelector("[data-modal-game-history-summary]");
const playerFilterButtons = document.querySelectorAll("[data-player-filter]");
const loginForm = document.querySelector("[data-login-form]");
const loginUsername = document.querySelector("[data-login-username]");
const loginPassword = document.querySelector("[data-login-password]");
const loginCode = document.querySelector("[data-login-code]");
const loginCodePanel = document.querySelector("[data-admin-code-panel]");
const loginSubmit = document.querySelector("[data-login-submit]");
const loginError = document.querySelector("[data-login-error]");
const logoutButton = document.querySelector("[data-logout]");
const adminForgotButton = document.querySelector("[data-admin-forgot-button]");
const adminForgotStatus = document.querySelector("[data-admin-forgot-status]");
const adminResetPasswordForm = document.querySelector("[data-admin-reset-password-form]");
const adminResetStatus = document.querySelector("[data-admin-reset-status]");

let activeAdminThread = null;
let activeModalUserId = null;
let adminUsersCache = [];
let pendingAdminLoginId = null;
let lastAdminUnreadTotal = 0;
let adminHasRenderedOnce = false;
let adminRenderInFlight = false;
let adminRenderQueued = false;
let adminSearchRenderTimer = null;
let adminLiveStream = null;
let adminLiveRefreshTimer = null;
const adminBroadcastExcludedUserIds = new Set();
const adminIdleLimitMs = 2 * 60 * 60 * 1000;
const adminKeepAliveMs = 5 * 60 * 1000;
let adminLastActivityAt = Date.now();
let adminLastKeepAliveAt = 0;

const adminPanelTitles = {
  overview: "Overview",
  activity: "Live Activity",
  players: "All Players",
  vip: "VIP Players",
  add: "Add Points",
  redeem: "Redeem Points",
  spin: "Spin Wheel",
  slots: "Slots Control",
  transactions: "Transactions",
  broadcast: "Broadcast",
  agents: "Agent Links",
};

adminPanelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panelName = button.dataset.adminPanelButton;
    adminChatJumps.forEach((item) => item.classList.remove("is-active"));
    adminMessagesPanel?.classList.add("is-hidden");
    adminPanelButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    adminPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.adminPanel === panelName));
    if (adminTitle) adminTitle.textContent = adminPanelTitles[panelName] || "Admin Portal";
  });
});

adminChatJumps.forEach((jump) => {
  jump.addEventListener("click", () => {
    adminPanelButtons.forEach((item) => item.classList.remove("is-active"));
    adminChatJumps.forEach((item) => item.classList.toggle("is-active", item === jump));
    adminPanels.forEach((panel) => panel.classList.remove("is-active"));
    adminMessagesPanel?.classList.remove("is-hidden");
    if (adminTitle) adminTitle.textContent = "Messages";
    document.querySelector(".admin-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    adminInput?.focus();
  });
});

adminRefresh?.addEventListener("click", () => renderAdmin());

document.querySelectorAll("[data-admin-search]").forEach((input) => {
  input.addEventListener("input", () => {
    adminSearchState[input.dataset.adminSearch] = input.value;
    clearTimeout(adminSearchRenderTimer);
    adminSearchRenderTimer = setTimeout(renderAdmin, 160);
  });
});

playerFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    adminPlayerFilter = button.dataset.playerFilter || "all";
    playerFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderAdmin();
  });
});

async function requireAdminSession() {
  if (!isAdminPage || !canUseApi) return;

  try {
    const data = await api("/api/admin/me");
    window.__sdAdminSessionRole = data?.role === "sub_admin" ? "sub_admin" : "admin";
    return;
  } catch {
  }

  try {
    const response = await fetch("/api/admin/sub-admin/me", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Sub-admin login is required.");
    const data = await response.json().catch(() => ({}));
    if (data?.loggedIn === false) throw new Error("Sub-admin login is required.");
    window.__sdAdminSessionRole = data?.role === "admin" ? "admin" : "sub_admin";
    return;
  } catch {
  }

  location.href = isSubAdminRoute() ? "/admin" : "/login9493";
}

async function logoutAdmin(reason = "") {
  const subAdminSession = window.__sdAdminSessionRole === "sub_admin";
  await api(subAdminSession ? "/api/admin/sub-admin/logout" : "/api/admin/logout", { method: "POST" }).catch(() => {});
  const suffix = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  location.href = `${subAdminSession ? "/admin" : "/login9493"}${suffix}`;
}

function isSubAdminRoute() {
  return location.pathname === "/admin" || location.pathname === "/admin/";
}

function markAdminActivity() {
  adminLastActivityAt = Date.now();
}

function setupAdminIdleLogout() {
  if (!isAdminPage || !canUseApi) return;
  ["click", "keydown", "pointerdown", "touchstart", "input", "scroll"].forEach((eventName) => {
    window.addEventListener(eventName, markAdminActivity, { passive: true });
  });
  setInterval(async () => {
    const idleFor = Date.now() - adminLastActivityAt;
    if (idleFor >= adminIdleLimitMs) {
      await logoutAdmin("inactive");
      return;
    }
    if (!document.hidden && Date.now() - adminLastKeepAliveAt >= adminKeepAliveMs) {
      adminLastKeepAliveAt = Date.now();
      if (window.__sdAdminSessionRole === "admin") {
        await api("/api/admin/keepalive", { method: "POST" }).catch(() => {});
      }
    }
  }, 60 * 1000);
}

function playerPresence(user) {
  const activeTime = user.lastActiveAt || user.lastLoginAt || user.createdAt;
  const timestamp = activeTime ? new Date(activeTime).getTime() : 0;
  if (!timestamp) return { className: "offline", label: "Offline" };
  const minutesAway = (Date.now() - timestamp) / 60000;
  if (minutesAway < 30) return { className: "online", label: "Online" };
  if (minutesAway < 12 * 60) return { className: "away", label: "Away" };
  return { className: "offline", label: "Offline" };
}

function setPresenceDot(dot, presence) {
  if (!dot) return;
  dot.classList.remove("online", "away", "offline");
  dot.classList.add(presence.className);
  dot.title = presence.label;
  dot.setAttribute("aria-label", presence.label);
}

function playAdminAlert() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  } catch {
    // Browser may block sound until the page has user interaction.
  }
}

function createAdminPlayerRow(user) {
  const presence = playerPresence(user);
  const vip = user.vipLevel || {};
  const hasVipLevel = Boolean(user.isVip || (vip.key && vip.key !== "bronze"));
  const item = document.createElement("article");
  item.className = `registered-player admin-player-row${hasVipLevel ? " is-vip-player" : ""}`;
  item.innerHTML = `
    <div class="registered-player-identity">
      <span class="player-presence-dot"></span>
      <button class="vip-star-button" type="button" data-toggle-vip aria-label="Toggle VIP player"></button>
      <button class="registered-player-name" type="button" data-view-user></button>
      <span class="admin-vip-level"></span>
    </div>
    <span class="admin-player-email"></span>
    <span class="admin-player-phone"></span>
    <strong class="admin-player-points"></strong>
    <span class="admin-player-owner"></span>
    <span class="admin-player-joined"></span>
    <span class="status-pill admin-player-status"></span>
    <div class="admin-player-actions">
      <button class="admin-mini-button gold" type="button" data-view-user>View</button>
      <button class="admin-mini-button green" type="button" data-quick-add-points>+ Pts</button>
      <button class="admin-mini-button blue" type="button" data-quick-reset-password>Pwd</button>
      <button class="admin-mini-button neutral" type="button" data-open-user-chat>Chat</button>
    </div>
  `;
  item.dataset.userId = user.id;
  setPresenceDot(item.querySelector(".player-presence-dot"), presence);
  item.querySelectorAll("[data-view-user], [data-open-user-chat], [data-quick-add-points], [data-quick-reset-password], [data-toggle-vip]").forEach((button) => {
    button.dataset.userId = user.id;
  });
  const vipButton = item.querySelector("[data-toggle-vip]");
  vipButton.textContent = user.isVip ? "★" : "☆";
  vipButton.classList.toggle("is-vip", Boolean(user.isVip));
  vipButton.title = user.isVip ? "Remove from VIP players" : "Add to VIP players";
  item.querySelector(".registered-player-name").textContent = user.username;
  const vipLevel = item.querySelector(".admin-vip-level");
  vipLevel.textContent = `${vip.name || "Bronze"} VIP`;
  vipLevel.dataset.vipLevel = String(vip.key || "bronze");
  item.querySelector(".admin-player-email").textContent = user.email;
  item.querySelector(".admin-player-phone").textContent = user.phone || "-";
  item.querySelector(".admin-player-points").textContent = formatPoints(user.points);
  item.querySelector(".admin-player-owner").textContent = user.ownerName || "Main Admin";
  item.querySelector(".admin-player-joined").textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-";
  item.querySelector(".admin-player-status").textContent = presence.label;
  item.querySelector(".admin-player-status").classList.add(presence.className);
  return item;
}

function renderUsers(users) {
  if (!adminUsers) return;
  adminUsersCache = users;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const filteredUsers = users.filter((user) => {
    const presence = playerPresence(user);
    if (adminPlayerFilter === "online") return presence.className === "online";
    if (adminPlayerFilter === "away") return presence.className === "away";
    if (adminPlayerFilter === "offline") return presence.className === "offline";
    if (adminPlayerFilter === "today") return user.createdAt && new Date(user.createdAt).getTime() >= startOfToday.getTime();
    if (adminPlayerFilter === "points") return Number(user.points) > 0;
    if (adminPlayerFilter === "chat") return Boolean(user.chatId);
    return true;
  });
  const visibleUsers = filterItems(filteredUsers, adminSearchState.players, (user) => [
    user.username,
    user.email,
    user.phone,
    user.dateOfBirth,
    user.points,
    user.createdAt,
    user.lastActiveAt,
    user.adminNote,
    user.ownerName,
    user.vipLevel?.name,
  ]);
  adminUserCount.textContent = `${visibleUsers.length}/${users.length} player${users.length === 1 ? "" : "s"}`;
  adminUsers.innerHTML = "";

  if (!visibleUsers.length) {
    adminUsers.innerHTML = `<div class="admin-player-empty">No matching players.</div>`;
    return;
  }

  const table = document.createElement("div");
  table.className = "admin-player-table";
  table.innerHTML = `
    <div class="admin-player-table-head" aria-hidden="true">
      <span>Username</span>
      <span>Email</span>
      <span>Phone</span>
      <span>Points</span>
      <span>Sub Admin</span>
      <span>Joined</span>
      <span>Status</span>
      <span>Actions</span>
    </div>
  `;
  visibleUsers.forEach((user) => table.appendChild(createAdminPlayerRow(user)));
  adminUsers.appendChild(table);
  renderPointsActionLists(users);
}

function renderVipUsers(users) {
  if (!adminVipUsers) return;
  const vipUsers = users.filter((user) => user.isVip || (user.vipLevel?.key && user.vipLevel.key !== "bronze"));
  const visibleUsers = filterItems(vipUsers, adminSearchState.vip, (user) => [
    user.username,
    user.email,
    user.phone,
    user.points,
    user.createdAt,
    user.ownerName,
    user.vipLevel?.name,
  ]);
  if (adminVipCount) adminVipCount.textContent = `${visibleUsers.length}/${vipUsers.length} VIP level player${vipUsers.length === 1 ? "" : "s"}`;
  adminVipUsers.innerHTML = "";
  if (!visibleUsers.length) {
    adminVipUsers.innerHTML = `<div class="admin-player-empty">No VIP level players yet. Players appear here at Silver and above, or when starred.</div>`;
    return;
  }
  const table = document.createElement("div");
  table.className = "admin-player-table";
  table.innerHTML = `
    <div class="admin-player-table-head" aria-hidden="true">
      <span>Username</span>
      <span>Email</span>
      <span>Phone</span>
      <span>Points</span>
      <span>Sub Admin</span>
      <span>Joined</span>
      <span>Status</span>
      <span>Actions</span>
    </div>
  `;
  visibleUsers.forEach((user) => table.appendChild(createAdminPlayerRow(user)));
  adminVipUsers.appendChild(table);
}

function getAdminUser(userId) {
  return adminUsersCache.find((user) => user.id === userId);
}

function formatAdminDate(value, fallback = "-") {
  return value ? new Date(value).toLocaleDateString() : fallback;
}

function openAdminPlayerModal(userId, focusTarget = "") {
  const user = getAdminUser(userId);
  if (!user || !playerModal) return;
  activeModalUserId = user.id;
  const presence = playerPresence(user);
  modalUsername.textContent = user.username || "Player";
  modalUsername.classList.toggle("is-vip-name", Boolean(user.isVip));
  modalEmail.textContent = user.email || "-";
  modalPhone.textContent = user.phone || "-";
  modalDob.textContent = user.dateOfBirth ? new Date(`${user.dateOfBirth}T00:00:00`).toLocaleDateString() : "Not provided";
  modalJoined.textContent = formatAdminDate(user.createdAt);
  modalStatus.textContent = presence.label;
  modalStatus.className = `status-pill ${presence.className}`;
  modalPoints.textContent = formatPoints(user.points);
  modalOpenChat.dataset.userId = user.id;
  modalPointsForm.dataset.userId = user.id;
  modalResetForm.dataset.userId = user.id;
  modalNoteForm.dataset.userId = user.id;
  modalNoteForm.note.value = user.adminNote || "";
  renderPlayerGameHistoryLoading();
  loadPlayerGameHistory(user.id);
  playerModal.classList.remove("is-hidden");
  playerModal.setAttribute("aria-hidden", "false");
  if (focusTarget === "points") modalPointsForm.points.focus();
  else if (focusTarget === "password") modalResetForm.password.focus();
  else modalOpenChat.focus();
}

function renderPlayerGameHistoryLoading() {
  if (modalGameHistorySummary) modalGameHistorySummary.textContent = "Loading...";
  if (modalGameHistory) {
    modalGameHistory.innerHTML = `<article class="admin-modal-history-empty">Loading game history...</article>`;
  }
}

function renderPlayerGameHistory(data = {}) {
  if (!modalGameHistory) return;
  const history = Array.isArray(data.history) ? data.history : [];
  const totals = data.totals || {};
  if (modalGameHistorySummary) {
    modalGameHistorySummary.textContent = `${Number(totals.spins) || 0} spins | Bet ${formatPoints(totals.wagered || 0)} | Won ${formatPoints(totals.won || 0)}`;
  }
  modalGameHistory.innerHTML = "";
  if (!history.length) {
    modalGameHistory.innerHTML = `<article class="admin-modal-history-empty">No game history for this player yet.</article>`;
    return;
  }
  history.slice(0, 100).forEach((spin) => {
    const item = document.createElement("article");
    item.className = `admin-modal-history-row ${Number(spin.win) > 0 ? "is-win" : "is-loss"}`;
    item.innerHTML = `
      <div>
        <strong></strong>
        <span></span>
      </div>
      <div class="admin-modal-history-values">
        <small></small>
        <b></b>
      </div>
    `;
    item.querySelector("strong").textContent = spin.gameName || "South Diamond Slots";
    item.querySelector("span").textContent = spin.createdAt ? new Date(spin.createdAt).toLocaleString() : "-";
    item.querySelector("small").textContent = `Bet ${formatPoints(spin.bet || 0)}`;
    item.querySelector("b").textContent = Number(spin.win) > 0 ? `Won +${formatPoints(spin.win)}` : "Won 0";
    modalGameHistory.appendChild(item);
  });
}

async function loadPlayerGameHistory(userId) {
  try {
    const data = await api(`/api/admin/player-game-history?userId=${encodeURIComponent(userId)}`);
    if (activeModalUserId !== userId) return;
    renderPlayerGameHistory(data);
  } catch (error) {
    if (modalGameHistorySummary) modalGameHistorySummary.textContent = "Unavailable";
    if (modalGameHistory) {
      modalGameHistory.innerHTML = `<article class="admin-modal-history-empty">Could not load game history.</article>`;
    }
  }
}

function closeAdminPlayerModal() {
  if (!playerModal) return;
  playerModal.classList.add("is-hidden");
  playerModal.setAttribute("aria-hidden", "true");
}

function filterItems(items, query, fields) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) =>
    fields(item)
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}

function pointsActionCard(user, action) {
  const isRedeem = action === "redeem";
  return `
    <article class="points-action-card">
      <div>
        <strong>${user.username}</strong>
        <span>${user.email}</span>
        <small>${formatPoints(user.points)} available points</small>
      </div>
      <form class="admin-points-form" data-points-user data-points-action="${action}">
        <input name="points" type="number" min="1" step="1" placeholder="Points" required />
        <input name="note" type="text" placeholder="Note" />
        <button class="game-link${isRedeem ? " redeem" : ""}" type="submit">${isRedeem ? "Redeem" : "Add"}</button>
      </form>
    </article>
  `;
}

function renderPointsActionLists(users) {
  const addUsers = filterItems(users, adminSearchState.add, (user) => [user.username, user.email, user.phone, user.points]);
  const redeemUsers = filterItems(users, adminSearchState.redeem, (user) => [user.username, user.email, user.phone, user.points]);
  if (pointsAddList) {
    pointsAddList.innerHTML = addUsers.length ? addUsers.map((user) => pointsActionCard(user, "add")).join("") : `<article class="points-action-card">No matching players.</article>`;
    addUsers.forEach((user, index) => {
      pointsAddList.querySelectorAll("[data-points-user]")[index].dataset.userId = user.id;
    });
  }
  if (pointsRedeemList) {
    pointsRedeemList.innerHTML = redeemUsers.length ? redeemUsers.map((user) => pointsActionCard(user, "redeem")).join("") : `<article class="points-action-card">No matching players.</article>`;
    redeemUsers.forEach((user, index) => {
      pointsRedeemList.querySelectorAll("[data-points-user]")[index].dataset.userId = user.id;
    });
  }
}

function getBroadcastVisibleUsers(users) {
  return filterItems(users, adminSearchState.broadcast, (user) => [
    user.username,
    user.email,
    user.phone,
    user.points,
    user.createdAt,
  ]);
}

function updateBroadcastCount(users = adminUsersCache) {
  if (!broadcastCount) return;
  const selectedCount = users.filter((user) => !adminBroadcastExcludedUserIds.has(user.id)).length;
  broadcastCount.textContent = `${selectedCount}/${users.length} selected`;
  if (broadcastSelectAll) {
    const visibleUsers = getBroadcastVisibleUsers(users);
    broadcastSelectAll.checked = Boolean(visibleUsers.length) && visibleUsers.every((user) => !adminBroadcastExcludedUserIds.has(user.id));
    broadcastSelectAll.indeterminate = visibleUsers.some((user) => !adminBroadcastExcludedUserIds.has(user.id)) && !broadcastSelectAll.checked;
  }
}

function renderBroadcastUsers(users) {
  if (!broadcastUsers) return;
  const visibleUsers = getBroadcastVisibleUsers(users);
  updateBroadcastCount(users);
  broadcastUsers.innerHTML = "";
  if (!visibleUsers.length) {
    broadcastUsers.innerHTML = `<article class="broadcast-player-card empty">No matching players.</article>`;
    return;
  }
  visibleUsers.forEach((user) => {
    const checked = !adminBroadcastExcludedUserIds.has(user.id);
    const presence = playerPresence(user);
    const row = document.createElement("label");
    row.className = `broadcast-player-card${checked ? " is-selected" : ""}`;
    row.innerHTML = `
      <input type="checkbox" data-broadcast-user />
      <span class="player-presence-dot"></span>
      <strong></strong>
      <small></small>
      <b></b>
    `;
    const input = row.querySelector("[data-broadcast-user]");
    input.dataset.userId = user.id;
    input.checked = checked;
    setPresenceDot(row.querySelector(".player-presence-dot"), presence);
    row.querySelector("strong").textContent = user.username || "Player";
    row.querySelector("small").textContent = user.email || user.phone || "No email";
    row.querySelector("b").textContent = `${formatPoints(user.points)} pts`;
    broadcastUsers.appendChild(row);
  });
}

function renderPointTransactions(transactions = []) {
  if (!pointsTransactions) return;
  const visibleTransactions = filterItems(transactions, adminSearchState.transactions, (transaction) => [
    transaction.username,
    transaction.type,
    transaction.points,
    transaction.balanceAfter,
    transaction.note,
    transaction.createdAt,
    transaction.ownerName,
  ]);
  pointsCount.textContent = `${visibleTransactions.length}/${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`;
  pointsTransactions.innerHTML = "";
  if (!visibleTransactions.length) {
    pointsTransactions.innerHTML = `<article class="points-transaction empty">No matching point transactions.</article>`;
    return;
  }

  visibleTransactions.slice(0, 80).forEach((transaction) => {
    const item = document.createElement("article");
    item.className = `points-transaction ${transaction.type}`;
    item.innerHTML = `
      <div><strong></strong><span></span></div>
      <b></b>
      <small></small>
    `;
    item.querySelector("strong").textContent = transaction.username || "Player";
    const owner = transaction.ownerName ? ` | ${transaction.ownerName}` : "";
    item.querySelector("span").textContent = `${transaction.note || (transaction.type === "add" ? "Points added" : "Points redeemed")}${owner}`;
    item.querySelector("b").textContent = `${transaction.type === "add" ? "+" : "-"}${formatPoints(transaction.points)}`;
    item.querySelector("small").textContent = `${new Date(transaction.createdAt).toLocaleString()} | Balance ${formatPoints(transaction.balanceAfter)}`;
    pointsTransactions.appendChild(item);
  });
}

function renderSpinAdmin(data = {}) {
  const settings = data.settings?.limits || {};
  const counts = data.counts || {};
  if (spinDate) spinDate.textContent = data.date ? `Today: ${data.date}` : "Daily prize controls";
  if (spinSettingsForm) {
    ["10", "5", "3", "1"].forEach((points) => {
      const input = spinSettingsForm.elements[points];
      if (input && document.activeElement !== input) input.value = settings[points] ?? "";
    });
  }
  if (spinAdminStats) {
    spinAdminStats.innerHTML = ["10", "5", "3", "1", "0"]
      .map((points) => {
        const label = points === "0" ? "Better luck" : `${points} point`;
        const limit = points === "0" ? "No limit" : `${counts[points] || 0}/${settings[points] ?? 0}`;
        return `<article><span>${label}</span><strong>${limit}</strong></article>`;
      })
      .join("");
  }
  if (spinAwardsList) {
    const awards = data.awards || [];
    spinAwardsList.innerHTML = "";
    if (!awards.length) {
      spinAwardsList.innerHTML = `<article class="points-transaction empty">No spin results yet today.</article>`;
      return;
    }
    awards.slice(0, 60).forEach((award) => {
      const item = document.createElement("article");
      item.className = `points-transaction ${award.prize > 0 ? "add" : "redeem"}`;
      item.innerHTML = `<div><strong></strong><span></span></div><b></b><small></small>`;
      item.querySelector("strong").textContent = award.username || "Player";
      item.querySelector("span").textContent = award.prize > 0 ? "Daily spin reward" : "Better luck next time";
      item.querySelector("b").textContent = award.prize > 0 ? `+${award.prize}` : "0";
      item.querySelector("small").textContent = award.createdAt ? new Date(award.createdAt).toLocaleString() : "";
      spinAwardsList.appendChild(item);
    });
  }
}

function renderSlotsAdmin(data = {}) {
  const settings = data.settings || {};
  const payout = data.payout || {};
  const paidOut = formatPoints(payout.paidOut || 0);
  const limit = formatPoints(settings.dailyPayoutLimit || 0);
  if (slotsAdminDate) slotsAdminDate.textContent = data.date ? `Today: ${data.date}` : "Daily payout controls";
  if (slotsSettingsForm) {
    const dailyInput = slotsSettingsForm.elements.dailyPayoutLimit;
    const playerInput = slotsSettingsForm.elements.playerDailyPayoutLimit;
    if (dailyInput && document.activeElement !== dailyInput) dailyInput.value = settings.dailyPayoutLimit ?? "";
    if (playerInput && document.activeElement !== playerInput) playerInput.value = settings.playerDailyPayoutLimit ?? "";
  }
  if (slotsAdminStats) {
    const remaining = Math.max(0, Number(settings.dailyPayoutLimit || 0) - Number(payout.paidOut || 0));
    slotsAdminStats.innerHTML = `
      <article><span>Paid today</span><strong>${paidOut}</strong></article>
      <article><span>Daily limit</span><strong>${limit}</strong></article>
      <article><span>Per player max</span><strong>${formatPoints(settings.playerDailyPayoutLimit || 0)}</strong></article>
      <article><span>Remaining</span><strong>${formatPoints(remaining)}</strong></article>
    `;
  }
  if (slotsSpinsList) {
    const spins = data.spins || [];
    slotsSpinsList.innerHTML = "";
    if (!spins.length) {
      slotsSpinsList.innerHTML = `<article class="points-transaction empty">No South Diamond Slots spins yet today.</article>`;
      return;
    }
    spins.slice(0, 80).forEach((spin) => {
      const item = document.createElement("article");
      item.className = `points-transaction ${Number(spin.win) > 0 ? "add" : "redeem"}`;
      item.innerHTML = `<div><strong></strong><span></span></div><b></b><small></small>`;
      item.querySelector("strong").textContent = spin.username || "Player";
      item.querySelector("span").textContent = `${spin.gameName || "South Diamond Slots"} | Bet ${formatPoints(spin.bet)}`;
      item.querySelector("b").textContent = Number(spin.win) > 0 ? `+${formatPoints(spin.win)}` : "0";
      item.querySelector("small").textContent = spin.createdAt ? new Date(spin.createdAt).toLocaleString() : "";
      slotsSpinsList.appendChild(item);
    });
  }
}

function renderActivity(activity = []) {
  if (!adminActivityList) return;
  const visibleActivity = filterItems(activity, adminSearchState.activity, (item) => [
    item.type,
    item.text,
    item.createdAt,
    item.details?.username,
    item.details?.email,
  ]);
  adminActivityList.innerHTML = "";
  if (!visibleActivity.length) {
    adminActivityList.innerHTML = `<article class="activity-item empty">No matching activity yet.</article>`;
    return;
  }
  visibleActivity.slice(0, 120).forEach((item) => {
    const row = document.createElement("article");
    row.className = "activity-item";
    row.innerHTML = `<strong></strong><span></span><small></small>`;
    row.querySelector("strong").textContent = item.text || item.type || "Admin activity";
    row.querySelector("span").textContent = item.type || "activity";
    row.querySelector("small").textContent = item.createdAt ? new Date(item.createdAt).toLocaleString() : "";
    adminActivityList.appendChild(row);
  });
}

function queueAdminLiveRefresh() {
  if (!adminMain) return;
  clearTimeout(adminLiveRefreshTimer);
  adminLiveRefreshTimer = setTimeout(() => {
    const isWorking =
      document.activeElement?.matches("input, textarea, select, button") ||
      document.activeElement?.closest("form") ||
      playerModal?.classList.contains("is-open");
    if (!document.hidden && !isWorking) renderAdmin({ forceLists: true });
  }, 250);
}

function startAdminLiveUpdates() {
  if (!adminMain || adminLiveStream || typeof EventSource === "undefined") return;
  try {
    adminLiveStream = new EventSource("/api/player/slots/live");
    adminLiveStream.addEventListener("message", (event) => {
      let payload = {};
      try { payload = JSON.parse(event.data || "{}"); } catch (error) {}
      if (payload.type && payload.type !== "connected") queueAdminLiveRefresh();
    });
    adminLiveStream.addEventListener("error", () => {
      try { adminLiveStream && adminLiveStream.close(); } catch (error) {}
      adminLiveStream = null;
      setTimeout(startAdminLiveUpdates, 3000);
    });
  } catch (error) {
    adminLiveStream = null;
  }
}

function renderDashboard(stats = {}) {
  if (!dashboardStats) return;
  dashboardStats.querySelectorAll("[data-stat]").forEach((item) => {
    const key = item.dataset.stat;
    item.textContent = stats[key] ?? 0;
  });
}

function latestChatTime(chat) {
  const lastMessage = chat.messages?.[chat.messages.length - 1];
  return lastMessage?.createdAt ? new Date(lastMessage.createdAt).getTime() : 0;
}

async function renderAdmin(options = {}) {
  if (!adminInbox || !adminMessages) return;
  if (!canUseApi) {
    const message = "Open the admin portal through http://localhost:3000/admin9493 so it can load saved players and chats.";
    if (adminUsers) adminUsers.innerHTML = `<div class="admin-player-empty">${message}</div>`;
    adminMessages.innerHTML = `<article class="message player"><span>Admin portal</span><p>${message}</p></article>`;
    return;
  }
  if (adminRenderInFlight) {
    adminRenderQueued = true;
    return;
  }

  adminRenderInFlight = true;
  try {
  const safeAdminApi = (path, fallback) => api(path).catch((error) => ({ ...fallback, error: error.message || "Could not load data." }));
  const [chatData, userData, dashboardData, pointsData, activityData, spinData, slotsData] = await Promise.all([
    safeAdminApi("/api/chats", { chats: [] }),
    safeAdminApi("/api/admin/users", { users: [] }),
    safeAdminApi("/api/admin/dashboard", { stats: {} }),
    safeAdminApi("/api/admin/points", { transactions: [] }),
    safeAdminApi("/api/admin/activity", { activity: [] }),
    safeAdminApi("/api/admin/spin-wheel", { settings: { limits: {} }, counts: {}, awards: [] }),
    safeAdminApi("/api/admin/slots-settings", { settings: {}, payout: {}, spins: [] }),
  ]);
  const loadError = userData.error || dashboardData.error || chatData.error;
  if (loadError) {
    const message = loadError === "Operator login is required."
      ? "Your admin login expired. Please log in again to load players and chats."
      : loadError;
    if (adminUsers) adminUsers.innerHTML = `<div class="admin-player-empty">${message}</div>`;
    adminMessages.innerHTML = `<article class="message player"><span>Admin portal</span><p>${message}</p></article>`;
    if (adminUserCount) adminUserCount.textContent = "Data unavailable";
    return;
  }
  const chats = (chatData.chats || [])
    .filter((chat) => !["demo-maya", "demo-andre"].includes(chat.id))
    .sort((a, b) => latestChatTime(b) - latestChatTime(a));
  const users = userData.users || [];
  adminUsersCache = users;
  const isPlayerFormActive = Boolean(
      document.activeElement?.closest("[data-reset-user]") ||
      document.activeElement?.closest("[data-points-user]") ||
      document.activeElement?.closest("[data-note-user]") ||
      document.activeElement?.closest("[data-broadcast-form]") ||
      document.activeElement?.closest("[data-spin-settings-form]") ||
      document.activeElement?.closest("[data-slots-settings-form]") ||
      document.activeElement?.closest("[data-player-modal]")
  );
  if (!isPlayerFormActive || options.forceLists) {
    renderUsers(users);
  } else if (adminUserCount) {
    adminUserCount.textContent = `${users.length} player${users.length === 1 ? "" : "s"}`;
  }
  renderVipUsers(users);
  renderDashboard(dashboardData.stats || {});
  renderPointTransactions(pointsData.transactions || []);
  renderActivity(activityData.activity || []);
  renderBroadcastUsers(users);
  renderSpinAdmin(spinData);
  renderSlotsAdmin(slotsData);

  const unreadTotal = chats.reduce((total, chat) => total + (Number(chat.unreadForAdmin) || 0), 0);
  adminUnreadBadges.forEach((badge) => {
    badge.textContent = unreadTotal;
    badge.classList.toggle("is-hidden", unreadTotal <= 0);
  });
  document.title = unreadTotal > 0 ? `(${unreadTotal}) South Diamond Admin` : "South Diamond Admin";
  if (adminHasRenderedOnce && unreadTotal > lastAdminUnreadTotal) playAdminAlert();
  lastAdminUnreadTotal = unreadTotal;
  adminHasRenderedOnce = true;

  if (!activeAdminThread && chats.length) activeAdminThread = chats[0].id;
  if (activeAdminThread && !chats.some((chat) => chat.id === activeAdminThread)) activeAdminThread = chats[0]?.id || null;

  adminInbox.innerHTML = "";
  adminCount.textContent = `${chats.length} chat${chats.length === 1 ? "" : "s"}`;

  chats.forEach((chat) => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    const chatUser = users.find((user) => user.id === chat.userId || user.chatId === chat.id);
    const presence = playerPresence(chatUser || { createdAt: 0 });
    const button = document.createElement("button");
    button.className = `inbox-player${chat.id === activeAdminThread ? " is-active" : ""}`;
    button.classList.toggle("is-vip-player", Boolean(chatUser?.isVip));
    button.type = "button";
    button.dataset.threadId = chat.id;
    button.innerHTML = `<span class="inbox-player-name"><span class="inbox-avatar"></span><i class="player-presence-dot"></i><b></b><em class="inbox-unread is-hidden"></em></span><small></small>`;
    setPresenceDot(button.querySelector(".player-presence-dot"), presence);
    button.querySelector("b").textContent = chatUser?.ownerName ? `${chat.name} (${chatUser.ownerName})` : chat.name;
    button.querySelector(".inbox-avatar").textContent = String(chat.name || "P").trim().slice(0, 1).toUpperCase();
    const unread = Number(chat.unreadForAdmin) || 0;
    const unreadBadge = button.querySelector(".inbox-unread");
    unreadBadge.textContent = unread;
    unreadBadge.classList.toggle("is-hidden", unread <= 0);
    button.querySelector("small").textContent = lastMessage ? lastMessage.text : "No messages yet";
    adminInbox.appendChild(button);
  });

  const selected = chats.find((chat) => chat.id === activeAdminThread);
  if (!selected) {
    adminName.textContent = "No player selected";
    adminName.classList.remove("is-vip-name");
    setPresenceDot(adminChatStatus, { className: "offline", label: "Offline" });
    adminMessages.dataset.messageScope = "empty";
    adminMessages.innerHTML = `<article class="message player"><span>Inbox</span><p>No messages yet.</p></article>`;
    return;
  }

  const selectedUser = users.find((user) => user.id === selected.userId || user.chatId === selected.id);
  setPresenceDot(adminChatStatus, playerPresence(selectedUser || { createdAt: 0 }));
  adminName.textContent = selectedUser?.ownerName ? `${selected.name} (${selectedUser.ownerName})` : selected.name;
  adminName.classList.toggle("is-vip-name", Boolean(selectedUser?.isVip));
  adminMessages.dataset.messageScope = selected.id;
  renderMessages(adminMessages, selected.messages);
  } finally {
    adminRenderInFlight = false;
    if (adminRenderQueued) {
      adminRenderQueued = false;
      renderAdmin();
    }
  }
}

async function openAdminChatForUser(userId) {
  const data = await api("/api/admin/user-chat", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  activeAdminThread = data.chat.id;
  adminMessagesPanel?.classList.remove("is-hidden");
  adminPanels.forEach((panel) => panel.classList.remove("is-active"));
  adminPanelButtons.forEach((item) => item.classList.remove("is-active"));
  adminChatJumps.forEach((item) => item.classList.add("is-active"));
  if (adminTitle) adminTitle.textContent = "Messages";
  await renderAdmin();
  document.querySelector(".admin-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  adminInput?.focus();
}

async function handleAdminPlayerListClick(event) {
  const vipButton = event.target.closest("[data-toggle-vip]");
  if (vipButton) {
    const user = getAdminUser(vipButton.dataset.userId);
    if (!user) return;
    vipButton.disabled = true;
    try {
      await api("/api/admin/player-vip", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, isVip: !user.isVip }),
      });
      await renderAdmin();
    } catch (error) {
      alert(error.message);
    } finally {
      vipButton.disabled = false;
    }
    return;
  }

  const viewButton = event.target.closest("[data-view-user]");
  if (viewButton) {
    openAdminPlayerModal(viewButton.dataset.userId);
    return;
  }

  const quickAddButton = event.target.closest("[data-quick-add-points]");
  if (quickAddButton) {
    openAdminPlayerModal(quickAddButton.dataset.userId, "points");
    return;
  }

  const quickResetButton = event.target.closest("[data-quick-reset-password]");
  if (quickResetButton) {
    openAdminPlayerModal(quickResetButton.dataset.userId, "password");
    return;
  }

  const button = event.target.closest("[data-open-user-chat]");
  if (!button) return;
  button.disabled = true;
  try {
    await openAdminChatForUser(button.dataset.userId);
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
  }
}

if (adminInbox && adminForm) {
  setupAdminIdleLogout();
  requireAdminSession().then(() => {
    renderAdmin();
    startAdminLiveUpdates();
  });

  if (adminUsers) {
    adminUsers.addEventListener("click", handleAdminPlayerListClick);
    adminVipUsers?.addEventListener("click", handleAdminPlayerListClick);

    adminUsers.addEventListener("submit", async (event) => {
      const form = event.target.closest("[data-reset-user]");
      if (!form) return;
      event.preventDefault();
      const button = form.querySelector("button");
      const password = form.password.value.trim();
      if (!password) return;
      button.disabled = true;
      button.textContent = "Resetting";
      try {
        await api("/api/admin/reset-player-password", {
          method: "POST",
          body: JSON.stringify({ userId: form.dataset.userId, password }),
        });
        form.reset();
        button.textContent = "Done";
        setTimeout(() => {
          button.disabled = false;
          button.textContent = "Reset";
        }, 1200);
      } catch (error) {
        button.disabled = false;
        button.textContent = "Reset";
        alert(error.message);
      }
    });

    adminUsers.addEventListener("submit", async (event) => {
      const form = event.target.closest("[data-note-user]");
      if (!form) return;
      event.preventDefault();
      const button = form.querySelector("button");
      const buttonText = button.textContent;
      button.disabled = true;
      button.textContent = "Saving";
      try {
        await api("/api/admin/user-note", {
          method: "POST",
          body: JSON.stringify({ userId: form.dataset.userId, note: form.note.value }),
        });
        button.textContent = "Saved";
        await renderAdmin();
      } catch (error) {
        alert(error.message);
      } finally {
        setTimeout(() => {
          button.disabled = false;
          button.textContent = buttonText;
        }, 900);
      }
    });

  }

  [pointsAddList, pointsRedeemList].forEach((list) => {
    if (!list) return;
    list.addEventListener("submit", async (event) => {
      const form = event.target.closest("[data-points-user]");
      if (!form) return;
      event.preventDefault();
      const action = form.dataset.pointsAction;
      const submitter = event.submitter;
      const buttonText = submitter.textContent;
      submitter.disabled = true;
      submitter.textContent = action === "add" ? "Adding" : "Redeeming";
      try {
        const payload = await api("/api/admin/points", {
          method: "POST",
          body: JSON.stringify({
            userId: form.dataset.userId,
            action,
            points: Number(form.points.value),
            note: form.note.value.trim(),
          }),
        });
        form.reset();
        if (window.__sdUpdateSubAdminWallet && payload.subAdminWallet != null) {
          window.__sdUpdateSubAdminWallet(payload.subAdminWallet);
        }
        submitter.blur();
        await renderAdmin({ forceLists: true });
      } catch (error) {
        alert(error.message);
      } finally {
        submitter.disabled = false;
        submitter.textContent = buttonText;
      }
    });
  });

  broadcastUsers?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-broadcast-user]");
    if (!checkbox) return;
    if (checkbox.checked) adminBroadcastExcludedUserIds.delete(checkbox.dataset.userId);
    else adminBroadcastExcludedUserIds.add(checkbox.dataset.userId);
    checkbox.closest(".broadcast-player-card")?.classList.toggle("is-selected", checkbox.checked);
    updateBroadcastCount();
  });

  broadcastSelectAll?.addEventListener("change", () => {
    const visibleUsers = getBroadcastVisibleUsers(adminUsersCache);
    visibleUsers.forEach((user) => {
      if (broadcastSelectAll.checked) adminBroadcastExcludedUserIds.delete(user.id);
      else adminBroadcastExcludedUserIds.add(user.id);
    });
    renderBroadcastUsers(adminUsersCache);
  });

  broadcastForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = broadcastForm.message.value.trim();
    const userIds = adminUsersCache.filter((user) => !adminBroadcastExcludedUserIds.has(user.id)).map((user) => user.id);
    if (!message) return;
    if (!userIds.length) {
      if (broadcastStatus) broadcastStatus.textContent = "Choose at least one player.";
      return;
    }
    const button = broadcastForm.querySelector("button[type='submit']");
    const buttonText = button.textContent;
    button.disabled = true;
    button.textContent = "Sending";
    if (broadcastStatus) broadcastStatus.textContent = "";
    try {
      const data = await api("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ message, userIds }),
      });
      broadcastForm.reset();
      adminBroadcastExcludedUserIds.clear();
      if (broadcastStatus) broadcastStatus.textContent = `Broadcast sent to ${data.sent} player${data.sent === 1 ? "" : "s"}.`;
      await renderAdmin();
    } catch (error) {
      if (broadcastStatus) broadcastStatus.textContent = error.message;
      else alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = buttonText;
    }
  });

  spinSettingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = spinSettingsForm.querySelector("button[type='submit']");
    const buttonText = button.textContent;
    const limits = {};
    ["10", "5", "3", "1"].forEach((points) => {
      limits[points] = Number(spinSettingsForm.elements[points].value);
    });
    button.disabled = true;
    button.textContent = "Saving";
    if (spinSettingsStatus) spinSettingsStatus.textContent = "";
    try {
      const data = await api("/api/admin/spin-wheel-settings", {
        method: "POST",
        body: JSON.stringify({ limits }),
      });
      renderSpinAdmin(data);
      if (spinSettingsStatus) spinSettingsStatus.textContent = "Spin limits saved.";
    } catch (error) {
      if (spinSettingsStatus) spinSettingsStatus.textContent = error.message;
      else alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = buttonText;
    }
  });

  slotsSettingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = slotsSettingsForm.querySelector("button[type='submit']");
    const buttonText = button.textContent;
    const dailyPayoutLimit = Number(slotsSettingsForm.elements.dailyPayoutLimit.value);
    const playerDailyPayoutLimit = Number(slotsSettingsForm.elements.playerDailyPayoutLimit.value);
    button.disabled = true;
    button.textContent = "Saving";
    if (slotsSettingsStatus) slotsSettingsStatus.textContent = "";
    try {
      const data = await api("/api/admin/slots-settings", {
        method: "POST",
        body: JSON.stringify({ dailyPayoutLimit, playerDailyPayoutLimit }),
      });
      renderSlotsAdmin(data);
      if (slotsSettingsStatus) slotsSettingsStatus.textContent = "Slot payout limit saved.";
    } catch (error) {
      if (slotsSettingsStatus) slotsSettingsStatus.textContent = error.message;
      else alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = buttonText;
    }
  });

  adminInbox.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-thread-id]");
    if (!button) return;
    activeAdminThread = button.dataset.threadId;
    await api("/api/admin/chats/read", {
      method: "POST",
      body: JSON.stringify({ threadId: activeAdminThread }),
    }).catch(() => {});
    renderAdmin();
    adminInput.focus();
  });

  adminMessages.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-payment-status]");
    if (!button || !activeAdminThread) return;
    button.disabled = true;
    try {
      await api("/api/admin/payment-status", {
        method: "POST",
        body: JSON.stringify({
          threadId: activeAdminThread,
          messageId: button.dataset.messageId,
          status: button.dataset.paymentStatus,
        }),
      });
      await renderAdmin();
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
    }
  });

  adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = adminInput.value.trim();
    if (!text || !activeAdminThread) return;

    await api("/api/chats/operator-message", {
      method: "POST",
      body: JSON.stringify({ threadId: activeAdminThread, text }),
    });
    adminInput.value = "";
    adminMessages.dataset.forceScroll = "true";
    renderAdmin();
    adminInput.focus();
  });

  deleteChat.addEventListener("click", async () => {
    if (!activeAdminThread) return;
    const confirmed = confirm("Delete this selected player's chat history? This only deletes the chat, not the registered player account.");
    if (!confirmed) return;

    await api("/api/chats", {
      method: "DELETE",
      body: JSON.stringify({ threadId: activeAdminThread }),
    });
    activeAdminThread = null;
    renderAdmin();
  });

  setInterval(() => {
    const isWorking =
      document.activeElement?.matches("input, textarea, select, button") ||
      document.activeElement?.closest("form") ||
      playerModal?.classList.contains("is-open");
    if (!document.hidden && !isWorking) renderAdmin();
  }, 30000);
}

closePlayerModal?.addEventListener("click", closeAdminPlayerModal);
playerModal?.addEventListener("click", (event) => {
  if (event.target === playerModal) closeAdminPlayerModal();
});

modalOpenChat?.addEventListener("click", async () => {
  if (!activeModalUserId) return;
  modalOpenChat.disabled = true;
  try {
    closeAdminPlayerModal();
    await openAdminChatForUser(activeModalUserId);
  } catch (error) {
    alert(error.message);
  } finally {
    modalOpenChat.disabled = false;
  }
});

modalPointsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitter = event.submitter || modalPointsForm.querySelector("[value='add']");
  const action = submitter?.value || "add";
  const buttonText = submitter?.textContent || "Save";
  if (!activeModalUserId) return;
  if (submitter) {
    submitter.disabled = true;
    submitter.textContent = action === "add" ? "Adding" : "Redeeming";
  }
  try {
    const payload = await api("/api/admin/points", {
      method: "POST",
      body: JSON.stringify({
        userId: activeModalUserId,
        action,
        points: Number(modalPointsForm.points.value),
        note: modalPointsForm.note.value.trim(),
      }),
    });
    modalPointsForm.reset();
    if (window.__sdUpdateSubAdminWallet && payload.subAdminWallet != null) {
      window.__sdUpdateSubAdminWallet(payload.subAdminWallet);
    }
    submitter?.blur();
    await renderAdmin({ forceLists: true });
    openAdminPlayerModal(activeModalUserId);
  } catch (error) {
    alert(error.message);
  } finally {
    if (submitter) {
      submitter.disabled = false;
      submitter.textContent = buttonText;
    }
  }
});

modalResetForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = modalResetForm.querySelector("button");
  const buttonText = button.textContent;
  if (!activeModalUserId) return;
  button.disabled = true;
  button.textContent = "Resetting";
  try {
    await api("/api/admin/reset-player-password", {
      method: "POST",
      body: JSON.stringify({ userId: activeModalUserId, password: modalResetForm.password.value.trim() }),
    });
    modalResetForm.reset();
    button.textContent = "Done";
  } catch (error) {
    alert(error.message);
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = buttonText;
    }, 900);
  }
});

modalNoteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = modalNoteForm.querySelector("button");
  const buttonText = button.textContent;
  if (!activeModalUserId) return;
  button.disabled = true;
  button.textContent = "Saving";
  try {
    await api("/api/admin/user-note", {
      method: "POST",
      body: JSON.stringify({ userId: activeModalUserId, note: modalNoteForm.note.value }),
    });
    await renderAdmin();
    openAdminPlayerModal(activeModalUserId);
    button.textContent = "Saved";
  } catch (error) {
    alert(error.message);
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = buttonText;
    }, 900);
  }
});

if (loginForm) {
  const adminResetToken = new URLSearchParams(location.search).get("reset");
  if (adminResetToken && adminResetPasswordForm) {
    loginForm.classList.add("is-hidden");
    adminForgotButton?.classList.add("is-hidden");
    adminResetPasswordForm.classList.remove("is-hidden");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    const submitButton = loginSubmit || loginForm.querySelector("button");
    submitButton.disabled = true;
    submitButton.textContent = pendingAdminLoginId ? "Verifying..." : "Sending Code...";

    try {
      if (!pendingAdminLoginId) {
        const data = await api("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({
            username: loginUsername.value.trim(),
            password: loginPassword.value,
          }),
        });
        if (data.ok && data.redirect) {
          location.href = data.redirect;
          return;
        }
        pendingAdminLoginId = data.pendingLoginId;
        loginCodePanel?.classList.remove("is-hidden");
        loginUsername.disabled = true;
        loginPassword.disabled = true;
        loginCode?.focus();
        loginError.textContent = data.message || "Security code sent to your admin email.";
        loginError.style.color = "#52ef9f";
        submitButton.disabled = false;
        submitButton.textContent = "Verify Code";
        return;
      }

      await api("/api/admin/verify-login", {
        method: "POST",
        body: JSON.stringify({
          pendingLoginId: pendingAdminLoginId,
          code: loginCode.value,
        }),
      });
      location.href = "/admin9493";
    } catch (error) {
      loginError.textContent = error.message;
      loginError.style.color = "";
      loginPassword.value = "";
      if (pendingAdminLoginId) {
        loginCode.value = "";
        loginCode.focus();
      } else {
        loginPassword.focus();
      }
      submitButton.disabled = false;
      submitButton.textContent = pendingAdminLoginId ? "Verify Code" : "Send Code";
    }
  });
}

adminForgotButton?.addEventListener("click", async () => {
  adminForgotStatus.textContent = "";
  adminForgotButton.disabled = true;
  const oldText = adminForgotButton.textContent;
  adminForgotButton.textContent = "Sending reset link...";
  try {
    const data = await api("/api/admin/forgot-password", {
      method: "POST",
      body: JSON.stringify({ username: loginUsername?.value.trim() || "" }),
    });
    adminForgotStatus.textContent = data.message || "Password reset link sent to your admin email.";
    adminForgotStatus.style.color = "#52ef9f";
  } catch (error) {
    adminForgotStatus.textContent = error.message;
    adminForgotStatus.style.color = "";
  } finally {
    adminForgotButton.disabled = false;
    adminForgotButton.textContent = oldText;
  }
});

adminResetPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const adminResetToken = new URLSearchParams(location.search).get("reset");
  const button = adminResetPasswordForm.querySelector("button");
  const oldText = button.textContent;
  adminResetStatus.textContent = "";
  button.disabled = true;
  button.textContent = "Resetting...";
  try {
    const data = await api("/api/admin/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: adminResetToken, password: adminResetPasswordForm.password.value }),
    });
    adminResetPasswordForm.reset();
    adminResetStatus.textContent = data.message || "Password reset. You can now log in.";
    adminResetStatus.style.color = "#52ef9f";
    setTimeout(() => {
      location.href = "/login9493";
    }, 1200);
  } catch (error) {
    adminResetStatus.textContent = error.message;
    adminResetStatus.style.color = "";
    button.disabled = false;
    button.textContent = oldText;
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging Out...";
    await logoutAdmin();
  });
}

// === Slot game enhancements: wire up new controls ===
if (slotMaxBetBtn) slotMaxBetBtn.addEventListener("click", () => { if (!slotIsSpinning) setMaxBet(); });
if (slotAutoBtn) slotAutoBtn.addEventListener("click", () => {
  if (slotAutoSpinning) stopSlotAutoSpin();
  else startSlotAutoSpin();
});

// =========================================================================
// Admin panel role-scoping + sub-admin/player management (Chunk F).
// Runs on admin.html for either main admin or logged-in sub-admin.
// =========================================================================
(function wireAdminRoleScope() {
  if (!document.querySelector("[data-admin-inbox]")) return; // only on admin.html
  let currentOperator = null;

  function hideAdminOnly(operator = currentOperator) {
    document.querySelectorAll("[data-admin-only]").forEach((el) => {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
      // If the hidden element is the currently active button/panel, deactivate it
      // so the layout doesn't try to render an empty overview.
      el.classList.remove("is-active");
    });
    // Activate the All Players panel as the default for sub-admins (they always
    // have access to it; the server filters it to their own players).
    const defaultButton = document.querySelector('[data-admin-panel-button="players"]:not([data-admin-only])');
    const defaultPanel = document.querySelector('[data-admin-panel="players"]:not([data-admin-only])');
    if (defaultButton) defaultButton.classList.add("is-active");
    if (defaultPanel) defaultPanel.classList.add("is-active");
    // Update the page title to match.
    const adminTitle = document.querySelector("[data-admin-title]");
    if (adminTitle) adminTitle.textContent = "Your players";
    // Add the logged-in sub-admin name at the top.
    const topbar = document.querySelector(".admin-topbar-actions");
    if (topbar && !document.querySelector("[data-subadmin-badge]")) {
      const badge = document.createElement("span");
      badge.setAttribute("data-subadmin-badge", "");
      badge.style.cssText = "padding:0.3rem 0.7rem;background:rgba(123,228,176,0.15);color:#7be4b0;border:1px solid rgba(123,228,176,0.4);border-radius:4px;font-size:0.8rem;font-weight:600;";
      badge.textContent = operator?.username || operator?.id || "Sub-admin";
      topbar.prepend(badge);
    }
  }

  function updateSubAdminWallet(wallet) {
    const amount = Number(wallet) || 0;
    const walletText = `Available points: ${amount}`;
    const walletNote = document.querySelector("[data-cp-wallet-note]");
    if (walletNote) walletNote.textContent = `${walletText}. Starting points are deducted from this.`;
    const existingBadge = document.querySelector("[data-subadmin-wallet-badge]");
    if (existingBadge) {
      existingBadge.textContent = walletText;
      return;
    }
    const topbar = document.querySelector(".admin-topbar-actions");
    if (!topbar) return;
    const badge = document.createElement("span");
    badge.setAttribute("data-subadmin-wallet-badge", "");
    badge.style.cssText = "padding:0.3rem 0.7rem;background:rgba(255,215,107,0.15);color:#ffd76b;border:1px solid rgba(255,215,107,0.45);border-radius:4px;font-size:0.8rem;font-weight:700;";
    badge.textContent = walletText;
    topbar.prepend(badge);
  }
  window.__sdUpdateSubAdminWallet = updateSubAdminWallet;

  async function loadOperator() {
    try {
      const response = await fetch("/api/admin/sub-admin/me", { credentials: "same-origin" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return null;
      currentOperator = payload;
      window.__sdOperator = payload;
      // If sub-admin, hide admin-only UI elements.
      if (payload.role === "sub_admin") {
        hideAdminOnly(payload);
      }
      // Show wallet badge somewhere visible.
      const walletNote = document.querySelector("[data-cp-wallet-note]");
      if (walletNote) {
        if (payload.role === "sub_admin") {
          updateSubAdminWallet(payload.wallet);
        } else {
          walletNote.textContent = "Admin mode — points are minted, no wallet limit.";
        }
      }
      const ctxNote = document.querySelector("[data-create-player-context]");
      if (ctxNote) {
        ctxNote.textContent =
          payload.role === "sub_admin"
            ? "Players you create will belong to you."
            : "Players you create will be assigned to the main admin.";
      }
      return payload;
    } catch {
      return null;
    }
  }

  async function refreshSubAdminList() {
    if (!currentOperator || currentOperator.role !== "admin") return;
    const tbody = document.querySelector("[data-subadmin-list]");
    if (!tbody) return;
    try {
      const response = await fetch("/api/admin/sub-admins", { credentials: "same-origin" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:0.6rem 0.4rem;color:#ffb4b4;">${payload.error || "Could not load sub-admins."}</td></tr>`;
        return;
      }
      const rows = (payload.subAdmins || []).map((sa) => {
        const status = sa.disabled ? '<span style="color:#ffb4b4;">Disabled</span>' : '<span style="color:#7be4b0;">Active</span>';
        return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:0.5rem 0.4rem;"><strong>${escapeHtml(sa.username)}</strong></td>
          <td style="padding:0.5rem 0.4rem;text-align:right;">${sa.wallet}</td>
          <td style="padding:0.5rem 0.4rem;text-align:right;">${sa.playerCount}</td>
          <td style="padding:0.5rem 0.4rem;">${status}</td>
          <td style="padding:0.5rem 0.4rem;display:flex;gap:0.3rem;flex-wrap:wrap;">
            <button class="game-link" type="button" data-sa-load="${sa.id}">+Pts</button>
            <button class="game-link" type="button" data-sa-disable="${sa.id}" data-sa-disabled="${sa.disabled ? "1" : "0"}">${sa.disabled ? "Enable" : "Disable"}</button>
            <button class="game-link" type="button" data-sa-reset="${sa.id}">Reset PW</button>
          </td>
        </tr>`;
      });
      tbody.innerHTML = rows.join("") || '<tr><td colspan="5" style="padding:0.6rem 0.4rem;opacity:0.6;">No sub-admins yet.</td></tr>';
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:0.6rem 0.4rem;color:#ffb4b4;">Could not load sub-admins.</td></tr>`;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  // Wire create-sub-admin form.
  const saForm = document.querySelector("[data-create-subadmin-form]");
  if (saForm) {
    saForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.querySelector("[data-sa-create-status]");
      if (status) status.textContent = "";
      const username = document.querySelector("[data-sa-username]")?.value.trim();
      const password = document.querySelector("[data-sa-password]")?.value;
      const startingWallet = Number(document.querySelector("[data-sa-wallet]")?.value || 0);
      try {
        const response = await fetch("/api/admin/sub-admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username, password, startingWallet }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (status) status.textContent = payload.error || "Could not create sub-admin.";
          return;
        }
        if (status) status.style.color = "#7be4b0";
        if (status) status.textContent = `Sub-admin "${payload.subAdmin.username}" created.`;
        saForm.reset();
        refreshSubAdminList();
      } catch {
        if (status) status.textContent = "Could not reach the server.";
      }
    });
  }

  // Delegate clicks on sub-admin actions (load points, disable, reset PW).
  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const loadId = target.getAttribute("data-sa-load");
    const disableId = target.getAttribute("data-sa-disable");
    const resetId = target.getAttribute("data-sa-reset");
    if (loadId) {
      const amount = prompt("How many points to add to this sub-admin's wallet?");
      if (!amount) return;
      const points = Number(amount);
      if (!Number.isFinite(points) || points <= 0) return alert("Enter a positive number.");
      const response = await fetch("/api/admin/sub-admins/load-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subAdminId: loadId, points }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return alert(payload.error || "Could not load points.");
      refreshSubAdminList();
    } else if (disableId) {
      const currentlyDisabled = target.getAttribute("data-sa-disabled") === "1";
      const response = await fetch("/api/admin/sub-admins/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subAdminId: disableId, disabled: !currentlyDisabled }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return alert(payload.error || "Could not change status.");
      refreshSubAdminList();
    } else if (resetId) {
      const newPassword = prompt("New password (min 6 characters):");
      if (!newPassword) return;
      if (newPassword.length < 6) return alert("Password must be at least 6 characters.");
      const response = await fetch("/api/admin/sub-admins/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subAdminId: resetId, password: newPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return alert(payload.error || "Could not reset password.");
      alert("Password reset.");
    }
  });

  // Wire create-player form.
  const cpForm = document.querySelector("[data-create-player-form]");
  if (cpForm) {
    cpForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.querySelector("[data-cp-status]");
      if (status) { status.style.color = ""; status.textContent = ""; }
      const username = document.querySelector("[data-cp-username]")?.value.trim();
      const password = document.querySelector("[data-cp-password]")?.value;
      const email = document.querySelector("[data-cp-email]")?.value.trim();
      const startingPoints = Number(document.querySelector("[data-cp-points]")?.value || 0);
      try {
        const response = await fetch("/api/admin/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username, password, email, startingPoints }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (status) status.textContent = payload.error || "Could not create player.";
          return;
        }
        if (status) status.style.color = "#7be4b0";
        if (status) status.textContent = `Player "${payload.user.username}" created with ${payload.user.points} points.`;
        cpForm.reset();
        // Update wallet note if sub-admin.
        if (currentOperator?.role === "sub_admin" && payload.subAdminWallet != null) {
          currentOperator.wallet = payload.subAdminWallet;
          updateSubAdminWallet(payload.subAdminWallet);
        }
        await renderAdmin();
        document.querySelector('[data-admin-panel-button="players"]')?.click();
      } catch {
        if (status) status.textContent = "Could not reach the server.";
      }
    });
  }

  // Initial load.
  (async function init() {
    const op = await loadOperator();
    if (op?.role === "admin") refreshSubAdminList();
  })();
})();

// =========================================================================
// Sub-admin login form handler (Chunk C).
// Only runs when sub-admin-login.html is the current page (form is present).
// =========================================================================
(function wireSubAdminLogin() {
  const form = document.querySelector("[data-sub-admin-login-form]");
  if (!form) return;
  const usernameInput = form.querySelector("[data-sub-admin-username]");
  const passwordInput = form.querySelector("[data-sub-admin-password]");
  const submitButton = form.querySelector("[data-sub-admin-submit]");
  const errorEl = form.querySelector("[data-sub-admin-error]");

  function showError(text) {
    if (errorEl) errorEl.textContent = text || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");
    const username = (usernameInput?.value || "").trim();
    const password = passwordInput?.value || "";
    if (!username || !password) {
      showError("Enter your username and password.");
      return;
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";
    }
    showError("Checking login...");
    try {
      const response = await fetch("/api/admin/sub-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        showError(payload.error || "Could not sign in.");
        return;
      }
      showError("Login accepted. Opening dashboard...");
      // Success — go to the sub-admin URL. The server will serve admin.html
      // there for logged-in sub-admins; the front-end will scope features by role
      // once Chunk F lands.
      window.location.assign("/admin");
    } catch (error) {
      showError("Could not reach the server. Check your connection and try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Log In";
      }
    }
  });
})();
