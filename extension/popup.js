document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const userSection = document.getElementById("user-section");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const userName = document.getElementById("user-name");
  const userEmail = document.getElementById("user-email");
  const userAvatar = document.getElementById("user-avatar");
  const encryptCount = document.getElementById("encrypt-count");
  const langSelect = document.getElementById("lang-select");

  let currentLang = "fr";

  async function initLanguage() {
    const { lang, session } = await chrome.storage.local.get(["lang", "session"]);

    if (lang && TRANSLATIONS[lang]) {
      currentLang = lang;
    } else if (session && session.user) {
      const userLang = session.user.user_metadata?.lang;
      if (userLang && TRANSLATIONS[userLang]) {
        currentLang = userLang;
      } else {
        currentLang = detectDefaultLanguage();
      }
    } else {
      currentLang = detectDefaultLanguage();
    }

    langSelect.value = currentLang;
    applyLanguage();
  }

  function applyLanguage() {
    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key, currentLang);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = t(key, currentLang);
    });

    const signupLink = document.querySelector(".footer-link a");
    if (signupLink) {
      const langPrefix = currentLang === "en" ? "/en" : "/fr";
      signupLink.href = `https://obscura.ai${langPrefix}/auth`;
    }
  }

  langSelect.addEventListener("change", async () => {
    currentLang = langSelect.value;
    await setLanguage(currentLang);
    applyLanguage();
  });

  async function checkSession() {
    const res = await chrome.runtime.sendMessage({ type: "GET_SESSION" });
    if (res && res.session) {
      showUserSection(res.session);
    } else {
      showLoginSection();
    }
  }

  function updateStatus(active) {
    const statusLabel = document.querySelector(".status-label");
    const pulse = document.querySelector(".pulse");
    if (active) {
      statusLabel.textContent = t("statusActive", currentLang);
      pulse.classList.remove("pulse--inactive");
    } else {
      statusLabel.textContent = t("statusInactive", currentLang);
      pulse.classList.add("pulse--inactive");
    }
  }

  function showLoginSection() {
    loginSection.classList.remove("hidden");
    userSection.classList.add("hidden");
    updateStatus(false);
  }

  function showUserSection(session) {
    loginSection.classList.add("hidden");
    userSection.classList.remove("hidden");
    updateStatus(true);

    const user = session.user;
    const meta = user.user_metadata || {};
    userName.textContent = meta.full_name || meta.name || user.email.split("@")[0];
    userEmail.textContent = user.email;

    if (meta.avatar_url) {
      userAvatar.innerHTML = `<img src="${meta.avatar_url}" alt="Avatar">`;
    }

    loadStats();
  }

  async function loadStats() {
    const res = await chrome.runtime.sendMessage({ type: "GET_STATS" });
    if (res) {
      encryptCount.textContent = res.encryptCount || 0;
    }
  }

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      loginError.textContent = t("fillAllFields", currentLang);
      return;
    }

    loginBtn.disabled = true;
    loginBtn.querySelector("span").textContent = t("loginLoading", currentLang);
    loginError.textContent = "";

    const res = await chrome.runtime.sendMessage({
      type: "LOGIN",
      email,
      password,
      lang: currentLang,
    });

    loginBtn.disabled = false;
    loginBtn.querySelector("span").textContent = t("loginButton", currentLang);

    if (res && res.error) {
      loginError.textContent = res.error;
    } else if (res && res.success) {
      if (res.user?.user_metadata?.lang && !await chrome.storage.local.get("lang").then(r => r.lang)) {
        currentLang = res.user.user_metadata.lang;
        langSelect.value = currentLang;
        await setLanguage(currentLang);
        applyLanguage();
      }
      showUserSection({ user: res.user });
    } else {
      loginError.textContent = t("unexpectedError", currentLang);
    }
  });

  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  const googleBtn = document.getElementById("google-btn");
  const githubBtn = document.getElementById("github-btn");

  async function handleOAuth(provider, btn) {
    btn.disabled = true;
    loginError.textContent = "";

    const res = await chrome.runtime.sendMessage({
      type: "OAUTH_LOGIN",
      provider,
      lang: currentLang,
    });

    btn.disabled = false;

    if (res && res.error) {
      loginError.textContent = res.error;
    } else if (res && res.success) {
      if (res.user?.user_metadata?.lang && !await chrome.storage.local.get("lang").then(r => r.lang)) {
        currentLang = res.user.user_metadata.lang;
        langSelect.value = currentLang;
        await setLanguage(currentLang);
        applyLanguage();
      }
      showUserSection({ user: res.user });
    }
  }

  googleBtn.addEventListener("click", () => handleOAuth("google", googleBtn));
  githubBtn.addEventListener("click", () => handleOAuth("github", githubBtn));

  logoutBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "LOGOUT" });
    showLoginSection();
  });

  await initLanguage();
  await checkSession();
});
