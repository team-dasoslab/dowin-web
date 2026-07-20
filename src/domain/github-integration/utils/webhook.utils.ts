/**
 * Extract action item display keys from text.
 * Matches #ABC-1 format: # prefix, 3 uppercase alphanumeric chars, dash, digits.
 * Requires # prefix — "#ABC-1" matches, "ABC-1" does not.
 */
export function extractDisplayKeys(
  text: string,
): Array<{ prefix: string; sequence: number; raw: string }> {
  const pattern = /#([A-Z0-9]{3})-(\d+)/g;
  const results: Array<{ prefix: string; sequence: number; raw: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    results.push({
      raw: match[0],
      prefix: match[1],
      sequence: parseInt(match[2], 10),
    });
  }

  return results;
}

/**
 * Convert a UTC Date to a KST YYYY-MM-DD date string.
 * KST = UTC+9.
 */
export function toKstDateString(date: Date): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  return kstDate.toISOString().slice(0, 10);
}

/**
 * Verify GitHub webhook HMAC-SHA256 signature.
 * Uses Web Crypto API available in Cloudflare Workers.
 */
export async function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));

  const expectedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const receivedHex = signatureHeader.slice("sha256=".length);

  // Constant-time comparison to avoid timing attacks
  if (expectedHex.length !== receivedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Normalize a PEM private key from an environment variable.
 *
 * Cloudflare Workers / .dev.vars may store multiline PEM values with
 * literal `\n` escape sequences instead of real newlines. This function
 * normalises both cases so the key is always a valid PEM string.
 *
 * Usage:
 *   const pem = normalizePem(env.GITHUB_APP_PRIVATE_KEY);
 */
export function normalizePem(raw: string): string {
  // Replace literal backslash-n with real newline (common in env vars)
  let normalized = raw.replace(/\\n/g, "\n").trim();
  // Strip surrounding quotes if present (e.g., from .dev.vars)
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1).trim();
  } else if (normalized.startsWith("'") && normalized.endsWith("'")) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

/**
 * Convert PKCS#1 DER (RSA PRIVATE KEY) to PKCS#8 DER (PRIVATE KEY).
 * GitHub App keys are often generated in PKCS#1 format, but Web Crypto API
 * only supports importing PKCS#8 for RSA private keys.
 */
function convertPkcs1ToPkcs8(pkcs1Der: Uint8Array): Uint8Array {
  // PKCS#8 header for RSA encryption (1.2.840.113549.1.1.1)
  const header = new Uint8Array([
    0x30, 0x82, 0x00, 0x00, // Sequence (length to be filled)
    0x02, 0x01, 0x00,       // Integer 0
    0x30, 0x0d,             // Sequence of 13 bytes
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // OID rsaEncryption
    0x05, 0x00,             // Null
    0x04, 0x82, 0x00, 0x00  // Octet string (length to be filled)
  ]);

  const pkcs1Length = pkcs1Der.length;
  const pkcs8Length = pkcs1Length + header.length - 4;

  header[2] = (pkcs8Length >> 8) & 0xff;
  header[3] = pkcs8Length & 0xff;

  header[24] = (pkcs1Length >> 8) & 0xff;
  header[25] = pkcs1Length & 0xff;

  const pkcs8Der = new Uint8Array(header.length + pkcs1Length);
  pkcs8Der.set(header, 0);
  pkcs8Der.set(pkcs1Der, header.length);

  return pkcs8Der;
}

/**
 * Generate a GitHub App JWT using RS256.
 * Uses the Web Crypto API (available in Cloudflare Workers).
 *
 * @param appId   GitHub App ID (numeric string)
 * @param pemKey  Raw PEM string from env — pass through normalizePem() first.
 */
export async function createGithubAppJwt(appId: string, pemKey: string): Promise<string> {
  const pem = normalizePem(pemKey);
  const isPkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");
  
  const pemBody = pem
    .replace(/-----BEGIN RSA PRIVATE KEY-----|-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----|-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  let derBuffer: Uint8Array = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  
  if (isPkcs1) {
    derBuffer = convertPkcs1ToPkcs8(derBuffer);
  }

  // Import as RSASSA-PKCS1-v1_5 (RS256)
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    derBuffer.buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iat: now - 60, // issued 60 s in the past to account for clock skew
    exp: now + 600, // 10 minute expiry (GitHub max)
    iss: appId,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signatureB64}`;
}

/**
 * Fetch an installation access token (short-lived) using a GitHub App JWT.
 * Used to call GitHub APIs scoped to a specific installation.
 */
export async function getInstallationAccessToken(
  appJwt: string,
  installationId: string,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Dowin-App",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to get installation access token: ${res.status}`);
  }

  const data = await res.json<{ token: string }>();
  return data.token;
}
