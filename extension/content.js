(() => {
  const PATTERNS = [
    { name: "EMAIL", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { name: "PHONE", regex: /\b(?:\+?33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}\b/g },
    { name: "PHONE_INTL", regex: /\b\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g },
    { name: "IBAN", regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g },
    { name: "CC", regex: /\b(?:\d[ -]*?){13,19}\b/g },
    { name: "SIRET", regex: /\b\d{14}\b/g },
    { name: "SIREN", regex: /\b\d{9}\b/g },
    { name: "IP", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
    { name: "URL", regex: /\bhttps?:\/\/[^\s]+/g },
  ];

  const BYPASS_REGEX = /\$([^$]+)\$/g;

  let currentMap = {};
  let contentLang = "fr";
  let responseTimes = [];

  async function loadLang() {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_LANG" });
      if (res && res.lang) contentLang = res.lang;
    } catch (e) {
      // Fallback to fr
    }
  }

  function getDisclaimer() {
    return t("disclaimer", contentLang);
  }

  function getNotifBody(count) {
    const plural = count > 1 ? "s" : "";
    return t("notifBody", contentLang, { count, plural });
  }

  function anonymize(text) {
    const bypassed = [];
    let cleaned = text.replace(BYPASS_REGEX, (_, val) => {
      const placeholder = `__BYPASS_${bypassed.length}__`;
      bypassed.push(val);
      return placeholder;
    });

    let output = cleaned;
    const map = {};
    const counters = {};

    for (const { name, regex } of PATTERNS) {
      output = output.replace(new RegExp(regex.source, regex.flags), (match) => {
        const existing = Object.entries(map).find(([, v]) => v === match);
        if (existing) return existing[0];

        counters[name] = (counters[name] || 0) + 1;
        const token = `[${name}_${counters[name]}]`;
        map[token] = match;
        return token;
      });
    }

    bypassed.forEach((val, i) => {
      output = output.replace(`__BYPASS_${i}__`, val);
    });

    return { anonymized: output, map };
  }

  function getHost() {
    const h = window.location.hostname;
    if (h.includes("chatgpt.com") || h.includes("chat.openai.com")) return "chatgpt";
    if (h.includes("gemini.google.com")) return "gemini";
    if (h.includes("claude.ai")) return "claude";
    return null;
  }

  function getInputElement() {
    const host = getHost();
    if (host === "chatgpt") {
      return document.querySelector("#prompt-textarea, div[contenteditable='true'][id='prompt-textarea']");
    }
    if (host === "gemini") {
      return document.querySelector(".ql-editor, div[contenteditable='true'][aria-label*='prompt'], div[contenteditable='true'].ql-editor, rich-textarea div[contenteditable='true']");
    }
    if (host === "claude") {
      return document.querySelector("div[contenteditable='true'].ProseMirror, div.ProseMirror[contenteditable='true']");
    }
    return null;
  }

  function getInputValue(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value;
    return el.innerText || el.textContent || "";
  }

  function setInputValue(el, lines) {
    if (!el) return;

    el.focus();

    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);

    document.execCommand("delete", false);

    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        document.execCommand("insertParagraph", false);
      }
      if (lines[i].length > 0) {
        document.execCommand("insertText", false, lines[i]);
      }
    }

    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  }

  function getSendButton() {
    const host = getHost();

    if (host === "chatgpt") {
      return document.querySelector(
        'button[data-testid="send-button"], button[aria-label="Send prompt"], button[aria-label="Envoyer le prompt"], form button[type="submit"]'
      );
    }
    if (host === "gemini") {
      return document.querySelector(
        'button[aria-label="Send message"], button[aria-label="Envoyer un message"], button[aria-label="Send"], button.send-button, button[mattooltip="Send message"], div.send-button-container button'
      );
    }
    if (host === "claude") {
      return document.querySelector(
        'button[aria-label="Send Message"], button[aria-label="Send message"], button[aria-label="Envoyer le message"]'
      );
    }
    return null;
  }

  function hasDetectableData(text) {
    const cleaned = text.replace(BYPASS_REGEX, "");
    for (const { regex } of PATTERNS) {
      const r = new RegExp(regex.source, regex.flags);
      if (r.test(cleaned)) return true;
    }
    return false;
  }

  function triggerSend(inputEl) {
    const maxAttempts = 10;
    let attempts = 0;

    function trySend() {
      attempts++;
      const sendBtn = getSendButton();

      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(trySend, 100);
        return;
      }

      const enterDown = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      inputEl.dispatchEvent(enterDown);
    }

    setTimeout(trySend, 200);
  }

  async function checkLoggedIn() {
    try {
      const { session } = await chrome.storage.local.get("session");
      return !!session;
    } catch (e) {
      return false;
    }
  }

  function showErrorNotification(message) {
    const existing = document.querySelector(".obscura-notification");
    if (existing) existing.remove();

    const notif = document.createElement("div");
    notif.className = "obscura-notification obscura-notification--error";
    notif.innerHTML = `
      <div class="obscura-notification-icon obscura-notification-icon--error">
        <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
      </div>
      <div class="obscura-notification-text">
        <span class="obscura-notification-title">${t("notifTitle", contentLang)}</span>
        <span class="obscura-notification-body">${message}</span>
      </div>
    `;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add("obscura-notification--visible"), 10);
    setTimeout(() => {
      notif.classList.remove("obscura-notification--visible");
      setTimeout(() => notif.remove(), 400);
    }, 4000);
  }

  function handleKeydown(e) {
    if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.altKey) return;

    const inputEl = getInputElement();
    if (!inputEl) return;

    const text = getInputValue(inputEl);
    if (!text.trim()) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    checkLoggedIn().then((loggedIn) => {
      if (!loggedIn) {
        showErrorNotification(t("notifLoginRequired", contentLang));
        triggerSend(inputEl);
        return;
      }

      if (!hasDetectableData(text)) {
        triggerSend(inputEl);
        return;
      }

      const { anonymized, map } = anonymize(text);
      if (Object.keys(map).length === 0) {
        triggerSend(inputEl);
        return;
      }

      currentMap = { ...currentMap, ...map };

      const disclaimerLines = ["", "---", getDisclaimer()];
      const promptLines = anonymized.split("\n");
      const allLines = [...promptLines, ...disclaimerLines];

      setInputValue(inputEl, allLines);

      chrome.runtime.sendMessage({
        type: "INCREMENT_ENCRYPT_COUNT",
        count: Object.keys(map).length,
      });

      showNotification(Object.keys(map).length);

      triggerSend(inputEl);
      measureResponseTime(inputEl);
    });
  }

  function measureResponseTime(inputEl) {
    const startTime = performance.now();

    const checkEmpty = () => {
      const value = getInputValue(inputEl);
      if (!value.trim()) {
        const elapsed = Math.round(performance.now() - startTime);
        responseTimes.push(elapsed);
        chrome.runtime.sendMessage({
          type: "RECORD_RESPONSE_TIME",
          latency: elapsed,
        });
        return;
      }
      requestAnimationFrame(checkEmpty);
    };

    setTimeout(() => checkEmpty(), 100);
  }

  function showNotification(count) {
    const existing = document.querySelector(".obscura-notification");
    if (existing) existing.remove();

    const notif = document.createElement("div");
    notif.className = "obscura-notification";
    notif.innerHTML = `
      <div class="obscura-notification-icon">
        <svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
      </div>
      <div class="obscura-notification-text">
        <span class="obscura-notification-title">${t("notifTitle", contentLang)}</span>
        <span class="obscura-notification-body">${getNotifBody(count)}</span>
      </div>
    `;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add("obscura-notification--visible"), 10);
    setTimeout(() => {
      notif.classList.remove("obscura-notification--visible");
      setTimeout(() => notif.remove(), 400);
    }, 4000);
  }

  function observeResponses() {
    const observer = new MutationObserver((mutations) => {
      if (Object.keys(currentMap).length === 0) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          decryptNode(node);
        }
        if (mutation.type === "characterData" && mutation.target.parentElement) {
          decryptNode(mutation.target.parentElement);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function decryptNode(node) {
    if (!node || node.closest && node.closest(".obscura-notification")) return;
    if (node.querySelector && node.querySelector("[contenteditable='true']")) return;
    if (node.closest && node.closest("[contenteditable='true']")) return;

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentElement;
      if (parent && parent.closest && parent.closest("[contenteditable='true']")) continue;

      let text = textNode.textContent;
      let changed = false;

      for (const [token, value] of Object.entries(currentMap)) {
        if (text.includes(token)) {
          text = text.split(token).join(value);
          changed = true;
        }
      }

      if (changed) {
        textNode.textContent = text;
      }
    }
  }

  async function init() {
    await loadLang();
    document.addEventListener("keydown", handleKeydown, true);
    observeResponses();

    const inputObserver = new MutationObserver(() => {
      const inputEl = getInputElement();
      if (inputEl && !inputEl.dataset.obscuraAttached) {
        inputEl.dataset.obscuraAttached = "true";
        inputEl.addEventListener("keydown", handleKeydown, true);
      }
    });

    inputObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})();
