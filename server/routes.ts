import express from "express";

const api = express.Router();
api.use(express.json());

// Health
api.get("/ping", (_req, res) => res.json({ ok: true }));

// Robust Drive PDF proxy (unchanged)
async function fetchDrivePdfBytes(fileId: string): Promise<Uint8Array> {
  const tryUrls = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
  ];

  for (const url of tryUrls) {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/pdf,*/*" },
      redirect: "follow",
    });
    const buf = new Uint8Array(await r.arrayBuffer());
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const isPdf =
      ct.includes("application/pdf") ||
      (buf.length > 4 && String.fromCharCode(buf[0], buf[1], buf[2], buf[3]) === "%PDF");

    if (isPdf) return buf;

    // handle Drive interstitial page (confirm token)
    const html = new TextDecoder().decode(buf);
    const m = html.match(/confirm=([0-9A-Za-z_\-]+)/);
    if (m) {
      const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${m[1]}&id=${encodeURIComponent(fileId)}`;
      const r2 = await fetch(confirmUrl, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/pdf,*/*" },
        redirect: "follow",
      });
      const buf2 = new Uint8Array(await r2.arrayBuffer());
      const ct2 = (r2.headers.get("content-type") || "").toLowerCase();
      const isPdf2 =
        ct2.includes("application/pdf") ||
        (buf2.length > 4 && String.fromCharCode(buf2[0], buf2[1], buf2[2], buf2[3]) === "%PDF");
      if (isPdf2) return buf2;
    }
  }

  throw new Error("Drive proxy could not retrieve a valid PDF (ensure public sharing).");
}

// GET /api/drive/pdf/:id -> returns raw PDF bytes
api.get("/drive/pdf/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("Missing id");
    const bytes = await fetchDrivePdfBytes(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).end(Buffer.from(bytes));
  } catch (e: any) {
    console.error("drive proxy error:", e);
    res.status(502).send(e?.message || "Failed to fetch PDF");
  }
});

