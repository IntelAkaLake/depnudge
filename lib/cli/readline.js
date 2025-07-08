const readline = require("readline");
const { colors } = require("../utils/console");

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(`${colors.yellow}${question}${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

module.exports = { createReadlineInterface, askConfirmation }; 