const { console_styled } = require("../utils/console");
const { t } = require("../utils/lang");

async function showBanner() {
  console.log();
  console_styled.log(`${await t("banner.welcome")}`, console_styled.cyan);
  console_styled.log(` ${await t("banner.subtitle")} `, console_styled.cyan);
  console.log();
}

module.exports = { showBanner }; 