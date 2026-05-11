const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const canUseApi = location.protocol === "http:" || location.protocol === "https:";
const isAdminPage = Boolean(document.querySelector("[data-admin-inbox]"));
const winnerList = document.querySelector("[data-winner-list]");
const winnerHighlight = document.querySelector("[data-winner-highlight]");

if ("serviceWorker" in navigator && canUseApi) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
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
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
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
      message.closest(".chat-messages")?.scrollTo({ top: message.closest(".chat-messages").scrollHeight });
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

function renderMessages(container, messages) {
  const scope = container.dataset.messageScope || "";
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
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return;
  }
  container.dataset.messagesKey = nextKey;
  container.innerHTML = "";
  messages.forEach((item) => container.appendChild(createMessage(item)));
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

const playerAuth = document.querySelector("[data-player-auth]");
const playerAppSections = document.querySelectorAll("[data-player-app]");
const playerOnlyItems = document.querySelectorAll("[data-player-only]");
const guestOnlyItems = document.querySelectorAll("[data-guest-only]");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll(".auth-panel");
const playerSignup = document.querySelector("[data-player-signup]");
const signupDateOfBirth = document.querySelector("#signup-date-of-birth");
const playerLogin = document.querySelector("[data-player-login]");
const playerReset = document.querySelector("[data-player-reset]");
const playerAuthMessage = document.querySelector("[data-player-auth-message]");
const playerNameDisplay = document.querySelector("[data-player-name-display]");
const playerPointsDisplay = document.querySelectorAll("[data-player-points], [data-player-points-display]");
const playerLogout = document.querySelector("[data-player-logout]");
const playerForm = document.querySelector("[data-player-form]");
const playerMessages = document.querySelector("[data-player-messages]");
const playerInput = document.querySelector("[data-player-input]");
const playerAvatarNav = document.querySelector("[data-player-avatar-nav]");
const profileSection = document.querySelector("[data-profile-panel]");
const profileOpenLinks = document.querySelectorAll("[data-profile-open]");
const profileForm = document.querySelector("[data-profile-form]");
const profilePhone = document.querySelector("#profile-phone");
const profilePassword = document.querySelector("#profile-password");
const profileStatus = document.querySelector("[data-profile-status]");
const profileUsername = document.querySelector("[data-profile-username]");
const profileEmail = document.querySelector("[data-profile-email]");
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
const referralSignupNote = document.querySelector("[data-referral-signup-note]");
const referralLinkInput = document.querySelector("[data-referral-link]");
const copyReferralButton = document.querySelector("[data-copy-referral]");
const referralStatus = document.querySelector("[data-referral-status]");

let currentPlayer = null;
let hasOpenedPlayerChat = false;
const referralCodeFromUrl = (() => {
  try {
    return new URLSearchParams(window.location.search).get("ref") || "";
  } catch {
    return "";
  }
})();
const adminSearchState = {
  players: "",
  transactions: "",
  add: "",
  redeem: "",
  activity: "",
};

let adminPlayerFilter = "all";
let shouldShowWelcome = false;

function setAuthMessage(text, isSuccess = false) {
  if (!playerAuthMessage) return;
  playerAuthMessage.textContent = text;
  playerAuthMessage.style.color = isSuccess ? "#52ef9f" : "";
}

