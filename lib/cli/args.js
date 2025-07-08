const args = process.argv.slice(2);

function getLanguageFromArgs() {
  const langIndex = args.findIndex(arg => arg === "--lang" || arg === "-l");
  if (langIndex !== -1 && args[langIndex + 1] && !args[langIndex + 1].startsWith("-")) {
    return args[langIndex + 1];
  }
  return null;
}

const flags = {
  help: args.includes("--help") || args.includes("-h"),
  yes: args.includes("--yes") || args.includes("-y"),
  check: args.includes("--check") || args.includes("-c"),
  version: args.includes("--version") || args.includes("-v"),
  scan: args.includes("--scan") || args.includes("-s"),
  install: args.includes("--install") || args.includes("-i"),
  lang: args.includes("--lang") || args.includes("-l")
};
const languageValue = getLanguageFromArgs();

const specificPackages = args.filter((arg, index) => {
  if (arg.startsWith("-")) {
    if (arg === "--lang" || arg === "-l") {
      return false;
    }
    return false;
  }
  
  if (index > 0) {
    const prevArg = args[index - 1];
    if (prevArg === "--lang" || prevArg === "-l") {
      return false;
    }
  }  
  return true;
});

module.exports = { args, flags, specificPackages, languageValue }; 