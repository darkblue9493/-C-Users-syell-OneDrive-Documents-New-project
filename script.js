const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const canUseApi = location.protocol === "http:" || location.protocol === "https:";
const isAdminPage = Boolean(document.querySelector("[data-admin-inbox]"));

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
    link.innerHTML = `<img alt="Attached payment screenshot" />`;
    link.querySelector("img").src = item.imageUrl;
    message.appendChild(link);
  }
  return message;
}

function renderMessages(container, messages) {
  container.innerHTML = "";
  messages.forEach((item) => container.appendChild(createMessage(item)));
  container.scrollTop = container.scrollHeight;
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
const profileForm = document.querySelector("[data-profile-form]");
const profilePhone = document.querySelector("#profile-phone");
const profilePassword = document.querySelector("#profile-password");
const profileStatus = document.querySelector("[data-profile-status]");
const profileUsername = document.querySelector("[data-profile-username]");
const profileEmail = document.querySelector("[data-profile-email]");
const profileAvatarPreview = document.querySelector("[data-player-avatar-preview]");
const avatarForm = document.querySelector("[data-avatar-form]");
const avatarFile = document.querySelector("[data-avatar-file]");
const avatarStatus = document.querySelector("[data-avatar-status]");
const uploadForm = document.querySelector("[data-upload-form]");
const uploadFile = document.querySelector("[data-upload-file]");
const uploadNote = document.querySelector("[data-upload-note]");
const uploadStatus = document.querySelector("[data-upload-status]");
const chatWidget = document.querySelector("[data-player-chat]");
const chatToggle = document.querySelector("[data-chat-toggle]");
const paymentActions = document.querySelector(".payment-actions");

let currentPlayer = null;

function setAuthMessage(text, isSuccess = false) {
  if (!playerAuthMessage) return;
  playerAuthMessage.textContent = text;
  playerAuthMessage.style.color = isSuccess ? "#52ef9f" : "";
}

function showPlayerApp(user) {
  currentPlayer = user;
  if (playerAuth) playerAuth.classList.add("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  playerOnlyItems.forEach((item) => item.classList.remove("is-hidden"));
  guestOnlyItems.forEach((item) => item.classList.add("is-hidden"));
  minimizePlayerChat();
  if (playerNameDisplay) playerNameDisplay.textContent = user.username;
  playerPointsDisplay.forEach((item) => {
    item.textContent = user.points ?? 0;
  });
  renderProfile(user);
  refreshPlayerChat();
}

function showPlayerAuth() {
  currentPlayer = null;
  if (playerAuth) playerAuth.classList.remove("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  playerOnlyItems.forEach((item) => item.classList.add("is-hidden"));
  guestOnlyItems.forEach((item) => item.classList.remove("is-hidden"));
  if (playerNameDisplay) playerNameDisplay.textContent = "Guest";
  playerPointsDisplay.forEach((item) => {
    item.textContent = "0";
  });
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

function minimizePlayerChat() {
  if (!chatWidget || !chatToggle) return;
  chatWidget.classList.add("is-minimized");
  chatToggle.textContent = "Open Chat";
  chatToggle.setAttribute("aria-expanded", "false");
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

document.querySelectorAll('a[href="#signup"]').forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector('[data-auth-tab="signup"]')?.click();
  });
});

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
      { author: "operator", text: "Welcome to South Diamond. Send what you need help with." },
    ]);
  } catch {
    renderMessages(playerMessages, [
      { author: "operator", text: "Welcome to South Diamond. Send what you need help with." },
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
  setInterval(refreshPlayerChat, 2500);
}

if (chatToggle && chatWidget) {
  chatToggle.addEventListener("click", () => {
    const isMinimized = chatWidget.classList.toggle("is-minimized");
    chatToggle.textContent = isMinimized ? "Open Chat" : "Minimize";
    chatToggle.setAttribute("aria-expanded", String(!isMinimized));
  });
}

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

const adminInbox = document.querySelector("[data-admin-inbox]");
const adminMessages = document.querySelector("[data-admin-messages]");
const adminName = document.querySelector("[data-admin-name]");
const adminCount = document.querySelector("[data-admin-count]");
const adminForm = document.querySelector("[data-admin-form]");
const adminInput = document.querySelector("[data-admin-input]");
const deleteChat = document.querySelector("[data-delete-chat]");
const adminUsers = document.querySelector("[data-admin-users]");
const adminUserCount = document.querySelector("[data-admin-user-count]");
const dashboardStats = document.querySelector("[data-dashboard-stats]");
const pointsTransactions = document.querySelector("[data-points-transactions]");
const pointsCount = document.querySelector("[data-points-count]");
const loginForm = document.querySelector("[data-login-form]");
const loginUsername = document.querySelector("[data-login-username]");
const loginPassword = document.querySelector("[data-login-password]");
const loginCode = document.querySelector("[data-login-code]");
const loginCodePanel = document.querySelector("[data-admin-code-panel]");
const loginSubmit = document.querySelector("[data-login-submit]");
const loginError = document.querySelector("[data-login-error]");
const logoutButton = document.querySelector("[data-logout]");

let activeAdminThread = null;
let lastAdminUsersKey = "";
let pendingAdminLoginId = null;

async function requireAdminSession() {
  if (!isAdminPage || !canUseApi) return;

  try {
    await api("/api/admin/me");
  } catch {
    location.href = "/login9493";
  }
}

function renderUsers(users) {
  if (!adminUsers) return;
  lastAdminUsersKey = JSON.stringify(
    users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      points: user.points,
      createdAt: user.createdAt,
    }))
  );
  adminUserCount.textContent = `${users.length} player${users.length === 1 ? "" : "s"}`;
  adminUsers.innerHTML = "";

  if (!users.length) {
    adminUsers.innerHTML = `<article class="registered-player"><strong>No registered players yet.</strong><span></span><small></small></article>`;
    return;
  }

  users.forEach((user) => {
    const item = document.createElement("article");
    item.className = "registered-player";
    item.innerHTML = `
      <div><strong></strong><span></span></div>
      <span></span>
      <small></small>
      <small></small>
      <div class="points-balance"><strong></strong><span>available points</span></div>
      <form class="admin-points-form" data-points-user>
        <label class="sr-only">Points</label>
        <input name="points" type="number" min="1" step="1" placeholder="Points" required />
        <input name="note" type="text" placeholder="Note" />
        <button class="game-link" type="submit" name="action" value="add">Add</button>
        <button class="game-link redeem" type="submit" name="action" value="redeem">Redeem</button>
      </form>
      <form class="admin-reset-form" data-reset-user>
        <label class="sr-only">New password</label>
        <input name="password" type="password" minlength="6" placeholder="New password" required />
        <button class="game-link" type="submit">Reset</button>
      </form>
    `;
    item.querySelector("[data-reset-user]").dataset.userId = user.id;
    item.querySelector("[data-points-user]").dataset.userId = user.id;
    item.querySelector("strong").textContent = user.username;
    item.querySelector("div span").textContent = user.email;
    item.children[1].textContent = user.phone;
    item.children[2].textContent = user.dateOfBirth
      ? `DOB ${new Date(`${user.dateOfBirth}T00:00:00`).toLocaleDateString()}`
      : "DOB not provided";
    item.children[3].textContent = user.createdAt ? `Joined ${new Date(user.createdAt).toLocaleDateString()}` : "";
    item.querySelector(".points-balance strong").textContent = user.points ?? 0;
    adminUsers.appendChild(item);
  });
}

