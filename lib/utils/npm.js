const { exec } = require("child_process");

async function getLatestVersion(packageName) {
  return new Promise((resolve) => {
    exec(`npm view ${packageName} version`, { encoding: "utf-8" }, (error, stdout, stderr) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

module.exports = { getLatestVersion }; 