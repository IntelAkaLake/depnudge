const { flags, specificPackages, languageValue } = require("../cli/args");
const { showBanner } = require("../cli/banner");
const { showHelp } = require("../cli/help");
const { showInteractiveMenu } = require("../cli/menu");
const { askConfirmation } = require("../cli/readline");
const { console_styled } = require("../utils/console");
const { t, getCurrentLanguage } = require("../utils/lang");
const { showLanguageInfo } = require("../cli/lang");
const { getOutdatedPackages, validatePackagesExist, updatePackageJson, installPackages, checkPackageJsonExists } = require("./update");
const { scanForUndefinedDependencies } = require("./scan");
const { createBackup } = require("./backup");
const { showVersion } = require("./version");

async function main() {
  try {
    if (!flags.help && !flags.version && !flags.check && !flags.lang) {
      await showBanner();
    }

    if (flags.lang) {
      if (languageValue) {
        console_styled.success(await t("general.language_set", { lang: languageValue }));
        console_styled.info(await t("general.language_remembered"));
        return;
      } else {
        await showLanguageInfo();
        return;
      }
    }

    if (flags.version) {
      await showVersion();
      return;
    }

    if (flags.help) {
      await showHelp();
      return;
    }

    if (flags.scan) {
      let scanPatterns = [];
      const scanIdx = process.argv.findIndex(arg => arg === "--scan" || arg === "-s");
      if (scanIdx !== -1) {
        scanPatterns = process.argv.slice(scanIdx + 1).filter(arg => !arg.startsWith("-"));
      }
      console_styled.header(await t("scan.scanning"));
      const undefinedDeps = await scanForUndefinedDependencies(scanPatterns);
      if (undefinedDeps.length === 0) {
        console_styled.success(await t("scan.none_found"));
      } else {
        console_styled.header(await t("scan.found", { count: undefinedDeps.length }));
        console.log();
        for (const pkg of undefinedDeps) {
          console_styled.log(await t("scan.package_list_item", { pkg }), console_styled.red);
        }
        console.log();
        console_styled.info(await t("scan.tip_scan"));
      }
      return;
    }

    if (flags.install) {
      let scanPatterns = [];
      const installIdx = process.argv.findIndex(arg => arg === "--install" || arg === "-i");
      if (installIdx !== -1) {
        scanPatterns = process.argv.slice(installIdx + 1).filter(arg => !arg.startsWith("-"));
      }
      console_styled.header(await t("install.scanning"));
      const undefinedDeps = await scanForUndefinedDependencies(scanPatterns);
      await installUndefinedDependencies(undefinedDeps, flags);
      return;
    }

    await checkPackageJsonExists();

    if (specificPackages && specificPackages.length > 0) {
      console_styled.header(await t("update.checking_specific", { packages: specificPackages.join(", ") }));
      console.log();
      await validatePackagesExist(specificPackages);
    } else {
      console_styled.header(await t("update.checking"));
      console.log();
    }

    const outdatedPackages = await getOutdatedPackages(specificPackages);

    if (Object.keys(outdatedPackages).length === 0) {
      if (specificPackages && specificPackages.length > 0) {
        console_styled.success(await t("update.some_up_to_date", { packages: specificPackages.join(", ") }));
      } else {
        console_styled.success(await t("update.all_up_to_date"));
        console.log();
        console_styled.info(await t("scan.tip_scan"));
      }
      return;
    }

    if (flags.check) {
      console_styled.header(await t("update.outdated_found", { count: Object.keys(outdatedPackages).length }));
      console.log();
      for (const pkgName of Object.keys(outdatedPackages)) {
        const info = outdatedPackages[pkgName];
        console_styled.log(await t("update.package_version", { pkg: pkgName, current: info.current, latest: info.latest }), console_styled.red);
      }
      console.log();
      console_styled.info(await t("main.use_without_check"));
      return;
    }

    let packagesToUpdate;

    if (specificPackages && specificPackages.length > 0) {
      packagesToUpdate = specificPackages;
      console_styled.header(await t("update.outdated_found", { count: Object.keys(outdatedPackages).length }));
      console.log();
      for (const pkgName of Object.keys(outdatedPackages)) {
        const info = outdatedPackages[pkgName];
        console_styled.log(await t("update.package_version", { pkg: pkgName, current: info.current, latest: info.latest }), console_styled.red);
      }
      if (!flags.yes) {
        console.log();
        const confirm = await askConfirmation(await t("general.confirm_update"));
        if (!["y", "yes"].includes(confirm)) {
          console_styled.info(await t("general.cancelled"));
          return;
        }
      }
    } else {
      packagesToUpdate = await showInteractiveMenu(outdatedPackages);
    }

    const filteredOutdatedPackages = {};
    packagesToUpdate.forEach(pkg => {
      if (outdatedPackages[pkg]) {
        filteredOutdatedPackages[pkg] = outdatedPackages[pkg];
      }
    });

    console.log();
    console_styled.header(await t("update.updating"));
    console.log();

    await createBackup();

    const updatedCount = await updatePackageJson(filteredOutdatedPackages);

    if (updatedCount > 0) {
      console.log();
      await installPackages(flags);
      console.log();
      console_styled.success(await t("update.done"));
      console_styled.dim(await t("update.test_reminder"));
    } else {
      console_styled.info(await t("main.no_packages_updated"));
    }
  } catch (error) {
    console_styled.error(await t("general.error", { message: error.message }));
    if (process.env.DEPNUDGE_DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

const { ProgressBar } = require("../utils/progress");
const { getLatestVersion } = require("../utils/npm");

async function installUndefinedDependencies(undefinedDeps, flags) {
  try {
    if (undefinedDeps.length === 0) {
      console_styled.success(await t("install.none_found"));
      return;
    }
    console_styled.header(await t("scan.found", { count: undefinedDeps.length }));
    console.log();
    const packageInfo = [];
    const progressBar = new ProgressBar(undefinedDeps.length, await t("progress.fetching_package_info"));
    for (let i = 0; i < undefinedDeps.length; i++) {
      const pkg = undefinedDeps[i];
      progressBar.update(i + 1, await t("progress.checking_package", { pkg }));
      const version = await getLatestVersion(pkg);
      if (version) {
        packageInfo.push({ name: pkg, version });
        console_styled.success(await t("install.package_success", { pkg, version }));
      } else {
        console_styled.warn(await t("install.package_not_found", { pkg }));
      }
      await require("../utils/sleep").sleep(process.env.DEPNUDGE_DELAY ? 50 : 0);
    }
    await progressBar.complete(await t("progress.package_info_fetched"));
    if (packageInfo.length === 0) {
      console_styled.warn(await t("main.no_valid_packages_found"));
      return;
    }
    if (!flags.yes) {
      const installConfirm = await askConfirmation(await t("general.confirm_install", { count: packageInfo.length }));
      if (!["y", "yes"].includes(installConfirm)) {
        console_styled.info(await t("general.cancelled"));
        return;
      }
    }
    const depType = await askConfirmation(await t("general.confirm_type"));
    const isDev = depType === "dev" || depType === "development";
    const { Spinner } = require("../utils/progress");
    const spinner = new Spinner(`Installing ${packageInfo.length} packages...`);
    spinner.start();
    try {
      const installCommand = isDev ? "npm install --save-dev" : "npm install";
      const packageList = packageInfo.map(pkg => `${pkg.name}@${pkg.version}`).join(" ");
      const fullCommand = `${installCommand} ${packageList}`;
      const { exec } = require("child_process");
      await new Promise((resolve, reject) => {
        exec(fullCommand, { encoding: "utf-8" }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
      spinner.complete(`Successfully installed ${packageInfo.length} packages!`);
    } catch (error) {
      spinner.fail(`Failed to install packages: ${error.message}`);
      throw error;
    }
  } catch (error) {
    console_styled.error(await t("general.error", { message: error.message }));
    if (process.env.DEPNUDGE_DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

module.exports = { main }; 