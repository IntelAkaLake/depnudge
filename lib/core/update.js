const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { Spinner, ProgressBar } = require("../utils/progress");
const { sleep } = require("../utils/sleep");
const { console_styled, colors } = require("../utils/console");
const { askConfirmation } = require("../cli/readline");
const { t } = require("../utils/lang");

async function getOutdatedPackages(specificPackages = null) {
  const spinner = new Spinner(await t("progress.checking_for_outdated_packages"));
  spinner.start();
  try {
    let command = ["npm", "outdated", "--json"];
    if (specificPackages && specificPackages.length > 0) {
      command = command.concat(specificPackages);
    }
    await sleep(process.env.DEPNUDGE_DELAY ? 100 : 0);
    const { stdout } = await new Promise((resolve, reject) => {
      exec(command.join(" "), { encoding: "utf-8" }, (error, stdout, stderr) => {
        if (error && error.code !== 1) {
          reject(error);
        } else {
          resolve({ stdout });
        }
      });
    });
    spinner.stop(await t("progress.packages_checked_successfully"));
    if (!stdout || stdout.trim() === "") {
      return {};
    }
    return JSON.parse(stdout);
  } catch (error) {
    spinner.stop(await t("update.error_checking_outdated", { error: error.message }), false);
    if (specificPackages && specificPackages.length > 0) {
      console_styled.error(await t("update.error_checking_packages", { packages: specificPackages.join(", ") }));
      console_styled.dim(await t("update.make_sure_packages_correct"));
    } else {
      console_styled.error(await t("update.error_checking_outdated", { error: error.message }));
    }
    throw error;
  }
}

async function checkPackageJsonExists() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  try {
    await fs.access(packageJsonPath);
  } catch {
    console_styled.error(await t("update.package_json_not_found"));
    console_styled.dim(await t("update.make_sure_node_project"));
    throw new Error("package.json not found");
  }
  return packageJsonPath;
}

async function validatePackagesExist(packageNames) {
  const packageJsonPath = await checkPackageJsonExists();
  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  } catch (error) {
    console_styled.error(await t("update.error_reading_package_json", { error: error.message }));
    throw error;
  }
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies
  };
  const missingPackages = packageNames.filter(pkg => !allDependencies[pkg]);
  if (missingPackages.length > 0) {
    console_styled.error(await t("update.packages_not_found"));
    missingPackages.forEach(pkg => console_styled.log(`   - ${pkg}`, colors.red));
    console_styled.info(await t("update.available_packages"));
    Object.keys(allDependencies).forEach(pkg => console_styled.log(`   - ${pkg}`, colors.green));
    throw new Error("Some packages not found");
  }
  return true;
}

function preserveVersionPrefix(currentVersion, newVersion) {
  const prefix = currentVersion.match(/^[^0-9]*/)[0];
  return prefix + newVersion;
}

async function updatePackageJson(outdatedPackages) {
  const packageJsonPath = await checkPackageJsonExists();
  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  } catch (error) {
    console_styled.error(await t("update.error_reading_package_json", { error: error.message }));
    throw error;
  }
  const packageNames = Object.keys(outdatedPackages);
  const progressBar = new ProgressBar(packageNames.length, await t("progress.updating_package_json"));
  let updatedCount = 0;
  for (let i = 0; i < packageNames.length; i++) {
    const pkgName = packageNames[i];
    const packageInfo = outdatedPackages[pkgName];
    const latestVersion = packageInfo.latest;
    progressBar.update(i + 1, await t("progress.updating_package", { pkg: pkgName }));
    await sleep(process.env.DEPNUDGE_DELAY ? 50 : 0);
    if (packageJson.dependencies && packageJson.dependencies[pkgName]) {
      const currentVersion = packageJson.dependencies[pkgName];
      packageJson.dependencies[pkgName] = preserveVersionPrefix(currentVersion, latestVersion);
      console_styled.success(await t("update.updated_package", { 
        pkg: pkgName, 
        current: currentVersion, 
        new: packageJson.dependencies[pkgName] 
      }));
      updatedCount++;
    }
    if (packageJson.devDependencies && packageJson.devDependencies[pkgName]) {
      const currentVersion = packageJson.devDependencies[pkgName];
      packageJson.devDependencies[pkgName] = preserveVersionPrefix(currentVersion, latestVersion);
      console_styled.success(await t("update.updated_package_dev", { 
        pkg: pkgName, 
        current: currentVersion, 
        new: packageJson.devDependencies[pkgName] 
      }));
      updatedCount++;
    }
    if (packageJson.peerDependencies && packageJson.peerDependencies[pkgName]) {
      const currentVersion = packageJson.peerDependencies[pkgName];
      packageJson.peerDependencies[pkgName] = preserveVersionPrefix(currentVersion, latestVersion);
      console_styled.success(await t("update.updated_package_peer", { 
        pkg: pkgName, 
        current: currentVersion, 
        new: packageJson.peerDependencies[pkgName] 
      }));
      updatedCount++;
    }
    if (packageJson.optionalDependencies && packageJson.optionalDependencies[pkgName]) {
      const currentVersion = packageJson.optionalDependencies[pkgName];
      packageJson.optionalDependencies[pkgName] = preserveVersionPrefix(currentVersion, latestVersion);
      console_styled.success(await t("update.updated_package_optional", { 
        pkg: pkgName, 
        current: currentVersion, 
        new: packageJson.optionalDependencies[pkgName] 
      }));
      updatedCount++;
    }
  }
  await progressBar.complete(await t("progress.updated_packages", { count: updatedCount }));
  if (updatedCount > 0) {
    try {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
      console_styled.success(await t("update.successfully_updated", { count: updatedCount }));
    } catch (error) {
      console_styled.error(await t("update.error_writing_package_json", { error: error.message }));
      throw error;
    }
  }
  return updatedCount;
}

async function installPackages(flags) {
  if (!flags.yes) {
    const installConfirm = await askConfirmation(await t("update.run_npm_install"));
    if (!["y", "yes"].includes(installConfirm)) {
      console_styled.info(await t("update.skipped_npm_install"));
      return;
    }
  }
  const spinner = new Spinner(await t("update.installing_packages"));
  spinner.start();
  try {
    await sleep(process.env.DEPNUDGE_DELAY ? 200 : 0);
    await new Promise((resolve, reject) => {
      exec("npm install", { encoding: "utf-8" }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
    spinner.stop(await t("update.packages_updated_successfully"));
  } catch (error) {
    spinner.stop(await t("update.installation_failed", { error: error.message }), false);
    console_styled.error(await t("update.installation_failed", { error: error.message }));
    console_styled.dim(await t("update.run_npm_install_manually"));
    throw error;
  }
}

module.exports = {
  getOutdatedPackages,
  validatePackagesExist,
  preserveVersionPrefix,
  updatePackageJson,
  installPackages,
  checkPackageJsonExists
};