// Replace translate handler with stricter chunking + debug headers + optional MyMemory disable
api.post("/translate", async (req, res) => {
  try {
    const { text, target, source } = (req.body ?? {}) as { text?: string; target?: string; source?: string };
    if (!text) return res.status(400).json({ error: "Missing text" });

    const tgt = (target || "en").toLowerCase();
    const src = (source || "auto").toLowerCase();
    const sanitizeLang = (code: string) => {
      const c = String(code || "").toLowerCase();
      return /^[a-z]{2}(-[a-z]{2})?$/.test(c) ? c : "en";
    };
    const tgtSan = sanitizeLang(tgt);
    const srcSan = src === "auto" ? "auto" : sanitizeLang(src);

    // If user selected same source and target (and not auto), skip translation
    if (srcSan !== "auto" && srcSan === tgtSan) {
      return res.json({ translatedText: text });
    }

    const azureKey = process.env.AZURE_TRANSLATOR_KEY;
    const azureRegion = process.env.AZURE_TRANSLATOR_REGION;
    const libreUrlEnv = process.env.LIBRE_TRANSLATE_URL; // prefer self-hosted if available
    const disableMyMemory = String(process.env.DISABLE_MYMEMORY || "").toLowerCase() === "true";

    // Try these Libre endpoints in order
    const libreUrls = [
      ...(libreUrlEnv ? [libreUrlEnv] : []),
      "https://libretranslate.com/translate",
      "https://translate.argosopentech.com/translate",
      "https://libretranslate.de/translate",
    ];

    const isJson = (r: Response) => (r.headers.get("content-type") || "").toLowerCase().includes("application/json");

    // Limits (be stricter than provider)
    const RAW_LIMIT = 380;  // raw characters, under MyMemory 500
    const ENC_LIMIT = 450;  // URL-encoded length, conservative

    // Split by sentences/whitespace honoring both raw and encoded limits
    function chunkSmart(t: string, rawLimit = RAW_LIMIT, encLimit = ENC_LIMIT): string[] {
      const chunks: string[] = [];
      let buf = "";
      const parts = t.split(/(\n+|[.!?]\s+|\s+)/); // keep separators
      for (const part of parts) {
        const candidate = buf + part;
        const rawTooLong = candidate.length > rawLimit && buf.trim();
        const encTooLong = encodeURIComponent(candidate).length > encLimit && buf.trim();
        if (rawTooLong || encTooLong) {
          chunks.push(buf.trim());
          buf = part.trimStart();
          // If even this piece is huge (e.g., long token), hard-slice it
          while (buf && (buf.length > rawLimit || encodeURIComponent(buf).length > encLimit)) {
            let len = Math.max(1, Math.floor(buf.length / 2));
            let slice = buf.slice(0, len);
            while ((slice.length > rawLimit || encodeURIComponent(slice).length > encLimit) && len > 1) {
              len = Math.floor(len / 2);
              slice = buf.slice(0, len);
            }
            chunks.push(slice.trim());
            buf = buf.slice(slice.length).trimStart();
          }
        } else {
          buf = candidate;
        }
      }
      if (buf.trim()) chunks.push(buf.trim());
      return chunks.filter(Boolean);
    }

    async function detectLang(q: string): Promise<string> {
      // 1) Azure detect (if configured)
      if (azureKey && azureRegion) {
        try {
          const r = await fetch(
            "https://api.cognitive.microsofttranslator.com/detect?api-version=3.0",
            {
              method: "POST",
              headers: {
                "Ocp-Apim-Subscription-Key": String(azureKey),
                "Ocp-Apim-Subscription-Region": String(azureRegion),
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify([{ Text: q.slice(0, 1000) }]),
            }
          );
          const ct = (r.headers.get("content-type") || "").toLowerCase();
          if (r.ok && ct.includes("application/json")) {
            const data: any = await r.json();
            const lang = data?.[0]?.language;
            if (lang) return sanitizeLang(lang);
          }
        } catch {}
      }

      // 2) LibreTranslate detect on any available instance
      const bases = [
        ...(libreUrlEnv ? [libreUrlEnv.replace(/\/translate$/, "")] : []),
        "https://libretranslate.com",
        "https://translate.argosopentech.com",
        "https://libretranslate.de",
      ];
      for (const base of bases) {
        try {
          const r = await fetch(`${base}/detect`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ q: q.slice(0, 1000) }),
          });
          const ct = (r.headers.get("content-type") || "").toLowerCase();
          if (r.ok && ct.includes("application/json")) {
            const arr: any[] = await r.json();
            const best = Array.isArray(arr) ? arr[0] : undefined;
            if (best?.language) return sanitizeLang(best.language);
          }
        } catch {}
      }

      // 3) Fallback
      return "en";
    }

    async function viaAzure(qs: string[]): Promise<string[]> {
      if (!azureKey || !azureRegion) throw new Error("Azure not configured");
      const out: string[] = [];
      for (const q of qs) {
        const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${encodeURIComponent(tgtSan)}${
          srcSan !== "auto" ? `&from=${encodeURIComponent(srcSan)}` : ""
        }`;
        const r = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": String(azureKey),
            "Ocp-Apim-Subscription-Region": String(azureRegion),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify([{ Text: q }]),
        });
        if (!(r.ok && isJson(r))) throw new Error(`Azure failed ${r.status}`);
        const data: any = await r.json();
        const translated = data?.[0]?.translations?.[0]?.text;
        if (!translated) throw new Error("Azure empty");
        out.push(translated);
      }
      return out;
    }

    async function viaLibre(qs: string[]): Promise<string[]> {
      const out: string[] = [];
      let lastErr: any;
      for (const q of qs) {
        let success = false;
        for (const url of libreUrls) {
          try {
            const r = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ q, source: srcSan, target: tgtSan, format: "text" }),
            });
            if (r.ok && isJson(r)) {
              const data: any = await r.json();
              const translated = data?.translatedText;
              if (translated) {
                out.push(translated);
                success = true;
                break;
              }
            } else {
              lastErr = `${r.status} ${await r.text().catch(() => "")}`;
            }
          } catch (e) {
            lastErr = e;
          }
        }
        if (!success) throw new Error(`Libre failed: ${String(lastErr || "unknown")}`);
      }
      return out;
    }

    // Recursively split any chunk that still trips MyMemory's limit
    async function myMemoryOne(q: string): Promise<string> {
      // extra guard
      if (q.length > RAW_LIMIT || encodeURIComponent(q).length > ENC_LIMIT) {
        const mid = Math.floor(q.length / 2);
        const leftBreak = q.lastIndexOf(" ", mid);
        const rightBreak = q.indexOf(" ", mid + 1);
        const splitAt =
          leftBreak !== -1 && rightBreak !== -1
            ? (mid - leftBreak < rightBreak - mid ? leftBreak : rightBreak)
            : (leftBreak !== -1 ? leftBreak : (rightBreak !== -1 ? rightBreak : mid));
        const left = q.slice(0, splitAt).trim();
        const right = q.slice(splitAt).trim();
        const [a, b] = await Promise.all([myMemoryOne(left), myMemoryOne(right)]);
        return `${a} ${b}`.trim();
      }

      const srcForPair = srcSan === "auto" ? await detectLang(q) : srcSan;
      const tgtForPair = tgtSan;

      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", q);
      url.searchParams.set("langpair", `${srcForPair}|${tgtForPair}`);
      const r2 = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const ct = (r2.headers.get("content-type") || "").toLowerCase();
      const okJson = ct.includes("application/json");
      const body = okJson ? await r2.json() : await r2.text();
      const details = okJson ? (body as any)?.responseDetails || "" : String(body);
      if (details && details.toUpperCase().includes("QUERY LENGTH LIMIT EXCEEDED")) {
        const mid = Math.floor(q.length / 2);
        const left = q.slice(0, mid).trim();
        const right = q.slice(mid).trim();
        const [a, b] = await Promise.all([myMemoryOne(left), myMemoryOne(right)]);
        return `${a} ${b}`.trim();
      }
      const translated = okJson ? (body as any)?.responseData?.translatedText : "";
      if (!translated) throw new Error(`MyMemory failed ${r2.status}`);
      return translated;
    }

    async function viaMyMemory(qs: string[]): Promise<string[]> {
      const out: string[] = [];
      for (const q of qs) out.push(await myMemoryOne(q));
      return out;
    }

    const chunks = chunkSmart(text);
    // Debug headers to verify chunking is active
    res.setHeader("x-translate-chunks", String(chunks.length));
    res.setHeader("x-translate-raw-avg", String(Math.round(chunks.reduce((s, c) => s + c.length, 0) / Math.max(1, chunks.length))));
    res.setHeader("x-translate-enc-avg", String(Math.round(chunks.reduce((s, c) => s + encodeURIComponent(c).length, 0) / Math.max(1, chunks.length))));

    let translatedChunks: string[] | null = null;
    let provider = "unknown";

    if (azureKey && azureRegion) {
      try {
        translatedChunks = await viaAzure(chunks);
        provider = "azure";
      } catch (e) {
        console.warn("Azure failed, falling back:", e);
      }
    }
    if (!translatedChunks) {
      try {
        translatedChunks = await viaLibre(chunks);
        provider = "libre";
      } catch (e) {
        console.warn("Libre failed, falling back:", e);
      }
    }
    if (!translatedChunks && !disableMyMemory) {
      translatedChunks = await viaMyMemory(chunks);
      provider = "mymemory";
    }
    if (!translatedChunks) {
      return res.status(502).json({ error: "All translation providers failed. Try again later." });
    }

    res.setHeader("x-translate-provider", provider);
    return res.json({ translatedText: translatedChunks.join(" ") });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

export function buildApiRouter() {
  return api;
}
