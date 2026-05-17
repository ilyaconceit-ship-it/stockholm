/**
 * Node.js HTTP server wrapper for Render.com deployment.
 * Wraps the TanStack Start Cloudflare-style fetch handler.
 *
 * Build output structure:
 *   dist/client/  — static assets
 *   dist/server/index.js — SSR fetch handler
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  ".js":    "application/javascript; charset=utf-8",
  ".mjs":   "application/javascript; charset=utf-8",
  ".css":   "text/css; charset=utf-8",
  ".html":  "text/html; charset=utf-8",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".ttf":   "font/ttf",
  ".json":  "application/json",
  ".webp":  "image/webp",
  ".mp3":   "audio/mpeg",
  ".map":   "application/json",
};

// Load the built server entry (dist/server/server.js)
const serverEntryPath = join(__dirname, "dist", "server", "server.js");
console.log(`Loading server entry: ${serverEntryPath}`);
const { default: serverHandler } = await import(serverEntryPath);

const clientDir = join(__dirname, "dist", "client");

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost`);
    const pathname = url.pathname;

    // Serve static files from dist/client
    if (pathname !== "/") {
      const staticPath = join(clientDir, pathname);
      if (existsSync(staticPath)) {
        const stat = statSync(staticPath);
        if (stat.isFile()) {
          const ext = extname(staticPath);
          const mime = MIME[ext] || "application/octet-stream";
          res.setHeader("Content-Type", mime);
          // Immutable cache for hashed assets
          if (pathname.startsWith("/assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else {
            res.setHeader("Cache-Control", "public, max-age=3600");
          }
          createReadStream(staticPath).pipe(res);
          return;
        }
      }
    }

    // Build Web API Request from Node.js request
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value != null) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
    const webRequest = new Request(`${protocol}://${host}${req.url}`, {
      method: req.method,
      headers,
      body: body?.length ? body : undefined,
      // Required for some fetch implementations
      duplex: "half",
    });

    // Call the Cloudflare-style fetch handler
    const webResponse = await serverHandler.fetch(webRequest, process.env, {});

    // Write response back
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await webResponse.arrayBuffer();
    res.end(Buffer.from(responseBody));

  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      res.end("Internal Server Error");
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Stockholm running on http://0.0.0.0:${PORT}`);
});
