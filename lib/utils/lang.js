const fs = require("fs").promises;
const path = require("path");
const os = require("os");

const DEFAULT_LANG = "en";
let _supportedLanguagesCache = null;

function getI18nDir() {
  return path.join(__dirname, "../../i18n");
}

async function getSupportedLanguages() {
  if (_supportedLanguagesCache) {
    return _supportedLanguagesCache;
  }
  
  try {
    const i18nDir = getI18nDir();
    const files = await fs.readdir(i18nDir);
    
    const languages = files
      .filter(file => file.endsWith(".json") && file !== "template.json")
      .map(file => path.basename(file, ".json"))
      .sort();
    
    if (!languages.includes(DEFAULT_LANG)) {
      console.warn(`Warning: Default language '${DEFAULT_LANG}' file not found in i18n directory`);
    }
    
    _supportedLanguagesCache = languages;
    return languages;
  } catch (error) {
    console.warn(`Warning: Could not read i18n directory: ${error.message}`);
    _supportedLanguagesCache = [DEFAULT_LANG];
    return _supportedLanguagesCache;
  }
}

function clearLanguageCache() {
  _supportedLanguagesCache = null;
}

async function getConfigDir() {
  const configDir = path.join(os.homedir(), ".depnudge");
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch (error) {
  }
  return configDir;
}

async function getConfigPath() {
  const configDir = await getConfigDir();
  return path.join(configDir, "config.json");
}

async function loadConfig() {
  const configPath = await getConfigPath();
  try {
    const data = await fs.readFile(configPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveConfig(config) {
  const configPath = await getConfigPath();
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn(`Warning: Could not save config file: ${error.message}`);
  }
}

async function getLanguageFromArgs() {
  const args = process.argv.slice(2);
  const langIndex = args.findIndex(arg => arg === "--lang" || arg === "-l");
  if (langIndex !== -1 && args[langIndex + 1]) {
    const lang = args[langIndex + 1].toLowerCase();
    const supportedLanguages = await getSupportedLanguages();
    if (supportedLanguages.includes(lang)) {
      const config = await loadConfig();
      config.language = lang;
      await saveConfig(config);
      return lang;
    } else {
      console.warn(`Warning: Unsupported language '${lang}'. Supported languages: ${supportedLanguages.join(", ")}`);
    }
  }
  return null;
}

async function getCurrentLanguage() {
  const cliLang = await getLanguageFromArgs();
  if (cliLang) {
    return cliLang;
  }
  const config = await loadConfig();
  const supportedLanguages = await getSupportedLanguages();
  if (config.language && supportedLanguages.includes(config.language)) {
    return config.language;
  }
  return DEFAULT_LANG;
}

async function loadLanguageFile(lang) {
  const langPath = path.join(getI18nDir(), `${lang}.json`);
  try {
    const data = await fs.readFile(langPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (lang !== DEFAULT_LANG) {
      return await loadLanguageFile(DEFAULT_LANG);
    }
    return {};
  }
}

function interpolateString(str, vars = {}) {
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

async function t(key, vars = {}) {
  const lang = await getCurrentLanguage();
  const translations = await loadLanguageFile(lang);
  const keys = key.split(".");
  let value = translations;
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      const enTranslations = await loadLanguageFile(DEFAULT_LANG);
      let enValue = enTranslations;
      for (const enKey of keys) {
        if (enValue && typeof enValue === "object" && enKey in enValue) {
          enValue = enValue[enKey];
        } else {
          return key;
        }
      }
      value = enValue;
      break;
    }
  }
  if (typeof value === "string") {
    return interpolateString(value, vars);
  }
  return key;
}

async function setLanguage(lang) {
  const supportedLanguages = await getSupportedLanguages();
  if (!supportedLanguages.includes(lang)) {
    throw new Error(`Unsupported language '${lang}'. Supported languages: ${supportedLanguages.join(", ")}`);
  }
  const config = await loadConfig();
  config.language = lang;
  await saveConfig(config);
}

async function getLanguageInfo() {
  const currentLang = await getCurrentLanguage();
  const config = await loadConfig();
  const supportedLanguages = await getSupportedLanguages();
  return {
    current: currentLang,
    saved: config.language || null,
    supported: supportedLanguages,
    default: DEFAULT_LANG
  };
}

module.exports = {
  t,
  getCurrentLanguage,
  getLanguageFromArgs,
  loadLanguageFile,
  setLanguage,
  getSupportedLanguages,
  getLanguageInfo,
  clearLanguageCache,
  DEFAULT_LANG
};