const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m"
};

const console_styled = {
  log: (msg, color = "") => console.log(`${color}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`),
  bright: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  highlight: (msg) => console.log(`${colors.bright}${colors.magenta}${msg}${colors.reset}`)
};

module.exports = { colors, console_styled }; 