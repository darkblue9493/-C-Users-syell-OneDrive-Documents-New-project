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
  const response = await fetch(path, {
    cache: "no-store",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json();
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
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll(".auth-panel");
const playerSignup = document.querySelector("[data-player-signup]");
const playerLogin = document.querySelector("[data-player-login]");
const playerReset = document.querySelector("[data-player-reset]");
const playerAuthMessage = document.querySelector("[data-player-auth-message]");
const playerNameDisplay = document.querySelector("[data-player-name-display]");
const playerLogout = document.querySelector("[data-player-logout]");
const playerForm = document.querySelector("[data-player-form]");
const playerMessages = document.querySelector("[data-player-messages]");
const playerInput = document.querySelector("[data-player-input]");
const uploadForm = document.querySelector("[data-upload-form]");
const uploadFile = document.querySelector("[data-upload-file]");
const uploadNote = document.querySelector("[data-upload-note]");
const uploadStatus = document.querySelector("[data-upload-status]");

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
  if (playerNameDisplay) playerNameDisplay.textContent = user.username;
  refreshPlayerChat();
}

function showPlayerAuth() {
  currentPlayer = null;
  if (playerAuth) playerAuth.classList.remove("is-hidden");
  playerAppSections.forEach((section) => section.classList.remove("is-hidden"));
  if (playerNameDisplay) playerNameDisplay.textContent = "Guest";
  if (playerMessages) {
    renderMessages(playerMessages, [
      { author: "operator", text: "Create an account or log in at the top of the page to chat with South Diamond support." },
    ]);
  }
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

if (playerSignup) {
  playerSignup.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
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

async function refreshPlayerChat() {
  if (!playerMessages || !currentPlayer) return;
  try {
    const data = await api("/api/player/me");
    currentPlayer = data.user;
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
      const imageData = await readFileAsDataUrl(file);
      const data = await api("/api/chats/player-upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          imageData,
          note: uploadNote.value.trim(),
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
const loginForm = document.querySelector("[data-login-form]");
const loginUsername = document.querySelector("[data-login-username]");
const loginPassword = document.querySelector("[data-login-password]");
const loginError = document.querySelector("[data-login-error]");
const logoutButton = document.querySelector("[data-logout]");

let activeAdminThread = null;

async function requireAdminSession() {
  if (!isAdminPage || !canUseApi) return;

  try {
    await api("/api/admin/me");
  } catch {
    location.href = "/login.html";
  }
}

function renderUsers(users) {
  if (!adminUsers) return;
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
      <form class="admin-reset-form" data-reset-user>
        <label class="sr-only">New password</label>
        <input name="password" type="password" minlength="6" placeholder="New password" required />
        <button class="game-link" type="submit">Reset</button>
      </form>
    `;
    item.querySelector("[data-reset-user]").dataset.userId = user.id;
    item.querySelector("strong").textContent = user.username;
    item.querySelector("div span").textContent = user.email;
    item.children[1].textContent = user.phone;
    item.querySelector("small").textContent = user.createdAt ? `Joined ${new Date(user.createdAt).toLocaleDateString()}` : "";
    adminUsers.appendChild(item);
  });
}

function renderDashboard(stats = {}) {
  if (!dashboardStats) return;
  dashboardStats.querySelectorAll("[data-stat]").forEach((item) => {
    const key = item.dataset.stat;
    item.textContent = stats[key] ?? 0;
  });
}

async function renderAdmin() {
  if (!adminInbox || !adminMessages) return;

  const chatData = await api("/api/chats").catch(() => ({ chats: [] }));
  const userData = await api("/api/admin/users").catch(() => ({ users: [] }));
  const dashboardData = await api("/api/admin/dashboard").catch(() => ({ stats: {} }));
  const chats = chatData.chats || [];
  renderUsers(userData.users || []);
  renderDashboard(dashboardData.stats || {});

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
    const submitButton = loginForm.querySelector("button");
    submitButton.disabled = true;
    submitButton.textContent = "Logging In...";

    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: loginUsername.value.trim(),
          password: loginPassword.value,
        }),
      });
      location.href = "/admin.html";
    } catch (error) {
      loginError.textContent = error.message;
      loginPassword.value = "";
      loginPassword.focus();
      submitButton.disabled = false;
      submitButton.textContent = "Log In";
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging Out...";
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    location.href = "/login.html";
  });
}
