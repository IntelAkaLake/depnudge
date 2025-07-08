const { console_styled } = require("../utils/console");
const { t, getLanguageInfo, getSupportedLanguages, setLanguage } = require("../utils/lang");

async function showLanguageInfo() {
    const langInfo = await getLanguageInfo();
    const supportedLangs = getSupportedLanguages();

    console_styled.header(await t("language.info_header"));
    console.log();
    console_styled.log(await t("language.current_language", { lang: langInfo.current }), console_styled.green);

    if (langInfo.saved) {
        console_styled.log(await t("language.saved_preference", { lang: langInfo.saved }), console_styled.cyan);
    } else {
        console_styled.log(await t("language.no_saved_preference"), console_styled.dim);
    }

    console.log();
    console_styled.bright(await t("language.supported_languages"));
    supportedLangs.forEach(lang => {
        const marker = lang === langInfo.current ? " 2 " : "  ";
        const color = lang === langInfo.current ? console_styled.green : console_styled.dim;
        console_styled.log(`${marker}${lang}`, color);
    });

    console.log();
    console_styled.info(await t("language.change_language"));
    console_styled.info(await t("language.auto_save"));
}

async function setLanguageFromArgs(lang) {
    try {
        await setLanguage(lang);
        console_styled.success(await t("general.language_set", { lang }));
        console_styled.info(await t("general.language_remembered"));
    } catch (error) {
        console_styled.error(await t("general.error", { message: error.message }));
        throw error;
    }
}

module.exports = { showLanguageInfo, setLanguageFromArgs }; 