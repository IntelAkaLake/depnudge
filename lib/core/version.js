const fs = require("fs").promises;
const path = require("path");
const { console_styled } = require("../utils/console");

async function showVersion() {
  const packageJsonPath = path.join(__dirname, "../../package.json");
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
    console_styled.header(`depnudge v${packageJson.version}`);
  } catch (error) {
    console_styled.header("depnudge ???");
  }
}

module.exports = { showVersion }; 