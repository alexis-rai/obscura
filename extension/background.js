const SUPABASE_URL = "https://pkvlxkbyozgrqnkktcgo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdmx4a2J5b3pncnFua2t0Y2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTAzMjksImV4cCI6MjA5NjY4NjMyOX0.OpWMmWO0uphzQ7YlMRjPxxdplEFd6ycJ_VfQAJV3FBU";

const ERROR_MESSAGES = {
  fr: {
    cancelled: "Connexion annulée.",
    authFailed: "Échec de l'authentification.",
    profileFailed: "Impossible de récupérer le profil.",
    invalidCredentials: "Identifiants incorrects.",
    networkError: "Erreur réseau. Vérifiez votre connexion.",
  },
  en: {
    cancelled: "Sign-in cancelled.",
    authFailed: "Authentication failed.",
    profileFailed: "Unable to retrieve profile.",
    invalidCredentials: "Invalid credentials.",
    networkError: "Network error. Check your connection.",
  },
};

async function getLang() {
  const { lang } = await chrome.storage.local.get("lang");
  return lang || "fr";
}

function msg(key, lang) {
  return ERROR_MESSAGES[lang]?.[key] || ERROR_MESSAGES["fr"][key];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOGIN") {
    handleLogin(message.email, message.password, message.lang).then(sendResponse);
    return true;
  }
  if (message.type === "OAUTH_LOGIN") {
    handleOAuthLogin(message.provider, message.lang).then(sendResponse);
    return true;
  }
  if (message.type === "GET_SESSION") {
    getSession().then(sendResponse);
    return true;
  }
  if (message.type === "LOGOUT") {
    handleLogout().then(sendResponse);
    return true;
  }
  if (message.type === "INCREMENT_ENCRYPT_COUNT") {
    incrementEncryptCount(message.count).then(sendResponse);
    return true;
  }
  if (message.type === "GET_STATS") {
    getStats().then(sendResponse);
    return true;
  }
  if (message.type === "CHECK_SESSION") {
    chrome.storage.local.get("session").then(({ session }) => {
      sendResponse({ loggedIn: !!session });
    });
    return true;
  }
  if (message.type === "RECORD_RESPONSE_TIME") {
    recordResponseTime(message.latency).then(sendResponse);
    return true;
  }
  if (message.type === "GET_LANG") {
    getLang().then((lang) => sendResponse({ lang }));
    return true;
  }
});

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function handleOAuthLogin(provider, overrideLang) {
  const lang = overrideLang || await getLang();
  try {
    const redirectUrl = chrome.identity.getRedirectURL();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });

    if (!responseUrl) {
      return { error: msg("cancelled", lang) };
    }

    const url = new URL(responseUrl);
    let accessToken = null;
    let refreshToken = null;

    // Try hash fragment first (implicit flow)
    const hashParams = new URLSearchParams(url.hash.substring(1));
    accessToken = hashParams.get("access_token");
    refreshToken = hashParams.get("refresh_token");

    // PKCE: exchange authorization code for tokens
    if (!accessToken) {
      const code = url.searchParams.get("code");
      if (code) {
        const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
          },
          body: JSON.stringify({
            auth_code: code,
            code_verifier: codeVerifier,
          }),
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token;
        }
      }
    }

    if (!accessToken) {
      return { error: msg("authFailed", lang) };
    }

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "apikey": SUPABASE_KEY,
      },
    });

    if (!userRes.ok) {
      return { error: msg("profileFailed", lang) };
    }

    const user = await userRes.json();
    await chrome.storage.local.set({
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
      },
    });

    return { success: true, user };
  } catch (e) {
    if (e.message?.includes("canceled") || e.message?.includes("cancelled")) {
      return { error: msg("cancelled", lang) };
    }
    return { error: msg("authFailed", lang) };
  }
}

async function handleLogin(email, password, overrideLang) {
  const lang = overrideLang || await getLang();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { error: msg("invalidCredentials", lang) };
    }
    await chrome.storage.local.set({
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      },
    });
    return { success: true, user: data.user };
  } catch (e) {
    return { error: msg("networkError", lang) };
  }
}

async function getSession() {
  const { session } = await chrome.storage.local.get("session");
  if (!session) return { session: null };

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": SUPABASE_KEY,
      },
    });

    if (res.ok) {
      const user = await res.json();
      session.user = user;
      await chrome.storage.local.set({ session });
      return { session };
    }

    if (res.status === 401 && session.refresh_token) {
      const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
          const newSession = {
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            user: refreshData.user,
          };
          await chrome.storage.local.set({ session: newSession });
          return { session: newSession };
        }
      }

      if (refreshRes.status === 400 || refreshRes.status === 401) {
        await chrome.storage.local.remove("session");
        return { session: null };
      }
    }

    return { session };
  } catch (e) {
    return { session };
  }
}

async function handleLogout() {
  const { session } = await chrome.storage.local.get("session");
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": SUPABASE_KEY,
      },
    }).catch(() => {});
  }
  await chrome.storage.local.remove("session");
  return { success: true };
}

async function incrementEncryptCount(count) {
  const { session } = await chrome.storage.local.get("session");
  if (!session) return;

  const piiCount = count || 1;
  const { encryptCount = 0 } = await chrome.storage.local.get("encryptCount");
  const newCount = encryptCount + piiCount;
  await chrome.storage.local.set({ encryptCount: newCount });

  await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_extension_encrypts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": SUPABASE_KEY,
      },
      body: JSON.stringify({ count: piiCount }),
    }).catch(() => {}),
    fetch(`${SUPABASE_URL}/rest/v1/rpc/record_protection_event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": SUPABASE_KEY,
      },
      body: JSON.stringify({ pii_count: piiCount }),
    }).catch(() => {}),
  ]);
}

async function recordResponseTime(latency) {
  const { responseTimes = [] } = await chrome.storage.local.get("responseTimes");
  responseTimes.push(latency);
  await chrome.storage.local.set({ responseTimes });

  const { session } = await chrome.storage.local.get("session");
  if (!session) return;

  const avg = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);

  await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_avg_latency`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": SUPABASE_KEY,
    },
    body: JSON.stringify({ new_latency: avg }),
  }).catch(() => {});
}

async function getStats() {
  const { session } = await chrome.storage.local.get("session");

  if (session) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=extension_encrypts&id=eq.${session.user.id}`,
        {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": SUPABASE_KEY,
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].extension_encrypts != null) {
          const count = rows[0].extension_encrypts;
          await chrome.storage.local.set({ encryptCount: count });
          return { encryptCount: count };
        }
      }
    } catch (e) {
      // Fallback to local
    }
  }

  const { encryptCount = 0 } = await chrome.storage.local.get("encryptCount");
  return { encryptCount };
}
