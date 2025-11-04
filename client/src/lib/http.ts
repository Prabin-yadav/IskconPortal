export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || res.statusText);
    }
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }

  if (isJson) return res.json() as Promise<T>;
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

export async function fetchJsonStrict<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const isJson = ct.includes("application/json");

  if (!isJson) {
    const body = await res.text().catch(() => "");
    const msg = body || res.statusText || "Non-JSON response";
    throw new Error(`${res.status} ${msg}`);
  }

  const data = await res.json().catch(() => {
    throw new Error("Invalid JSON response");
  });

  if (!res.ok) {
    const errMsg = (data?.error || data?.message || res.statusText) as string;
    throw new Error(errMsg);
  }
  return data as T;
}