const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");

const storeKey = "southDiamondChats";
const playerThreadKey = "southDiamondPlayerThread";
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

const starterChats = [
  {
    id: "demo-maya",
    name: "Maya R.",
    messages: [
      { author: "player", text: "Hi, can you send me the Juwa link?" },
      { author: "operator", text: "Yes. Tap JW1 or JW2.0 in the Games section." },
    ],
  },
  {
    id: "demo-andre",
    name: "Andre T.",
    messages: [
      { author: "player", text: "How do I claim the welcome bonus?" },
      { author: "operator", text: "Click Claim Bonus and I can help you from chat." },
    ],
  },
];

function loadLocalChats() {
  const saved = localStorage.getItem(storeKey);
  return saved ? JSON.parse(saved) : structuredClone(starterChats);
}

function saveLocalChats(chats) {
  localStorage.setItem(storeKey, JSON.stringify(chats));
}

async function getChats() {
  if (!canUseApi || !isAdminPage) return loadLocalChats();
  const response = await fetch("/api/chats", { cache: "no-store" });
  const data = await response.json();
  return data.chats || [];
}

async function sendPlayerMessage(threadId, name, text) {
  if (!canUseApi) {
    const chats = loadLocalChats();
    let chat = chats.find((item) => item.id === threadId);
    if (!chat) {
      chat = { id: `player-${Date.now()}`, name: name || "New Player", messages: [] };
      chats.unshift(chat);
    }
    chat.name = name || "New Player";
    chat.messages.push({ author: "player", text });
    saveLocalChats(chats);
    return chat;
  }

  const response = await fetch("/api/chats/player-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, name, text }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not send message.");
  return data.chat;
}

async function sendOperatorMessage(threadId, text) {
  if (!canUseApi) {
    const chats = loadLocalChats();
    const chat = chats.find((item) => item.id === threadId);
    if (!chat) return null;
    chat.messages.push({ author: "operator", text });
    saveLocalChats(chats);
    return chat;
  }

  const response = await fetch("/api/chats/operator-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, text }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not send reply.");
  return data.chat;
}

async function clearAllChats() {
  if (!canUseApi) {
    localStorage.removeItem(storeKey);
    localStorage.removeItem(playerThreadKey);
    return [];
  }

  const response = await fetch("/api/chats", { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not clear chats.");
  localStorage.removeItem(playerThreadKey);
  return data.chats || [];
}

function createMessage(item) {
  const message = document.createElement("article");
  message.className = `message ${item.author}`;
  message.innerHTML = `<span>${item.author === "operator" ? "Support" : "Player"}</span><p></p>`;
  message.querySelector("p").textContent = item.text;
  return message;
}

function renderMessages(container, messages) {
  container.innerHTML = "";
  messages.forEach((item) => container.appendChild(createMessage(item)));
  container.scrollTop = container.scrollHeight;
}

const playerForm = document.querySelector("[data-player-form]");
const playerMessages = document.querySelector("[data-player-messages]");
const playerName = document.querySelector("[data-player-name]");
const playerInput = document.querySelector("[data-player-input]");

let playerThreadId = localStorage.getItem(playerThreadKey);

async function ensurePlayerThread() {
  const chats = await getChats();
  let thread = chats.find((item) => item.id === playerThreadId);
  return thread || null;
}

async function refreshPlayerChat() {
  if (!playerMessages) return;
  const chats = await getChats();
  const thread = chats.find((item) => item.id === playerThreadId) || (await ensurePlayerThread());
  if (!thread) {
    renderMessages(playerMessages, [
      { author: "operator", text: "Welcome to South Diamond. Send your name and what you need help with." },
    ]);
    return;
  }
  if (thread.name !== "New Player" && playerName) playerName.value = thread.name;
  renderMessages(playerMessages, thread.messages);
}

if (playerForm && playerMessages) {
  refreshPlayerChat();

  playerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = playerInput.value.trim();
    if (!text) return;

    const name = playerName.value.trim() || "New Player";
    const thread = await sendPlayerMessage(playerThreadId, name, text);
    playerThreadId = thread.id;
    localStorage.setItem(playerThreadKey, playerThreadId);

    playerInput.value = "";
    renderMessages(playerMessages, thread.messages);
    playerInput.focus();
  });

  setInterval(refreshPlayerChat, 2500);
}

const adminInbox = document.querySelector("[data-admin-inbox]");
const adminMessages = document.querySelector("[data-admin-messages]");
const adminName = document.querySelector("[data-admin-name]");
const adminCount = document.querySelector("[data-admin-count]");
const adminForm = document.querySelector("[data-admin-form]");
const adminInput = document.querySelector("[data-admin-input]");
const clearChats = document.querySelector("[data-clear-chats]");

let activeAdminThread = null;

async function renderAdmin() {
  if (!adminInbox || !adminMessages) return;

  const chats = await getChats();
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
  renderAdmin();

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

    await sendOperatorMessage(activeAdminThread, text);
    adminInput.value = "";
    renderAdmin();
    adminInput.focus();
  });

  clearChats.addEventListener("click", async () => {
    await clearAllChats();
    activeAdminThread = null;
    renderAdmin();
  });

  setInterval(renderAdmin, 2500);
}
