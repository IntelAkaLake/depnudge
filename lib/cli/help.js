const { console_styled } = require("../utils/console");
const { t, getLanguageInfo, getSupportedLanguages } = require("../utils/lang");

async function showHelp() {
  const langInfo = await getLanguageInfo();
  const supportedLangs = await getSupportedLanguages();
  
  console_styled.header(await t("help.header"));
  console.log();
  console_styled.bright(await t("help.usage"));
  console_styled.dim(await t("help.usage_example"));
  console.log();
  console_styled.bright(await t("help.options"));
  console_styled.dim(await t("help.help_option"));
  console_styled.dim(await t("help.version_option"));
  console_styled.dim(await t("help.check_option"));
  console_styled.dim(await t("help.scan_option"));
  console_styled.dim(await t("help.install_option"));
  console_styled.dim(await t("help.yes_option"));
  console_styled.dim(await t("help.lang_option", { langs: supportedLangs.join(", ") }));
  console.log();
  console_styled.bright(await t("help.examples"));
  console_styled.log(await t("help.example_check"), console_styled.green);
  console_styled.log(await t("help.example_check_only"), console_styled.green);
  console_styled.log(await t("help.example_scan"), console_styled.green);
  console_styled.log(await t("help.example_install"), console_styled.green);
  console_styled.log(await t("help.example_specific"), console_styled.green);
  console_styled.log(await t("help.example_yes"), console_styled.green);
  console_styled.log(await t("help.example_lang", { lang: langInfo.current === "en" ? "it" : "en" }), console_styled.green);
  console.log();
  
  if (langInfo.saved) {
    console_styled.info(await t("help.current_language", { current: langInfo.current, saved: langInfo.saved }));
  } else {
    console_styled.info(await t("help.current_language_default", { current: langInfo.current }));
  }
}

module.exports = { showHelp }; 