function referralUrlFor(user) {
  if (!user?.referralCode) return "";
  const baseUrl = window.location.protocol === "file:" ? window.location.href.split(/[?#]/)[0] : `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}?ref=${encodeURIComponent(user.referralCode)}`;
}

function showPlayerApp(user) {
  currentPlayer = user;
  document.body.classList.add("is-player-logged-in");
  if (playerAuth) playerAuth.classList.add("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  playerOnlyItems.forEach((item) => {
    if (!item.matches("[data-profile-panel]")) item.classList.remove("is-hidden");
  });
  profileSection?.classList.add("is-hidden");
  guestOnlyItems.forEach((item) => item.classList.add("is-hidden"));
  minimizePlayerChat();
  if (playerNameDisplay) playerNameDisplay.textContent = user.username;
  playerPointsDisplay.forEach((item) => {
    item.textContent = user.points ?? 0;
  });
  renderProfile(user);
  if (shouldShowWelcome) showWelcomeModal(user);
  shouldShowWelcome = false;
}

function showPlayerAuth() {
  currentPlayer = null;
  document.body.classList.remove("is-player-logged-in");
  document.body.classList.remove("player-chat-open");
  if (playerAuth) playerAuth.classList.remove("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  playerOnlyItems.forEach((item) => item.classList.add("is-hidden"));
  profileSection?.classList.add("is-hidden");
  guestOnlyItems.forEach((item) => item.classList.remove("is-hidden"));
  if (playerNameDisplay) playerNameDisplay.textContent = "Guest";
  playerPointsDisplay.forEach((item) => {
    item.textContent = "0";
  });
  hasOpenedPlayerChat = false;
  renderProfile(null);
  if (playerMessages) {
    renderMessages(playerMessages, [
      { author: "operator", text: "Create an account or log in at the top of the page to chat with South Diamond support." },
    ]);
  }
}

function renderProfile(user) {
  if (!profileUsername) return;
  if (!user) {
    profileUsername.textContent = "Player";
    profileEmail.textContent = "";
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
    return;
  }

  profileUsername.textContent = user.username;
  profileEmail.textContent = user.email;
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
    item.querySelector("small").textContent = `${new Date(transaction.createdAt).toLocaleString()} | Balance ${transaction.balanceAfter}`;
    item.querySelector("b").textContent = `${transaction.type === "redeem" ? "-" : "+"}${transaction.points}`;
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
    document.querySelector('[data-auth-tab="signup"]')?.click();
    playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  profileSection?.classList.remove("is-hidden");
  profileSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  refreshPlayerPointTransactions();
}

function minimizePlayerChat() {
  if (!chatWidget || !chatToggle) return;
  chatWidget.classList.add("is-minimized");
  document.body.classList.remove("player-chat-open");
  chatToggle.textContent = "Open Chat";
  chatToggle.setAttribute("aria-expanded", "false");
}

function openPlayerChat() {
  if (!currentPlayer || !chatWidget || !chatToggle) return false;
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
    document.querySelector('[data-auth-tab="signup"]')?.click();
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
  if (welcomePoints) welcomePoints.textContent = user.points ?? 0;
  welcomeModal.classList.remove("is-hidden");
}

function closeWelcomeModal() {
  welcomeModal?.classList.add("is-hidden");
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    authTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    authPanels.forEach((panel) => {
      const isSignup = panel.matches("[data-player-signup]");
      const isLogin = panel.matches("[data-player-login]");
      const isReset = panel.matches("[data-player-reset]");
      panel.classList.toggle(
        "is-active",
        (tab.dataset.authTab === "signup" && isSignup) ||
          (tab.dataset.authTab === "login" && isLogin) ||
          (tab.dataset.authTab === "reset" && isReset)
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

document.querySelectorAll('a[href="#signup"]').forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector('[data-auth-tab="signup"]')?.click();
  });
});

if (referralCodeFromUrl && referralCodeInput) {
  referralCodeInput.value = referralCodeFromUrl.trim();
  document.querySelector('[data-auth-tab="signup"]')?.click();
  if (referralSignupNote) {
    referralSignupNote.textContent = "Referral link applied. Create your account to join South Diamond.";
    referralSignupNote.classList.remove("is-hidden");
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

if (playerSignup) {
  playerSignup.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    if (signupDateOfBirth && !isAdultDate(signupDateOfBirth.value)) {
      alert("Age requirement not met. You must be 18 or older to create a South Diamond account.");
      signupDateOfBirth.focus();
      playerAuth?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      const data = await api("/api/player/signup", {
        method: "POST",
        body: JSON.stringify(formData(playerSignup)),
      });
      playerSignup.reset();
      shouldShowWelcome = false;
      showPlayerApp(data.user);
    } catch (error) {
      setAuthMessage(error.message);
    }
  });
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
    } catch (error) {
      setAuthMessage(error.message);
    }
  });
}

