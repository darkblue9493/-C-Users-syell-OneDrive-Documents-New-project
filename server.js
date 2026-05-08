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
const adminPath = "/admin9493";
const adminLoginPath = "/login9493";
const adminExportToken = process.env.ADMIN_EXPORT_TOKEN || "";
const tierlockMerchantId = process.env.TIERLOCK_MERCHANT_ID || "e5474f4227";
const tierlockMerchantSecret = process.env.TIERLOCK_MERCHANT_SECRET || "";
const brevoApiKey = process.env.BREVO_API_KEY || "";
const resendApiKey = process.env.RESEND_API_KEY || "";
const adminLoginEmail = process.env.ADMIN_LOGIN_EMAIL || "";
const adminFromEmail = process.env.ADMIN_FROM_EMAIL || "";
const maintenanceMode = String(process.env.MAINTENANCE_MODE || "").toLowerCase() === "true";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(supabaseUrl && supabaseServiceKey);
const sessions = new Set();
const playerSessions = new Map();
const adminLoginAttempts = new Map();
const pendingAdminLogins = new Map();
const maxJsonBodyBytes = 8_000_000;
const playerSessionMaxAge = 60 * 60 * 24 * 400;

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

const starterChats = [];

function starterDatabase() {
  return { chats: starterChats, users: [], pointTransactions: [], activityLog: [] };
}

function normalizeDatabase(data) {
  const normalized = data && typeof data === "object" ? data : starterDatabase();
  if (!Array.isArray(normalized.chats)) normalized.chats = [];
  if (!Array.isArray(normalized.users)) normalized.users = [];
  if (!Array.isArray(normalized.pointTransactions)) normalized.pointTransactions = [];
  if (!Array.isArray(normalized.activityLog)) normalized.activityLog = [];
  normalized.users = normalized.users.map((user) => ({
    ...user,
    points: Number.isFinite(Number(user.points)) ? Number(user.points) : 0,
    adminNote: user.adminNote || "",
    playerSessionTokens: Array.isArray(user.playerSessionTokens)
      ? user.playerSessionTokens
      : user.playerSessionToken
        ? [user.playerSessionToken]
        : [],
  }));
  normalized.chats = normalized.chats
    .filter((chat) => !["demo-maya", "demo-andre"].includes(chat.id))
    .map((chat) => ({
      ...chat,
      unreadForAdmin: Number.isFinite(Number(chat.unreadForAdmin)) ? Number(chat.unreadForAdmin) : 0,
      messages: Array.isArray(chat.messages)
        ? chat.messages.map((message, index) => ({
            ...message,
            id:
              message.id ||
              `msg-${chat.id}-${index}-${String(message.createdAt || "old").replace(/[^a-z0-9]/gi, "")}`,
            paymentStatus: message.imageUrl ? message.paymentStatus || "pending" : message.paymentStatus,
          }))
        : [],
    }));
  return normalized;
}

function moveChatToTop(chats, chatId) {
  const index = chats.findIndex((chat) => chat.id === chatId);
  if (index <= 0) return;
  const [chat] = chats.splice(index, 1);
  chats.unshift(chat);
}

