const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, "data");
const dbPath = path.join(dataDir, "chats.json");
const uploadDir = path.join(dataDir, "uploads");
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "southdiamond";
const sessions = new Set();
const playerSessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const starterChats = [
  {
    id: "demo-maya",
    name: "Maya R.",
    messages: [
      { author: "player", text: "Hi, can you send me the Juwa link?", createdAt: new Date().toISOString() },
      { author: "operator", text: "Yes. Tap JW1 or JW2.0 in the Games section.", createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "demo-andre",
    name: "Andre T.",
    messages: [
      { author: "player", text: "How do I claim the welcome bonus?", createdAt: new Date().toISOString() },
      { author: "operator", text: "Click Claim Bonus and I can help you from chat.", createdAt: new Date().toISOString() },
    ],
  },
];

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ chats: starterChats, users: [] }, null, 2));
    return;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  let changed = false;
  if (!Array.isArray(data.chats)) {
    data.chats = starterChats;
    changed = true;
  }
  if (!Array.isArray(data.users)) {
    data.users = [];
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDatabase(data) {
  ensureDatabase();
  if (!Array.isArray(data.chats)) data.chats = [];
  if (!Array.isArray(data.users)) data.users = [];
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((part) => part.length === 2)
  );
}

function isAdminRequest(request) {
  const cookies = parseCookies(request);
  return Boolean(cookies.sd_admin_session && sessions.has(cookies.sd_admin_session));
}

function requireAdmin(request, response) {
  if (isAdminRequest(request)) return true;
  sendJson(response, 401, { error: "Admin login is required." });
  return false;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    chatId: user.chatId || null,
  };
}

