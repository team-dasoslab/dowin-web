type FcmMessage = {
  token: string;
  title: string;
  body: string;
  url: string;
  pushType: string;
  campaignId: string;
};

type FcmCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type FcmDeliverySummary = {
  success: number;
  failed: number;
  disabledTokens: string[];
};

class InvalidFcmTokenError extends Error {
  constructor(
    readonly token: string,
    message: string,
  ) {
    super(message);
    this.name = "InvalidFcmTokenError";
  }
}

const FIREBASE_MESSAGING_SCOPE =
  "https://www.googleapis.com/auth/firebase.messaging";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function sendFcmMessages(
  messages: FcmMessage[],
  credentials: FcmCredentials,
): Promise<FcmDeliverySummary> {
  if (messages.length === 0) {
    return {
      success: 0,
      failed: 0,
      disabledTokens: [],
    };
  }

  const accessToken = await getGoogleAccessToken(credentials);
  const results = await Promise.all(
    messages.map(async (message) => {
      try {
        await sendSingleFcmMessage(message, credentials.projectId, accessToken);

        return { status: "success" as const };
      } catch (error) {
        if (error instanceof InvalidFcmTokenError) {
          return {
            status: "disabled" as const,
            token: error.token,
          };
        }

        console.error("FCM delivery failed:", error);
        return { status: "failed" as const };
      }
    }),
  );

  return {
    success: results.filter((result) => result.status === "success").length,
    failed: results.filter((result) => result.status === "failed").length,
    disabledTokens: results
      .filter(
        (result): result is { status: "disabled"; token: string } =>
          result.status === "disabled",
      )
      .map((result) => result.token),
  };
}

async function sendSingleFcmMessage(
  message: FcmMessage,
  projectId: string,
  accessToken: string,
) {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: message.token,
          notification: {
            title: message.title,
            body: message.body,
          },
          data: {
            url: message.url,
            pushType: message.pushType,
            campaignId: message.campaignId,
          },
        },
      }),
    },
  );

  if (response.ok) {
    return;
  }

  const rawBody = await response.text();
  const parsedBody = tryParseJson(rawBody);

  if (isInvalidFcmTokenResponse(response.status, rawBody, parsedBody)) {
    throw new InvalidFcmTokenError(
      message.token,
      `Invalid FCM token response: ${response.status}`,
    );
  }

  throw new Error(`FCM send failed: ${response.status} ${rawBody}`);
}

async function getGoogleAccessToken(credentials: FcmCredentials) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const assertion = await createSignedJwt({
    iss: credentials.clientEmail,
    scope: FIREBASE_MESSAGING_SCOPE,
    aud: OAUTH_TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }, credentials.privateKey);

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token request failed: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    access_token?: string;
  };

  if (!body.access_token) {
    throw new Error("Google OAuth token response missing access_token");
  }

  return body.access_token;
}

async function createSignedJwt(
  payload: Record<string, string | number>,
  privateKeyPem: string,
) {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${encodeBase64Url(signature)}`;
}

function pemToArrayBuffer(pem: string) {
  const normalizedPem = pem.replace(/\\n/g, "\n");
  const base64 = normalizedPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  return Uint8Array.from(Buffer.from(base64, "base64")).buffer;
}

function encodeBase64Url(input: string | ArrayBuffer) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function tryParseJson(rawBody: string) {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isInvalidFcmTokenResponse(
  status: number,
  rawBody: string,
  parsedBody: Record<string, unknown> | null,
) {
  if (status === 404) {
    return true;
  }

  if (status !== 400) {
    return false;
  }

  const error = parsedBody?.error;
  if (typeof error !== "object" || !error) {
    return rawBody.includes("UNREGISTERED");
  }

  const details = Array.isArray((error as { details?: unknown }).details)
    ? ((error as { details: Array<Record<string, unknown>> }).details ?? [])
    : [];

  return details.some((detail) => {
    const errorCode = detail.errorCode;
    return errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT";
  });
}
