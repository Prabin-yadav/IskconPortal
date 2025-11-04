import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { fetchJsonStrict } from "@/lib/http";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function extractDriveId(link: string | null | undefined) {
  if (!link) return null;
  const m1 = link.match(/[?&]id=([^&]+)/)?.[1];
  const m2 = link.match(/\/file\/d\/([^\/]+)/)?.[1];
  return m1 || m2 || null;
}

function toDrivePreview(link: string) {
  const id = extractDriveId(link);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  if (link.includes("export=download")) return link.replace("export=download", "export=view");
  return link;
}

function toDriveDownload(link: string) {
  const id = extractDriveId(link);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : link;
}

// Add a helper to map Book.language -> ISO code
function mapLangNameToCode(name?: string): string {
  const n = String(name || "").toLowerCase();
  const map: Record<string, string> = {
    english: "en",
    hindi: "hi",
    nepali: "ne",
    bengali: "bn",
    marathi: "mr",
    gujarati: "gu",
    tamil: "ta",
    telugu: "te",
    kannada: "kn",
    malayalam: "ml",
    sanskrit: "sa",
    // fallbacks
    en: "en", hi: "hi", ne: "ne", bn: "bn", mr: "mr", gu: "gu", ta: "ta", te: "te", kn: "kn", ml: "ml", sa: "sa",
  };
  return map[n] || "auto";
}

