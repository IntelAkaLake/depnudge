const fs = require("fs").promises;
const path = require("path");
const { ProgressBar } = require("../utils/progress");
const { sleep } = require("../utils/sleep");
const { console_styled } = require("../utils/console");
const { isNodeBuiltin } = require("../utils/node");
const { collectFilesByPatterns } = require("../utils/file");
const { t } = require("../utils/lang");

function extractPackageNames(content) {
  const packages = new Set();
  const requireMatches = content.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
  if (requireMatches) {
    requireMatches.forEach(match => {
      const packageName = match.match(/['"`]([^'"`]+)['"`]/)[1];
      if (!packageName.startsWith(".") && !packageName.startsWith("/")) {
        const parts = packageName.split("/");
        if (packageName.startsWith("@")) {
          packages.add(parts[0] + "/" + parts[1]);
        } else {
          packages.add(parts[0]);
        }
      }
    });
  }
  const importMatches = content.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
  if (importMatches) {
    importMatches.forEach(match => {
      const packageName = match.match(/from\s+['"`]([^'"`]+)['"`]/)[1];
      if (!packageName.startsWith(".") && !packageName.startsWith("/")) {
        const parts = packageName.split("/");
        if (packageName.startsWith("@")) {
          packages.add(parts[0] + "/" + parts[1]);
        } else {
          packages.add(parts[0]);
        }
      }
    });
  }
  const dynamicImportMatches = content.match(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
  if (dynamicImportMatches) {
    dynamicImportMatches.forEach(match => {
      const packageName = match.match(/['"`]([^'"`]+)['"`]/)[1];
      if (!packageName.startsWith(".") && !packageName.startsWith("/")) {
        const parts = packageName.split("/");
        if (packageName.startsWith("@")) {
          packages.add(parts[0] + "/" + parts[1]);
        } else {
          packages.add(parts[0]);
        }
      }
    });
  }
  return packages;
}

async function scanForUndefinedDependencies(patterns) {
  const { checkPackageJsonExists } = require("./update");
  let packageJsonPath;
  try {
    packageJsonPath = await checkPackageJsonExists();
  } catch (error) {
    console_styled.error(await t("scan.error_generic", { error: error.message }));
    return [];
  }
  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  } catch (error) {
    console_styled.error(await t("scan.error_reading_package_json", { error: error.message }));
    return [];
  }
  const declaredDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies
  };
  let filesToProcess = [];
  if (patterns && patterns.length > 0) {
    filesToProcess = await collectFilesByPatterns(patterns) || [];
  } else {
    filesToProcess = await collectFilesByPatterns([
      "src/", "lib/", "app/", "components/", "utils/", "pages/", "hooks/",
      "index.js", "index.ts", "app.js", "app.ts", "main.js", "main.ts",
      "server.js", "server.ts", "next.config.js", "vite.config.js",
      "webpack.config.js", "rollup.config.js", "tailwind.config.js"
    ]) || [];
  }
  if (filesToProcess.length === 0) {
    console_styled.warn(await t("scan.no_files"));
    return [];
  }
  const foundPackages = new Set();
  const progressBar = new ProgressBar(filesToProcess.length, await t("progress.scanning_files"));
  for (let i = 0; i < filesToProcess.length; i++) {
    const filePath = filesToProcess[i];
    const fileName = path.basename(filePath);
    progressBar.update(i + 1, await t("progress.scanning_file", { file: fileName }));
    await sleep(process.env.DEPNUDGE_DELAY ? 10 : 0);
    try {
      const content = await fs.readFile(filePath, "utf8");
      const packages = extractPackageNames(content);
      packages.forEach(pkg => foundPackages.add(pkg));
    } catch (error) {
    }
  }
  await progressBar.complete(await t("progress.scanned_files", { count: filesToProcess.length }));
  const undefinedDependencies = [];
  foundPackages.forEach(pkg => {
    if (!declaredDependencies[pkg] && !isNodeBuiltin(pkg)) {
      undefinedDependencies.push(pkg);
    }
  });
  return undefinedDependencies;
}

module.exports = { scanForUndefinedDependencies, extractPackageNames }; 