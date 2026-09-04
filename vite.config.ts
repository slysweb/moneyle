import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { applyPageMeta, crawlerPages, metaForPath } from "./src/lib/pageMeta.ts";

function gameHtmlMeta(): Plugin {
  return {
    name: "game-html-meta",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          next();
          return;
        }
        const pathname = req.url ? new URL(req.url, "http://vite.local").pathname : "";
        const page = metaForPath(pathname);
        if (!page) {
          next();
          return;
        }
        try {
          const raw = fs.readFileSync(path.resolve("index.html"), "utf8");
          const html = applyPageMeta(raw, page, page.path);
          const transformed = await server.transformIndexHtml(pathname, html);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(transformed);
        } catch (err) {
          next(err);
        }
      });
    },
    writeBundle(options) {
      const dir = options.dir;
      if (!dir) return;
      const indexPath = path.join(dir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const html = fs.readFileSync(indexPath, "utf8");
      for (const page of crawlerPages()) {
        const slug = page.path.replace(/^\//, "");
        const rewritten = applyPageMeta(html, page, page.path);
        const htmlFile = path.join(dir, `${slug}.html`);
        fs.mkdirSync(path.dirname(htmlFile), { recursive: true });
        fs.writeFileSync(htmlFile, rewritten);
        const nested = path.join(dir, slug);
        fs.mkdirSync(nested, { recursive: true });
        fs.writeFileSync(path.join(nested, "index.html"), rewritten);
      }
    },
  };
}

export default defineConfig({
  plugins: [gameHtmlMeta(), react(), cloudflare()],
});