export default function PDFReader() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<any | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [pdfTextUrl, setPdfTextUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Translation UI
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [translatedText, setTranslatedText] = useState("");

  // NEW: keep original page text in state and loading indicator
  const [originalText, setOriginalText] = useState("");
  const [pageLoading, setPageLoading] = useState(false);

  const pdfDocRef = useRef<any | null>(null);
  const [initializingPdf, setInitializingPdf] = useState(false);

  // Show translation panel only after user clicks translate (or after there’s a result)
  const [showTranslatePanel, setShowTranslatePanel] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  // After user clicks Translate once, keep translating on page changes
  const [autoTranslate, setAutoTranslate] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!id) throw new Error("Missing book id");
        const snap = await getDoc(doc(db, "books", id));
        if (!snap.exists()) throw new Error("Book not found");
        const data = snap.data();
        if (ignore) return;

        setBook(data);
        setSourceLanguage(mapLangNameToCode(data?.language));

        if (data.driveLink) {
          const fileId = extractDriveId(data.driveLink);
          setEmbedUrl(toDrivePreview(data.driveLink));
          setDownloadUrl(toDriveDownload(data.driveLink));
          setPdfTextUrl(fileId ? `/api/drive/pdf/${fileId}` : null);
        } else {
          setError("No driveLink found on this book.");
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  async function ensurePdfLoaded() {
    if (pdfDocRef.current || !pdfTextUrl) return;
    setInitializingPdf(true);
    try {
      const resp = await fetch(pdfTextUrl);
      const ct = (resp.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/pdf")) {
        const sample = (await resp.text()).slice(0, 200);
        throw new Error("Proxy did not return a PDF. Sample: " + sample); 
      }
      const ab = await resp.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: ab });
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages || 0);
      setCurrentPage(1);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setInitializingPdf(false);
    }
  }

  // Order-preserving, line-aware text extraction
  function normalizeItemsToText(items: any[]): string {
    type Piece = { str: string; x: number; y: number; fontSize: number };
    const pieces: Piece[] = items.map((it: any) => {
      // transform: [a, b, c, d, e, f]; e = x, f = y in viewport coords
      const [ , , , , e, f ] = it.transform || [0,0,0,0,0,0];
      const fs = it.height || 0;
      return { str: it.str || "", x: e || 0, y: f || 0, fontSize: fs };
    });
    // Group by line (tolerance on Y)
    const yTol = 3; // px
    pieces.sort((a,b) => (b.y - a.y) || (a.x - b.x)); // y desc (PDF origin bottom-left), then x asc
    const lines: Piece[][] = [];
    for (const p of pieces) {
      const last = lines[lines.length - 1];
      if (!last) { lines.push([p]); continue; }
      const sameLine = Math.abs(last[0].y - p.y) <= yTol;
      if (sameLine) last.push(p);
      else lines.push([p]);
    }
    // Sort pieces within each line by X and join with spaces
    const joined = lines.map(line => {
      line.sort((a,b) => a.x - b.x);
      // Insert spaces if gap is large (heuristic)
      let s = "";
      for (let i=0;i<line.length;i++) {
        const cur = line[i];
        s += cur.str;
        if (i < line.length - 1) {
          const next = line[i+1];
          if (next.x - cur.x > (cur.fontSize || 8) * 0.6) s += " ";
        }
      }
      return s;
    }).join("\n");
    // Clean up hyphenation and extra spaces
    return joined
      .replace(/-\n/g, "")          // de-hyphenate line breaks
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  async function extractPageText(pageNum: number) {
    await ensurePdfLoaded();
    if (!pdfDocRef.current) throw new Error("PDF not loaded");
    const page = await pdfDocRef.current.getPage(pageNum);
    const content = await page.getTextContent().catch(() => ({ items: [] as any[] }));
    const text = normalizeItemsToText(content.items as any[]);
    return text || "";
  }

  // Translate helper used by button and by auto-translate on page change
  async function translateText(text: string) {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }
    setIsTranslating(true);
    setShowTranslatePanel(true);
    try {
      const sameLang = sourceLanguage !== "auto" && sourceLanguage === targetLanguage;
      if (sameLang) {
        setTranslatedText(text);
        return;
      }
      const data = await fetchJsonStrict<{ translatedText: string }>("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target: targetLanguage, source: sourceLanguage }),
      });
      setTranslatedText(data.translatedText || "");
    } catch (e: any) {
      setTranslatedText("");
      setError(e?.message || String(e));
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleTranslate() {
    setAutoTranslate(true); // enable auto-translate for subsequent page changes
    await translateText(originalText);
  }

  // Initialize PDF and page 1 text
  useEffect(() => {
    (async () => {
      if (!pdfTextUrl) return;
      await ensurePdfLoaded();
      await loadPage(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfTextUrl]);

  // NEW: load page text into state (no async in render)
  async function loadPage(pageNum: number) {
    setPageLoading(true);
    setTranslatedText("");
    try {
      await ensurePdfLoaded();
      const txt = await extractPageText(pageNum);
      setOriginalText(txt || "(No text detected on this page)");
      setCurrentPage(pageNum);
      // If user enabled auto-translate, translate this page automatically
      if (autoTranslate && txt.trim()) {
        await translateText(txt);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setPageLoading(false);
    }
  }

  const goFullscreen = () => {
    const el = viewerRef.current;
    if (!el) return;
    // Try Fullscreen API
    // @ts-expect-error vendor prefixes
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) req.call(el);
  }

  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    loadPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage >= totalPages) return;
    loadPage(currentPage + 1);
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!book) return null;

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-3 mb-3 md:mb-0">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-extrabold">{book.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {downloadUrl && (
            <Button asChild variant="secondary">
              <a href={downloadUrl} download>
                <ExternalLink className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
          {embedUrl && (
            <Button asChild variant="secondary">
              <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                View in Tab
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={goFullscreen}>Fullscreen</Button>
        </div>
      </div>

      {/* Large PDF viewer */}
      <div ref={viewerRef} className="bg-background border rounded-lg overflow-hidden mb-4">
        {embedUrl ? (
          <iframe
            title={book?.title || "PDF"}
            src={embedUrl}
            className="w-full h-[85vh] border-0"
            allow="autoplay"
          />
        ) : (
          <div className="p-6 text-sm text-muted-foreground">No preview available</div>
        )}
      </div>

      {/* Translate toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page</span>
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1 || pageLoading}>
            &lt;
          </Button>
          <span className="text-sm font-medium">
            {currentPage}{totalPages ? ` / ${totalPages}` : ""}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages || pageLoading}>
            &gt;
          </Button>
          {initializingPdf && <span className="ml-3 text-sm text-muted-foreground">Loading PDF…</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From</span>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="border rounded-md p-2 text-sm"
              title="From language"
            >
              <option value="auto">Auto</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ne">Nepali</option>
              <option value="bn">Bengali</option>
              <option value="mr">Marathi</option>
              <option value="gu">Gujarati</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="sa">Sanskrit</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">→</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="border rounded-md p-2 text-sm"
              title="To language"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ne">Nepali</option>
              <option value="bn">Bengali</option>
              <option value="mr">Marathi</option>
              <option value="gu">Gujarati</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="sa">Sanskrit</option>
            </select>
          </div>
          <Button onClick={handleTranslate} disabled={isTranslating || pageLoading || !pdfTextUrl}>
            {isTranslating ? "Translating..." : "Translate current page"}
          </Button>
        </div>
      </div>

      {/* Show translation panel only after user initiates translate */}
      {showTranslatePanel && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Original Text</h2>
              <div className="whitespace-pre-wrap break-words text-sm">
                {pageLoading ? "Loading page text…" : originalText || "(No text detected)"}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Translated Text</h2>
              <div className="whitespace-pre-wrap break-words text-sm">
                {translatedText || (isTranslating ? "Translating…" : "(Click Translate to see the result)")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
