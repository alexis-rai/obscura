const TRANSLATIONS = {
  fr: {
    // Topbar
    statusActive: "Actif",
    statusInactive: "Inactif",

    // Login section
    loginTitle: "Connexion",
    loginDesc: "Connectez votre compte pour synchroniser vos données de protection.",
    emailLabel: "Email",
    emailPlaceholder: "votre@email.com",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "••••••••",
    loginButton: "Se connecter",
    loginLoading: "Connexion...",
    or: "ou",
    noAccount: "Pas de compte ?",
    createAccount: "Créer un compte",
    fillAllFields: "Veuillez remplir tous les champs.",
    unexpectedError: "Erreur inattendue. Réessayez.",

    // OAuth
    oauthCancelled: "Connexion annulée.",
    oauthFailed: "Échec de l'authentification.",
    oauthProfileFailed: "Impossible de récupérer le profil.",

    // User section
    defaultUserName: "Utilisateur",
    dataProtected: "Données protégées",
    encryptions: "chiffrements",
    guideAutoLabel: "Auto",
    guideAutoDesc: "Chiffrement transparent sur ChatGPT, Gemini, Claude",
    guideBypassLabel: "$...$",
    guideBypassDesc: "Encadrez une valeur pour désactiver le chiffrement",
    logoutButton: "Se déconnecter",

    // Content script notification
    notifTitle: "Obscura AI",
    notifBody: "{count} donnée{plural} sensible{plural} chiffrée{plural} avant envoi.",
    notifLoginRequired: "Connectez-vous pour activer la protection Obscura AI.",
    disclaimer: "[Obscura AI] Certaines informations sensibles dans ce message ont été automatiquement chiffrées pour protéger la vie privée de l'utilisateur. Les tokens entre crochets (ex: [EMAIL_1]) remplacent les données réelles. Merci de les utiliser tels quels dans votre réponse.",

    // Language
    languageLabel: "Langue",
  },
  en: {
    // Topbar
    statusActive: "Active",
    statusInactive: "Inactive",

    // Login section
    loginTitle: "Sign In",
    loginDesc: "Connect your account to sync your protection data.",
    emailLabel: "Email",
    emailPlaceholder: "your@email.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    loginButton: "Sign in",
    loginLoading: "Signing in...",
    or: "or",
    noAccount: "No account?",
    createAccount: "Create account",
    fillAllFields: "Please fill in all fields.",
    unexpectedError: "Unexpected error. Try again.",

    // OAuth
    oauthCancelled: "Sign-in cancelled.",
    oauthFailed: "Authentication failed.",
    oauthProfileFailed: "Unable to retrieve profile.",

    // User section
    defaultUserName: "User",
    dataProtected: "Data protected",
    encryptions: "encryptions",
    guideAutoLabel: "Auto",
    guideAutoDesc: "Transparent encryption on ChatGPT, Gemini, Claude",
    guideBypassLabel: "$...$",
    guideBypassDesc: "Wrap a value to disable encryption",
    logoutButton: "Sign out",

    // Content script notification
    notifTitle: "Obscura AI",
    notifBody: "{count} sensitive item{plural} encrypted before sending.",
    notifLoginRequired: "Sign in to activate Obscura AI protection.",
    disclaimer: "[Obscura AI] Some sensitive information in this message has been automatically encrypted to protect user privacy. Tokens in brackets (e.g. [EMAIL_1]) replace real data. Please use them as-is in your response.",

    // Language
    languageLabel: "Language",
  },
};

const FR_LOCALES = ["fr", "fr-fr", "fr-be", "fr-ch", "fr-ca", "fr-lu"];

function detectDefaultLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  if (browserLang.startsWith("fr")) return "fr";
  return "en";
}

async function getLanguage() {
  const { lang } = await chrome.storage.local.get("lang");
  if (lang && TRANSLATIONS[lang]) return lang;
  return detectDefaultLanguage();
}

async function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  await chrome.storage.local.set({ lang });
}

function t(key, lang, params = {}) {
  const str = TRANSLATIONS[lang]?.[key] || TRANSLATIONS["fr"][key] || key;
  return str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TRANSLATIONS, detectDefaultLanguage, getLanguage, setLanguage, t };
}
