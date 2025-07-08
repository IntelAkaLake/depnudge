const { askConfirmation } = require("./readline");
const { console_styled, colors } = require("../utils/console");
const { t } = require("../utils/lang");

async function showInteractiveMenu(outdatedPackages) {
  const packageCount = Object.keys(outdatedPackages).length;

  console_styled.header(await t("update.outdated_found", { count: packageCount }));
  console.log();

  Object.keys(outdatedPackages).forEach(pkgName => {
    const info = outdatedPackages[pkgName];
    console_styled.log(`   ${colors.bright}${pkgName}${colors.reset}: ${colors.dim}${info.current}${colors.reset} → ${colors.green}${info.latest}${colors.reset}`);
  });

  console.log();
  console_styled.bright(await t("menu.what_to_do"));
  console_styled.log(`  [u] ${await t("menu.update_all")}`, colors.green);
  console_styled.log(`  [s] ${await t("menu.select_specific")}`, colors.yellow);
  console_styled.log(`  [c] ${await t("menu.cancel_exit")}`, colors.red);
  console.log();

  const choice = await askConfirmation(await t("menu.enter_choice"));

  switch (choice) {
    case "u":
    case "update":
      return Object.keys(outdatedPackages);
    case "s":
    case "select":
      return await selectPackages(outdatedPackages);
    case "c":
    case "cancel":
    case "exit":
      console_styled.info(await t("general.cancelled"));
      return [];
    default:
      console_styled.error(await t("general.invalid_choice"));
      throw new Error("Invalid menu choice");
  }
}

async function selectPackages(outdatedPackages) {
  const packageNames = Object.keys(outdatedPackages);

  console_styled.info(await t("menu.enter_packages"));
  const selection = await askConfirmation(await t("menu.packages_to_update"));

  if (selection === "all") {
    return packageNames;
  }

  const selectedPackages = selection.split(" ").filter(pkg => pkg.trim());
  const validPackages = selectedPackages.filter(pkg => packageNames.includes(pkg));
  const invalidPackages = selectedPackages.filter(pkg => !packageNames.includes(pkg));

  if (invalidPackages.length > 0) {
    console_styled.warn(await t("menu.ignoring_invalid", { packages: invalidPackages.join(", ") }));
  }

  if (validPackages.length === 0) {
    console_styled.error(await t("menu.no_valid_packages"));
  }

  return validPackages;
}

module.exports = { showInteractiveMenu, selectPackages }; 