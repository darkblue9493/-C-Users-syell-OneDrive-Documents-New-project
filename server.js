const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, "data");
const dbPath = path.join(dataDir, "chats.json");

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
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ chats: starterChats }, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDatabase(data) {
  ensureDatabase();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
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

function listProjectFiles() {
  return fs.readdirSync(root).sort();
}

async function handleApi(request, response, urlPath) {
  if (request.method === "GET" && urlPath === "/api/chats") {
    return sendJson(response, 200, readDatabase());
  }

  if (request.method === "POST" && urlPath === "/api/chats/player-message") {
    const body = await readBody(request);
    const text = String(body.text || "").trim();
    const name = String(body.name || "New Player").trim() || "New Player";
    if (!text) return sendJson(response, 400, { error: "Message is required." });

    const data = readDatabase();
    let chat = data.chats.find((item) => item.id === body.threadId);
    if (!chat) {
      chat = { id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, messages: [] };
      data.chats.unshift(chat);
    }

    chat.name = name;
    chat.messages.push({ author: "player", text, createdAt: new Date().toISOString() });
    writeDatabase(data);
    return sendJson(response, 200, { chat, chats: data.chats });
  }

  if (request.method === "POST" && urlPath === "/api/chats/operator-message") {
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
    writeDatabase({ chats: [] });
    return sendJson(response, 200, { chats: [] });
  }

  return sendJson(response, 404, { error: "API route was not found." });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname === "/health") {
      return sendJson(response, 200, {
        ok: true,
        root,
        files: listProjectFiles(),
        hasAdmin: fs.existsSync(path.join(root, "admin.html")),
      });
    }

    if (url.pathname === "/files") {
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      response.end(listProjectFiles().join("\n"));
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
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
  console.log(`Project root: ${root}`);
  console.log(`Project files: ${listProjectFiles().join(", ")}`);
  console.log(`Admin page found: ${fs.existsSync(path.join(root, "admin.html"))}`);
});