function safeUploadName(originalName, mimeType) {
  const extension = path.extname(String(originalName || "")).toLowerCase();
  const fallback = mimeType === "image/png" ? ".png" : ".jpg";
  const safeExtension = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension) ? extension : fallback;
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExtension}`;
}

function getPlayerUser(request) {
  const cookies = parseCookies(request);
  const userId = cookies.sd_player_session && playerSessions.get(cookies.sd_player_session);
  if (!userId) return null;
  return readDatabase().users.find((user) => user.id === userId) || null;
}

function requirePlayer(request, response) {
  const user = getPlayerUser(request);
  if (user) return user;
  sendJson(response, 401, { error: "Player login is required." });
  return null;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

function publicFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const routeMap = {
    "/": "index.html",
    "/admin": "admin.html",
    "/admin.html": "admin.html",
  };
  const filePath = path.join(root, routeMap[cleanPath] || cleanPath.replace(/^\/+/, ""));
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

async function handleApi(request, response, urlPath) {
  if (request.method === "POST" && urlPath === "/api/admin/login") {
    const body = await readBody(request);
    if (body.username !== adminUsername || body.password !== adminPassword) {
      return sendJson(response, 401, { error: "Wrong username or password." });
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    sessions.add(token);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_admin_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/admin/logout") {
    const cookies = parseCookies(request);
    if (cookies.sd_admin_session) sessions.delete(cookies.sd_admin_session);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "sd_admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && urlPath === "/api/admin/me") {
    return sendJson(response, isAdminRequest(request) ? 200 : 401, { loggedIn: isAdminRequest(request) });
  }

  if (request.method === "GET" && urlPath === "/api/admin/users") {
    if (!requireAdmin(request, response)) return;
    const data = readDatabase();
    return sendJson(response, 200, { users: data.users.map(sanitizeUser) });
  }

  if (request.method === "GET" && urlPath === "/api/admin/dashboard") {
    if (!requireAdmin(request, response)) return;
    const data = readDatabase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeSince = Date.now() - 24 * 60 * 60 * 1000;
    const users = data.users || [];
    const chats = data.chats || [];
    const messages = chats.flatMap((chat) => chat.messages || []);
    return sendJson(response, 200, {
      stats: {
        totalUsers: users.length,
        usersToday: users.filter((user) => new Date(user.createdAt).getTime() >= startOfToday.getTime()).length,
        activePlayers: users.filter((user) => user.lastLoginAt && new Date(user.lastLoginAt).getTime() >= activeSince).length,
        openChats: chats.length,
        totalMessages: messages.length,
        imageUploads: messages.filter((message) => message.imageUrl).length,
      },
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/reset-player-password") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const password = String(body.password || "");
    if (!userId || password.length < 6) {
      return sendJson(response, 400, { error: "Choose a player and enter a password with at least 6 characters." });
    }

    const data = readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });

    user.passwordHash = hashPassword(password);
    writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "POST" && urlPath === "/api/player/signup") {
    const body = await readBody(request);
    const username = String(body.username || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !phone || !email || !password) {
      return sendJson(response, 400, { error: "Username, phone number, email, and password are required." });
    }
    if (password.length < 6) {
      return sendJson(response, 400, { error: "Password must be at least 6 characters." });
    }

    const data = readDatabase();
    if (data.users.some((user) => user.email === email)) {
      return sendJson(response, 409, { error: "An account with this email already exists." });
    }

    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username,
      phone,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      chatId: null,
    };
    data.users.unshift(user);
    writeDatabase(data);

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    playerSessions.set(token, user.id);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_player_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/player/login") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const data = readDatabase();
    const user = data.users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(response, 401, { error: "Wrong email or password." });
    }

    user.lastLoginAt = new Date().toISOString();
    writeDatabase(data);

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    playerSessions.set(token, user.id);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_player_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/player/logout") {
    const cookies = parseCookies(request);
    if (cookies.sd_player_session) playerSessions.delete(cookies.sd_player_session);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "sd_player_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && urlPath === "/api/player/me") {
    const user = getPlayerUser(request);
    return sendJson(response, user ? 200 : 401, { user: sanitizeUser(user) });
  }

  if (request.method === "GET" && urlPath === "/api/player/chat") {
    const user = requirePlayer(request, response);
    if (!user) return;
    const data = readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    const chat = data.chats.find((item) => item.id === savedUser?.chatId) || null;
    return sendJson(response, 200, { chat });
  }

  if (request.method === "POST" && urlPath === "/api/player/reset-password") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || password.length < 6) {
      return sendJson(response, 400, { error: "Enter your email and a new password with at least 6 characters." });
    }

    const data = readDatabase();
    const user = data.users.find((item) => item.email === email);
    if (!user) return sendJson(response, 404, { error: "No account was found for that email." });

    user.passwordHash = hashPassword(password);
    writeDatabase(data);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "POST" && urlPath === "/api/player/profile") {
    const user = requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    if (!phone) return sendJson(response, 400, { error: "Phone number is required." });
    if (password && password.length < 6) return sendJson(response, 400, { error: "Password must be at least 6 characters." });

    const data = readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    savedUser.phone = phone;
    if (password) savedUser.passwordHash = hashPassword(password);
    writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(savedUser) });
  }

  if (request.method === "POST" && urlPath === "/api/player/avatar") {
    const user = requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const imageData = String(body.imageData || "");
    const mimeType = String(body.mimeType || "");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType) || !imageData) {
      return sendJson(response, 400, { error: "Upload a valid image file." });
    }

    const base64 = imageData.includes(",") ? imageData.split(",").pop() : imageData;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 3_000_000) return sendJson(response, 400, { error: "Profile image must be under 3 MB." });

    ensureDatabase();
    const fileName = safeUploadName(body.fileName, mimeType);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const data = readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    savedUser.avatarUrl = `/uploads/${fileName}`;
    writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(savedUser) });
  }

  if (request.method === "GET" && urlPath === "/api/chats") {
    if (!requireAdmin(request, response)) return;
    return sendJson(response, 200, { chats: readDatabase().chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-message") {
    const user = requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    if (!text) return sendJson(response, 400, { error: "Message is required." });

    const data = readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    let chat = data.chats.find((item) => item.id === savedUser.chatId);
    if (!chat) {
      chat = {
        id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: savedUser.username,
        userId: savedUser.id,
        messages: [],
      };
      savedUser.chatId = chat.id;
      data.chats.unshift(chat);
    }

    chat.name = savedUser.username;
    chat.userId = savedUser.id;
    chat.messages.push({ author: "player", text, createdAt: new Date().toISOString() });
    writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-upload") {
    const user = requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const imageData = String(body.imageData || "");
    const mimeType = String(body.mimeType || "");
    const note = String(body.note || "").trim();
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType) || !imageData) {
      return sendJson(response, 400, { error: "Upload a valid image file." });
    }

    const base64 = imageData.includes(",") ? imageData.split(",").pop() : imageData;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 5_000_000) return sendJson(response, 400, { error: "Image must be under 5 MB." });

    ensureDatabase();
    const fileName = safeUploadName(body.fileName, mimeType);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const data = readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    let chat = data.chats.find((item) => item.id === savedUser.chatId);
    if (!chat) {
      chat = {
        id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: savedUser.username,
        userId: savedUser.id,
        messages: [],
      };
      savedUser.chatId = chat.id;
      data.chats.unshift(chat);
    }

    chat.messages.push({
      author: "player",
      text: note || "Payment screenshot attached.",
      imageUrl: `/uploads/${fileName}`,
      createdAt: new Date().toISOString(),
    });
    writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/operator-message") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    if (!text || !body.threadId) return sendJson(response, 400, { error: "Thread and message are required." });

    const data = readDatabase();
    const chat = data.chats.find((item) => item.id === body.threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });

    chat.messages.push({ author: "operator", text, createdAt: new Date().toISOString() });
    writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "DELETE" && urlPath === "/api/chats") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    if (!threadId) return sendJson(response, 400, { error: "Choose a chat to delete." });

    const data = readDatabase();
    data.chats = data.chats.filter((chat) => chat.id !== threadId);
    data.users = data.users.map((user) => (user.chatId === threadId ? { ...user, chatId: null } : user));
    writeDatabase(data);
    return sendJson(response, 200, { chats: data.chats });
  }

  return sendJson(response, 404, { error: "API route was not found." });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
      return;
    }

    if (url.pathname.startsWith("/uploads/")) {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(uploadDir, fileName);
      if (!fs.existsSync(filePath)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
      });
      fs.createReadStream(filePath).pipe(response);
      return;
    }

    if ((url.pathname === "/admin.html" || url.pathname === "/admin") && !isAdminRequest(request)) {
      response.writeHead(302, { Location: "/login.html" });
      response.end();
      return;
    }

    if (url.pathname === "/login.html" && isAdminRequest(request)) {
      response.writeHead(302, { Location: "/admin.html" });
      response.end();
      return;
    }

    const filePath = publicFilePath(url.pathname);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
}

ensureDatabase();
http.createServer(handleRequest).listen(port, () => {
  console.log(`South Diamond server running at http://localhost:${port}`);
});