if (playerReset) {
  playerReset.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    try {
      await api("/api/player/reset-password", {
        method: "POST",
        body: JSON.stringify(formData(playerReset)),
      });
      playerReset.reset();
      setAuthMessage("Password reset. You can log in with the new password now.", true);
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
  if (!playerMessages || !currentPlayer) return;
  try {
    const data = await api("/api/player/me");
    currentPlayer = data.user;
    renderProfile(data.user);
    const chats = await api("/api/player/chat");
    renderMessages(playerMessages, chats.chat?.messages || [
      { author: "operator", text: playerChatWelcomeText },
    ]);
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

    try {
      const data = await api("/api/chats/player-message", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      playerInput.value = "";
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
    if (currentPlayer && hasOpenedPlayerChat) refreshPlayerChat();
  }, 2500);
}

if (chatToggle && chatWidget) {
  chatToggle.addEventListener("click", () => {
    const isMinimized = chatWidget.classList.toggle("is-minimized");
    document.body.classList.toggle("player-chat-open", !isMinimized);
    chatToggle.textContent = isMinimized ? "Open Chat" : "Minimize";
    chatToggle.setAttribute("aria-expanded", String(!isMinimized));
    if (!isMinimized && currentPlayer) {
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

const adminInbox = document.querySelector("[data-admin-inbox]");
const adminMessages = document.querySelector("[data-admin-messages]");
const adminName = document.querySelector("[data-admin-name]");
const adminChatStatus = document.querySelector("[data-admin-chat-status]");
const adminCount = document.querySelector("[data-admin-count]");
const adminForm = document.querySelector("[data-admin-form]");
const adminInput = document.querySelector("[data-admin-input]");
const deleteChat = document.querySelector("[data-delete-chat]");
const adminUsers = document.querySelector("[data-admin-users]");
const adminUserCount = document.querySelector("[data-admin-user-count]");
const dashboardStats = document.querySelector("[data-dashboard-stats]");
const pointsTransactions = document.querySelector("[data-points-transactions]");
const pointsCount = document.querySelector("[data-points-count]");
const pointsAddList = document.querySelector("[data-points-add-list]");
const pointsRedeemList = document.querySelector("[data-points-redeem-list]");
const adminActivityList = document.querySelector("[data-admin-activity]");
const adminPanelButtons = document.querySelectorAll("[data-admin-panel-button]");
const adminPanels = document.querySelectorAll("[data-admin-panel]");
const adminChatJumps = document.querySelectorAll("[data-admin-chat-jump]");
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

const adminPanelTitles = {
  overview: "Overview",
  activity: "Live Activity",
  players: "All Players",
  add: "Add Points",
  redeem: "Redeem Points",
  transactions: "Transactions",
  agents: "Agent Links",
};

adminPanelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panelName = button.dataset.adminPanelButton;
    adminChatJumps.forEach((item) => item.classList.remove("is-active"));
    adminPanelButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    adminPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.adminPanel === panelName));
    if (adminTitle) adminTitle.textContent = adminPanelTitles[panelName] || "Admin Portal";
  });
});

