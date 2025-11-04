import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multerPkg from "multer";
const multer = (multerPkg as any).default ?? multerPkg;
// Ensure dev uses the current TS route, avoid stale .js
import { buildApiRouter } from "./routes";

(async () => {
  const app = express();
  const __dirnameESM = path.dirname(fileURLToPath(import.meta.url));
  const clientRoot = path.resolve(__dirnameESM, "..", "client");

  // ---------- API FIRST ----------
  app.use("/api", express.json());
  // serve uploaded images
  app.use("/uploads", express.static(path.resolve(__dirnameESM, "uploads")));

  // mount existing routes
  app.use("/api", buildApiRouter());

  // ---- donations storage helpers ----
  const dataDir = path.resolve(__dirnameESM, "data");
  await fs.mkdir(dataDir, { recursive: true });
  const donationsFile = path.join(dataDir, "donations.json");
  async function readDonations() {
    try {
      return JSON.parse(await fs.readFile(donationsFile, "utf-8"));
    } catch {
      await fs.writeFile(donationsFile, "[]");
      return [];
    }
  }
  async function writeDonations(list: any[]) {
    await fs.writeFile(donationsFile, JSON.stringify(list, null, 2));
  }

  // ---- multer for proof image ----
  const proofDir = path.resolve(__dirnameESM, "uploads", "payment-proofs");
  await fs.mkdir(proofDir, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, proofDir),
      filename: (_req, file, cb) =>
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname || "").toLowerCase()}`),
    }),
    fileFilter: (_req, file, cb) => {
      if ((file.mimetype || "").startsWith("image/")) cb(null, true);
      else cb(new Error("Only images are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  // ---- donations API (place BEFORE any /api 404) ----
  app.get("/api/donations", async (req, res) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    const list = await readDonations();
    const out = email ? list.filter((d: any) => (d.email || "").toLowerCase() === email) : list;
    out.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(out);
  });

  // CHANGE: accept both "proof" and "details" files
  app.post(
    "/api/donations",
    upload.fields([
      { name: "proof", maxCount: 1 },
      { name: "details", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const { donorName, email, phone, amount, purpose, note } = req.body ?? {};
        const amt = Number(amount);
        if (!donorName || !email || !purpose || !Number.isFinite(amt) || amt <= 0) {
          return res.status(400).json({ error: "Invalid input (name, email, purpose, amount required)" });
        }
        const list = await readDonations();

        const files = (req as any).files as Record<string, Array<{ filename: string }>> | undefined;
        const proofFile = files?.proof?.[0];
        const detailsFile = files?.details?.[0];

        const item = {
          id: crypto.randomUUID(),
          donorName: String(donorName).trim(),
          email: String(email).trim(),
          ...(phone ? { phone: String(phone).trim() } : {}),
          amount: amt,
          purpose: String(purpose).trim(),
          ...(note ? { note: String(note).trim() } : {}),
          date: new Date().toISOString(),
          status: "pending" as const,
          proofImageUrl: proofFile ? `/uploads/payment-proofs/${proofFile.filename}` : undefined,
          detailsImageUrl: detailsFile ? `/uploads/payment-proofs/${detailsFile.filename}` : undefined,
        };
        list.unshift(item);
        await writeDonations(list);
        res.status(201).json(item);
      } catch (e: any) {
        res.status(500).json({ error: e?.message || "Failed to save donation" });
      }
    }
  );

  app.patch("/api/donations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body ?? {};
      if (!["pending", "verified", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const list = await readDonations();
      const idx = list.findIndex((d: any) => d.id === id);
      if (idx === -1) return res.status(404).json({ error: "Donation not found" });
      list[idx].status = status;
      await writeDonations(list);
      res.json(list[idx]);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to update donation" });
    }
  });

  console.log("API routes mounted: /api/drive/pdf/:id, /api/translate, /api/ping, /api/donations[GET,POST,PATCH]");
  // IMPORTANT: API 404 must be AFTER the donation routes
  app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));

  // ---------- Vite middleware (dev) or static (prod) ----------
  const port = Number(process.env.PORT) || 5000;
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: clientRoot,
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    // SPA fallback using client/index.html transformed by Vite
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let html = await fs.readFile(path.resolve(clientRoot, "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.setHeader("Content-Type", "text/html");
        res.status(200).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Serve built client
    const distDir = path.resolve(clientRoot, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
})();