function ensureLocalStorage() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1${pathname}`, {
    ...options,
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase request failed.");
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function ensureDatabase() {
  ensureLocalStorage();
  if (useSupabase) {
    const rows = await supabaseRequest("/app_state?id=eq.main&select=id");
    if (!rows.length) {
      const localData = fs.existsSync(dbPath)
        ? normalizeDatabase(JSON.parse(fs.readFileSync(dbPath, "utf8")))
        : starterDatabase();
      await supabaseRequest("/app_state", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ id: "main", data: localData }),
      });
    }
    return;
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(starterDatabase(), null, 2));
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

async function readDatabase() {
  await ensureDatabase();
  if (useSupabase) {
    const rows = await supabaseRequest("/app_state?id=eq.main&select=data");
    return normalizeDatabase(rows[0]?.data || starterDatabase());
  }

  return normalizeDatabase(JSON.parse(fs.readFileSync(dbPath, "utf8")));
}

async function writeDatabase(data) {
  await ensureDatabase();
  const normalized = normalizeDatabase(data);
  if (useSupabase) {
    await supabaseRequest("/app_state?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ id: "main", data: normalized, updated_at: new Date().toISOString() }),
    });
    return;
  }

  fs.writeFileSync(dbPath, JSON.stringify(normalized, null, 2));
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function sendCsv(response, fileName, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  response.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  response.end(csv);
}

function sendDownloadJson(response, fileName, data) {
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data, null, 2));
}

function addActivity(data, type, text, details = {}) {
  if (!Array.isArray(data.activityLog)) data.activityLog = [];
  data.activityLog.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    text,
    details,
    createdAt: new Date().toISOString(),
  });
  data.activityLog = data.activityLog.slice(0, 300);
}

function createAdminCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendAdminLoginCode(code) {
  if (!adminLoginEmail || !adminFromEmail) {
    throw new Error("Admin email code is not set up. Add ADMIN_LOGIN_EMAIL and ADMIN_FROM_EMAIL in Render.");
  }

  if (brevoApiKey) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "South Diamond",
          email: adminFromEmail,
        },
        to: [{ email: adminLoginEmail, name: "South Diamond Admin" }],
        subject: "South Diamond admin login code",
        textContent: `Your South Diamond admin login code is ${code}. It expires in 5 minutes.`,
        htmlContent: `<p>Your South Diamond admin login code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Could not send admin login code.");
    }
    return;
  }

  if (!resendApiKey) {
    throw new Error("Admin email code is not set up. Add BREVO_API_KEY in Render.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `South Diamond <${adminFromEmail}>`,
      to: [adminLoginEmail],
      subject: "South Diamond admin login code",
      text: `Your South Diamond admin login code is ${code}. It expires in 5 minutes.`,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not send admin login code.");
  }
}

async function createTierlockPaymentUrl(user, amount) {
  if (!tierlockMerchantId || !tierlockMerchantSecret) {
    throw new Error("Tierlock is not set up yet.");
  }

  const total = Number(amount);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Choose a valid payment amount.");
  }

  const orderId = `sd-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const response = await fetch("https://api.tierlock.com/api/generateLinkToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: tierlockMerchantId,
      merchant_secret: tierlockMerchantSecret,
      display_name: "South Diamond",
      total,
      order_id: orderId,
      customer: {
        email: user.email,
        phone: user.phone,
        name: user.username,
      },
    }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.success === false || !data.payment_url) {
    throw new Error(data.error || data.message || "Could not create Tierlock payment link.");
  }

  return { paymentUrl: data.payment_url, orderId };
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

function clientKey(request) {
  return String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function getLockout(request) {
  const key = clientKey(request);
  const record = adminLoginAttempts.get(key);
  if (!record?.lockedUntil) return null;
  if (Date.now() >= record.lockedUntil) {
    adminLoginAttempts.delete(key);
    return null;
  }
  return record;
}

function recordFailedAdminLogin(request) {
  const key = clientKey(request);
  const record = adminLoginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 5 * 60 * 1000;
  }
  adminLoginAttempts.set(key, record);
  return record;
}

function clearAdminLoginAttempts(request) {
  adminLoginAttempts.delete(clientKey(request));
}

function secureCookiePart(request) {
  const isHttps = request.headers["x-forwarded-proto"] === "https" || request.socket.encrypted;
  return isHttps ? "; Secure" : "";
}

function requireAdmin(request, response) {
  if (isAdminRequest(request)) return true;
  sendJson(response, 401, { error: "Admin login is required." });
  return false;
}

function isAdminOrExportRequest(request, url) {
  return isAdminRequest(request) || (adminExportToken && url.searchParams.get("token") === adminExportToken);
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

function parseDateOfBirth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { date, value: `${match[1]}-${match[2]}-${match[3]}` };
}

function isAtLeast18(dateOfBirth) {
  const parsed = parseDateOfBirth(dateOfBirth);
  if (!parsed) return false;
  const today = new Date();
  let age = today.getUTCFullYear() - parsed.date.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - parsed.date.getUTCMonth();
  const dayDiff = today.getUTCDate() - parsed.date.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 18;
}

function sanitizePointTransaction(transaction) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    username: transaction.username,
    type: transaction.type,
    points: transaction.points,
    balanceAfter: transaction.balanceAfter,
    note: transaction.note || "",
    createdAt: transaction.createdAt,
  };
}

function sanitizeActivity(item) {
  return {
    id: item.id,
    type: item.type,
    text: item.text,
    details: item.details || {},
    createdAt: item.createdAt,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    dateOfBirth: user.dateOfBirth || null,
    points: Number.isFinite(Number(user.points)) ? Number(user.points) : 0,
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt || user.lastLoginAt || user.createdAt,
    chatId: user.chatId || null,
    adminNote: user.adminNote || "",
  };
}

function safeUploadName(originalName, mimeType) {
  const extension = path.extname(String(originalName || "")).toLowerCase();
  const fallback = mimeType === "image/png" ? ".png" : ".jpg";
  const safeExtension = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension) ? extension : fallback;
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExtension}`;
}