adminChatJumps.forEach((jump) => {
  jump.addEventListener("click", () => {
    adminPanelButtons.forEach((item) => item.classList.remove("is-active"));
    adminChatJumps.forEach((item) => item.classList.toggle("is-active", item === jump));
    if (adminTitle) adminTitle.textContent = "Messages";
    document.querySelector(".admin-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    adminInput?.focus();
  });
});

adminRefresh?.addEventListener("click", () => renderAdmin());

document.querySelectorAll("[data-admin-search]").forEach((input) => {
  input.addEventListener("input", () => {
    adminSearchState[input.dataset.adminSearch] = input.value;
    renderAdmin();
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
    await api("/api/admin/me");
  } catch {
    location.href = "/login9493";
  }
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
      <span>Joined</span>
      <span>Status</span>
      <span>Actions</span>
    </div>
  `;
  visibleUsers.forEach((user) => {
    const presence = playerPresence(user);
    const item = document.createElement("article");
    item.className = "registered-player admin-player-row";
    item.innerHTML = `
      <div class="registered-player-identity">
        <span class="player-presence-dot"></span>
        <button class="registered-player-name" type="button" data-view-user></button>
      </div>
      <span class="admin-player-email"></span>
      <span class="admin-player-phone"></span>
      <strong class="admin-player-points"></strong>
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
    item.querySelectorAll("[data-view-user], [data-open-user-chat], [data-quick-add-points], [data-quick-reset-password]").forEach((button) => {
      button.dataset.userId = user.id;
    });
    item.querySelector(".registered-player-name").textContent = user.username;
    item.querySelector(".admin-player-email").textContent = user.email;
    item.querySelector(".admin-player-phone").textContent = user.phone || "-";
    item.querySelector(".admin-player-points").textContent = user.points ?? 0;
    item.querySelector(".admin-player-joined").textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-";
    item.querySelector(".admin-player-status").textContent = presence.label;
    item.querySelector(".admin-player-status").classList.add(presence.className);
    table.appendChild(item);
  });
  adminUsers.appendChild(table);
  renderPointsActionLists(users);
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
  modalEmail.textContent = user.email || "-";
  modalPhone.textContent = user.phone || "-";
  modalDob.textContent = user.dateOfBirth ? new Date(`${user.dateOfBirth}T00:00:00`).toLocaleDateString() : "Not provided";
  modalJoined.textContent = formatAdminDate(user.createdAt);
  modalStatus.textContent = presence.label;
  modalStatus.className = `status-pill ${presence.className}`;
  modalPoints.textContent = user.points ?? 0;
  modalOpenChat.dataset.userId = user.id;
  modalPointsForm.dataset.userId = user.id;
  modalResetForm.dataset.userId = user.id;
  modalNoteForm.dataset.userId = user.id;
  modalNoteForm.note.value = user.adminNote || "";
  playerModal.classList.remove("is-hidden");
  playerModal.setAttribute("aria-hidden", "false");
  if (focusTarget === "points") modalPointsForm.points.focus();
  else if (focusTarget === "password") modalResetForm.password.focus();
  else modalOpenChat.focus();
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
        <small>${user.points ?? 0} available points</small>
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

function renderPointTransactions(transactions = []) {
  if (!pointsTransactions) return;
  const visibleTransactions = filterItems(transactions, adminSearchState.transactions, (transaction) => [
    transaction.username,
    transaction.type,
    transaction.points,
    transaction.balanceAfter,
    transaction.note,
    transaction.createdAt,
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
    item.querySelector("span").textContent = transaction.note || (transaction.type === "add" ? "Points added" : "Points redeemed");
    item.querySelector("b").textContent = `${transaction.type === "add" ? "+" : "-"}${transaction.points}`;
    item.querySelector("small").textContent = `${new Date(transaction.createdAt).toLocaleString()} | Balance ${transaction.balanceAfter}`;
    pointsTransactions.appendChild(item);
  });
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

async function renderAdmin() {
  if (!adminInbox || !adminMessages) return;

  const chatData = await api("/api/chats").catch(() => ({ chats: [] }));
  const userData = await api("/api/admin/users").catch(() => ({ users: [] }));
  const dashboardData = await api("/api/admin/dashboard").catch(() => ({ stats: {} }));
  const pointsData = await api("/api/admin/points").catch(() => ({ transactions: [] }));
  const activityData = await api("/api/admin/activity").catch(() => ({ activity: [] }));
  const chats = (chatData.chats || [])
    .filter((chat) => !["demo-maya", "demo-andre"].includes(chat.id))
    .sort((a, b) => latestChatTime(b) - latestChatTime(a));
  const users = userData.users || [];
  adminUsersCache = users;
  const isPlayerFormActive = Boolean(
    document.activeElement?.closest("[data-reset-user]") ||
      document.activeElement?.closest("[data-points-user]") ||
      document.activeElement?.closest("[data-note-user]") ||
      document.activeElement?.closest("[data-player-modal]")
  );
  if (!isPlayerFormActive) {
    renderUsers(users);
  } else if (adminUserCount) {
    adminUserCount.textContent = `${users.length} player${users.length === 1 ? "" : "s"}`;
  }
  renderDashboard(dashboardData.stats || {});
  renderPointTransactions(pointsData.transactions || []);
  renderActivity(activityData.activity || []);

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
    button.type = "button";
    button.dataset.threadId = chat.id;
    button.innerHTML = `<span class="inbox-player-name"><span class="inbox-avatar"></span><i class="player-presence-dot"></i><b></b><em class="inbox-unread is-hidden"></em></span><small></small>`;
    setPresenceDot(button.querySelector(".player-presence-dot"), presence);
    button.querySelector("b").textContent = chat.name;
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
    setPresenceDot(adminChatStatus, { className: "offline", label: "Offline" });
    adminMessages.dataset.messageScope = "empty";
    adminMessages.innerHTML = `<article class="message player"><span>Inbox</span><p>No messages yet.</p></article>`;
    return;
  }

  const selectedUser = users.find((user) => user.id === selected.userId || user.chatId === selected.id);
  setPresenceDot(adminChatStatus, playerPresence(selectedUser || { createdAt: 0 }));
  adminName.textContent = selected.name;
  adminMessages.dataset.messageScope = selected.id;
  renderMessages(adminMessages, selected.messages);
}

async function openAdminChatForUser(userId) {
  const data = await api("/api/admin/user-chat", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  activeAdminThread = data.chat.id;
  await renderAdmin();
  document.querySelector(".admin-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  adminInput?.focus();
}

if (adminInbox && adminForm) {
  requireAdminSession().then(renderAdmin);

  if (adminUsers) {
    adminUsers.addEventListener("click", async (event) => {
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
    });

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
        await api("/api/admin/points", {
          method: "POST",
          body: JSON.stringify({
            userId: form.dataset.userId,
            action,
            points: Number(form.points.value),
            note: form.note.value.trim(),
          }),
        });
        form.reset();
        await renderAdmin();
      } catch (error) {
        alert(error.message);
      } finally {
        submitter.disabled = false;
        submitter.textContent = buttonText;
      }
    });
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

  setInterval(renderAdmin, 2500);
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
    await api("/api/admin/points", {
      method: "POST",
      body: JSON.stringify({
        userId: activeModalUserId,
        action,
        points: Number(modalPointsForm.points.value),
        note: modalPointsForm.note.value.trim(),
      }),
    });
    modalPointsForm.reset();
    await renderAdmin();
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
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    location.href = "/login9493";
  });
}
