// functions/_middleware.js
// Signed expiring per-student token gate for Cloudflare Pages.
// Token: base64url(header).base64url(payload).base64url(signature)
// signature = HMAC-SHA256(header.payload, TOKEN_SECRET)

function b64urlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

async function hmacSha256(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function verifyToken(token, secret) {
  if (!token) return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false };

  const [h64, p64, s64] = parts;
  const header = safeJsonParse(new TextDecoder().decode(b64urlToBytes(h64)));
  const payload = safeJsonParse(new TextDecoder().decode(b64urlToBytes(p64)));
  if (!header || !payload) return { ok: false };

  if (header.alg !== "HS256" || header.typ !== "JWT") return { ok: false };

  const signingInput = `${h64}.${p64}`;
  const expectedSig = await hmacSha256(secret, signingInput);
  const expectedB64 = bytesToB64url(expectedSig);

  if (expectedB64 !== s64) return { ok: false };

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp || 0);
  if (!exp || now > exp) return { ok: false };

  return { ok: true, payload };
}

function deny() {
  return new Response("Invalid / expired link", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const isIndex = url.pathname === "/" || url.pathname === "/index.html";
  const isMock =
    /^\/mock-\d+$/.test(url.pathname) ||
    /^\/mock-\d+\.html$/.test(url.pathname) ||
    /^\/mock-\d+\/$/.test(url.pathname);

  if (!(isIndex || isMock)) return next();

  const secret = env.TOKEN_SECRET;
  if (!secret) return new Response("Server misconfigured: TOKEN_SECRET missing", { status: 500 });

  const token = url.searchParams.get("t");
  const v = await verifyToken(token, secret);
  if (!v.ok) return deny();

  function normalizePath(p) {
    return String(p || "").replace(/\/$/, "").replace(/\.html$/, "");
  }

  if (normalizePath(v.payload.allowed) !== normalizePath(url.pathname)) return deny();

  return next();
}

}

