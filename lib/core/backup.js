const fs = require("fs").promises;
const path = require("path");
const { console_styled } = require("../utils/console");
const { t } = require("../utils/lang");

async function createBackup() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const backupPath = path.join(process.cwd(), "package.json.backup");
  try {
    await fs.copyFile(packageJsonPath, backupPath);
    console_styled.success(await t("backup.created"));
  } catch (error) {
    console_styled.warn(await t("backup.could_not_create", { error: error.message }));
  }
}

module.exports = { createBackup }; 