function renderPointTransactions(transactions = []) {
  if (!pointsTransactions) return;
  pointsCount.textContent = `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`;
  pointsTransactions.innerHTML = "";
  if (!transactions.length) {
    pointsTransactions.innerHTML = `<article class="points-transaction empty">No point transactions yet.</article>`;
    return;
  }

  transactions.slice(0, 80).forEach((transaction) => {
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
  const chats = (chatData.chats || [])
    .filter((chat) => !["demo-maya", "demo-andre"].includes(chat.id))
    .sort((a, b) => latestChatTime(b) - latestChatTime(a));
  const users = userData.users || [];
  const usersKey = JSON.stringify(
    users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      points: user.points,
      createdAt: user.createdAt,
    }))
  );
  const isPlayerFormActive = Boolean(
    adminUsers?.contains(document.activeElement) &&
      (document.activeElement.closest("[data-reset-user]") || document.activeElement.closest("[data-points-user]"))
  );
  if (!isPlayerFormActive && usersKey !== lastAdminUsersKey) {
    renderUsers(users);
  } else if (adminUserCount) {
    adminUserCount.textContent = `${users.length} player${users.length === 1 ? "" : "s"}`;
  }
  renderDashboard(dashboardData.stats || {});
  renderPointTransactions(pointsData.transactions || []);

  if (!activeAdminThread && chats.length) activeAdminThread = chats[0].id;
  if (activeAdminThread && !chats.some((chat) => chat.id === activeAdminThread)) activeAdminThread = chats[0]?.id || null;

  adminInbox.innerHTML = "";
  adminCount.textContent = `${chats.length} chat${chats.length === 1 ? "" : "s"}`;

  chats.forEach((chat) => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    const button = document.createElement("button");
    button.className = `inbox-player${chat.id === activeAdminThread ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.threadId = chat.id;
    button.innerHTML = `<span></span><small></small>`;
    button.querySelector("span").textContent = chat.name;
    button.querySelector("small").textContent = lastMessage ? lastMessage.text : "No messages yet";
    adminInbox.appendChild(button);
  });

  const selected = chats.find((chat) => chat.id === activeAdminThread);
  if (!selected) {
    adminName.textContent = "No player selected";
    adminMessages.innerHTML = `<article class="message player"><span>Inbox</span><p>No messages yet.</p></article>`;
    return;
  }

  adminName.textContent = selected.name;
  renderMessages(adminMessages, selected.messages);
}

if (adminInbox && adminForm) {
  requireAdminSession().then(renderAdmin);

  if (adminUsers) {
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
      const form = event.target.closest("[data-points-user]");
      if (!form) return;
      event.preventDefault();
      const submitter = event.submitter;
      const action = submitter?.value || "add";
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
  }

  adminInbox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-thread-id]");
    if (!button) return;
    activeAdminThread = button.dataset.threadId;
    renderAdmin();
    adminInput.focus();
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

if (loginForm) {
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

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging Out...";
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    location.href = "/login9493";
  });
}