async function getPlayerUser(request) {
  const cookies = parseCookies(request);
  const token = cookies.sd_player_session;
  if (!token) return null;
  const data = await readDatabase();
  const userId = playerSessions.get(token);
  const user =
    (userId && data.users.find((item) => item.id === userId)) ||
    data.users.find((item) => Array.isArray(item.playerSessionTokens) && item.playerSessionTokens.includes(token));
  if (user) playerSessions.set(token, user.id);
  return user || null;
}

async function requirePlayer(request, response) {
  const user = await getPlayerUser(request);
  if (user) return user;
  sendJson(response, 401, { error: "Player login is required." });
  return null;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    request.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > maxJsonBodyBytes) {
        tooLarge = true;
        request.resume();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      if (tooLarge) return;
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
    [adminPath]: "admin.html",
    [adminLoginPath]: "login.html",
    "/maintenance": "maintenance.html",
    "/maintenance.html": "maintenance.html",
  };
  const filePath = path.join(root, routeMap[cleanPath] || cleanPath.replace(/^\/+/, ""));
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function serveFile(response, filePath, statusCode = 200, cacheControl = "no-store") {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(statusCode, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": cacheControl,
  });
  fs.createReadStream(filePath).pipe(response);
}

async function handleApi(request, response, urlPath, url) {
  if (request.method === "POST" && urlPath === "/api/admin/login") {
    const lockout = getLockout(request);
    if (lockout) {
      const minutes = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
      return sendJson(response, 429, { error: `Too many wrong attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` });
    }

    const body = await readBody(request);
    if (body.username !== adminUsername || body.password !== adminPassword) {
      const record = recordFailedAdminLogin(request);
      if (record.lockedUntil && Date.now() < record.lockedUntil) {
        return sendJson(response, 429, { error: "Too many wrong attempts. Admin login is blocked for 5 minutes." });
      }
      return sendJson(response, 401, { error: "Wrong username or password." });
    }

    const code = createAdminCode();
    const pendingLoginId = `admin-login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await sendAdminLoginCode(code);
    } catch (error) {
      return sendJson(response, 500, { error: error.message || "Could not send admin login code." });
    }
    pendingAdminLogins.set(pendingLoginId, {
      code,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return sendJson(response, 200, {
      requiresCode: true,
      pendingLoginId,
      message: "Security code sent to your admin email.",
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/verify-login") {
    const body = await readBody(request);
    const pendingLoginId = String(body.pendingLoginId || "");
    const code = String(body.code || "").replace(/\D/g, "");
    const pending = pendingAdminLogins.get(pendingLoginId);
    if (!pending) return sendJson(response, 400, { error: "Login code expired. Please log in again." });
    if (Date.now() > pending.expiresAt) {
      pendingAdminLogins.delete(pendingLoginId);
      return sendJson(response, 400, { error: "Login code expired. Please log in again." });
    }
    if (code !== pending.code) {
      pending.attempts += 1;
      if (pending.attempts >= 5) pendingAdminLogins.delete(pendingLoginId);
      return sendJson(response, 401, { error: "Wrong security code." });
    }

    pendingAdminLogins.delete(pendingLoginId);
    clearAdminLoginAttempts(request);
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    sessions.add(token);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_admin_session=${token}; HttpOnly${secureCookiePart(request)}; SameSite=Lax; Path=/; Max-Age=86400`,
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

  if (request.method === "GET" && urlPath === "/api/admin/storage") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, {
      storage: useSupabase ? "supabase" : "local-file",
      users: data.users.length,
      chats: data.chats.length,
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/users") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, { users: data.users.map(sanitizeUser) });
  }

  if (request.method === "POST" && urlPath === "/api/admin/user-chat") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });

    let chat = data.chats.find((item) => item.id === user.chatId) || data.chats.find((item) => item.userId === user.id);
    if (!chat) {
      chat = {
        id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: user.username,
        userId: user.id,
        messages: [],
      };
      data.chats.unshift(chat);
    }

    chat.name = user.username;
    chat.userId = user.id;
    chat.unreadForAdmin = 0;
    chat.lastReadByAdminAt = new Date().toISOString();
    user.chatId = chat.id;
    moveChatToTop(data.chats, chat.id);
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "GET" && urlPath === "/api/admin/points") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, {
      transactions: data.pointTransactions.map(sanitizePointTransaction),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/activity") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendJson(response, 200, {
      activity: (data.activityLog || []).map(sanitizeActivity),
    });
  }

  if (request.method === "POST" && urlPath === "/api/admin/points") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const action = String(body.action || "");
    const amount = Number(body.points);
    const note = String(body.note || "").trim();
    if (!userId || !["add", "redeem"].includes(action) || !Number.isInteger(amount) || amount <= 0) {
      return sendJson(response, 400, { error: "Choose a player, action, and whole number of points." });
    }

    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    user.points = Number.isFinite(Number(user.points)) ? Number(user.points) : 0;

    if (action === "redeem" && user.points < amount) {
      return sendJson(response, 400, { error: "Player does not have enough available points." });
    }

    user.points = action === "add" ? user.points + amount : user.points - amount;
    const transaction = {
      id: `points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      username: user.username,
      type: action,
      points: amount,
      balanceAfter: user.points,
      note,
      createdAt: new Date().toISOString(),
    };
    data.pointTransactions.unshift(transaction);
    addActivity(
      data,
      action === "add" ? "points-add" : "points-redeem",
      `${action === "add" ? "Added" : "Redeemed"} ${amount} points for ${user.username}`,
      { userId: user.id, username: user.username, points: amount, balanceAfter: user.points }
    );
    await writeDatabase(data);
    return sendJson(response, 200, {
      user: sanitizeUser(user),
      transaction: sanitizePointTransaction(transaction),
      transactions: data.pointTransactions.map(sanitizePointTransaction),
    });
  }

  if (request.method === "GET" && urlPath === "/api/admin/users.csv") {
    if (!isAdminOrExportRequest(request, url)) {
      return sendJson(response, 401, { error: "Admin login or export token is required." });
    }
    const data = await readDatabase();
    const rows = [
      ["Username", "Phone", "Date of Birth", "Email", "Available Points", "Joined", "Last Login", "Chat ID"],
      ...data.users.map((user) => [
        user.username,
        user.phone,
        user.dateOfBirth || "",
        user.email,
        Number.isFinite(Number(user.points)) ? Number(user.points) : 0,
        user.createdAt || "",
        user.lastLoginAt || "",
        user.chatId || "",
      ]),
    ];
    return sendCsv(response, "south-diamond-players.csv", rows);
  }

  if (request.method === "GET" && urlPath === "/api/admin/backup") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    return sendDownloadJson(response, `south-diamond-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
  }

  if (request.method === "GET" && urlPath === "/api/admin/dashboard") {
    if (!requireAdmin(request, response)) return;
    const data = await readDatabase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeSince = Date.now() - 24 * 60 * 60 * 1000;
    const users = data.users || [];
    const chats = data.chats || [];
    const messages = chats.flatMap((chat) => chat.messages || []);
    const pointTransactions = data.pointTransactions || [];
    return sendJson(response, 200, {
      stats: {
        totalUsers: users.length,
        usersToday: users.filter((user) => new Date(user.createdAt).getTime() >= startOfToday.getTime()).length,
        activePlayers: users.filter((user) => {
          const activeAt = user.lastActiveAt || user.lastLoginAt;
          return activeAt && new Date(activeAt).getTime() >= activeSince;
        }).length,
        openChats: chats.length,
        unreadChats: chats.reduce((total, chat) => total + (Number(chat.unreadForAdmin) || 0), 0),
        totalMessages: messages.length,
        imageUploads: messages.filter((message) => message.imageUrl).length,
        totalPoints: users.reduce((total, user) => total + (Number(user.points) || 0), 0),
        redeemedPoints: pointTransactions
          .filter((transaction) => transaction.type === "redeem")
          .reduce((total, transaction) => total + (Number(transaction.points) || 0), 0),
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

    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });

    user.passwordHash = hashPassword(password);
    addActivity(data, "password-reset", `Reset password for ${user.username}`, { userId: user.id, username: user.username });
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "POST" && urlPath === "/api/admin/user-note") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const userId = String(body.userId || "");
    const note = String(body.note || "").trim().slice(0, 1000);
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === userId);
    if (!user) return sendJson(response, 404, { error: "Player was not found." });
    user.adminNote = note;
    addActivity(data, "player-note", `Updated notes for ${user.username}`, { userId: user.id, username: user.username });
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "POST" && urlPath === "/api/player/signup") {
    const body = await readBody(request);
    const username = String(body.username || "").trim();
    const phone = String(body.phone || "").trim();
    const parsedDateOfBirth = parseDateOfBirth(body.dateOfBirth);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !phone || !parsedDateOfBirth || !email || !password) {
      return sendJson(response, 400, { error: "Username, phone number, date of birth, email, and password are required." });
    }
    if (!isAtLeast18(parsedDateOfBirth.value)) {
      return sendJson(response, 403, { error: "You must be 18 or older to create a South Diamond account." });
    }
    if (password.length < 6) {
      return sendJson(response, 400, { error: "Password must be at least 6 characters." });
    }

    const data = await readDatabase();
    if (data.users.some((user) => user.email === email)) {
      return sendJson(response, 409, { error: "An account with this email already exists." });
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username,
      phone,
      email,
      dateOfBirth: parsedDateOfBirth.value,
      points: 0,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      playerSessionTokens: [token],
      chatId: null,
    };
    data.users.unshift(user);
    addActivity(data, "signup", `New player registered: ${user.username}`, { userId: user.id, username: user.username, email: user.email });
    await writeDatabase(data);

    playerSessions.set(token, user.id);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_player_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${playerSessionMaxAge}`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/player/login") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const data = await readDatabase();
    const user = data.users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(response, 401, { error: "Wrong email or password." });
    }

    user.lastLoginAt = new Date().toISOString();
    user.lastActiveAt = user.lastLoginAt;

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    user.playerSessionTokens = Array.isArray(user.playerSessionTokens) ? user.playerSessionTokens : [];
    user.playerSessionTokens = [...new Set([...user.playerSessionTokens, token])].slice(-8);
    await writeDatabase(data);

    playerSessions.set(token, user.id);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sd_player_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${playerSessionMaxAge}`,
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/player/logout") {
    const cookies = parseCookies(request);
    const token = cookies.sd_player_session;
    if (token) {
      playerSessions.delete(token);
      const data = await readDatabase();
      const user = data.users.find((item) => Array.isArray(item.playerSessionTokens) && item.playerSessionTokens.includes(token));
      if (user) {
        user.playerSessionTokens = user.playerSessionTokens.filter((item) => item !== token);
        await writeDatabase(data);
      }
    }
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "sd_player_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && urlPath === "/api/player/me") {
    const loggedInUser = await getPlayerUser(request);
    if (!loggedInUser) return sendJson(response, 401, { user: null });
    const data = await readDatabase();
    const user = data.users.find((item) => item.id === loggedInUser.id);
    if (!user) return sendJson(response, 401, { user: null });
    const now = Date.now();
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    if (!lastActive || now - lastActive > 60 * 1000) {
      user.lastActiveAt = new Date(now).toISOString();
      await writeDatabase(data);
    }
    return sendJson(response, 200, { user: sanitizeUser(user) });
  }

  if (request.method === "GET" && urlPath === "/api/player/chat") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const data = await readDatabase();
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

    const data = await readDatabase();
    const user = data.users.find((item) => item.email === email);
    if (!user) return sendJson(response, 404, { error: "No account was found for that email." });

    user.passwordHash = hashPassword(password);
    await writeDatabase(data);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === "POST" && urlPath === "/api/player/profile") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    if (!phone) return sendJson(response, 400, { error: "Phone number is required." });
    if (password && password.length < 6) return sendJson(response, 400, { error: "Password must be at least 6 characters." });

    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    savedUser.phone = phone;
    if (password) savedUser.passwordHash = hashPassword(password);
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(savedUser) });
  }

  if (request.method === "POST" && urlPath === "/api/player/tierlock-payment") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    try {
      const payment = await createTierlockPaymentUrl(user, body.amount);
      return sendJson(response, 200, payment);
    } catch (error) {
      return sendJson(response, 400, { error: error.message || "Could not create Tierlock payment link." });
    }
  }

  if (request.method === "POST" && urlPath === "/api/player/avatar") {
    const user = await requirePlayer(request, response);
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

    await ensureDatabase();
    const fileName = safeUploadName(body.fileName, mimeType);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const data = await readDatabase();
    const savedUser = data.users.find((item) => item.id === user.id);
    if (!savedUser) return sendJson(response, 401, { error: "Player login is required." });
    savedUser.avatarUrl = `/uploads/${fileName}`;
    await writeDatabase(data);
    return sendJson(response, 200, { user: sanitizeUser(savedUser) });
  }

  if (request.method === "GET" && urlPath === "/api/chats") {
    if (!requireAdmin(request, response)) return;
    return sendJson(response, 200, { chats: (await readDatabase()).chats });
  }

  if (request.method === "POST" && urlPath === "/api/admin/chats/read") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    const data = await readDatabase();
    const chat = data.chats.find((item) => item.id === threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });
    chat.unreadForAdmin = 0;
    chat.lastReadByAdminAt = new Date().toISOString();
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "POST" && urlPath === "/api/admin/payment-status") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    const messageId = String(body.messageId || "");
    const status = String(body.status || "");
    if (!threadId || !messageId || !["pending", "approved", "rejected"].includes(status)) {
      return sendJson(response, 400, { error: "Choose a payment screenshot and status." });
    }
    const data = await readDatabase();
    const chat = data.chats.find((item) => item.id === threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });
    const message = (chat.messages || []).find((item) => item.id === messageId && item.imageUrl);
    if (!message) return sendJson(response, 404, { error: "Payment screenshot was not found." });
    message.paymentStatus = status;
    addActivity(data, "payment-status", `Marked ${chat.name}'s payment ${status}`, { threadId, messageId, status, username: chat.name });
    await writeDatabase(data);
    return sendJson(response, 200, { chat });
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-message") {
    const user = await requirePlayer(request, response);
    if (!user) return;
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    if (!text) return sendJson(response, 400, { error: "Message is required." });

    const data = await readDatabase();
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
    chat.messages.push({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, author: "player", text, createdAt: new Date().toISOString() });
    chat.unreadForAdmin = (Number(chat.unreadForAdmin) || 0) + 1;
    moveChatToTop(data.chats, chat.id);
    await writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-upload") {
    const user = await requirePlayer(request, response);
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

    await ensureDatabase();
    const fileName = safeUploadName(body.fileName, mimeType);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const data = await readDatabase();
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
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: "player",
      text: note || "Payment screenshot attached.",
      imageUrl: `/uploads/${fileName}`,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    });
    chat.unreadForAdmin = (Number(chat.unreadForAdmin) || 0) + 1;
    moveChatToTop(data.chats, chat.id);
    await writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/operator-message") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    if (!text || !body.threadId) return sendJson(response, 400, { error: "Thread and message are required." });

    const data = await readDatabase();
    const chat = data.chats.find((item) => item.id === body.threadId);
    if (!chat) return sendJson(response, 404, { error: "Chat was not found." });

    chat.messages.push({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, author: "operator", text, createdAt: new Date().toISOString() });
    chat.unreadForAdmin = 0;
    chat.lastReadByAdminAt = new Date().toISOString();
    addActivity(data, "chat-reply", `Replied to ${chat.name}`, { threadId: chat.id, username: chat.name });
    await writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "DELETE" && urlPath === "/api/chats") {
    if (!requireAdmin(request, response)) return;
    const body = await readBody(request);
    const threadId = String(body.threadId || "");
    if (!threadId) return sendJson(response, 400, { error: "Choose a chat to delete." });

    const data = await readDatabase();
    data.chats = data.chats.filter((chat) => chat.id !== threadId);
    data.users = data.users.map((user) => (user.chatId === threadId ? { ...user, chatId: null } : user));
    addActivity(data, "chat-delete", "Deleted a selected chat", { threadId });
    await writeDatabase(data);
    return sendJson(response, 200, { chats: data.chats });
  }

  return sendJson(response, 404, { error: "API route was not found." });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname, url);
      return;
    }

    const isPublicAsset =
      url.pathname.startsWith("/assets/") ||
      url.pathname === "/styles.css" ||
      url.pathname === "/script.js" ||
      url.pathname === "/service-worker.js" ||
      url.pathname === "/manifest.webmanifest";
    const isAdminRoute = url.pathname === adminPath || url.pathname === adminLoginPath;
    if (maintenanceMode && !isAdminRoute && !isPublicAsset && !url.pathname.startsWith("/uploads/")) {
      const maintenancePath = publicFilePath("/maintenance.html");
      if (maintenancePath && fs.existsSync(maintenancePath)) {
        serveFile(response, maintenancePath, 503);
        return;
      }
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

    if (["/admin", "/admin.html", "/login.html"].includes(url.pathname)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    if (url.pathname === adminPath && !isAdminRequest(request)) {
      response.writeHead(302, { Location: adminLoginPath });
      response.end();
      return;
    }

    if (url.pathname === adminLoginPath && isAdminRequest(request)) {
      response.writeHead(302, { Location: adminPath });
      response.end();
      return;
    }

    const filePath = publicFilePath(url.pathname);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    serveFile(response, filePath);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
}

ensureDatabase()
  .then(() => {
    http.createServer(handleRequest).listen(port, () => {
      console.log(`South Diamond server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("South Diamond could not start:", error.message);
    process.exit(1);
  });
