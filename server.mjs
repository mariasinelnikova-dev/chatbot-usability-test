import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync, watch } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(".");
const port = 4173;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const LIVE_RELOAD_SNIPPET = `\n<script>\n(function(){\n  const es = new EventSource('/__live');\n  es.addEventListener('reload', () => window.location.reload());\n  es.onerror = () => { setTimeout(() => window.location.reload(), 1000); };\n})();\n</script>\n`;

const liveClients = new Set();

function broadcastReload() {
  for (const client of liveClients) {
    try {
      client.write("event: reload\ndata: 1\n\n");
    } catch {
      liveClients.delete(client);
    }
  }
}

let debounceTimer = null;
const watchedExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".svg", ".png"]);
const ignoredPaths = /(^|[\\/])(\.git|node_modules|\.DS_Store)([\\/]|$)/;

/* Следим за всем деревом: список файлов быстро устаревает, а новые страницы
   вроде rating/lottie/preview.html тогда молча остаются без перезагрузки */
try {
  watch(root, { recursive: true }, (_event, filename) => {
    if (!filename || ignoredPaths.test(filename)) return;
    if (!watchedExtensions.has(extname(filename).toLowerCase())) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(broadcastReload, 100);
  });
} catch (error) {
  console.warn("Живая перезагрузка недоступна:", error.message);
}

const server = createServer((req, res) => {
  if (req.url === "/__live") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    res.write("retry: 1000\n\n");
    liveClients.add(res);
    req.on("close", () => liveClients.delete(res));
    return;
  }

  const urlPath = (req.url ?? "/").split("?")[0];
  let filePath = join(root, decodeURIComponent(urlPath));

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    "content-type": mimeTypes[ext] ?? "application/octet-stream",
    "cache-control": "no-store",
  });

  if (ext === ".html") {
    const html = readFileSync(filePath, "utf8").replace(
      "</body>",
      `${LIVE_RELOAD_SNIPPET}</body>`,
    );
    res.end(html);
    return;
  }

  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Prototype server: http://localhost:${port}`);
});
